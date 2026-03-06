const currentNoteEl = document.getElementById("dev-current-note");
const currentHzEl = document.getElementById("dev-current-hz");
const row1El = document.getElementById("dev-row-1");
const row2El = document.getElementById("dev-row-2");
const settingsControlsEl = document.getElementById("dev-pitch-settings-controls");
const resetSettingsButton = document.getElementById("dev-pitch-reset");
const sliderCanvas = document.getElementById("dev-pitch-slider");
const sliderLabelEl = document.getElementById("dev-slider-label");

let audioContext = null;
let analyser = null;
let micStream = null;
let rafId = null;
let timeDomainBuffer = null;
let bottomBar = null;
const pitchSmoother = window.PitchFinder.createMedianSmoother(5);

const MIDI_MIN = 48;
const MIDI_MAX = 96;

const rows = [[], []];
let writeRow = 0;
let writeCol = 0;
let lastPushedMidi = null;
const settingInputs = {};

const settingSpecs = [
  { key: "yinThreshold", label: "YIN threshold", min: 0.05, max: 0.35, step: 0.005, decimals: 3 },
  { key: "probabilityThreshold", label: "Confidence threshold", min: 0.3, max: 0.95, step: 0.01, decimals: 2 },
  { key: "volumeThreshold", label: "Volume threshold", min: 0.001, max: 0.08, step: 0.001, decimals: 3 },
  { key: "minFrequency", label: "Minimum Hz", min: 40, max: 300, step: 1, decimals: 0 },
  { key: "maxFrequency", label: "Maximum Hz", min: 250, max: 2200, step: 1, decimals: 0 },
  { key: "noiseFloorAlpha", label: "Noise floor alpha", min: 0.9, max: 0.999, step: 0.001, decimals: 3 }
];

function formatSettingValue(spec, value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return spec.decimals > 0 ? value.toFixed(spec.decimals) : String(Math.round(value));
}

function setControlsFromSettings(settings) {
  settingSpecs.forEach((spec) => {
    const pair = settingInputs[spec.key];
    if (!pair) {
      return;
    }
    const value = Number(settings[spec.key]);
    if (!Number.isFinite(value)) {
      return;
    }
    pair.range.value = String(value);
    pair.value.textContent = formatSettingValue(spec, value);
  });
}

function buildPitchSettingsControls() {
  if (!settingsControlsEl || !window.PitchFinder || typeof window.PitchFinder.getSettings !== "function") {
    return;
  }

  settingsControlsEl.innerHTML = "";
  const settings = window.PitchFinder.getSettings();

  settingSpecs.forEach((spec) => {
    const row = document.createElement("label");
    row.className = "dev-setting-row";

    const name = document.createElement("span");
    name.className = "dev-setting-name";
    name.textContent = spec.label;

    const value = document.createElement("span");
    value.className = "dev-setting-value";
    value.textContent = formatSettingValue(spec, Number(settings[spec.key]));

    const range = document.createElement("input");
    range.type = "range";
    range.min = String(spec.min);
    range.max = String(spec.max);
    range.step = String(spec.step);
    range.value = String(settings[spec.key]);
    range.addEventListener("input", () => {
      const updated = window.PitchFinder.updateSettings({ [spec.key]: Number(range.value) });
      setControlsFromSettings(updated);
    });

    settingInputs[spec.key] = { range, value };
    row.appendChild(name);
    row.appendChild(value);
    row.appendChild(range);
    settingsControlsEl.appendChild(row);
  });

  if (resetSettingsButton) {
    resetSettingsButton.addEventListener("click", () => {
      const updated = window.PitchFinder.resetSettings();
      setControlsFromSettings(updated);
    });
  }
}

function renderRows() {
  if (!window.ClarinetVexRenderer || typeof window.ClarinetVexRenderer.renderNoteSequenceSvg !== "function") {
    row1El.textContent = "VexFlow renderer unavailable.";
    row2El.textContent = "VexFlow renderer unavailable.";
    return;
  }

  const renderRow = (host, notes) => {
    host.innerHTML = "";
    const width = Math.max(320, host.clientWidth || 320);
    const svg = window.ClarinetVexRenderer.renderNoteSequenceSvg({
      width,
      height: 132,
      scale: "CHROMATIC",
      notes: notes.length > 0
        ? notes.map((writtenMidi) => ({
          writtenMidi,
          fill: "#1e3a66",
          stemColor: "#1e3a66"
        }))
        : [{ writtenMidi: 67, visible: false }],
      className: "staff-svg"
    });
    host.appendChild(svg);
  };

  renderRow(row1El, rows[0]);
  renderRow(row2El, rows[1]);
}

function pushNote(writtenMidi) {
  if (!Number.isFinite(writtenMidi) || writtenMidi === lastPushedMidi) {
    return;
  }
  lastPushedMidi = writtenMidi;
  rows[writeRow][writeCol] = writtenMidi;
  writeCol += 1;
  if (writeCol >= 8) {
    writeCol = 0;
    writeRow = writeRow === 0 ? 1 : 0;
    rows[writeRow] = [];
  }
  renderRows();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawSlider(midiFloat = null, hz = null) {
  const ctx = sliderCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(sliderCanvas.clientWidth));
  const h = Math.max(1, Math.floor(sliderCanvas.clientHeight));

  if (sliderCanvas.width !== Math.floor(w * dpr) || sliderCanvas.height !== Math.floor(h * dpr)) {
    sliderCanvas.width = Math.floor(w * dpr);
    sliderCanvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, w, h);

  const left = 16;
  const right = w - 16;
  const y = Math.round(h * 0.56);

  ctx.strokeStyle = "#1f3a34";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  ctx.fillStyle = "#325851";
  ctx.font = "12px 'Avenir Next', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(window.ClarinetCore.midiToName(MIDI_MIN, true), left, y - 12);
  ctx.textAlign = "right";
  ctx.fillText(window.ClarinetCore.midiToName(MIDI_MAX, true), right, y - 12);

  if (midiFloat !== null && Number.isFinite(midiFloat)) {
    const ratio = clamp((midiFloat - MIDI_MIN) / (MIDI_MAX - MIDI_MIN), 0, 1);
    const x = left + ratio * (right - left);

    ctx.strokeStyle = "#0f7c62";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x, y + 20);
    ctx.stroke();

    ctx.fillStyle = "#0f7c62";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    sliderLabelEl.textContent = `Pitch position: ${midiFloat.toFixed(2)} MIDI${hz ? ` (${hz.toFixed(1)} Hz)` : ""}`;
  } else {
    sliderLabelEl.textContent = "Pitch position: -";
  }
}

function tick() {
  if (!audioContext || !analyser) {
    rafId = null;
    return;
  }

  if (!timeDomainBuffer || timeDomainBuffer.length !== analyser.fftSize) {
    timeDomainBuffer = new Float32Array(analyser.fftSize);
  }

  analyser.getFloatTimeDomainData(timeDomainBuffer);
  if (bottomBar) {
    bottomBar.updateFromTimeDomain(timeDomainBuffer);
  }

  const hz = window.PitchFinder.autoCorrelate(timeDomainBuffer, audioContext.sampleRate);
  if (hz > 60 && hz < 2200) {
    const stable = pitchSmoother.push(hz);
    const midi = window.ClarinetCore.freqToMidi(stable);
    const midiFloat = window.ClarinetCore.freqToMidiFloat(stable);
    const note = window.ClarinetCore.midiToName(midi, true);

    currentNoteEl.textContent = note;
    currentHzEl.textContent = `${stable.toFixed(1)} Hz`;
    pushNote(midi);
    drawSlider(midiFloat, stable);

    if (bottomBar) {
      bottomBar.setDetectedPitches(note, note);
      bottomBar.setListening(true);
    }
  } else {
    lastPushedMidi = null;
    drawSlider(null, null);
    if (bottomBar) {
      bottomBar.setListening(false);
      bottomBar.clearDetectedPitches();
    }
  }

  rafId = requestAnimationFrame(tick);
}

async function startListening() {
  if (micStream) {
    return;
  }
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
    }
  });

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaStreamSource(micStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);

  pitchSmoother.clear();
  if (bottomBar) {
    bottomBar.setStartEnabled(false);
  }
  tick();
}

function stopListening() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  if (bottomBar) {
    bottomBar.setListening(false);
    bottomBar.setStartEnabled(true);
    bottomBar.clearDetectedPitches();
  }
}

function init() {
  buildPitchSettingsControls();
  renderRows();
  drawSlider(null, null);
  window.addEventListener("resize", renderRows);
  window.addEventListener("clarinet:pitch-settings", (event) => {
    if (event && event.detail) {
      setControlsFromSettings(event.detail);
    }
  });

  bottomBar = window.BottomBar.init({
    startLabel: "Start listening",
    stopLabel: "Stop",
    onStart: startListening,
    onStop: stopListening,
    startEnabled: true,
    stopEnabled: true,
    listening: false
  });
}

init();
