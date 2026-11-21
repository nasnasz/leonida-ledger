// Minimal Chrome DevTools Protocol driver for real screenshots and smoke
// tests. Uses Node 22's built-in fetch and WebSocket; no packages.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = "/home/ubuntu/.hermes/tools/chromium-1208/chrome-linux64/chrome";

export async function launch({ port = 9333, width = 1280, height = 800, profile = "/tmp/ledger-cdp" } = {}) {
  mkdirSync(profile, { recursive: true });
  const child = spawn(CHROME, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "about:blank",
  ], { stdio: "ignore" });

  let version = null;
  for (let attempt = 0; attempt < 80 && !version; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) version = await response.json();
    } catch {
      // Chrome is still starting.
    }
    if (!version) await sleep(120);
  }
  if (!version) throw new Error("Chrome did not expose a DevTools endpoint");

  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = pages.find((target) => target.type === "page");
  if (!page) throw new Error("No page target");

  const session = new CdpSession(page.webSocketDebuggerUrl);
  await session.open();
  await session.send("Page.enable");
  await session.send("Runtime.enable");
  await session.send("DOM.enable");
  await session.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  return { child, session };
}

export class CdpSession {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.listeners = new Map();
  }

  async open() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message}: ${JSON.stringify(message.error.data ?? "")}`));
        else resolve(message.result);
        return;
      }
      if (message.method && this.waiters.has(message.method)) {
        const waiters = this.waiters.get(message.method);
        this.waiters.delete(message.method);
        for (const resolve of waiters) resolve(message.params);
      }
      if (message.method && this.listeners.has(message.method)) {
        for (const handler of this.listeners.get(message.method)) handler(message.params);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const waiters = this.waiters.get(method) ?? [];
      waiters.push(resolve);
      this.waiters.set(method, waiters);
    });
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) ?? [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result?.value;
  }

  async navigate(url, readyExpression = "document.querySelectorAll('.trophy-row').length > 0 || document.querySelectorAll('.stage-card').length > 0") {
    const loaded = this.once("Page.loadEventFired");
    await this.send("Page.navigate", { url });
    await Promise.race([loaded, sleep(5000)]);
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        if (await this.evaluate(readyExpression)) return;
      } catch {
        // Navigation may still be swapping realms.
      }
      await sleep(100);
    }
    throw new Error(`Page did not become ready: ${url}`);
  }

  async screenshot(path) {
    const { data } = await this.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    writeFileSync(path, Buffer.from(data, "base64"));
  }

  close() {
    try {
      this.socket.close();
    } catch {
      // Already closed.
    }
  }
}
