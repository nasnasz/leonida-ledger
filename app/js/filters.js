// Search, kind chips, grade select and the spoiler switch. Views ask
// matches() whether a trophy survives the current filter state.

import { isShielded } from "./data.js";

export function initFilters({ trophies, state, onChange }) {
  const search = document.getElementById("search");
  search.addEventListener("input", () => onChange({ query: search.value }));

  document.getElementById("kind-chips").addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (chip) onChange({ kind: chip.dataset.kind });
  });

  const grade = document.getElementById("grade");
  grade.addEventListener("change", () => onChange({ grade: grade.value }));

  const spoiler = document.getElementById("spoiler");
  spoiler.addEventListener("change", () => onChange({ spoiler: spoiler.checked }));

  const counts = {
    all: trophies.length,
    story: trophies.filter((trophy) => trophy.kind === "story").length,
    missable: trophies.filter((trophy) => trophy.missable).length,
    collectible: trophies.filter((trophy) => trophy.kind === "collectible").length,
    activity: trophies.filter((trophy) => trophy.kind === "activity").length,
    online: trophies.filter((trophy) => trophy.kind === "online").length,
  };
  document.querySelectorAll("#kind-chips .chip").forEach((chip) => {
    const count = chip.querySelector(".chip-count");
    if (count && Number.isInteger(counts[chip.dataset.kind])) count.textContent = counts[chip.dataset.kind];
  });
}

export function syncFilterControls(state) {
  document.querySelectorAll("#kind-chips .chip").forEach((chip) => {
    const active = chip.dataset.kind === state.kind;
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
  const grade = document.getElementById("grade");
  if (grade.value !== state.grade) grade.value = state.grade;
  const spoiler = document.getElementById("spoiler");
  if (spoiler.checked !== state.spoiler) spoiler.checked = state.spoiler;
  const search = document.getElementById("search");
  if (search.value !== state.query) search.value = state.query;
}

export function matches(trophy, state, earned) {
  if (state.kind === "missable") {
    if (!trophy.missable) return false;
  } else if (state.kind !== "all" && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;

  const query = state.query.trim().toLowerCase();
  if (!query) return true;

  const shielded = isShielded(trophy, earned, state.spoiler);
  const parts = shielded
    ? [trophy.kind, trophy.chapter ?? "", `stage ${trophy.stage}`]
    : [
        trophy.name,
        trophy.description,
        trophy.guide,
        trophy.tips,
        trophy.kind,
        trophy.chapter ?? "",
        trophy.missable_reason ?? "",
        ...(trophy.sources ?? []).map((source) => source.name),
      ];
  return parts.join(" ").toLowerCase().includes(query);
}

export function sortByPlayOrder(trophies) {
  return [...trophies].sort((a, b) => a.order - b.order);
}
