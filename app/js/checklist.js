// The checklist itself: one compact row per visible trophy, ordered by the
// roadmap's play order, with grade, kind, count and missable badges.

import { el, clear } from "./dom.js";
import { gradeLabel, kindLabel, targetText, isShielded } from "./data.js";

export function renderChecklist(root, { trophies, state, selectedId, onSelect, onToggle }) {
  clear(root);
  const fragment = document.createDocumentFragment();
  for (const trophy of trophies) fragment.append(buildRow(trophy, state, selectedId, onSelect, onToggle));
  root.append(fragment);
}

function buildRow(trophy, state, selectedId, onSelect, onToggle) {
  const earned = state.earned.has(trophy.id);
  const shielded = isShielded(trophy, state.earned, state.spoiler);
  const selected = trophy.id === selectedId;

  const row = el("article", "trophy-row");
  row.classList.toggle("is-earned", earned);
  row.classList.toggle("is-selected", selected);
  row.dataset.id = String(trophy.id);
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", shielded
    ? `Hidden story trophy, stage ${trophy.stage}, ${earned ? "earned" : "not earned"}`
    : `${trophy.name}, ${trophy.grade}, ${earned ? "earned" : "not earned"}`);

  const checkLabel = el("label", "check");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = earned;
  checkbox.setAttribute("aria-label", shielded ? "Mark this hidden story trophy earned" : `Mark ${trophy.name} earned`);
  checkbox.addEventListener("change", () => onToggle(trophy.id));
  checkLabel.append(checkbox, el("span", "box", "✓"));

  const main = el("div", "row-main");
  const top = el("div", "row-top");
  top.append(el("h3", "", shielded ? "Hidden story trophy" : trophy.name));
  top.append(kindBadge(trophy));
  if (trophy.missable) top.append(el("span", "badge missable", "⚠ Missable"));
  const target = targetText(trophy);
  if (target) top.append(el("span", "badge count", target));

  const desc = el("p", "desc", shielded
    ? "The name and description stay shielded until this story trophy is earned."
    : trophy.description);
  if (shielded) desc.classList.add("shielded");
  main.append(top, desc);

  const side = el("div", "row-side");
  side.append(el("span", `grade-pill ${trophy.grade}`, gradeLabel(trophy.grade)));
  side.append(el("span", "row-order", `#${String(trophy.order).padStart(2, "0")}`));

  row.append(checkLabel, main, side);
  row.addEventListener("click", (event) => {
    if (event.target.closest(".check")) return;
    onSelect(trophy.id);
  });
  row.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !event.target.closest(".check")) {
      event.preventDefault();
      onSelect(trophy.id);
    }
  });
  return row;
}

export function kindBadge(trophy) {
  return el("span", `badge kind-${trophy.kind}`, kindLabel(trophy.kind));
}
