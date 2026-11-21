// Take the four real renders in screenshots/ from a running app server.
//   python3 -m http.server 8899 --bind 127.0.0.1   (inside app/)
//   node tools/shoot.mjs

import { execFileSync } from "node:child_process";
import { launch } from "./cdp.mjs";

const ORIGIN = "http://127.0.0.1:8899/";
const EARNED = [2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 16, 17, 21, 30, 35, 40, 42, 46, 52, 53];
const SHOTS = [
  { name: "1-cover", hash: "#trophy/5", scroll: 0 },
  { name: "2-roadmap", hash: "#roadmap", scroll: 330 },
  { name: "3-filters", hash: "#filters/story/spoiler", scroll: 0, seed: [2, 4, 8, 10, 13, 16, 17, 21, 30, 35, 40, 42, 46, 52, 53] },
  { name: "4-progress", hash: "#filters/collectible", scroll: 0, click: 30 },
];

const { child, session } = await launch();
try {
  for (const [index, shot] of SHOTS.entries()) {
    await session.navigate(ORIGIN);
    const seed = shot.seed ?? EARNED;
    const payload = JSON.stringify({ app: "leonida-ledger", version: 1, earned: seed, spoiler: false });
    await session.evaluate(`localStorage.setItem("leonida-ledger:v1", ${JSON.stringify(payload)})`);
    await session.navigate(`${ORIGIN}?shot=${index}${shot.hash}`);
    await session.evaluate(`window.scrollTo(0, ${shot.scroll ?? 0})`);
    if (shot.click) {
      await session.evaluate(`document.querySelector('[data-id="${shot.click}"]').click()`);
      await new Promise((resolve) => setTimeout(resolve, 200));
      await session.evaluate(`window.scrollTo(0, ${shot.scroll ?? 0})`);
    }
    const checkpoint = (await session.evaluate(`localStorage.getItem("leonida-ledger:v1")`));
    if (!checkpoint) throw new Error("Progress seed vanished");
    const earnedNow = await session.evaluate(`document.getElementById('progress-count').textContent`);
    if (!earnedNow.startsWith(String(seed.length))) throw new Error(`Seed not applied: ${earnedNow}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    await session.screenshot(`/tmp/${shot.name}.png`);
    execFileSync("python3", ["-c", [
      "from PIL import Image",
      `im = Image.open('/tmp/${shot.name}.png').convert('RGB')`,
      "im = im.resize((1280, 800), Image.LANCZOS)",
      `im.save('screenshots/${shot.name}.jpg', 'JPEG', quality=72, optimize=True, progressive=True)`,
    ].join("\n")]);
    console.log(`captured ${shot.name} (${shot.hash})`);
  }
} finally {
  session.close();
  child.kill();
}
