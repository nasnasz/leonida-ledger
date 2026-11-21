// Loads the ledger's own JSON and answers the small questions the views ask
// about a trophy: its grade label, kind label, hidden state and target text.

export const GRADES = ["platinum", "gold", "silver", "bronze"];
export const KINDS = ["story", "missable", "collectible", "activity", "online"];

const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectible: "Collectible",
  activity: "Activity",
  online: "Online",
};

export async function loadLedger() {
  const response = await fetch("data/trophies.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load trophies.json (${response.status})`);
  const doc = await response.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length === 0) {
    throw new Error("trophies.json has no trophies array");
  }
  return {
    meta: Array.isArray(doc) ? {} : doc,
    roadmap: Array.isArray(doc.roadmap) ? doc.roadmap : [],
    trophies,
  };
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function kindLabel(kind) {
  return KIND_LABELS[kind] ?? kind;
}

// A story trophy is shielded only while spoilers are on and it is not earned.
export function isShielded(trophy, earned, spoilerOn) {
  return Boolean(spoilerOn) && trophy.kind === "story" && !earned.has(trophy.id);
}

export function targetText(trophy) {
  if (!Number.isFinite(trophy.target)) return null;
  if (trophy.name === "Dime on the Dollar") return "$250,000 laundry target";
  if (trophy.name === "Treat Yo Self") return "$100,000 spending target";
  if (trophy.target === 100 && trophy.kind === "collectible" && trophy.name === "A Long Road") return "the whole completion list";
  return `${trophy.target} needed`;
}

export function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
