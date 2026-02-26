const { TUNING_OFFSETS } = window.ClarinetCore;

const DIFFICULTY_PRESETS = {
  easy: {
    maxJump: 2,
    jumpBias: "small"
  },
  medium: {
    maxJump: 5,
    jumpBias: "mixed"
  },
  hard: {
    maxJump: 9,
    jumpBias: "large"
  }
};

const NOTES_PER_SEQUENCE = 8;
const BREATHING_PAUSE_MS = 1000;

const currentTuningEl = document.getElementById("ptn2-current-tuning");
const scaleSelect = document.getElementById("ptn2-scale");
const difficultySelect = document.getElementById("ptn2-difficulty");
const regChalumeau = document.getElementById("ptn2-reg-chalumeau");
const regClarion = document.getElementById("ptn2-reg-clarion");
const regAltissimo = document.getElementById("ptn2-reg-altissimo");
const startBtn = document.getElementById("ptn2-retry");
const stopBtn = document.getElementById("ptn2-stop");
const statusEl = document.getElementById("ptn2-status");
const roundsEl = document.getElementById("ptn2-rounds");
const npmEl = document.getElementById("ptn2-npm");
const reactionEl = document.getElementById("ptn2-reaction");
const scoreEl = document.getElementById("ptn2-score");
const noteLabelEl = document.getElementById("ptn2-note-label");

let audioContext = null;
let analyser = null;
let micStream = null;
let rafId = null;
let pauseTimerId = null;
let isRunning = false;
let inBreathingPause = false;
let currentTuning = "Bb";
let currentSequence = [];
let currentIndex = 0;
let sequenceShownAt = 0;
let currentCandidate = null;
let lastAcceptedAt = 0;
let sequenceCount = 0;
let totalAcceptedNotes = 0;
let runStartedAt = 0;
let scaleRegisterControls = null;
const pitchSmoother = window.PitchFinder.createMedianSmoother(7);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  currentTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
}

function getAllowedWrittenNotes() {
  return scaleRegisterControls.getScaleFilteredRegisterPool();
}

function pickNextIndex(currentIndex, poolLength, config) {
  const candidates = [];
  for (let i = 0; i < poolLength; i += 1) {
    const distance = Math.abs(i - currentIndex);
    if (distance > 0 && distance <= config.maxJump) {
      candidates.push(i);
    }
  }

  if (candidates.length === 0) {
    return randomInt(0, poolLength - 1);
  }

  const near = candidates.filter((idx) => Math.abs(idx - currentIndex) <= 2);
  const far = candidates.filter((idx) => Math.abs(idx - currentIndex) >= 4);

  if (config.jumpBias === "small" && near.length > 0) {
    return near[randomInt(0, near.length - 1)];
  }
  if (config.jumpBias === "large" && far.length > 0) {
    return far[randomInt(0, far.length - 1)];
  }
  if (config.jumpBias === "mixed") {
    const useFar = Math.random() < 0.35;
    if (useFar && far.length > 0) {
      return far[randomInt(0, far.length - 1)];
    }
    if (!useFar && near.length > 0) {
      return near[randomInt(0, near.length - 1)];
    }
  }

  return candidates[randomInt(0, candidates.length - 1)];
}

function generateSequence() {
  const pool = getAllowedWrittenNotes();
  const difficulty = DIFFICULTY_PRESETS[difficultySelect.value] || DIFFICULTY_PRESETS.easy;

  if (pool.length === 0) {
    return [];
  }

  const sequence = [];
  let currentPoolIndex = randomInt(0, pool.length - 1);
  sequence.push(pool[currentPoolIndex]);

  while (sequence.length < NOTES_PER_SEQUENCE) {
    currentPoolIndex = pickNextIndex(currentPoolIndex, pool.length, difficulty);
    sequence.push(pool[currentPoolIndex]);
  }

  return sequence;
}

function updateStats() {
  roundsEl.textContent = String(sequenceCount);
  if (!runStartedAt || totalAcceptedNotes === 0) {
    npmEl.textContent = "0.0";
    return;
  }
  const minutes = (performance.now() - runStartedAt) / 60000;
  const npm = totalAcceptedNotes / Math.max(minutes, 1 / 60000);
  npmEl.textContent = npm.toFixed(1);
}

function renderSequence() {
  if (currentSequence.length === 0) {
    scoreEl.innerHTML = "<p class=\"muted\">No playable notes for this scale/difficulty/register selection.</p>";
    noteLabelEl.textContent = "";
    return;
  }

  const width = Math.max(520, 140 + currentSequence.length * 86);
  const notes = currentSequence.map((writtenMidi, index) => {
    if (index < currentIndex) {
      return { writtenMidi, fill: "#0f7c62", stemColor: "#0f7c62" };
    }
    if (index === currentIndex) {
      return { writtenMidi, fill: "#10634f", stemColor: "#10634f" };
    }
    return { writtenMidi, fill: "#7faea3", stemColor: "#7faea3" };
  });

  const svg = window.ClarinetStaffRenderer.renderNoteSequenceSvg({
    width,
    height: 220,
    scale: scaleRegisterControls.getScale(),
    notes
  });
  svg.classList.add("staff-svg");
  svg.style.maxWidth = "100%";

  scoreEl.innerHTML = "";
  scoreEl.appendChild(svg);
  noteLabelEl.textContent = `Sequence: ${currentIndex}/${currentSequence.length} notes completed`;
}

function beginNextSequence() {
  currentSequence = generateSequence();
  currentIndex = 0;
  currentCandidate = null;
  sequenceShownAt = performance.now();
  inBreathingPause = false;

  if (currentSequence.length === 0) {
    statusEl.textContent = "No notes available for this scale/difficulty/register selection.";
  } else {
    statusEl.textContent = "Play these notes in order.";
  }
  renderSequence();
}

function startBreathingPause() {
  inBreathingPause = true;
  sequenceCount += 1;
  updateStats();
  statusEl.textContent = "Good. Breathing pause (1s)...";

  if (pauseTimerId) {
    clearTimeout(pauseTimerId);
  }
  pauseTimerId = setTimeout(() => {
    pauseTimerId = null;
    if (!isRunning) {
      return;
    }
    beginNextSequence();
  }, BREATHING_PAUSE_MS);
}

function acceptCurrentNote() {
  const now = performance.now();
  if (now - lastAcceptedAt < 170) {
    return;
  }

  currentIndex += 1;
  totalAcceptedNotes += 1;
  lastAcceptedAt = now;

  const reactionMs = now - sequenceShownAt;
  reactionEl.textContent = `${Math.round(reactionMs)} ms`;
  updateStats();
  renderSequence();

  if (currentIndex >= currentSequence.length) {
    startBreathingPause();
  }
}

function checkMatch(concertMidi) {
  if (!isRunning || inBreathingPause || currentSequence.length === 0 || currentIndex >= currentSequence.length) {
    return;
  }

  const writtenMidi = concertMidi + TUNING_OFFSETS[currentTuning];
  const now = performance.now();

  if (!currentCandidate || currentCandidate.midi !== writtenMidi) {
    currentCandidate = { midi: writtenMidi, startedAt: now };
    return;
  }

  if (now - currentCandidate.startedAt < 130) {
    return;
  }

  if (writtenMidi === currentSequence[currentIndex]) {
    acceptCurrentNote();
  }
}

function tick() {
  if (!isRunning || !analyser || !audioContext) {
    rafId = null;
    return;
  }

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  const pitch = window.PitchFinder.autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch > 60 && pitch < 2100) {
    const stable = pitchSmoother.push(pitch);
    const concertMidi = window.ClarinetCore.freqToMidi(stable);
    checkMatch(concertMidi);
  }

  rafId = requestAnimationFrame(tick);
}

async function startMicrophone() {
  if (isRunning) {
    return;
  }

  statusEl.textContent = "Requesting microphone access...";
  try {
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
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    startBtn.disabled = true;
    stopBtn.disabled = false;
    scaleRegisterControls.setDisabled(true);
    difficultySelect.disabled = true;
    isRunning = true;
    inBreathingPause = false;
    runStartedAt = performance.now();
    currentCandidate = null;
    lastAcceptedAt = 0;
    sequenceCount = 0;
    totalAcceptedNotes = 0;
    reactionEl.textContent = "-";
    pitchSmoother.clear();

    updateStats();
    beginNextSequence();
    tick();
  } catch (error) {
    startBtn.disabled = false;
    statusEl.textContent = `Could not access microphone: ${error.message}`;
  }
}

function stopMicrophone() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (pauseTimerId) {
    clearTimeout(pauseTimerId);
    pauseTimerId = null;
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
  isRunning = false;
  inBreathingPause = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  scaleRegisterControls.setDisabled(false);
  difficultySelect.disabled = false;
  statusEl.textContent = "Microphone is off.";
}

function init() {
  initializeTuning();
  scaleRegisterControls = window.ClarinetScaleRegisterControls.init({
    scaleSelect,
    registerCheckboxes: {
      chalumeau: regChalumeau,
      clarion: regClarion,
      altissimo: regAltissimo
    },
    defaultScale: "C_MAJOR"
  });

  startBtn.addEventListener("click", startMicrophone);
  stopBtn.addEventListener("click", stopMicrophone);

  renderSequence();
}

init();
