const { TUNING_OFFSETS } = window.ClarinetCore;

const currentTuningEl = document.getElementById("ptn-current-tuning");
const scaleSelect = document.getElementById("ptn-scale");
const regChalumeau = document.getElementById("reg-chalumeau");
const regClarion = document.getElementById("reg-clarion");
const regAltissimo = document.getElementById("reg-altissimo");
const scoreStatusEl = document.getElementById("ptn-score-status");
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
let bottomBar = null;

function syncBottomBarState() {
  if (!bottomBar) {
    return;
  }
  bottomBar.setListening(isRunning);
  bottomBar.setStartEnabled(!isRunning);
  bottomBar.setStopEnabled(isRunning);
}

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
    if (scoreStatusEl) {
      scoreStatusEl.textContent = "Listening... play the target note quickly.";
    }
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
    isRunning = true;
    syncBottomBarState();
    runStartedAt = performance.now();
    hitCount = 0;
    pitchSmoother.clear();
    reactionEl.textContent = "-";
    updateStats();
    setNextTarget();

    if (scoreStatusEl) {
      scoreStatusEl.textContent = "Play the target note quickly.";
    }
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
  scaleRegisterControls.setDisabled(false);
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Press Start, then play the shown target note as fast as possible.";
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
    defaultScale: "C_MAJOR"
  });

  scaleSelect.addEventListener("change", setNextTarget);
  [regChalumeau, regClarion, regAltissimo].forEach((input) => {
    input.addEventListener("change", () => {
      setNextTarget();
    });
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

  scoreEl.innerHTML = "<p class=\"muted\">Press Start to begin.</p>";
  if (scoreStatusEl) {
    scoreStatusEl.textContent = "Press Start, then play the shown target note as fast as possible.";
  }
  syncBottomBarState();
}

init();
