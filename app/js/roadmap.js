// The roadmap view: six stages in order, each with its progress bar, its
// trophies as jump chips, and every missable called out with the reason.

import { el, clear } from "./dom.js";
import { isShielded } from "./data.js";

export function renderRoadmap(root, { trophies, roadmap, state, onSelect }) {
  clear(root);
  const earnedCount = state.earned.size;

  const lead = el("section", "roadmap-lead");
  const copy = el("div");
  copy.append(el("p", "eyebrow", "The platinum route"));
  copy.append(el("h2", "", "Six stages, one Leonida"));
  copy.append(el("p", "", "The order below follows the story into the optional work, then finishes with the long grind and 100%. Missables sit in stage 3 on purpose: clear them before the final mission. Jump to any trophy to read its guide."));
  const stat = el("div", "lead-stat");
  stat.append(el("strong", "", `${earnedCount}/55`));
  stat.append(el("span", "", "earned"));
  lead.append(copy, stat);

  const list = el("ol", "stage-list");
  const stages = roadmap.length > 0
    ? roadmap
    : Array.from({ length: 6 }, (_, index) => ({ stage: index + 1, title: `Stage ${index + 1}`, intro: "" }));

  for (const stage of stages) {
    const items = trophies.filter((trophy) => trophy.stage === stage.stage).sort((a, b) => a.order - b.order);
    const done = items.filter((trophy) => state.earned.has(trophy.id)).length;
    list.append(stageCard(stage, items, done, state, onSelect));
  }

  root.append(lead, list);
}

function stageCard(stage, items, done, state, onSelect) {
  const card = el("li", "stage-card");
  card.classList.toggle("is-complete", items.length > 0 && done === items.length);

  const head = el("header", "stage-head");
  head.append(el("span", "stage-num", String(stage.stage).padStart(2, "0")));
  head.append(el("h2", "", stage.title));
  const score = el("span", "stage-score", `${done} / ${items.length}`);
  score.classList.toggle("is-done", items.length > 0 && done === items.length);
  head.append(score);
  card.append(head);

  const bar = el("div", "stage-bar");
  const fill = el("span");
  fill.style.width = items.length ? `${Math.round((done / items.length) * 100)}%` : "0%";
  bar.append(fill);
  card.append(bar);

  if (stage.intro) card.append(el("p", "stage-intro", stage.intro));

  const chips = el("div", "stage-items");
  for (const trophy of items) {
    const shielded = isShielded(trophy, state.earned, state.spoiler);
    const chip = el("button", "stage-chip");
    chip.type = "button";
    chip.classList.toggle("is-earned", state.earned.has(trophy.id));
    chip.classList.toggle("is-missable", trophy.missable);
    chip.title = shielded ? "Hidden story trophy" : trophy.name;
    chip.append(el("span", "stage-check", state.earned.has(trophy.id) ? "✓" : "○"));
    chip.append(el("span", "", shielded ? "Hidden story trophy" : trophy.name));
    if (trophy.missable) chip.append(el("span", "stage-warn", "⚠"));
    chip.addEventListener("click", () => onSelect(trophy.id));
    chips.append(chip);
  }
  card.append(chips);

  const missables = items.filter((trophy) => trophy.missable);
  if (missables.length > 0) {
    const warningList = el("ul", "missable-list");
    for (const trophy of missables) {
      const item = el("li");
      const shielded = isShielded(trophy, state.earned, state.spoiler);
      item.append(el("strong", "", shielded ? "Hidden missable" : trophy.name));
      item.append(document.createTextNode(shielded ? "Story-window dependent — read the reason once the shield is off or the trophy is earned." : trophy.missable_reason ?? "Story-window dependent."));
      warningList.append(item);
    }
    card.append(warningList);
  }
  return card;
}
