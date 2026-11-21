// Boot and render loop: route the hash, keep state, and redraw the header,
// checklist, detail panel or roadmap whenever progress or a filter changes.

import { loadLedger, GRADES, KINDS } from "./data.js";
import { loadProgress, saveProgress } from "./store.js";
import { initFilters, syncFilterControls, matches, sortByPlayOrder } from "./filters.js";
import { initIo } from "./io.js";
import { renderChecklist } from "./checklist.js";
import { renderDetail } from "./detail.js";
import { renderRoadmap } from "./roadmap.js";
import { el, clear, showToast } from "./dom.js";

const state = {
  view: "checklist",
  kind: "all",
  grade: "all",
  query: "",
  spoiler: false,
  selectedId: null,
  earned: new Set(),
};

let ledger = { trophies: [], roadmap: [], meta: {} };

async function boot() {
  try {
    ledger = await loadLedger();
  } catch (error) {
    showLoadError(error);
    return;
  }
  const saved = loadProgress(ledger.trophies);
  state.earned = saved.earned;
  state.spoiler = saved.spoiler;

  initFilters({ trophies: ledger.trophies, state, onChange: handleFilterChange });
  initIo({ trophies: ledger.trophies, state, onReplace: replaceProgress });
  document.getElementById("tab-checklist").addEventListener("click", () => setView("checklist"));
  document.getElementById("tab-roadmap").addEventListener("click", () => setView("roadmap"));
  window.addEventListener("hashchange", () => {
    applyRoute();
    renderAll();
  });

  applyRoute();
  if (!state.selectedId) state.selectedId = firstIncompleteId();
  saveProgress(state);
  renderAll();
}

function firstIncompleteId() {
  const ordered = sortByPlayOrder(ledger.trophies);
  const next = ordered.find((trophy) => !state.earned.has(trophy.id));
  return (next ?? ordered[0])?.id ?? null;
}

function handleFilterChange(patch) {
  if (Object.hasOwn(patch, "query")) state.query = patch.query;
  if (Object.hasOwn(patch, "kind")) {
    state.kind = patch.kind;
    state.view = "checklist";
  }
  if (Object.hasOwn(patch, "grade")) {
    state.grade = patch.grade;
    state.view = "checklist";
  }
  if (Object.hasOwn(patch, "spoiler")) {
    state.spoiler = patch.spoiler;
    saveProgress(state);
  }
  if (!Object.hasOwn(patch, "query")) writeHash();
  renderAll();
}

function replaceProgress({ earned, spoiler }) {
  state.earned = earned;
  if (typeof spoiler === "boolean") state.spoiler = spoiler;
  if (!ledger.trophies.some((trophy) => trophy.id === state.selectedId)) state.selectedId = firstIncompleteId();
  saveProgress(state);
  renderAll();
}

function toggleTrophy(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress(state);
  renderAll();
}

function selectTrophy(id) {
  state.selectedId = id;
  state.view = "checklist";
  writeHash({ trophy: id });
  renderAll();
  if (window.innerWidth < 1080) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("detail").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}

function setView(view) {
  state.view = view;
  if (view === "checklist" && !state.selectedId) state.selectedId = firstIncompleteId();
  writeHash();
  renderAll();
}

function writeHash({ trophy = null } = {}) {
  let hash = "#checklist";
  if (trophy !== null) {
    hash = `#trophy/${trophy}`;
  } else if (state.view === "roadmap") {
    hash = "#roadmap";
  } else if (state.kind !== "all" || state.grade !== "all" || state.spoiler) {
    const parts = [];
    if (state.kind !== "all") parts.push(state.kind);
    if (state.grade !== "all") parts.push(state.grade);
    if (state.spoiler) parts.push("spoiler");
    hash = `#filters/${parts.join("/")}`;
  }
  history.replaceState(null, "", hash);
}

function applyRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return;
  if (parts[0] === "roadmap") {
    state.view = "roadmap";
    return;
  }
  if (parts[0] === "trophy") {
    const id = Number(parts[1]);
    if (Number.isInteger(id) && ledger.trophies.some((trophy) => trophy.id === id)) {
      state.selectedId = id;
      state.view = "checklist";
    }
    return;
  }
  if (parts[0] === "filters" || parts[0] === "checklist") {
    state.view = "checklist";
    for (const part of parts.slice(1)) {
      if (KINDS.includes(part)) state.kind = part;
      else if (GRADES.includes(part)) state.grade = part;
      else if (part === "spoiler") state.spoiler = true;
    }
  }
}

function renderAll() {
  syncFilterControls(state);
  renderHeader();

  const onChecklist = state.view === "checklist";
  document.getElementById("tab-checklist").classList.toggle("is-active", onChecklist);
  document.getElementById("tab-checklist").setAttribute("aria-pressed", String(onChecklist));
  document.getElementById("tab-roadmap").classList.toggle("is-active", !onChecklist);
  document.getElementById("tab-roadmap").setAttribute("aria-pressed", String(!onChecklist));
  document.querySelector(".list-pane").hidden = !onChecklist;
  document.getElementById("detail").hidden = !onChecklist;
  document.getElementById("roadmap-view").hidden = onChecklist;
  document.getElementById("route-note").textContent = onChecklist
    ? "Search, filter, and open a trophy for its guide."
    : "Six stages from the opening to the platinum; missables flagged with why.";

  if (!onChecklist) {
    renderRoadmap(document.getElementById("roadmap-view"), {
      trophies: ledger.trophies,
      roadmap: ledger.roadmap,
      state,
      onSelect: selectTrophy,
    });
    return;
  }

  const visible = sortByPlayOrder(ledger.trophies.filter((trophy) => matches(trophy, state, state.earned)));
  renderChecklist(document.getElementById("checklist"), {
    trophies: visible,
    state,
    selectedId: state.selectedId,
    onSelect: selectTrophy,
    onToggle: toggleTrophy,
  });
  document.getElementById("empty-state").hidden = visible.length > 0;
  document.getElementById("checklist").hidden = visible.length === 0;
  document.getElementById("result-summary").textContent =
    `Showing ${visible.length} of ${ledger.trophies.length} · ${state.earned.size} earned · ordered by the roadmap`;
  renderDetail(document.getElementById("detail"), {
    trophy: ledger.trophies.find((trophy) => trophy.id === state.selectedId) ?? null,
    state,
    onToggle: toggleTrophy,
  });
}

function renderHeader() {
  const total = ledger.trophies.length || 55;
  const earned = state.earned.size;
  const percent = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById("progress-count").textContent = `${earned} / ${total}`;
  document.getElementById("progress-percent").textContent = `${percent}%`;
  document.getElementById("progress-fill").style.width = `${percent}%`;
  const bar = document.getElementById("progress-bar");
  bar.setAttribute("aria-valuemax", String(total));
  bar.setAttribute("aria-valuenow", String(earned));

  const tally = document.getElementById("grade-tally");
  clear(tally);
  for (const grade of GRADES) {
    const all = ledger.trophies.filter((trophy) => trophy.grade === grade);
    const got = all.filter((trophy) => state.earned.has(trophy.id)).length;
    const item = el("li", grade);
    item.title = `${grade}: ${got} of ${all.length}`;
    item.append(el("span", "", grade));
    item.append(el("span", "", `${got}/${all.length}`));
    tally.append(item);
  }
}

function showLoadError(error) {
  document.getElementById("result-summary").textContent = "The ledger data could not be loaded.";
  const detail = document.getElementById("detail");
  clear(detail);
  const box = el("div", "detail-placeholder");
  box.append(el("h2", "", "Could not open trophies.json"));
  box.append(el("p", "", String(error.message ?? error)));
  box.append(el("p", "", "Serve app/ with a static server (python3 -m http.server 8899 inside app/) so data/trophies.json can be fetched, then reload."));
  detail.append(box);
}

boot();
