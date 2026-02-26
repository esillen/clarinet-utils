const { TUNING_OFFSETS } = window.ClarinetCore;

const DIFFICULTY_PRESETS = {
  easy: {
    minNotes: 3,
    maxNotes: 5,
    maxJump: 2,
    jumpBias: "small"
  },
  medium: {
    minNotes: 5,
    maxNotes: 7,
    maxJump: 5,
    jumpBias: "mixed"
  },
  hard: {
    minNotes: 7,
    maxNotes: 10,
    maxJump: 8,
    jumpBias: "large"
  }
};

const currentTuningEl = document.getElementById("pam-current-tuning");
const scaleSelect = document.getElementById("scale-select");
const difficultySelect = document.getElementById("difficulty-select");
const regChalumeau = document.getElementById("pam-reg-chalumeau");
const regClarion = document.getElementById("pam-reg-clarion");
const regAltissimo = document.getElementById("pam-reg-altissimo");
const revealFirstNote = document.getElementById("reveal-first-note");
const customControls = document.getElementById("custom-controls");
const customCount = document.getElementById("custom-count");
const customMin = document.getElementById("custom-min");
const customMax = document.getElementById("custom-max");
const customJump = document.getElementById("custom-jump");
const startBtn = document.getElementById("start-game");
const stopBtn = document.getElementById("stop-game");
const gameStatus = document.getElementById("game-status");
const roundNumberEl = document.getElementById("round-number");
const roundSpeedEl = document.getElementById("round-speed");
const roundResultEl = document.getElementById("round-result");
const scoreOutput = document.getElementById("score-output");
const heardNotesEl = document.getElementById("heard-notes");

let audioContext = null;
let analyser = null;
let micStream = null;
let loopRaf = null;
let roundCounter = 0;
let gameRunning = false;
let currentMode = "idle";
let resolveRoundInput = null;
let cancelRoundInput = null;
let activeRoundToken = 0;
let detectedSequence = [];
let currentCandidate = null;
let lastAcceptedAt = 0;
let currentTuning = "Bb";
let scaleRegisterControls = null;
const pitchSmoother = window.PitchFinder.createMedianSmoother(7);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  if (currentTuningEl) {
    currentTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
  }
}

function updateDifficultyVisibility() {
  customControls.hidden = difficultySelect.value !== "custom";
}

function getDifficultyConfig() {
  if (difficultySelect.value !== "custom") {
    return DIFFICULTY_PRESETS[difficultySelect.value];
  }

  const count = Math.min(16, Math.max(3, Number(customCount.value) || 6));
  const minMidi = Math.min(96, Math.max(55, Number(customMin.value) || 67));
  const maxMidi = Math.min(100, Math.max(minMidi + 1, Number(customMax.value) || 90));
  const maxJump = Math.min(10, Math.max(1, Number(customJump.value) || 4));

  return {
    minNotes: count,
    maxNotes: count,
    minMidi,
    maxMidi,
    maxJump,
    jumpBias: "mixed"
  };
}

function getSelectableNotePool(config) {
  const registerPool = scaleRegisterControls.getRegisterPool();
  if (registerPool.length === 0) {
    return [];
  }

  let candidatePool = registerPool;
  if (difficultySelect.value === "custom") {
    candidatePool = registerPool.filter((midi) => midi >= config.minMidi && midi <= config.maxMidi);
  }

  if (candidatePool.length === 0) {
    return [];
  }

  const scaleFiltered = scaleRegisterControls.filterToScale(candidatePool);

  return scaleFiltered.length > 0 ? scaleFiltered : candidatePool;
}

function pickNextIndex(currentIndex, poolLength, config) {
  const candidates = [];
  for (let index = 0; index < poolLength; index += 1) {
    const distance = Math.abs(index - currentIndex);
    if (distance > 0 && distance <= config.maxJump) {
      candidates.push(index);
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

function generatePhrase() {
  const config = getDifficultyConfig();
  const pool = getSelectableNotePool(config);
  const phraseLength = randomInt(config.minNotes, config.maxNotes);

  if (pool.length === 0) {
    return [];
  }

  const phrase = [];
  let currentIndex = randomInt(0, pool.length - 1);
  phrase.push(pool[currentIndex]);

  while (phrase.length < phraseLength) {
    currentIndex = pickNextIndex(currentIndex, pool.length, config);
    phrase.push(pool[currentIndex]);
  }

  return phrase;
}

function renderPlaceholderScore() {
  scoreOutput.innerHTML = "<p class=\"muted\">Listening for your response...</p>";
}

function renderScore(expectedWritten, playedConcert = [], reveal = false, revealFirst = false) {
  const width = Math.max(400, 130 + expectedWritten.length * 62);
  const tuningOffset = TUNING_OFFSETS[currentTuning];
  const notes = expectedWritten.map((midi, index) => {
    const playedWritten = playedConcert[index] !== undefined ? playedConcert[index] + tuningOffset : null;
    const correct = playedWritten !== null && Math.abs(playedWritten - midi) <= 0;
    const showPreReveal = !reveal && revealFirst && index === 0;
    const fillColor = reveal ? (correct ? "#0f7c62" : "#c23f4d") : "#10634f";
    return {
      writtenMidi: midi,
      visible: reveal || showPreReveal,
      fill: fillColor,
      stemColor: fillColor
    };
  });

  const svg = window.ClarinetStaffRenderer.renderNoteSequenceSvg({
    notes,
    width,
    height: 210,
    scale: scaleRegisterControls.getScale()
  });
  svg.setAttribute("class", "staff-svg");
  svg.style.maxWidth = "100%";

  scoreOutput.innerHTML = "";
  scoreOutput.appendChild(svg);
}

function maybeAcceptDetectedNote(midi) {
  const now = performance.now();

  if (!currentCandidate || Math.abs(currentCandidate.midi - midi) > 0) {
    currentCandidate = { midi, startedAt: now };
    return;
  }

  if (now - currentCandidate.startedAt < 170) {
    return;
  }

  const last = detectedSequence[detectedSequence.length - 1];
  if (last === midi || now - lastAcceptedAt < 180) {
    return;
  }

  detectedSequence.push(midi);
  lastAcceptedAt = now;

  if (resolveRoundInput) {
    resolveRoundInput([...detectedSequence]);
  }
}

function analysisLoop() {
  if (!gameRunning || !analyser || !audioContext) {
    loopRaf = null;
    return;
  }

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);

  if (currentMode === "listening") {
    const pitch = window.PitchFinder.autoCorrelate(buffer, audioContext.sampleRate);
    if (pitch > 60 && pitch < 2100) {
      const stable = pitchSmoother.push(pitch);
      const midi = window.ClarinetCore.freqToMidi(stable);
      maybeAcceptDetectedNote(midi);
    }
  }

  loopRaf = requestAnimationFrame(analysisLoop);
}

async function setupAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  await audioContext.resume();

  if (!micStream) {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });
  }

  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    const source = audioContext.createMediaStreamSource(micStream);
    source.connect(analyser);
  }
}

function stopAudio() {
  if (loopRaf) {
    cancelAnimationFrame(loopRaf);
    loopRaf = null;
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
}

async function playTone(midi, durationMs) {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const durationSec = durationMs / 1000;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = window.ClarinetCore.midiToFreq(midi);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSec + 0.01);

  await sleep(durationMs + 80);
}

async function playPrompt(concertPhrase, token) {
  currentMode = "playing";
  gameStatus.textContent = "Listen...";
  for (let i = 0; i < concertPhrase.length; i += 1) {
    if (!gameRunning || token !== activeRoundToken) {
      return;
    }
    await playTone(concertPhrase[i], 380);
  }
  await sleep(320);
}

function listenForPhrase(expectedLength, token) {
  currentMode = "listening";
  pitchSmoother.clear();
  detectedSequence = [];
  currentCandidate = null;
  lastAcceptedAt = 0;
  heardNotesEl.textContent = "Listening...";

  const startedAt = performance.now();
  const timeoutMs = Math.max(7000, expectedLength * 2800);

  return new Promise((resolve) => {
    const cleanup = (result) => {
      resolveRoundInput = null;
      cancelRoundInput = null;
      resolve(result);
    };

    const timeoutId = setTimeout(() => {
      cleanup({
        notes: [...detectedSequence],
        completed: false,
        elapsedMs: performance.now() - startedAt
      });
    }, timeoutMs);

    resolveRoundInput = (notes) => {
      if (!gameRunning || token !== activeRoundToken) {
        clearTimeout(timeoutId);
        cleanup({ notes, completed: false, elapsedMs: performance.now() - startedAt });
        return;
      }

      if (notes.length >= expectedLength) {
        clearTimeout(timeoutId);
        cleanup({
          notes,
          completed: true,
          elapsedMs: performance.now() - startedAt
        });
      }
    };

    cancelRoundInput = () => {
      clearTimeout(timeoutId);
      cleanup({
        notes: [...detectedSequence],
        completed: false,
        elapsedMs: performance.now() - startedAt
      });
    };
  });
}

function sequencesMatch(expected, heard) {
  if (heard.length < expected.length) {
    return false;
  }

  for (let i = 0; i < expected.length; i += 1) {
    if (Math.abs(expected[i] - heard[i]) > 0) {
      return false;
    }
  }

  return true;
}

async function runRound(token) {
  const phraseWritten = generatePhrase();
  if (phraseWritten.length === 0) {
    gameStatus.textContent = "No notes available with current range/scale settings.";
    return;
  }

  const tuningOffset = TUNING_OFFSETS[currentTuning];
  const phraseConcert = phraseWritten.map((midi) => midi - tuningOffset);

  roundCounter += 1;
  roundNumberEl.textContent = String(roundCounter);
  roundResultEl.textContent = "-";
  roundSpeedEl.textContent = "-";
  heardNotesEl.textContent = "";
  renderScore(phraseWritten, [], false, revealFirstNote.checked);

  await playPrompt(phraseConcert, token);
  if (!gameRunning || token !== activeRoundToken) {
    return;
  }

  gameStatus.textContent = "Your turn: play it back.";
  const attempt = await listenForPhrase(phraseConcert.length, token);
  if (!gameRunning || token !== activeRoundToken) {
    return;
  }

  const success = attempt.completed && sequencesMatch(phraseConcert, attempt.notes);
  const speedSec = (attempt.elapsedMs / 1000).toFixed(2);

  roundSpeedEl.textContent = `${speedSec}s`;
  roundResultEl.textContent = success ? "Correct" : "Try again";
  gameStatus.textContent = success
    ? "Nice. Next phrase coming..."
    : "Not quite. Next phrase coming...";

  const heardText = attempt.notes.length > 0
    ? attempt.notes.map((midi) => window.ClarinetCore.midiToName(midi + tuningOffset, true)).join(" ")
    : "(no stable notes detected)";

  heardNotesEl.textContent = `You played: ${heardText}`;
  renderScore(phraseWritten, attempt.notes, true, false);
}

async function startGame() {
  if (gameRunning) {
    return;
  }

  const preflightPool = getSelectableNotePool(getDifficultyConfig());
  if (preflightPool.length === 0) {
    gameStatus.textContent = "Select at least one register (and matching scale/custom range).";
    return;
  }

  try {
    await setupAudio();
  } catch (error) {
    gameStatus.textContent = `Could not start microphone/audio: ${error.message}`;
    return;
  }

  gameRunning = true;
  activeRoundToken += 1;
  const token = activeRoundToken;

  startBtn.disabled = true;
  stopBtn.disabled = false;
  scaleRegisterControls.setDisabled(true);
  difficultySelect.disabled = true;
  revealFirstNote.disabled = true;
  customControls.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });

  if (!loopRaf) {
    analysisLoop();
  }

  while (gameRunning && token === activeRoundToken) {
    await runRound(token);
    if (!gameRunning || token !== activeRoundToken) {
      break;
    }
    await sleep(1200);
  }
}

function stopGame() {
  if (!gameRunning) {
    return;
  }

  gameRunning = false;
  activeRoundToken += 1;
  currentMode = "idle";
  if (cancelRoundInput) {
    cancelRoundInput();
  } else {
    resolveRoundInput = null;
  }

  stopAudio();

  startBtn.disabled = false;
  stopBtn.disabled = true;
  scaleRegisterControls.setDisabled(false);
  difficultySelect.disabled = false;
  revealFirstNote.disabled = false;
  customControls.querySelectorAll("input").forEach((input) => {
    input.disabled = false;
  });

  gameStatus.textContent = "Game stopped. Press Start game to begin again.";
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
  updateDifficultyVisibility();

  difficultySelect.addEventListener("change", updateDifficultyVisibility);
  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGame);

  renderPlaceholderScore();
}

init();
