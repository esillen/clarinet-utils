const tuningSelect = document.getElementById("global-tuning");

function init() {
if (tuningSelect) {
  tuningSelect.value = window.ClarinetCore.readTuning("Bb");
  tuningSelect.addEventListener("change", () => {
    window.ClarinetCore.writeTuning(tuningSelect.value);
  });
}
}

init();
