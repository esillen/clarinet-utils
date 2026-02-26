const { TUNING_OFFSETS } = window.ClarinetCore;
const { getEntry, renderFingeringCard } = window.ClarinetFingerings;

const fingeringNoteEl = document.getElementById("fingering-note");
const fingeringListEl = document.getElementById("fingering-list");
const pitchCanvas = document.getElementById("pitch-canvas");
const spectrumCanvas = document.getElementById("spectrum-canvas");

let audioContext = null;
let analyser = null;
let micStream = null;
let rafId = null;
let currentWrittenMidi = null;
let lastRenderedWrittenMidi = null;
const TRACE_LENGTH = 260;
const PITCH_MIDI_MIN = 48;
const PITCH_MIDI_MAX = 96;
let pitchTrace = new Array(TRACE_LENGTH).fill(null);
let frequencyBins = null;
let currentTuning = "Bb";
const pitchSmoother = window.PitchFinder.createMedianSmoother(7);
let noPitchFrameCount = 0;
const NO_PITCH_PLACEHOLDER_FRAMES = 16;
let bottomBar = null;

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
}

function updateBottomBarListening(listening) {
  if (!bottomBar) {
    return;
  }
  bottomBar.setListening(listening);
  bottomBar.setStartEnabled(!listening);
}

function midiToY(midi, graphTop, graphBottom) {
  const ratio = (midi - PITCH_MIDI_MIN) / (PITCH_MIDI_MAX - PITCH_MIDI_MIN);
  return graphBottom - ratio * (graphBottom - graphTop);
}

function syncCanvasSize(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  const width = Math.max(1, Math.floor(displayWidth * dpr));
  const height = Math.max(1, Math.floor(displayHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: displayWidth, height: displayHeight };
}

function renderPitchTrace() {
  if (!pitchCanvas) {
    return;
  }

  const ctx = pitchCanvas.getContext("2d");
  const size = syncCanvasSize(pitchCanvas, ctx);
  const width = size.width;
  const height = size.height;
  const leftPad = 46;
  const rightPad = 10;
  const topPad = 12;
  const bottomPad = 12;
  const graphWidth = width - leftPad - rightPad;
  const graphTop = topPad;
  const graphBottom = height - bottomPad;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#284056";
  ctx.lineWidth = 1;
  for (let midi = PITCH_MIDI_MIN; midi <= PITCH_MIDI_MAX; midi += 1) {
    const y = midiToY(midi, graphTop, graphBottom);
    const isC = midi % 12 === 0;
    if (isC) {
      ctx.strokeStyle = "#38566b";
      ctx.lineWidth = 1.25;
    } else {
      ctx.strokeStyle = "#22384a";
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(width - rightPad, y);
    ctx.stroke();

    if (isC) {
      ctx.fillStyle = "#6f8ba1";
      ctx.font = "11px 'Avenir Next', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(window.ClarinetCore.midiToName(midi, true), 6, y + 3);
    }
  }

  const stepX = graphWidth / (TRACE_LENGTH - 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#36efd2";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#36efd2";

  let openSegment = false;
  ctx.beginPath();
  for (let i = 0; i < pitchTrace.length; i += 1) {
    const midi = pitchTrace[i];
    const x = leftPad + i * stepX;
    if (midi === null || midi < PITCH_MIDI_MIN - 2 || midi > PITCH_MIDI_MAX + 2) {
      openSegment = false;
      continue;
    }
    const y = midiToY(midi, graphTop, graphBottom);
    if (!openSegment) {
      ctx.moveTo(x, y);
      openSegment = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  const latest = pitchTrace[pitchTrace.length - 1];
  if (latest !== null) {
    const x = leftPad + (pitchTrace.length - 1) * stepX;
    const y = midiToY(latest, graphTop, graphBottom);
    ctx.fillStyle = "#b2fff0";
    ctx.beginPath();
    ctx.arc(x, y, 4.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pushPitchTrace(freq) {
  const midi = freq === null ? null : window.ClarinetCore.freqToMidiFloat(freq);
  pitchTrace.push(midi);
  if (pitchTrace.length > TRACE_LENGTH) {
    pitchTrace.shift();
  }
  renderPitchTrace();
}

function renderSpectrumHistogram(sampleRate = null) {
  if (!spectrumCanvas) {
    return;
  }

  const ctx = spectrumCanvas.getContext("2d");
  const size = syncCanvasSize(spectrumCanvas, ctx);
  const width = size.width;
  const height = size.height;
  const leftPad = 42;
  const rightPad = 12;
  const topPad = 12;
  const bottomPad = 24;
  const graphWidth = width - leftPad - rightPad;
  const graphHeight = height - topPad - bottomPad;
  const floorY = topPad + graphHeight;

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i <= 4; i += 1) {
    const y = topPad + (graphHeight * i) / 4;
    ctx.strokeStyle = i === 4 ? "#335169" : "#213344";
    ctx.lineWidth = i === 4 ? 1.2 : 1;
    ctx.beginPath();
    ctx.moveTo(leftPad, y);
    ctx.lineTo(width - rightPad, y);
    ctx.stroke();
  }

  if (frequencyBins && frequencyBins.length > 0) {
    const barCount = Math.min(220, frequencyBins.length);
    const binsPerBar = Math.max(1, Math.floor(frequencyBins.length / barCount));
    const barWidth = graphWidth / barCount;

    for (let i = 0; i < barCount; i += 1) {
      let sum = 0;
      const start = i * binsPerBar;
      const end = Math.min(frequencyBins.length, start + binsPerBar);
      for (let j = start; j < end; j += 1) {
        sum += frequencyBins[j];
      }
      const avg = sum / Math.max(1, end - start);
      const normalized = avg / 255;
      const barHeight = Math.max(1, normalized * graphHeight);
      const x = leftPad + i * barWidth;
      const y = floorY - barHeight;

      const hue = 190 + normalized * 28;
      ctx.fillStyle = `hsla(${hue}, 86%, 60%, 0.88)`;
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    }
  }

  ctx.fillStyle = "#7fa0b7";
  ctx.font = "11px 'Avenir Next', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("0 Hz", leftPad, height - 7);

  const maxHz = sampleRate ? Math.round(sampleRate / 2) : 0;
  ctx.textAlign = "right";
  ctx.fillText(maxHz > 0 ? `${maxHz} Hz` : "Nyquist", width - rightPad, height - 7);
}

function clearPitchTrace() {
  pitchTrace = new Array(TRACE_LENGTH).fill(null);
  renderPitchTrace();
}

function renderFingeringPlaceholder(message = "Play a steady note to show fingerings.") {
  fingeringListEl.innerHTML = "";
  const placeholderFingering = {
    name: "Waiting For Note",
    type: "Primary",
    keys: "",
    info: message
  };
  fingeringListEl.appendChild(
    renderFingeringCard(placeholderFingering, {
      compact: true,
      showVisual: true,
      compactShowImage: true,
      horizontal: true,
      hideKeys: true,
      showHoleOverlay: false
    })
  );
}

function renderFingerings(writtenMidi) {
  const entry = getEntry(writtenMidi);
  fingeringListEl.innerHTML = "";

  if (!entry) {
    fingeringNoteEl.textContent = `No fingering data in this tool for ${window.ClarinetCore.midiToName(writtenMidi, true)} yet.`;
    renderFingeringPlaceholder("No fingering data found for this written note.");
    return;
  }

  fingeringNoteEl.textContent = `Showing ${entry.fingerings.length} fingering option(s) for ${entry.noteLabel}.`;

  entry.fingerings.forEach((fingering) => {
    fingeringListEl.appendChild(
      renderFingeringCard(fingering, {
        compact: true,
        showVisual: true,
        compactShowImage: true,
        horizontal: true,
        hideKeys: true,
        showHoleOverlay: true,
        writtenMidi
      })
    );
  });

}

function renderFromMidi(concertMidi) {
  const tuning = currentTuning;
  const transpose = TUNING_OFFSETS[tuning];
  const writtenMidi = concertMidi + transpose;
  currentWrittenMidi = writtenMidi;

  const concertLabel = window.ClarinetCore.midiToName(concertMidi, true);
  const writtenLabel = window.ClarinetCore.midiToName(writtenMidi, true);

  if (bottomBar) {
    bottomBar.setDetectedPitches(concertLabel, writtenLabel);
  }

  if (lastRenderedWrittenMidi !== writtenMidi) {
    renderFingerings(writtenMidi);
    lastRenderedWrittenMidi = writtenMidi;
  }
}

function tickPitch() {
  if (!analyser || !audioContext) {
    return;
  }

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  if (bottomBar) {
    bottomBar.updateFromTimeDomain(buffer);
  }
  if (!frequencyBins || frequencyBins.length !== analyser.frequencyBinCount) {
    frequencyBins = new Uint8Array(analyser.frequencyBinCount);
  }
  analyser.getByteFrequencyData(frequencyBins);
  renderSpectrumHistogram(audioContext.sampleRate);
  const pitch = window.PitchFinder.autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch > 65 && pitch < 2100) {
    noPitchFrameCount = 0;
    const stable = pitchSmoother.push(pitch);
    const midi = window.ClarinetCore.freqToMidi(stable);
    renderFromMidi(midi, stable);
    pushPitchTrace(stable);
  } else {
    noPitchFrameCount += 1;
    if (noPitchFrameCount === NO_PITCH_PLACEHOLDER_FRAMES) {
      if (currentWrittenMidi === null) {
        fingeringNoteEl.textContent = "Play a steady pitch to see options.";
        renderFingeringPlaceholder();
        lastRenderedWrittenMidi = null;
      }
    }
    pushPitchTrace(null);
  }

  rafId = requestAnimationFrame(tickPitch);
}

async function startMicrophone() {
  if (micStream) {
    return;
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

    updateBottomBarListening(true);

    pitchSmoother.clear();
    clearPitchTrace();
    tickPitch();
  } catch (error) {
    fingeringNoteEl.textContent = `Could not access microphone: ${error.message}`;
    updateBottomBarListening(false);
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
  frequencyBins = null;
  lastRenderedWrittenMidi = null;
  renderSpectrumHistogram();
  updateBottomBarListening(false);
  if (bottomBar) {
    bottomBar.clearDetectedPitches();
  }
}

function init() {
  initializeTuning();
  bottomBar = window.BottomBar.init({
    startLabel: "Start listening",
    showStop: false,
    onStart: startMicrophone,
    startEnabled: true,
    listening: false
  });
  window.addEventListener("resize", () => {
    renderPitchTrace();
    renderSpectrumHistogram(audioContext ? audioContext.sampleRate : null);
  });

  renderFingeringPlaceholder();
  renderPitchTrace();
  renderSpectrumHistogram();
  updateBottomBarListening(false);
}

init();
