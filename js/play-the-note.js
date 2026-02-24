const { TUNING_OFFSETS, SCALES } = window.ClarinetCore;

const currentTuningEl = document.getElementById("ptn-current-tuning");
const scaleSelect = document.getElementById("ptn-scale");
const regChalumeau = document.getElementById("reg-chalumeau");
const regClarion = document.getElementById("reg-clarion");
const regAltissimo = document.getElementById("reg-altissimo");
const retryBtn = document.getElementById("ptn-retry");
const stopBtn = document.getElementById("ptn-stop");
const statusEl = document.getElementById("ptn-status");
const hitsEl = document.getElementById("ptn-hits");
const npmEl = document.getElementById("ptn-npm");
const reactionEl = document.getElementById("ptn-reaction");
const scoreEl = document.getElementById("ptn-score");
const noteLabelEl = document.getElementById("ptn-note-label");

let audioContext = null;
let analyser = null;
let micStream = null;
let rafId = null;
let targetWrittenMidi = null;
let targetShownAt = 0;
let hitCount = 0;
let runStartedAt = 0;
let currentCandidate = null;
let lastHitAt = 0;
let isRunning = false;
let currentTuning = "Bb";
const pitchSmoother = window.PitchFinder.createMedianSmoother(7);
const REGISTER_RANGES = {
  chalumeau: { min: 52, max: 64 },
  clarion: { min: 65, max: 79 },
  altissimo: { min: 80, max: 96 }
};

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  if (currentTuningEl) {
    currentTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
  }
}

function getAllowedWrittenNotes() {
  const pool = [];
  const scale = SCALES[scaleSelect.value] || SCALES.C_MAJOR;
  const allowedPitchClasses = new Set(scale.intervals.map((interval) => (scale.root + interval) % 12));

  const addRange = (minMidi, maxMidi) => {
    for (let midi = minMidi; midi <= maxMidi; midi += 1) {
      if (allowedPitchClasses.has((midi + 1200) % 12)) {
        pool.push(midi);
      }
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

  return pool;
}

function randomTarget(previous = null) {
  const pool = getAllowedWrittenNotes();
  if (pool.length === 0) {
    return null;
  }

  if (pool.length === 1) {
    return pool[0];
  }

  let next = previous;
  while (next === previous) {
    next = pool[Math.floor(Math.random() * pool.length)];
  }
  return next;
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

function accidentalForMidi(midi) {
  const pitchClass = ((midi % 12) + 12) % 12;
  return [1, 3, 6, 8, 10].includes(pitchClass) ? "\u266F/\u266D" : "";
}

function renderTarget(writtenMidi) {
  const width = 420;
  const height = 210;
  const left = 52;
  const right = width - 24;
  const staffTop = 78;
  const spacing = 9;
  const x = 215;
  const y = noteYForStaff(writtenMidi, staffTop, spacing);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "staff-svg");
  svg.style.maxWidth = "100%";

  for (let i = 0; i < 5; i += 1) {
    const lineY = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", left);
    line.setAttribute("x2", right);
    line.setAttribute("y1", lineY);
    line.setAttribute("y2", lineY);
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

  const noteHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  noteHead.setAttribute("cx", String(x));
  noteHead.setAttribute("cy", String(y));
  noteHead.setAttribute("rx", "10");
  noteHead.setAttribute("ry", "7");
  noteHead.setAttribute("transform", `rotate(-20 ${x} ${y})`);
  noteHead.setAttribute("fill", "#10634f");
  svg.appendChild(noteHead);

  const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const stemUp = y > staffTop + 2 * spacing;
  stem.setAttribute("x1", String(stemUp ? x + 8 : x - 8));
  stem.setAttribute("x2", String(stemUp ? x + 8 : x - 8));
  stem.setAttribute("y1", String(y));
  stem.setAttribute("y2", String(stemUp ? y - 30 : y + 30));
  stem.setAttribute("stroke", "#10634f");
  stem.setAttribute("stroke-width", "1.4");
  svg.appendChild(stem);

  const accidental = accidentalForMidi(writtenMidi);
  if (accidental) {
    const accidentalText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    accidentalText.setAttribute("x", String(x - 38));
    accidentalText.setAttribute("y", String(y + 4));
    accidentalText.setAttribute("font-size", "18");
    accidentalText.setAttribute("font-family", "serif");
    accidentalText.textContent = accidental;
    svg.appendChild(accidentalText);
  }

  scoreEl.innerHTML = "";
  scoreEl.appendChild(svg);
  noteLabelEl.textContent = `Target written note: ${window.ClarinetCore.midiToName(writtenMidi, true)} (${currentTuning} clarinet)`;
}

function setNextTarget() {
  const next = randomTarget(targetWrittenMidi);
  if (next === null) {
    targetWrittenMidi = null;
    scoreEl.innerHTML = "<p class=\"muted\">Select at least one register.</p>";
    noteLabelEl.textContent = "";
    return;
  }

  targetWrittenMidi = next;
  targetShownAt = performance.now();
  currentCandidate = null;
  renderTarget(targetWrittenMidi);
}

function updateStats() {
  hitsEl.textContent = String(hitCount);
  if (hitCount === 0 || runStartedAt === 0) {
    npmEl.textContent = "0.0";
    return;
  }
  const minutes = (performance.now() - runStartedAt) / 60000;
  const npm = hitCount / Math.max(minutes, 1 / 60000);
  npmEl.textContent = npm.toFixed(1);
}

function acceptHit() {
  const now = performance.now();
  if (now - lastHitAt < 220) {
    return;
  }

  hitCount += 1;
  lastHitAt = now;

  const reactionMs = now - targetShownAt;
  reactionEl.textContent = `${Math.round(reactionMs)} ms`;
  updateStats();
  setNextTarget();
}

function checkMatch(concertMidi) {
  if (targetWrittenMidi === null) {
    return;
  }

  const writtenMidi = concertMidi + TUNING_OFFSETS[currentTuning];
  const now = performance.now();

  if (!currentCandidate || currentCandidate.midi !== writtenMidi) {
    currentCandidate = { midi: writtenMidi, startedAt: now };
    return;
  }

  if (now - currentCandidate.startedAt < 140) {
    return;
  }

  if (writtenMidi === targetWrittenMidi) {
    acceptHit();
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
    statusEl.textContent = "Listening... play the target note quickly.";
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

    retryBtn.hidden = true;
    stopBtn.disabled = false;
    isRunning = true;
    runStartedAt = performance.now();
    hitCount = 0;
    pitchSmoother.clear();
    reactionEl.textContent = "-";
    updateStats();
    setNextTarget();

    statusEl.textContent = "Microphone started. Play the target note.";
    tick();
  } catch (error) {
    retryBtn.hidden = false;
    statusEl.textContent = `Could not access microphone: ${error.message}`;
  }
}

function stopMicrophone() {
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
  isRunning = false;
  stopBtn.disabled = true;
  retryBtn.hidden = false;
  statusEl.textContent = "Microphone is off.";
}

function init() {
  initializeTuning();
  if (window.initReorderableWorkspace) {
    window.initReorderableWorkspace({
      workspaceSelector: "#play-note-workspace",
      itemSelector: ".utility-panel",
      storageKey: "panel_order_play_the_note_v1"
    });
  }

  scaleSelect.addEventListener("change", setNextTarget);
  [regChalumeau, regClarion, regAltissimo].forEach((input) => {
    input.addEventListener("change", () => {
      setNextTarget();
    });
  });
  retryBtn.addEventListener("click", startMicrophone);
  stopBtn.addEventListener("click", stopMicrophone);

  scoreEl.innerHTML = "<p class=\"muted\">Waiting for microphone...</p>";
  startMicrophone();
}

init();
