// The detail panel: official text, my guide, the field plan, a tip and the
// source links for whichever trophy is selected.

import { el, clear } from "./dom.js";
import { gradeLabel, kindLabel, isShielded, sourceHost, targetText } from "./data.js";

export function renderPlaceholder(root) {
  clear(root);
  const box = el("div", "detail-placeholder");
  box.append(el("p", "eyebrow", "Field notes"));
  box.append(el("h2", "", "Pick a trophy"));
  box.append(el("p", "", "Every entry carries its official name, description and grade, a guide in my own words, a tip, and the guide sites I consulted. Tick the box when you earn it — progress stays in this browser."));
  root.append(box);
}

export function renderDetail(root, { trophy, state, onToggle }) {
  if (!trophy) {
    renderPlaceholder(root);
    return;
  }
  const earned = state.earned.has(trophy.id);
  if (isShielded(trophy, state.earned, state.spoiler)) {
    renderShieldPanel(root, trophy);
    return;
  }

  clear(root);
  const card = el("article", "detail-card");

  const head = el("header", "detail-head");
  const kicker = el("div", "detail-kicker");
  kicker.append(el("span", `grade-pill ${trophy.grade}`, gradeLabel(trophy.grade)));
  kicker.append(el("span", `badge kind-${trophy.kind}`, kindLabel(trophy.kind)));
  if (trophy.missable) kicker.append(el("span", "badge missable", "⚠ Missable"));
  kicker.append(el("span", "detail-stage", `Stage ${trophy.stage} · play #${trophy.order}`));
  head.append(kicker);
  head.append(el("h2", "", trophy.name));
  head.append(el("blockquote", "official-desc", trophy.description));

  const body = el("div", "detail-body");
  if (trophy.missable && trophy.missable_reason) {
    const box = el("div", "missable-box");
    box.append(el("strong", "", "Why it can be missed"));
    box.append(el("span", "", trophy.missable_reason));
    body.append(box);
  }

  body.append(section("The guide", el("p", "guide-text", trophy.guide)));
  body.append(fieldPlan(trophy));

  const sources = el("ul", "sources-list");
  for (const source of trophy.sources ?? []) {
    const item = el("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(el("span", "", source.name));
    link.append(el("span", "link-mark", sourceHost(source.url)));
    item.append(link);
    sources.append(item);
  }
  body.append(section("Sources cited", sources));

  const tip = el("div", "tip-box");
  tip.append(el("span", "tip-icon", "▸"));
  tip.append(el("span", "", trophy.tips));
  body.append(section("Field tip", tip));

  const button = el("button", `earn-button${earned ? " is-earned" : ""}`,
    earned ? "✓ Earned — click to undo" : "Mark this trophy earned");
  button.type = "button";
  button.addEventListener("click", () => onToggle(trophy.id));
  body.append(button);

  card.append(head, body);
  root.append(card);
}

function section(title, content) {
  const box = el("section");
  box.append(el("h3", "", title));
  box.append(content);
  return box;
}

function fieldPlan(trophy) {
  const wrap = el("section");
  wrap.append(el("h3", "", "Field plan"));
  const list = el("dl", "field-plan");
  addFact(list, "Chapter", trophy.chapter ?? "Story-wide / any time");
  addFact(list, "Play order", `#${trophy.order} of 55`);
  addFact(list, "Target", targetText(trophy) ?? "One-off");
  wrap.append(list);
  return wrap;
}

function addFact(list, term, value) {
  const fact = el("div", "fact");
  const dt = el("dt", "", term);
  const dd = el("dd", "", value);
  fact.append(dt, dd);
  list.append(fact);
}

function renderShieldPanel(root, trophy) {
  clear(root);
  const card = el("article", "detail-card");
  const head = el("header", "detail-head");
  const kicker = el("div", "detail-kicker");
  kicker.append(el("span", `grade-pill ${trophy.grade}`, gradeLabel(trophy.grade)));
  kicker.append(el("span", "detail-stage", `Stage ${trophy.stage} · play #${trophy.order}`));
  head.append(kicker);
  head.append(el("h2", "", "Shielded story trophy"));
  card.append(head);

  const panel = el("div", "shield-panel");
  panel.append(el("span", "shield-icon", "◈"));
  panel.append(el("h2", "", "No spoilers here"));
  panel.append(el("p", "", "The spoiler shield is on. This story trophy's name, description and guide stay hidden until you mark it earned. Turn the shield off in the toolbar if you want the full list."));
  card.append(panel);
  root.append(card);
}
