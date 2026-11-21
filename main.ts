// Leonida Ledger — submission entry point for make.fun's gta6-trophy-guide-01 bounty.
// The guide itself is the static app/ folder (ES modules, CSS and app/data/trophies.json,
// no build step, no network calls). This program copies app/ and screenshots/ to /output
// and writes /output/dossier.json with the vendored buildDossier. vendor/makefun-frontend.ts
// must stay byte-identical: the scorer rebuilds the dossier with its own copy and compares.
//
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.
// To produce the submission folder outside the grader:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

try {
  mkdirSync(out, { recursive: true });
} catch (error) {
  console.error(`Could not create the output directory ${out}. Set MAKEFUN_OUTPUT_DIR to a writable path, or create /output and make it writable. ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
