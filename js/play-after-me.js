const { TUNING_OFFSETS } = window.ClarinetCore;
const NOTE_COLORS = window.ClarinetVexRenderer.NOTE_COLORS;

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
const addAccidentalsEl = document.getElementById("pam-add-accidentals");
const revealFirstNote = document.getElementById("reveal-first-note");
const customControls = document.getElementById("custom-controls");
const customCount = document.getElementById("custom-count");
const customMin = document.getElementById("custom-min");
const customMax = document.getElementById("custom-max");
const customJump = document.getElementById("custom-jump");
const scoreStatusEl = document.getElementById("pam-score-status");
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
let bottomBar = null;

function syncBottomBarState() {
  if (!bottomBar) {
    return;
  }
  const isListeningMode = gameRunning && currentMode === "listening";
  bottomBar.setListening(isListeningMode);
  bottomBar.setStartEnabled(!gameRunning);
  bottomBar.setStopEnabled(gameRunning);
}

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

function getSelectableNotePools(config) {
  const registerPool = scaleRegisterControls.getRegisterPool();
  if (registerPool.length === 0) {
    return { candidatePool: [], scalePool: [], accidentalPool: [] };
  }

  let candidatePool = registerPool;
  if (difficultySelect.value === "custom") {
    candidatePool = registerPool.filter((midi) => midi >= config.minMidi && midi <= config.maxMidi);
  }

  if (candidatePool.length === 0) {
    return { candidatePool: [], scalePool: [], accidentalPool: [] };
  }

  const scalePool = scaleRegisterControls.filterToScale(candidatePool);
  const accidentalPool = candidatePool.filter((midi) => !scalePool.includes(midi));
  return {
    candidatePool,
    scalePool,
    accidentalPool
  };
}

function getAccidentalRangeForDifficulty(config) {
  if (difficultySelect.value === "easy") {
    return { min: 0, max: 1 };
  }
  if (difficultySelect.value === "medium") {
    return { min: 0, max: 2 };
  }
  if (difficultySelect.value === "hard") {
    return { min: 1, max: 3 };
  }
  if (config.maxJump <= 3) {
    return { min: 0, max: 1 };
  }
  if (config.maxJump <= 6) {
    return { min: 0, max: 2 };
  }
  return { min: 1, max: 3 };
}

function planAccidentalTargets(phraseLength, config) {
  const targets = new Set();
  if (!scaleRegisterControls.isAddAccidentalsEnabled() || phraseLength <= 0) {
    return targets;
  }
  const range = getAccidentalRangeForDifficulty(config);
  const scaledMin = Math.max(0, Math.floor((range.min * phraseLength) / 8));
  const scaledMax = Math.max(scaledMin, Math.ceil((range.max * phraseLength) / 8));
  let targetCount = randomInt(scaledMin, scaledMax);
  if (range.min > 0 && phraseLength > 0 && targetCount === 0) {
    targetCount = 1;
  }
  while (targets.size < Math.min(phraseLength, targetCount)) {
    targets.add(randomInt(0, phraseLength - 1));
  }
  return targets;
}

function generatePhrase() {
  const config = getDifficultyConfig();
  const pools = getSelectableNotePools(config);
  const pool = pools.candidatePool;
  const phraseLength = randomInt(config.minNotes, config.maxNotes);
  const scaleSet = new Set(pools.scalePool);
  const accidentalTargets = planAccidentalTargets(phraseLength, config);

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

  const phrase = [];
  let currentMidi = startPool[randomInt(0, startPool.length - 1)];
  phrase.push(currentMidi);

  while (phrase.length < phraseLength) {
    const currentIndex = pool.indexOf(currentMidi);
    const allCandidates = [];
    for (let index = 0; index < pool.length; index += 1) {
      const distance = Math.abs(index - currentIndex);
      if (distance > 0 && distance <= config.maxJump) {
        allCandidates.push(index);
      }
    }
    if (allCandidates.length === 0) {
      currentMidi = pool[randomInt(0, pool.length - 1)];
      phrase.push(currentMidi);
      continue;
    }
    const wantAccidental = pools.accidentalPool.length > 0 && accidentalTargets.has(phrase.length);
    const preferred = allCandidates.filter((idx) => {
      const midi = pool[idx];
      const isAccidental = !scaleSet.has(midi);
      return wantAccidental ? isAccidental : !isAccidental;
    });
    const chosenPool = preferred.length > 0 ? preferred : allCandidates;
    const near = chosenPool.filter((idx) => Math.abs(idx - currentIndex) <= 2);
    const far = chosenPool.filter((idx) => Math.abs(idx - currentIndex) >= 4);
    let chosenIndex = chosenPool[randomInt(0, chosenPool.length - 1)];
    if (config.jumpBias === "small" && near.length > 0) {
      chosenIndex = near[randomInt(0, near.length - 1)];
    } else if (config.jumpBias === "large" && far.length > 0) {
      chosenIndex = far[randomInt(0, far.length - 1)];
    } else if (config.jumpBias === "mixed") {
      const useFar = Math.random() < 0.35;
      if (useFar && far.length > 0) {
        chosenIndex = far[randomInt(0, far.length - 1)];
      } else if (!useFar && near.length > 0) {
        chosenIndex = near[randomInt(0, near.length - 1)];
      }
    }
    currentMidi = pool[chosenIndex];
    phrase.push(currentMidi);
  }

  return phrase;
}

function renderPlaceholderScore() {
  scoreOutput.innerHTML = "<p class=\"muted\">Press Start to begin.</p>";
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Press Start. The browser plays first, then you repeat.";
  }
}

function renderScore(expectedWritten, playedConcert = [], reveal = false, revealFirst = false) {
  const width = Math.max(400, 130 + expectedWritten.length * 62);
  const tuningOffset = TUNING_OFFSETS[currentTuning];
  const notes = expectedWritten.map((midi, index) => {
    const playedWritten = playedConcert[index] !== undefined ? playedConcert[index] + tuningOffset : null;
    const correct = playedWritten !== null && Math.abs(playedWritten - midi) <= 0;
    const showPreReveal = !reveal && revealFirst && index === 0;
    const fillColor = reveal
      ? (correct ? NOTE_COLORS.correct : NOTE_COLORS.incorrect)
      : NOTE_COLORS.toPlay;
    return {
      writtenMidi: midi,
      visible: reveal || showPreReveal,
      fill: fillColor,
      stemColor: fillColor
    };
  });

  const svg = window.ClarinetVexRenderer.renderNoteSequenceSvg({
    notes,
    width,
    height: 210,
    scale: scaleRegisterControls.getScale(),
    noteColor: NOTE_COLORS.neutral
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
  if (bottomBar) {
    bottomBar.updateFromTimeDomain(buffer);
  }

  if (currentMode === "listening") {
    const pitch = window.PitchFinder.autoCorrelate(buffer, audioContext.sampleRate);
    if (pitch > 60 && pitch < 2100) {
      const stable = pitchSmoother.push(pitch);
      const midi = window.ClarinetCore.freqToMidi(stable);
      if (bottomBar) {
        bottomBar.setDetectedPitches(
          window.ClarinetCore.midiToName(midi, true),
          window.ClarinetCore.midiToName(midi + TUNING_OFFSETS[currentTuning], true)
        );
      }
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
  syncBottomBarState();
  if (bottomBar) {
    bottomBar.clearDetectedPitches();
  }
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
  syncBottomBarState();
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Listen...";
  }
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
  syncBottomBarState();
  pitchSmoother.clear();
  detectedSequence = [];
  currentCandidate = null;
  lastAcceptedAt = 0;
  heardNotesEl.textContent = "Listening...";
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Your turn: play it back.";
  }

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
    currentMode = "idle";
    syncBottomBarState();
    if (scoreStatusEl) {
      scoreStatusEl.textContent = "No notes available with current range/scale settings.";
    }
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

  const attempt = await listenForPhrase(phraseConcert.length, token);
  if (!gameRunning || token !== activeRoundToken) {
    return;
  }

  const success = attempt.completed && sequencesMatch(phraseConcert, attempt.notes);
  const speedSec = (attempt.elapsedMs / 1000).toFixed(2);
  currentMode = "playing";
  syncBottomBarState();

  roundSpeedEl.textContent = `${speedSec}s`;
  roundResultEl.textContent = success ? "Correct" : "Try again";
  if (scoreStatusEl) {
    scoreStatusEl.textContent = success
      ? "Nice. Next phrase coming..."
      : "Not quite. Next phrase coming...";
  }

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

  const preflightPools = getSelectableNotePools(getDifficultyConfig());
  const accidentalsOn = scaleRegisterControls.isAddAccidentalsEnabled();
  const hasPlayable = accidentalsOn
    ? (preflightPools.scalePool.length > 0 || preflightPools.accidentalPool.length > 0)
    : preflightPools.scalePool.length > 0;
  if (preflightPools.candidatePool.length === 0 || !hasPlayable) {
    if (scoreStatusEl) {
      scoreStatusEl.textContent = "Select at least one register (and matching scale/custom range).";
    }
    return;
  }

  try {
    await setupAudio();
  } catch (error) {
    if (scoreStatusEl) {
      scoreStatusEl.textContent = `Could not start microphone/audio: ${error.message}`;
    }
    syncBottomBarState();
    return;
  }

  gameRunning = true;
  activeRoundToken += 1;
  const token = activeRoundToken;

  scaleRegisterControls.setDisabled(true);
  difficultySelect.disabled = true;
  revealFirstNote.disabled = true;
  customControls.querySelectorAll("input").forEach((input) => {
    input.disabled = true;
  });
  syncBottomBarState();

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
    currentMode = "idle";
    syncBottomBarState();
    return;
  }

  gameRunning = false;
  activeRoundToken += 1;
  currentMode = "idle";
  syncBottomBarState();
  if (cancelRoundInput) {
    cancelRoundInput();
  } else {
    resolveRoundInput = null;
  }

  stopAudio();
  scaleRegisterControls.setDisabled(false);
  difficultySelect.disabled = false;
  revealFirstNote.disabled = false;
  customControls.querySelectorAll("input").forEach((input) => {
    input.disabled = false;
  });
  syncBottomBarState();

  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Game stopped. Press Start to begin again.";
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
  updateDifficultyVisibility();
  bottomBar = window.BottomBar.init({
    startLabel: "Start",
    stopLabel: "Stop",
    onStart: startGame,
    onStop: stopGame,
    startEnabled: true,
    stopEnabled: false,
    listening: false
  });

  difficultySelect.addEventListener("change", updateDifficultyVisibility);

  renderPlaceholderScore();
  syncBottomBarState();
}

init();
