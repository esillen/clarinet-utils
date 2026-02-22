const STORAGE_KEY = "clarinet_tuning";

const TUNING_OFFSETS = {
  Bb: 2,
  A: 3,
  C: 0
};

const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const SCALES = {
  C_MAJOR: { label: "C Major", root: 0, intervals: [0, 2, 4, 5, 7, 9, 11] },
  G_MAJOR: { label: "G Major", root: 7, intervals: [0, 2, 4, 5, 7, 9, 11] },
  D_MAJOR: { label: "D Major", root: 2, intervals: [0, 2, 4, 5, 7, 9, 11] },
  A_MAJOR: { label: "A Major", root: 9, intervals: [0, 2, 4, 5, 7, 9, 11] },
  F_MAJOR: { label: "F Major", root: 5, intervals: [0, 2, 4, 5, 7, 9, 11] },
  BB_MAJOR: { label: "B♭ Major", root: 10, intervals: [0, 2, 4, 5, 7, 9, 11] },
  A_MINOR: { label: "A Minor", root: 9, intervals: [0, 2, 3, 5, 7, 8, 10] },
  CHROMATIC: { label: "Chromatic", root: 0, intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
};

const DIFFICULTY_PRESETS = {
  easy: {
    minNotes: 3,
    maxNotes: 5,
    minMidi: 67,
    maxMidi: 84,
    maxJump: 2,
    jumpBias: "small"
  },
  medium: {
    minNotes: 5,
    maxNotes: 7,
    minMidi: 67,
    maxMidi: 91,
    maxJump: 5,
    jumpBias: "mixed"
  },
  hard: {
    minNotes: 7,
    maxNotes: 10,
    minMidi: 67,
    maxMidi: 95,
    maxJump: 8,
    jumpBias: "large"
  }
};

const tuningSelect = document.getElementById("game-tuning");
const scaleSelect = document.getElementById("scale-select");
const difficultySelect = document.getElementById("difficulty-select");
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
let pitchHistory = [];
let detectedSequence = [];
let currentCandidate = null;
let lastAcceptedAt = 0;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function freqToMidi(freq) {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

function midiToName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  return `${NOTE_NAMES_FLAT[pitchClass]}${octave}`;
}

function initializeTuning() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && TUNING_OFFSETS[saved] !== undefined) {
    tuningSelect.value = saved;
  } else {
    tuningSelect.value = "Bb";
    localStorage.setItem(STORAGE_KEY, "Bb");
  }
}

function updateDifficultyVisibility() {
  customControls.hidden = difficultySelect.value !== "custom";
}

function saveTuning() {
  localStorage.setItem(STORAGE_KEY, tuningSelect.value);
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

function getScalePool(scaleKey, minMidi, maxMidi) {
  const scale = SCALES[scaleKey];
  const allowedPitchClasses = new Set(scale.intervals.map((interval) => (scale.root + interval) % 12));
  const pool = [];

  for (let midi = minMidi; midi <= maxMidi; midi += 1) {
    if (allowedPitchClasses.has((midi + 1200) % 12)) {
      pool.push(midi);
    }
  }

  if (pool.length < 3) {
    for (let midi = minMidi; midi <= maxMidi; midi += 1) {
      pool.push(midi);
    }
  }

  return pool;
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
  const pool = getScalePool(scaleSelect.value, config.minMidi, config.maxMidi);
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
  const note = midiToName(midi);
  const pitch = note.slice(0, -1);
  const octave = Number(note.slice(-1));
  const map = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const letter = pitch.charAt(0);
  const diatonic = octave * 7 + map[letter];
  const ref = 4 * 7 + 2;
  const step = diatonic - ref;
  return staffTop + 4 * spacing - step * (spacing / 2);
}

function renderScore(expectedWritten, playedConcert = [], reveal = false) {
  const width = Math.max(400, 130 + expectedWritten.length * 62);
  const height = 210;
  const left = 52;
  const right = width - 24;
  const staffTop = 78;
  const spacing = 8;
  const tuningOffset = TUNING_OFFSETS[tuningSelect.value];

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

    if (!reveal) {
      const hiddenHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      hiddenHead.setAttribute("cx", String(x));
      hiddenHead.setAttribute("cy", String(y));
      hiddenHead.setAttribute("rx", "9");
      hiddenHead.setAttribute("ry", "6.5");
      hiddenHead.setAttribute("fill", "#dbe9e4");
      hiddenHead.setAttribute("stroke", "#98b9ae");
      hiddenHead.setAttribute("stroke-width", "1");
      svg.appendChild(hiddenHead);
      return;
    }

    const head = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
    head.setAttribute("cx", String(x));
    head.setAttribute("cy", String(y));
    head.setAttribute("rx", "9");
    head.setAttribute("ry", "6.5");
    head.setAttribute("transform", `rotate(-20 ${x} ${y})`);
    head.setAttribute("fill", correct ? "#0f7c62" : "#c23f4d");
    svg.appendChild(head);

    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const stemUp = y > staffTop + 2 * spacing;
    stem.setAttribute("x1", String(stemUp ? x + 8 : x - 8));
    stem.setAttribute("x2", String(stemUp ? x + 8 : x - 8));
    stem.setAttribute("y1", String(y));
    stem.setAttribute("y2", String(stemUp ? y - 30 : y + 30));
    stem.setAttribute("stroke", correct ? "#0f7c62" : "#c23f4d");
    stem.setAttribute("stroke-width", "1.4");
    svg.appendChild(stem);
  });

  scoreOutput.innerHTML = "";
  scoreOutput.appendChild(svg);
}

function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i += 1) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) {
    return -1;
  }

  let r1 = 0;
  let r2 = size - 1;
  const threshold = 0.2;

  for (let i = 0; i < size / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < size / 2; i += 1) {
    if (Math.abs(buffer[size - i]) < threshold) {
      r2 = size - i;
      break;
    }
  }

  const sliced = buffer.slice(r1, r2);
  const newSize = sliced.length;
  const corr = new Array(newSize).fill(0);

  for (let i = 0; i < newSize; i += 1) {
    for (let j = 0; j < newSize - i; j += 1) {
      corr[i] += sliced[j] * sliced[j + i];
    }
  }

  let dip = 0;
  while (dip + 1 < corr.length && corr[dip] > corr[dip + 1]) {
    dip += 1;
  }

  let maxPos = -1;
  let maxVal = -1;
  for (let i = dip; i < corr.length; i += 1) {
    if (corr[i] > maxVal) {
      maxVal = corr[i];
      maxPos = i;
    }
  }

  if (maxPos <= 0) {
    return -1;
  }

  return sampleRate / maxPos;
}

function getStablePitch(newPitch) {
  pitchHistory.push(newPitch);
  if (pitchHistory.length > 7) {
    pitchHistory.shift();
  }
  const sorted = [...pitchHistory].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
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
    const pitch = autoCorrelate(buffer, audioContext.sampleRate);
    if (pitch > 60 && pitch < 2100) {
      const stable = getStablePitch(pitch);
      const midi = freqToMidi(stable);
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
  oscillator.frequency.value = midiToFreq(midi);

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
  pitchHistory = [];
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
  const tuningOffset = TUNING_OFFSETS[tuningSelect.value];
  const phraseConcert = phraseWritten.map((midi) => midi - tuningOffset);

  roundCounter += 1;
  roundNumberEl.textContent = String(roundCounter);
  roundResultEl.textContent = "-";
  roundSpeedEl.textContent = "-";
  heardNotesEl.textContent = "";
  renderScore(phraseWritten, [], false);

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
    ? attempt.notes.map((midi) => midiToName(midi + tuningOffset)).join(" ")
    : "(no stable notes detected)";

  heardNotesEl.textContent = `You played: ${heardText}`;
  renderScore(phraseWritten, attempt.notes, true);
}

async function startGame() {
  if (gameRunning) {
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
  tuningSelect.disabled = true;
  scaleSelect.disabled = true;
  difficultySelect.disabled = true;
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
  tuningSelect.disabled = false;
  scaleSelect.disabled = false;
  difficultySelect.disabled = false;
  customControls.querySelectorAll("input").forEach((input) => {
    input.disabled = false;
  });

  gameStatus.textContent = "Game stopped. Press Start game to begin again.";
}

function init() {
  initializeTuning();
  updateDifficultyVisibility();

  tuningSelect.addEventListener("change", saveTuning);
  difficultySelect.addEventListener("change", updateDifficultyVisibility);
  startBtn.addEventListener("click", startGame);
  stopBtn.addEventListener("click", stopGame);

  renderPlaceholderScore();
}

init();
