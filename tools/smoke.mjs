// Functional smoke test for the tracker, driven through Chrome DevTools.
// Serves must be running at http://127.0.0.1:8899/ (inside app/).
//   node tools/smoke.mjs

import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { launch } from "./cdp.mjs";

const ORIGIN = "http://127.0.0.1:8899/";
const CHECKS = [];

function check(name, condition, detail = "") {
  CHECKS.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
}

function progress() {
  return document.getElementById("progress-count").textContent;
}

async function waitFor(session, expression, label, timeout = 4000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await session.evaluate(expression)) return true;
    await sleep(80);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const { child, session } = await launch({ port: 9334, profile: "/tmp/ledger-smoke" });

try {
  await session.send("Page.addScriptToEvaluateOnNewDocument", {
    source: "window.__errors = []; addEventListener('error', (event) => window.__errors.push(String(event.message))); addEventListener('unhandledrejection', (event) => window.__errors.push(String(event.reason)));",
  });

  await session.navigate(ORIGIN);
  await session.evaluate("localStorage.clear()");
  await session.navigate(`${ORIGIN}?clean=1`);

  check("renders all 55 rows", await session.evaluate("document.querySelectorAll('.trophy-row').length") === 55);
  check("starts at 0 / 55", (await session.evaluate("document.getElementById('progress-count').textContent")) === "0 / 55");

  await session.evaluate("document.querySelector('.trophy-row .check input').click()");
  check("checkbox updates progress", (await session.evaluate("document.getElementById('progress-count').textContent")) === "1 / 55");
  check("checkbox persists to localStorage", await session.evaluate("JSON.parse(localStorage.getItem('leonida-ledger:v1')).earned.includes(2)"));

  await session.navigate(`${ORIGIN}?persist=1`);
  check("progress survives reload", (await session.evaluate("document.getElementById('progress-count').textContent")) === "1 / 55");

  await session.evaluate("document.getElementById('spoiler').click()");
  check("spoiler hides unearned story rows", await session.evaluate("document.querySelectorAll('.trophy-row .shielded').length") > 0);
  check("spoiler setting is saved", await session.evaluate("JSON.parse(localStorage.getItem('leonida-ledger:v1')).spoiler === true"));
  await session.navigate(`${ORIGIN}?spoil=1`);
  check("spoiler survives reload", await session.evaluate("document.querySelectorAll('.trophy-row .shielded').length") > 0);
  await session.evaluate("document.getElementById('spoiler').click()");

  await session.evaluate("(() => { const field = document.getElementById('search'); field.value = 'shooting'; field.dispatchEvent(new Event('input', { bubbles: true })); })()");
  const searchNames = await session.evaluate("[...document.querySelectorAll('.trophy-row h3')].map((node) => node.textContent)");
  check("search finds The Shootist", searchNames.includes("The Shootist") && searchNames.length < 55, searchNames.join(" | "));
  await session.evaluate("(() => { const field = document.getElementById('search'); field.value = ''; field.dispatchEvent(new Event('input', { bubbles: true })); })()");

  await session.evaluate("document.querySelector('[data-kind=\"missable\"]').click()");
  check("missable filter shows 8", await session.evaluate("document.querySelectorAll('.trophy-row').length === 8"));
  check("every missable row is flagged", await session.evaluate("document.querySelectorAll('.trophy-row .badge.missable').length === 8"));

  await session.evaluate("document.querySelector('[data-kind=\"online\"]').click()");
  check("online filter is empty with an empty state", await session.evaluate("document.querySelectorAll('.trophy-row').length === 0 && !document.getElementById('empty-state').hidden"));
  await session.evaluate("document.querySelector('[data-kind=\"all\"]').click()");

  await session.evaluate("document.getElementById('tab-roadmap').click()");
  check("roadmap renders six stages", await session.evaluate("document.querySelectorAll('.stage-card').length") === 6);
  check("roadmap flags all eight missables with reasons", await session.evaluate("document.querySelectorAll('.missable-list li').length") === 8);
  check("stage progress bars exist", await session.evaluate("document.querySelectorAll('.stage-bar span').length") === 6);
  await session.evaluate("document.getElementById('tab-checklist').click()");

  await session.evaluate("document.querySelector('[data-id=\"30\"]').click()");
  check("detail opens with the guide", await session.evaluate("document.querySelector('#detail h2').textContent === \"Don't Touch My Deck\""));
  check("detail shows cited sources", await session.evaluate("document.querySelectorAll('.sources-list a').length") === 3);
  check("source links are real URLs", await session.evaluate("[...document.querySelectorAll('.sources-list a')].every((a) => a.href.startsWith('https://'))"));

  await session.evaluate(`
    window.__export = null;
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { blob.text().then((text) => { window.__export = text; }); return create(blob); };
    document.getElementById('export').click();
  `);
  await waitFor(session, "window.__export !== null", "export payload");
  const exported = JSON.parse(await session.evaluate("window.__export"));
  check("export is a Leonida Ledger file", exported.app === "leonida-ledger" && exported.version === 1);
  check("export carries earned ids", Array.isArray(exported.earned) && exported.earned.length === 1 && exported.earned[0] === 2, `earned=${exported.earned}`);

  writeFileSync("/tmp/leonida-import.json", JSON.stringify({ app: "leonida-ledger", version: 1, earned: [1, 7, 14], spoiler: false }));
  const { root } = await session.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await session.send("DOM.querySelector", { nodeId: root.nodeId, selector: "#import" });
  await session.send("DOM.setFileInputFiles", { nodeId, files: ["/tmp/leonida-import.json"] });
  await waitFor(session, "document.getElementById('progress-count').textContent === '3 / 55'", "import");
  check("import replaces progress", await session.evaluate("JSON.parse(localStorage.getItem('leonida-ledger:v1')).earned.join(',') === '1,7,14'"));

  check("no runtime errors", await session.evaluate("window.__errors.length === 0"), await session.evaluate("JSON.stringify(window.__errors)"));

  const requests = [];
  session.on("Network.requestWillBeSent", (event) => requests.push(event.request.url));
  await session.send("Network.enable");
  await session.navigate(`${ORIGIN}?net=1`);
  const external = requests.filter((url) => /^https?:/.test(url) && !url.startsWith(ORIGIN));
  check("app requests only its own server", external.length === 0, external.join(", ") || `${requests.length} requests`);
} finally {
  session.close();
  child.kill();
}

const failed = CHECKS.filter((entry) => !entry.ok);
console.log(`\n${CHECKS.length - failed.length}/${CHECKS.length} checks passed`);
if (failed.length > 0) process.exitCode = 1;
