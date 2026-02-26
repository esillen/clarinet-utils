const tuningSelect = document.getElementById("global-tuning");
const scaleSelect = document.getElementById("global-scale");
const transposeModeCards = Array.from(document.querySelectorAll("[data-requires-transposition]"));
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

function updateTranspositionGameAvailability(tuning) {
  const disable = tuning === "C";
  transposeModeCards.forEach((card) => {
    card.classList.toggle("card-disabled", disable);
    card.setAttribute("aria-disabled", disable ? "true" : "false");
    if (disable) {
      card.setAttribute("tabindex", "-1");
      card.setAttribute("title", "Unavailable for C clarinet tuning.");
    } else {
      card.removeAttribute("tabindex");
      card.removeAttribute("title");
    }
  });
}

function init() {
  if (tuningSelect) {
    tuningSelect.value = window.ClarinetCore.readTuning("Bb");
    updateTranspositionGameAvailability(tuningSelect.value);
    tuningSelect.addEventListener("change", () => {
      window.ClarinetCore.writeTuning(tuningSelect.value);
      updateTranspositionGameAvailability(tuningSelect.value);
    });
  } else {
    updateTranspositionGameAvailability(window.ClarinetCore.readTuning("Bb"));
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

  transposeModeCards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (card.classList.contains("card-disabled")) {
        event.preventDefault();
      }
    });
  });
}

init();
