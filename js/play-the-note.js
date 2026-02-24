const { TUNING_OFFSETS } = window.ClarinetCore;

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
let scaleRegisterControls = null;
const pitchSmoother = window.PitchFinder.createMedianSmoother(7);

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  if (currentTuningEl) {
    currentTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
  }
}

function getAllowedWrittenNotes() {
  return scaleRegisterControls.getScaleFilteredRegisterPool();
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

function renderTarget(writtenMidi) {
  const svg = window.ClarinetStaffRenderer.renderNoteSequenceSvg({
    notes: [{ writtenMidi, fill: "#10634f", stemColor: "#10634f" }],
    width: 420,
    height: 210,
    scale: scaleRegisterControls.getScale()
  });
  svg.setAttribute("class", "staff-svg");
  svg.style.maxWidth = "100%";

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
    scaleRegisterControls.setDisabled(true);
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
  scaleRegisterControls.setDisabled(false);
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
