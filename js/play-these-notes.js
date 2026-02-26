const { TUNING_OFFSETS } = window.ClarinetCore;
const NOTE_COLORS = window.ClarinetVexRenderer.NOTE_COLORS;

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
const addAccidentalsEl = document.getElementById("ptn2-add-accidentals");
const scoreStatusEl = document.getElementById("ptn2-score-status");
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
let bottomBar = null;

function syncBottomBarState() {
  if (!bottomBar) {
    return;
  }
  const activelyListening = isRunning && !inBreathingPause && currentSequence.length > 0 && currentIndex < currentSequence.length;
  bottomBar.setListening(activelyListening);
  bottomBar.setStartEnabled(!isRunning);
  bottomBar.setStopEnabled(isRunning);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  currentTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
}

function getAllowedWrittenNotes() {
  const registerPool = scaleRegisterControls.getRegisterPool();
  const scalePool = scaleRegisterControls.filterToScale(registerPool);
  const accidentalPool = registerPool.filter((midi) => !scalePool.includes(midi));
  return {
    registerPool,
    scalePool,
    accidentalPool
  };
}

function getAccidentalRange() {
  if (difficultySelect.value === "easy") {
    return { min: 0, max: 1 };
  }
  if (difficultySelect.value === "hard") {
    return { min: 1, max: 3 };
  }
  return { min: 0, max: 2 };
}

function planAccidentalTargets(noteCount) {
  const targets = new Set();
  if (!scaleRegisterControls.isAddAccidentalsEnabled() || noteCount <= 0) {
    return targets;
  }
  const range = getAccidentalRange();
  const targetCount = randomInt(range.min, range.max);
  while (targets.size < Math.min(noteCount, targetCount)) {
    targets.add(randomInt(0, noteCount - 1));
  }
  return targets;
}

function chooseNextByJumpBias(currentIndex, candidateIndices, config) {
  if (candidateIndices.length === 0) {
    return null;
  }
  const near = candidateIndices.filter((idx) => Math.abs(idx - currentIndex) <= 2);
  const far = candidateIndices.filter((idx) => Math.abs(idx - currentIndex) >= 4);

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
  return candidateIndices[randomInt(0, candidateIndices.length - 1)];
}

function generateSequence() {
  const pools = getAllowedWrittenNotes();
  const pool = pools.registerPool;
  const difficulty = DIFFICULTY_PRESETS[difficultySelect.value] || DIFFICULTY_PRESETS.easy;
  const scaleSet = new Set(pools.scalePool);
  const accidentalTargets = planAccidentalTargets(NOTES_PER_SEQUENCE);

  if (pool.length === 0) {
    return [];
  }

  const chooseStartAccidental = pools.accidentalPool.length > 0 && accidentalTargets.has(0);
  let startPool = chooseStartAccidental ? pools.accidentalPool : pools.scalePool;
  if (startPool.length === 0) {
    startPool = pools.scalePool.length > 0 ? pools.scalePool : pools.accidentalPool;
  }
  if (startPool.length === 0) {
    return [];
  }

  const sequence = [];
  let currentMidi = startPool[randomInt(0, startPool.length - 1)];
  sequence.push(currentMidi);

  while (sequence.length < NOTES_PER_SEQUENCE) {
    const currentIndex = pool.indexOf(currentMidi);
    const candidates = [];
    for (let i = 0; i < pool.length; i += 1) {
      const distance = Math.abs(i - currentIndex);
      if (distance > 0 && distance <= difficulty.maxJump) {
        candidates.push(i);
      }
    }

    const wantAccidental = pools.accidentalPool.length > 0 && accidentalTargets.has(sequence.length);
    const preferred = candidates.filter((idx) => {
      const midi = pool[idx];
      const isAccidental = !scaleSet.has(midi);
      return wantAccidental ? isAccidental : !isAccidental;
    });
    const chosenIndex = chooseNextByJumpBias(currentIndex, preferred.length > 0 ? preferred : candidates, difficulty);
    if (chosenIndex === null) {
      break;
    }
    currentMidi = pool[chosenIndex];
    sequence.push(currentMidi);
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
    if (scoreStatusEl) {
      scoreStatusEl.textContent = "No playable notes for this selection. Adjust scale/registers/difficulty.";
    }
    noteLabelEl.textContent = "";
    return;
  }

  const isMobile = window.matchMedia("(max-width: 620px)").matches;
  const width = isMobile
    ? Math.max(620, 180 + currentSequence.length * 104)
    : Math.max(520, 140 + currentSequence.length * 86);
  const notes = currentSequence.map((writtenMidi, index) => {
    if (index < currentIndex) {
      return { writtenMidi, fill: NOTE_COLORS.correct, stemColor: NOTE_COLORS.correct };
    }
    return { writtenMidi, fill: NOTE_COLORS.toPlay, stemColor: NOTE_COLORS.toPlay };
  });

  const svg = window.ClarinetVexRenderer.renderNoteSequenceSvg({
    width,
    height: isMobile ? 300 : 220,
    scale: scaleRegisterControls.getScale(),
    notes,
    noteColor: NOTE_COLORS.neutral
  });
  svg.classList.add("staff-svg");
  svg.style.maxWidth = isMobile ? "none" : "100%";

  scoreEl.innerHTML = "";
  scoreEl.appendChild(svg);
  noteLabelEl.textContent = `Sequence: ${currentIndex}/${currentSequence.length} notes completed`;
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Play from left to right. Green = completed, dark = current, light = upcoming.";
  }
}

function beginNextSequence() {
  currentSequence = generateSequence();
  currentIndex = 0;
  currentCandidate = null;
  sequenceShownAt = performance.now();
  inBreathingPause = false;

  if (scoreStatusEl) {
    scoreStatusEl.textContent = currentSequence.length === 0
      ? "No notes available for this scale/difficulty/register selection."
      : "Play these notes in order.";
  }
  syncBottomBarState();
  renderSequence();
}

function startBreathingPause() {
  inBreathingPause = true;
  sequenceCount += 1;
  updateStats();
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Good. Breathing pause (1s)...";
  }
  syncBottomBarState();

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
  if (bottomBar) {
    bottomBar.updateFromTimeDomain(buffer);
  }
  const pitch = window.PitchFinder.autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch > 60 && pitch < 2100) {
    const stable = pitchSmoother.push(pitch);
    const concertMidi = window.ClarinetCore.freqToMidi(stable);
    if (bottomBar) {
      bottomBar.setDetectedPitches(
        window.ClarinetCore.midiToName(concertMidi, true),
        window.ClarinetCore.midiToName(concertMidi + TUNING_OFFSETS[currentTuning], true)
      );
    }
    checkMatch(concertMidi);
  }

  rafId = requestAnimationFrame(tick);
}

async function startMicrophone() {
  if (isRunning) {
    return;
  }

  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Requesting microphone access...";
  }
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
    syncBottomBarState();

    updateStats();
    beginNextSequence();
    tick();
  } catch (error) {
    syncBottomBarState();
    if (scoreStatusEl) {
      scoreStatusEl.textContent = `Could not access microphone: ${error.message}`;
    }
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
  scaleRegisterControls.setDisabled(false);
  difficultySelect.disabled = false;
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Press Start, then play the notes shown here.";
  }
  syncBottomBarState();
  if (bottomBar) {
    bottomBar.clearDetectedPitches();
  }
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
    addAccidentalsCheckbox: addAccidentalsEl,
    defaultScale: "C_MAJOR"
  });

  bottomBar = window.BottomBar.init({
    startLabel: "Start",
    stopLabel: "Stop",
    onStart: startMicrophone,
    onStop: stopMicrophone,
    startEnabled: true,
    stopEnabled: false,
    listening: false
  });

  renderSequence();
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Press Start, then play the notes shown here.";
  }
  syncBottomBarState();
}

init();
