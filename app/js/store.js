// Progress lives in localStorage and can travel as a small JSON file.
// The store only ever accepts trophy ids that exist in the loaded ledger.

const STORAGE_KEY = "leonida-ledger:v1";
const APP_ID = "leonida-ledger";

export function loadProgress(trophies) {
  const validIds = new Set(trophies.map((trophy) => trophy.id));
  const fallback = { earned: new Set(), spoiler: false };
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return fallback;
  }
  if (!raw) return fallback;
  try {
    const data = JSON.parse(raw);
    const earned = Array.isArray(data.earned)
      ? data.earned.filter((id) => Number.isInteger(id) && validIds.has(id))
      : [];
    return { earned: new Set(earned), spoiler: Boolean(data.spoiler) };
  } catch {
    return fallback;
  }
}

export function saveProgress(state) {
  const payload = {
    app: APP_ID,
    version: 1,
    savedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // A private window with storage disabled still works for this session.
  }
}

export function exportProgress(state) {
  return JSON.stringify({
    app: APP_ID,
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  }, null, 2);
}

export function downloadProgress(state) {
  const blob = new Blob([exportProgress(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leonida-ledger-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseProgressFile(text, trophies) {
  const validIds = new Set(trophies.map((trophy) => trophy.id));
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.earned)) return null;
  if (data.app && data.app !== APP_ID) return null;
  const earned = [...new Set(data.earned.filter((id) => Number.isInteger(id) && validIds.has(id)))];
  return { earned: new Set(earned), spoiler: Boolean(data.spoiler) };
}
