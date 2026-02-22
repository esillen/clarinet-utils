const tuningSelect = document.getElementById("global-tuning");

function init() {
  if (tuningSelect) {
    tuningSelect.value = window.ClarinetCore.readTuning("Bb");
    tuningSelect.addEventListener("change", () => {
      window.ClarinetCore.writeTuning(tuningSelect.value);
    });
  }

  if (window.initReorderableWorkspace) {
    window.initReorderableWorkspace({
      workspaceSelector: "#main-workspace",
      itemSelector: ".main-panel",
      storageKey: "panel_order_main_v1"
    });
  }
}

init();
