const tuningSelect = document.getElementById("global-tuning");
const scaleSelect = document.getElementById("global-scale");
const SCALE_STORAGE_KEY = "clarinet_scale_selection_v1";

function readStoredScale(defaultScale = "C_MAJOR") {
  const saved = localStorage.getItem(SCALE_STORAGE_KEY);
  if (saved && window.ClarinetCore.SCALES[saved]) {
    return saved;
  }
  localStorage.setItem(SCALE_STORAGE_KEY, defaultScale);
  return defaultScale;
}

function writeStoredScale(scale) {
  if (!window.ClarinetCore.SCALES[scale]) {
    return;
  }
  localStorage.setItem(SCALE_STORAGE_KEY, scale);
}

function init() {
  if (tuningSelect) {
    tuningSelect.value = window.ClarinetCore.readTuning("Bb");
    tuningSelect.addEventListener("change", () => {
      window.ClarinetCore.writeTuning(tuningSelect.value);
    });
  }

  if (scaleSelect) {
    const savedScale = readStoredScale("C_MAJOR");
    if (scaleSelect.querySelector(`option[value="${savedScale}"]`)) {
      scaleSelect.value = savedScale;
    }
    scaleSelect.addEventListener("change", () => {
      writeStoredScale(scaleSelect.value);
    });
  }
}

init();
