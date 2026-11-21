// Export, import and reset. Import replaces the ledger in this browser and
// reports how many earned ids the file actually supplied.

import { downloadProgress, parseProgressFile } from "./store.js";
import { showToast } from "./dom.js";

export function initIo({ trophies, state, onReplace }) {
  document.getElementById("export").addEventListener("click", () => {
    downloadProgress(state);
    showToast(`Exported ${state.earned.size} earned troph${state.earned.size === 1 ? "y" : "ies"}.`);
  });

  const input = document.getElementById("import");
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    const parsed = parseProgressFile(await file.text(), trophies);
    if (!parsed) {
      showToast("That file is not a Leonida Ledger progress export.");
      return;
    }
    onReplace(parsed);
    showToast(`Imported ${parsed.earned.size} earned troph${parsed.earned.size === 1 ? "y" : "ies"}.`);
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (state.earned.size === 0) {
      showToast("Nothing is marked earned yet.");
      return;
    }
    if (window.confirm("Clear every earned trophy in this browser? Your exported files are not touched.")) {
      onReplace({ earned: new Set(), spoiler: state.spoiler });
      showToast("Progress cleared.");
    }
  });
}
