// Local stand-in for the six server-side scorer rows in the kit's RULES.txt.
// The kit's `check` command does not run them (its Grade locally section says
// the scorer stays on the server), so this verifies the same properties here:
// app_files, references, screenshots, dossier_matches, trophies, js_parses.
//   node tools/verify-static.mjs

import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { buildDossier } from "../vendor/makefun-frontend.ts";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const APP = join(ROOT, "app");
const SHOTS = join(ROOT, "screenshots");
const rows = [];

function row(name, ok, detail) {
  rows.push({ name, ok });
  console.log(`${ok ? "pass" : "FAIL"}  ${name}  ${detail}`);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    out.push(path);
    if (entry.isDirectory()) out.push(...walk(path));
  }
  return out;
}

function bytes(path) {
  return statSync(path).size;
}

// app_files ---------------------------------------------------------------
{
  const all = walk(APP);
  const special = all.filter((path) => !lstatSync(path).isFile() && !lstatSync(path).isDirectory());
  const files = all.filter((path) => lstatSync(path).isFile());
  const total = files.reduce((sum, path) => sum + bytes(path), 0);
  const tooLong = all.filter((path) => Buffer.byteLength(relative(APP, path)) > 1000);
  const index = join(APP, "index.html");
  const ok = special.length === 0 && all.length <= 993 && total <= 50331648 && tooLong.length === 0 && existsSync(index) && bytes(index) <= 1048576;
  row("app_files", ok, `${files.length} files, ${all.length} entries, ${total} bytes, ${special.length} special, index.html ${bytes(index)} bytes`);
}

// references --------------------------------------------------------------
{
  const html = readFileSync(join(APP, "index.html"), "utf8");
  const refs = [];
  for (const match of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) refs.push({ ref: match[1], kind: "script" });
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const href = /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const rel = /\brel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    if (href && /stylesheet|modulepreload|preload|prefetch|icon|manifest/i.test(rel)) refs.push({ ref: href, kind: "link" });
  }
  for (const match of html.matchAll(/<(?:img|source|video|audio|track|iframe|object|embed)\b[^>]*?(?:src|srcset|poster)\s*=\s*["']([^"']+)["']/gi)) refs.push({ ref: match[1], kind: "media" });
  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    for (const css of match[1].matchAll(/(?:@import|url\()\s*["']?([^"')\s]+)/gi)) refs.push({ ref: css[1], kind: "style" });
  }
  const cssFiles = walk(APP).filter((path) => path.endsWith(".css"));
  for (const file of cssFiles) {
    const css = readFileSync(file, "utf8");
    for (const match of css.matchAll(/(?:@import|url\()\s*["']?([^"')\s]+)/gi)) refs.push({ ref: match[1], kind: "style", from: file });
  }
  const jsFiles = walk(APP).filter((path) => /\.m?js$/.test(path));
  for (const file of jsFiles) {
    const js = readFileSync(file, "utf8");
    const specifiers = [
      ...js.matchAll(/\b(?:import|export)\b[^'"`;]*?\bfrom\s*["']([^"']+)["']/g),
      ...js.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g),
    ].map((match) => match[1]);
    for (const specifier of specifiers) refs.push({ ref: specifier, kind: "module", from: file });
  }
  const bad = [];
  for (const entry of refs) {
    const { ref, kind } = entry;
    if (/^(https?:)?\/\//.test(ref) || /^data:/.test(ref) || ref.startsWith("#")) {
      if (kind !== "style" || !/^(data:image\/|#)/.test(ref)) bad.push(`${kind} ${ref}`);
      continue;
    }
    const base = kind === "module" && entry.from ? dirname(entry.from) : APP;
    const target = ref.startsWith("/") ? resolve(APP, ref.slice(1)) : resolve(base, ref);
    if (target !== APP && !target.startsWith(APP + sep)) bad.push(`outside app/: ${ref}`);
    else if (!existsSync(target) || !statSync(target).isFile()) bad.push(`missing: ${ref}`);
    else if (kind === "script" || kind === "module") {
      if (!/\.m?js$/.test(target)) bad.push(`not js: ${ref}`);
    } else if (kind === "link" || kind === "style") {
      if (!/\.css$/.test(target)) bad.push(`not css: ${ref}`);
    }
  }
  const source = jsFiles.map((file) => readFileSync(file, "utf8")).join("\n");
  for (const match of source.matchAll(/\bfetch\s*\(\s*["']([^"']+)["']/g)) {
    if (/^(https?:)?\/\//.test(match[1]) || !existsSync(resolve(join(APP, match[1])))) bad.push(`bad fetch: ${match[1]}`);
  }
  row("references", bad.length === 0, `${refs.length} refs checked, ${bad.length} bad${bad.length ? `: ${bad.slice(0, 4).join("; ")}` : ""}`);
}

// screenshots -------------------------------------------------------------
{
  const files = readdirSync(SHOTS).filter((name) => !name.startsWith(".")).sort();
  const dims = JSON.parse(execFileSync("python3", ["-c", `import json,os\nfrom PIL import Image\nprint(json.dumps({f: list(Image.open(os.path.join(${JSON.stringify(SHOTS)}, f)).size) for f in ${JSON.stringify(files)}}))`]).toString());
  const bad = files.filter((name) => {
    const size = bytes(join(SHOTS, name));
    const [w, h] = dims[name];
    return !/^[A-Za-z0-9._-]{1,128}$/.test(name) || name.startsWith(".") || name.startsWith("-") || size > 262144 || Math.max(w, h) > 1280 || Math.min(w, h) < 480 || !/\.(jpe?g|png)$/i.test(name);
  });
  row("screenshots", files.length >= 3 && files.length <= 4 && bad.length === 0, `${files.length} files, ${files.map((name) => `${name} ${dims[name].join("x")} ${Math.round(bytes(join(SHOTS, name)) / 1024)}K`).join("; ")}`);
}

// dossier_matches ---------------------------------------------------------
{
  const out = "/tmp/ledger-verify-out";
  execFileSync(process.execPath, [join(ROOT, "main.ts")], { env: { ...process.env, MAKEFUN_OUTPUT_DIR: out }, cwd: ROOT });
  const options = { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 };
  const rebuilt = Buffer.from(buildDossier(out, options));
  const onDisk = readFileSync(join(out, "dossier.json"));
  const identical = rebuilt.equals(onDisk);
  row("dossier_matches", identical && onDisk.length <= 1572864, `${onDisk.length} bytes, rebuilt identical: ${identical}`);
}

// trophies ----------------------------------------------------------------
{
  const data = JSON.parse(readFileSync(join(APP, "data", "trophies.json"), "utf8"));
  const root = execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], { cwd: ROOT }).toString().trim();
  const original = JSON.parse(execFileSync("git", ["show", `${root}:app/data/trophies.json`], { cwd: ROOT }).toString());
  const source = original.trophies ?? original;
  const byName = new Map(data.trophies.map((trophy) => [trophy.name, trophy]));
  const bad = [];
  for (const trophy of source) {
    const current = byName.get(trophy.name);
    if (!current) bad.push(`missing ${trophy.name}`);
    else if (current.description !== trophy.description || current.grade !== trophy.grade) bad.push(`changed ${trophy.name}`);
    else if (!current.guide || !Array.isArray(current.sources) || current.sources.length < 1) bad.push(`unguided ${trophy.name}`);
  }
  row("trophies", source.length === 55 && data.trophies.length === 55 && bad.length === 0, `55 names/descriptions/grades verbatim, ${data.trophies.filter((t) => t.guide && t.sources?.length).length} guided with sources${bad.length ? `, ${bad.slice(0, 3).join("; ")}` : ""}`);
}

// js_parses ---------------------------------------------------------------
{
  const files = walk(APP).filter((path) => /\.m?js$/.test(path));
  const bad = [];
  for (const file of files) {
    try {
      execFileSync(process.execPath, ["--input-type=module", "--check"], { input: readFileSync(file), stdio: ["pipe", "ignore", "pipe"] });
    } catch {
      bad.push(relative(APP, file));
    }
  }
  row("js_parses", bad.length === 0, `${files.length} modules parse${bad.length ? `, failed: ${bad.join(", ")}` : ""}`);
}

const failed = rows.filter((entry) => !entry.ok);
console.log(`\n${rows.length - failed.length}/${rows.length} scorer rows pass locally`);
if (failed.length) process.exitCode = 1;
