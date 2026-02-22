const { TUNING_OFFSETS, SCALES } = window.ClarinetCore;

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

const REGISTER_RANGES = {
  chalumeau: { min: 52, max: 64 },
  clarion: { min: 65, max: 79 },
  altissimo: { min: 80, max: 96 }
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

function getRegisterPool() {
  const pool = [];
  const addRange = (minMidi, maxMidi) => {
    for (let midi = minMidi; midi <= maxMidi; midi += 1) {
      pool.push(midi);
    }
  };

  if (regChalumeau.checked) {
    addRange(REGISTER_RANGES.chalumeau.min, REGISTER_RANGES.chalumeau.max);
  }
  if (regClarion.checked) {
    addRange(REGISTER_RANGES.clarion.min, REGISTER_RANGES.clarion.max);
  }
  if (regAltissimo.checked) {
    addRange(REGISTER_RANGES.altissimo.min, REGISTER_RANGES.altissimo.max);
  }

  return [...new Set(pool)].sort((a, b) => a - b);
}

function getSelectableNotePool(config) {
  const registerPool = getRegisterPool();
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

  const scale = SCALES[scaleSelect.value];
  const allowedPitchClasses = new Set(scale.intervals.map((interval) => (scale.root + interval) % 12));
  const scaleFiltered = candidatePool.filter((midi) => allowedPitchClasses.has((midi + 1200) % 12));

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

function noteYForStaff(midi, staffTop, spacing) {
  const note = window.ClarinetCore.midiToName(midi, true);
  const pitch = note.slice(0, -1);
  const octave = Number(note.slice(-1));
  const map = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const letter = pitch.charAt(0);
  const diatonic = octave * 7 + map[letter];
  const ref = 4 * 7 + 2;
  const step = diatonic - ref;
  const slot = spacing / 2;
  const rawY = staffTop + 4 * spacing - step * slot;
  return Math.round(rawY / slot) * slot;
}

function renderScore(expectedWritten, playedConcert = [], reveal = false, revealFirst = false) {
  const width = Math.max(400, 130 + expectedWritten.length * 62);
  const height = 210;
  const left = 52;
  const right = width - 24;
  const staffTop = 78;
  const spacing = 9;
  const tuningOffset = TUNING_OFFSETS[currentTuning];

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "staff-svg");
  svg.style.maxWidth = "100%";

  for (let i = 0; i < 5; i += 1) {
    const y = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", left);
    line.setAttribute("x2", right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#122420");
    line.setAttribute("stroke-width", "1.2");
    svg.appendChild(line);
  }

  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "12");
  clef.setAttribute("y", "108");
  clef.setAttribute("font-size", "62");
  clef.setAttribute("font-family", "serif");
  clef.textContent = "\uD834\uDD1E";
  svg.appendChild(clef);

  expectedWritten.forEach((midi, index) => {
    const x = 95 + index * 58;
    const y = noteYForStaff(midi, staffTop, spacing);
    const playedWritten = playedConcert[index] !== undefined ? playedConcert[index] + tuningOffset : null;
    const correct = playedWritten !== null && Math.abs(playedWritten - midi) <= 0;
    const showPreReveal = !reveal && revealFirst && index === 0;

    if (!reveal && !showPreReveal) {
      return;
    }

    const ledgerYs = [];
    if (y < staffTop - spacing / 2) {
      for (let ly = staffTop - spacing; ly >= y - 1; ly -= spacing) {
        ledgerYs.push(ly);
      }
    } else if (y > staffTop + 4 * spacing + spacing / 2) {
      for (let ly = staffTop + 5 * spacing; ly <= y + 1; ly += spacing) {
        ledgerYs.push(ly);
      }
    }

    ledgerYs.forEach((ly) => {
      const ledger = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ledger.setAttribute("x1", String(x - 16));
      ledger.setAttribute("x2", String(x + 16));
      ledger.setAttribute("y1", String(ly));
      ledger.setAttribute("y2", String(ly));
      ledger.setAttribute("stroke", "#122420");
      ledger.setAttribute("stroke-width", "1.1");
      svg.appendChild(ledger);
    });

    const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    head.setAttribute("cx", String(x));
    head.setAttribute("cy", String(y));
    head.setAttribute("rx", "9");
    head.setAttribute("ry", "6.5");
    head.setAttribute("transform", `rotate(-20 ${x} ${y})`);
    const fillColor = reveal ? (correct ? "#0f7c62" : "#c23f4d") : "#10634f";
    head.setAttribute("fill", fillColor);
    svg.appendChild(head);

    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const stemUp = y > staffTop + 2 * spacing;
    stem.setAttribute("x1", String(stemUp ? x + 8 : x - 8));
    stem.setAttribute("x2", String(stemUp ? x + 8 : x - 8));
    stem.setAttribute("y1", String(y));
    stem.setAttribute("y2", String(stemUp ? y - 30 : y + 30));
    stem.setAttribute("stroke", fillColor);
    stem.setAttribute("stroke-width", "1.4");
    svg.appendChild(stem);
  });

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
  scaleSelect.disabled = true;
  difficultySelect.disabled = true;
  regChalumeau.disabled = true;
  regClarion.disabled = true;
  regAltissimo.disabled = true;
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
  scaleSelect.disabled = false;
  difficultySelect.disabled = false;
  regChalumeau.disabled = false;
  regClarion.disabled = false;
  regAltissimo.disabled = false;
  revealFirstNote.disabled = false;
  customControls.querySelectorAll("input").forEach((input) => {
    input.disabled = false;
  });

  gameStatus.textContent = "Game stopped. Press Start game to begin again.";
}

function init() {
  initializeTuning();
  updateDifficultyVisibility();
  if (window.initReorderableWorkspace) {
    window.initReorderableWorkspace({
      workspaceSelector: "#play-after-workspace",
      itemSelector: ".utility-panel",
      storageKey: "panel_order_play_after_me_v1"
    });
  }

  difficultySelect.addEventListener("change", updateDifficultyVisibility);
  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGame);

  renderPlaceholderScore();
}

init();
