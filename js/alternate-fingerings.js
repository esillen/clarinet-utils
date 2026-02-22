const { TUNING_OFFSETS } = window.ClarinetCore;
const { getEntry, renderFingeringCard, getReferenceHtml } = window.ClarinetFingerings;

const currentTuningEl = document.getElementById("current-tuning");
const retryBtn = document.getElementById("retry-btn");
const stopBtn = document.getElementById("stop-btn");
const micStatus = document.getElementById("mic-status");
const concertNoteEl = document.getElementById("concert-note");
const concertFreqEl = document.getElementById("concert-freq");
const writtenNoteEl = document.getElementById("written-note");
const fingeringNoteEl = document.getElementById("fingering-note");
const fingeringListEl = document.getElementById("fingering-list");
const fingeringVisualRefsEl = document.getElementById("fingering-visual-refs");
const staffEl = document.getElementById("staff");
const pitchCanvas = document.getElementById("pitch-canvas");
const spectrumCanvas = document.getElementById("spectrum-canvas");

let audioContext = null;
let analyser = null;
let micStream = null;
let rafId = null;
let currentWrittenMidi = null;
const TRACE_LENGTH = 260;
const PITCH_MIDI_MIN = 48;
const PITCH_MIDI_MAX = 96;
let pitchTrace = new Array(TRACE_LENGTH).fill(null);
let frequencyBins = null;
let currentTuning = "Bb";
const pitchSmoother = window.PitchFinder.createMedianSmoother(7);

function initializeTuning() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  if (currentTuningEl) {
    currentTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
  }
}

function renderStaff(midi) {
  const width = 360;
  const height = 190;
  const left = 48;
  const right = width - 20;
  const staffTop = 52;
  const stepPx = 7;
  const refStep = 4 * 7 + 2;

  const noteName = window.ClarinetCore.midiToName(midi, true);
  const pitch = noteName.slice(0, -1);
  const octave = Number(noteName.slice(-1));
  const map = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const letter = pitch.charAt(0);
  const diatonic = octave * 7 + map[letter];
  const stepFromE4 = diatonic - refStep;
  const noteY = staffTop + 4 * stepPx - stepFromE4 * (stepPx / 2);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "staff-svg");

  for (let i = 0; i < 5; i += 1) {
    const y = staffTop + i * stepPx;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", left);
    line.setAttribute("x2", right);
    line.setAttribute("y1", y);
    line.setAttribute("y2", y);
    line.setAttribute("stroke", "#1a2a27");
    line.setAttribute("stroke-width", "1.2");
    svg.appendChild(line);
  }

  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "12");
  clef.setAttribute("y", "80");
  clef.setAttribute("font-size", "58");
  clef.setAttribute("font-family", "serif");
  clef.textContent = "\uD834\uDD1E";
  svg.appendChild(clef);

  const noteX = 175;

  const minStaffY = staffTop;
  const maxStaffY = staffTop + 4 * stepPx;
  const ledgerYs = [];

  if (noteY < minStaffY - stepPx / 2) {
    for (let y = minStaffY - stepPx; y >= noteY - 1; y -= stepPx) {
      ledgerYs.push(y);
    }
  } else if (noteY > maxStaffY + stepPx / 2) {
    for (let y = maxStaffY + stepPx; y <= noteY + 1; y += stepPx) {
      ledgerYs.push(y);
    }
  }

  ledgerYs.forEach((y) => {
    const ledger = document.createElementNS("http://www.w3.org/2000/svg", "line");
    ledger.setAttribute("x1", noteX - 18);
    ledger.setAttribute("x2", noteX + 18);
    ledger.setAttribute("y1", y);
    ledger.setAttribute("y2", y);
    ledger.setAttribute("stroke", "#1a2a27");
    ledger.setAttribute("stroke-width", "1.2");
    svg.appendChild(ledger);
  });

  const noteHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  noteHead.setAttribute("cx", String(noteX));
  noteHead.setAttribute("cy", String(noteY));
  noteHead.setAttribute("rx", "10");
  noteHead.setAttribute("ry", "7");
  noteHead.setAttribute("transform", `rotate(-20 ${noteX} ${noteY})`);
  noteHead.setAttribute("fill", "#122420");
  svg.appendChild(noteHead);

  if (noteY > staffTop + 2 * stepPx) {
    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    stem.setAttribute("x1", String(noteX + 9));
    stem.setAttribute("x2", String(noteX + 9));
    stem.setAttribute("y1", String(noteY));
    stem.setAttribute("y2", String(noteY - 34));
    stem.setAttribute("stroke", "#122420");
    stem.setAttribute("stroke-width", "1.6");
    svg.appendChild(stem);
  } else {
    const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
    stem.setAttribute("x1", String(noteX - 9));
    stem.setAttribute("x2", String(noteX - 9));
    stem.setAttribute("y1", String(noteY));
    stem.setAttribute("y2", String(noteY + 34));
    stem.setAttribute("stroke", "#122420");
    stem.setAttribute("stroke-width", "1.6");
    svg.appendChild(stem);
  }

  if (pitch.includes("#") || pitch.includes("b")) {
    const accidental = document.createElementNS("http://www.w3.org/2000/svg", "text");
    accidental.setAttribute("x", String(noteX - 26));
    accidental.setAttribute("y", String(noteY + 4));
    accidental.setAttribute("font-size", "24");
    accidental.setAttribute("font-family", "serif");
    accidental.textContent = pitch.includes("#") ? "\u266F" : "\u266D";
    svg.appendChild(accidental);
  }

  staffEl.innerHTML = "";
  staffEl.appendChild(svg);
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

function renderFingerings(writtenMidi) {
  const entry = getEntry(writtenMidi);
  fingeringListEl.innerHTML = "";

  if (!entry) {
    fingeringNoteEl.textContent = `No fingering data in this tool for ${window.ClarinetCore.midiToName(writtenMidi, true)} yet.`;
    if (fingeringVisualRefsEl) {
      fingeringVisualRefsEl.textContent = "";
    }
    return;
  }

  fingeringNoteEl.textContent = `Showing ${entry.fingerings.length} fingering option(s) for ${entry.noteLabel}.`;

  entry.fingerings.forEach((fingering) => {
    fingeringListEl.appendChild(renderFingeringCard(fingering));
  });

  if (fingeringVisualRefsEl) {
    fingeringVisualRefsEl.innerHTML = getReferenceHtml();
  }
}

function renderFromMidi(concertMidi, detectedFrequency = null) {
  const tuning = currentTuning;
  const transpose = TUNING_OFFSETS[tuning];
  const writtenMidi = concertMidi + transpose;
  currentWrittenMidi = writtenMidi;

  const concertLabel = window.ClarinetCore.midiToName(concertMidi, true);
  const writtenLabel = window.ClarinetCore.midiToName(writtenMidi, true);

  concertNoteEl.textContent = concertLabel;
  writtenNoteEl.textContent = `${writtenLabel} (${tuning} clarinet)`;

  if (detectedFrequency) {
    const cents = window.ClarinetCore.centsOff(detectedFrequency, concertMidi);
    const centsPrefix = cents > 0 ? "+" : "";
    concertFreqEl.textContent = `${detectedFrequency.toFixed(2)} Hz (${centsPrefix}${cents} cents)`;
  }

  renderStaff(writtenMidi);
  renderFingerings(writtenMidi);
}

function tickPitch() {
  if (!analyser || !audioContext) {
    return;
  }

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);
  if (!frequencyBins || frequencyBins.length !== analyser.frequencyBinCount) {
    frequencyBins = new Uint8Array(analyser.frequencyBinCount);
  }
  analyser.getByteFrequencyData(frequencyBins);
  renderSpectrumHistogram(audioContext.sampleRate);
  const pitch = window.PitchFinder.autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch > 65 && pitch < 2100) {
    const stable = pitchSmoother.push(pitch);
    const midi = window.ClarinetCore.freqToMidi(stable);
    renderFromMidi(midi, stable);
    pushPitchTrace(stable);
    micStatus.textContent = "Listening... keep a stable tone for best results.";
  } else {
    pushPitchTrace(null);
  }

  rafId = requestAnimationFrame(tickPitch);
}

async function startMicrophone() {
  if (micStream) {
    return;
  }

  micStatus.textContent = "Requesting microphone access...";
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
    micStatus.textContent = "Microphone started. Play a note.";

    pitchSmoother.clear();
    clearPitchTrace();
    tickPitch();
  } catch (error) {
    retryBtn.hidden = false;
    retryBtn.disabled = false;
    micStatus.textContent = `Could not access microphone: ${error.message}`;
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
  retryBtn.hidden = false;
  retryBtn.disabled = false;
  stopBtn.disabled = true;
  micStatus.textContent = "Microphone is off.";
  renderSpectrumHistogram();
}

function init() {
  initializeTuning();
  if (window.initReorderableWorkspace) {
    window.initReorderableWorkspace({
      workspaceSelector: "#workspace",
      itemSelector: ".controls, .results, .pitch-visualizer, .spectrum-visualizer, .fingerings",
      storageKey: "panel_order_alternate_fingerings_v1"
    });
  }

  retryBtn.addEventListener("click", startMicrophone);
  stopBtn.addEventListener("click", stopMicrophone);
  window.addEventListener("resize", () => {
    renderPitchTrace();
    renderSpectrumHistogram(audioContext ? audioContext.sampleRate : null);
  });

  concertFreqEl.textContent = "";
  renderPitchTrace();
  renderSpectrumHistogram();
  startMicrophone();
}

init();
