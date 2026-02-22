const STORAGE_KEY = "clarinet_tuning";

const TUNING_OFFSETS = {
  Bb: 2,
  A: 3,
  C: 0
};

const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const FINGERING_DB = {
  52: {
    noteLabel: "E3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3 + RH1 + RH2 + RH3 + pinky E/B key",
        info: "Lowest common written note on B\u266d clarinet (without extension)."
      }
    ]
  },
  53: {
    noteLabel: "F3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3 + RH1 + RH2 + RH3 + pinky F/C key",
        info: "Stable fundamental fingering."
      }
    ]
  },
  54: {
    noteLabel: "F#3 / Gb3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3 + RH1 + RH2 + RH3 + right-hand little finger F#/C#",
        info: "Keep fingers sealed for pitch stability."
      }
    ]
  },
  55: {
    noteLabel: "G3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3 + RH1 + RH2 + RH3",
        info: "Common open-position low G."
      }
    ]
  },
  56: {
    noteLabel: "G#3 / Ab3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Low G plus left-hand little finger G#/D# key",
        info: "Use matching pinky for nearby notes to reduce motion."
      }
    ]
  },
  57: {
    noteLabel: "A3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3 + RH1 + RH2",
        info: "Chalumeau A."
      }
    ]
  },
  58: {
    noteLabel: "A#3 / Bb3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "A3 + register of side Bb lever (or RH side Bb depending instrument)",
        info: "Choose side-Bb mechanism available on your clarinet."
      }
    ]
  },
  59: {
    noteLabel: "B3",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3 + RH1",
        info: "Chalumeau B natural."
      }
    ]
  },
  60: {
    noteLabel: "C4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2 + LH3",
        info: "Primary chalumeau C."
      }
    ]
  },
  61: {
    noteLabel: "C#4 / Db4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + LH2",
        info: "Often needs careful voicing for clean response."
      }
    ]
  },
  62: {
    noteLabel: "D4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1",
        info: "Open throat-entry note."
      }
    ]
  },
  63: {
    noteLabel: "D#4 / Eb4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb + LH1 + side Eb/Bb key",
        info: "Use right-hand side key in many passages."
      }
    ]
  },
  64: {
    noteLabel: "E4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "LH thumb only",
        info: "Throat E can be sharp; support with voicing."
      },
      {
        name: "Resonance E",
        type: "Alternate",
        keys: "LH thumb + RH1",
        info: "Adds weight and improves throat-tone color."
      }
    ]
  },
  65: {
    noteLabel: "F4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Open with first finger (index)",
        info: "Typical throat F fingering."
      },
      {
        name: "Resonance F",
        type: "Alternate",
        keys: "Standard F + RH1",
        info: "Useful to darken tone and improve connection to clarion notes."
      }
    ]
  },
  66: {
    noteLabel: "F#4 / Gb4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Open with F# key",
        info: "Throat F#; can be unstable."
      },
      {
        name: "Resonance F#",
        type: "Alternate",
        keys: "Standard + RH1 and RH2",
        info: "Common resonance fingering to stabilize intonation."
      }
    ]
  },
  67: {
    noteLabel: "G4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "No left-hand fingers + register key off",
        info: "Open G at the top of throat-tone region."
      }
    ]
  },
  68: {
    noteLabel: "G#4 / Ab4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "G + side G#/Ab key",
        info: "Often used as passing fingering."
      }
    ]
  },
  69: {
    noteLabel: "A4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register key + LH1 + LH2 + LH3",
        info: "First clarion A."
      },
      {
        name: "Resonance A",
        type: "Alternate",
        keys: "Standard + RH1",
        info: "Helps center pitch in softer dynamics."
      }
    ]
  },
  70: {
    noteLabel: "A#4 / Bb4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2 + LH3 + LH little finger A#/F",
        info: "Most common B\u266d clarion fingering."
      },
      {
        name: "Bis B\u266d",
        type: "Alternate",
        keys: "Register + LH1 + bis key",
        info: "Fast for A-B\u266d-B or nearby chromatic motion."
      },
      {
        name: "1+1 B\u266d",
        type: "Alternate",
        keys: "Register + LH1 + RH1",
        info: "Convenient in specific trills and awkward passages."
      }
    ]
  },
  71: {
    noteLabel: "B4",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2 + LH3",
        info: "Clarion B natural."
      },
      {
        name: "B-C trill prep",
        type: "Trill",
        keys: "Standard B + prepare side C key",
        info: "Technique setup for rapid B to C motion."
      }
    ]
  },
  72: {
    noteLabel: "C5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2",
        info: "Regular clarion C."
      },
      {
        name: "Side C",
        type: "Alternate",
        keys: "B fingering + side C key",
        info: "Useful in technical passages and smoother slurs."
      },
      {
        name: "B-C trill",
        type: "Trill",
        keys: "Hold B and trill side C key",
        info: "Classic trill fingering for B-C in clarion register."
      }
    ]
  },
  73: {
    noteLabel: "C#5 / Db5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1",
        info: "Clarion C#."
      }
    ]
  },
  74: {
    noteLabel: "D5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + thumb",
        info: "Bright clarion D."
      }
    ]
  },
  75: {
    noteLabel: "D#5 / Eb5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Open clarion + side Eb key",
        info: "Use side key for cleaner articulation."
      }
    ]
  },
  76: {
    noteLabel: "E5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2 + RH1 + RH2 + RH3",
        info: "Top of common clarion scale area."
      }
    ]
  },
  77: {
    noteLabel: "F5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + RH1 + RH2 + RH3",
        info: "Common bridge into altissimo."
      },
      {
        name: "Altissimo F",
        type: "Alternate",
        keys: "Register + LH1 + LH2 + RH1",
        info: "Can improve tuning depending on instrument setup."
      }
    ]
  },
  78: {
    noteLabel: "F#5 / Gb5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH2 + RH1 + RH2 + RH3",
        info: "Standard high F#."
      },
      {
        name: "Long F#",
        type: "Alternate",
        keys: "Register + LH1 + LH2 + LH3 + RH1 + RH2 + RH3",
        info: "Alternative can darken tone and aid intonation."
      }
    ]
  },
  79: {
    noteLabel: "G5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH3 + RH1 + RH2 + RH3",
        info: "Common first altissimo G fingering."
      }
    ]
  },
  80: {
    noteLabel: "G#5 / Ab5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2 + RH2 + RH3 + side Ab",
        info: "Altissimo G#; varies by model."
      }
    ]
  },
  81: {
    noteLabel: "A5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + RH1 + RH2",
        info: "Typical altissimo A."
      }
    ]
  },
  82: {
    noteLabel: "A#5 / Bb5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + side Bb + RH1",
        info: "Altissimo B\u266d fingering variant."
      }
    ]
  },
  83: {
    noteLabel: "B5",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2 + side key combination",
        info: "Altissimo B with model-dependent choices."
      }
    ]
  },
  84: {
    noteLabel: "C6",
    fingerings: [
      {
        name: "Standard",
        type: "Primary",
        keys: "Register + LH1 + LH2 + RH2",
        info: "Common altissimo C option."
      },
      {
        name: "C trill fingering",
        type: "Trill",
        keys: "B5 fingering + trill key",
        info: "Used for rapid upper-register ornaments."
      }
    ]
  }
};

const tuningSelect = document.getElementById("tuning-select");
const retryBtn = document.getElementById("retry-btn");
const stopBtn = document.getElementById("stop-btn");
const micStatus = document.getElementById("mic-status");
const concertNoteEl = document.getElementById("concert-note");
const concertFreqEl = document.getElementById("concert-freq");
const writtenNoteEl = document.getElementById("written-note");
const fingeringNoteEl = document.getElementById("fingering-note");
const fingeringListEl = document.getElementById("fingering-list");
const staffEl = document.getElementById("staff");
const pitchCanvas = document.getElementById("pitch-canvas");
const spectrumCanvas = document.getElementById("spectrum-canvas");
const workspaceEl = document.getElementById("workspace");

let audioContext = null;
let analyser = null;
let micStream = null;
let rafId = null;
let pitchHistory = [];
let currentWrittenMidi = null;
const TRACE_LENGTH = 260;
const PITCH_MIDI_MIN = 48;
const PITCH_MIDI_MAX = 96;
const PANEL_SELECTOR = ".controls, .results, .pitch-visualizer, .spectrum-visualizer, .fingerings";
const LAYOUT_STORAGE_KEY = "clarinet_layout_v1";
let pitchTrace = new Array(TRACE_LENGTH).fill(null);
let frequencyBins = null;
let dragState = null;
let zCounter = 20;
let panelsInitialized = false;

function initializeTuning() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && TUNING_OFFSETS[saved] !== undefined) {
    tuningSelect.value = saved;
  } else {
    tuningSelect.value = "Bb";
    localStorage.setItem(STORAGE_KEY, "Bb");
  }
}

function saveTuning() {
  localStorage.setItem(STORAGE_KEY, tuningSelect.value);
  if (currentWrittenMidi !== null) {
    renderFromMidi(currentWrittenMidi - TUNING_OFFSETS[tuningSelect.dataset.previous || tuningSelect.value]);
  }
  tuningSelect.dataset.previous = tuningSelect.value;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function freqToMidi(freq) {
  return Math.round(69 + 12 * Math.log2(freq / 440));
}

function freqToMidiFloat(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

function centsOff(freq, midi) {
  return Math.round(1200 * Math.log2(freq / midiToFreq(midi)));
}

function midiToName(midi, preferFlats = true) {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
  return `${names[pitchClass]}${octave}`;
}

function getStablePitch(newPitch) {
  pitchHistory.push(newPitch);
  if (pitchHistory.length > 7) {
    pitchHistory.shift();
  }
  const sorted = [...pitchHistory].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i += 1) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) {
    return -1;
  }

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;

  for (let i = 0; i < SIZE / 2; i += 1) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < SIZE / 2; i += 1) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  const sliced = buffer.slice(r1, r2);
  const newSize = sliced.length;
  const c = new Array(newSize).fill(0);

  for (let i = 0; i < newSize; i += 1) {
    for (let j = 0; j < newSize - i; j += 1) {
      c[i] += sliced[j] * sliced[j + i];
    }
  }

  let d = 0;
  while (d + 1 < c.length && c[d] > c[d + 1]) {
    d += 1;
  }

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < c.length; i += 1) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }

  if (maxPos <= 0) {
    return -1;
  }

  let T0 = maxPos;
  if (maxPos > 0 && maxPos < c.length - 1) {
    const x1 = c[maxPos - 1];
    const x2 = c[maxPos];
    const x3 = c[maxPos + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a !== 0) {
      T0 -= b / (2 * a);
    }
  }

  return sampleRate / T0;
}

function renderStaff(midi) {
  const width = 360;
  const height = 190;
  const left = 48;
  const right = width - 20;
  const staffTop = 52;
  const stepPx = 7;
  const refStep = 4 * 7 + 2;

  const noteName = midiToName(midi, true);
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
      ctx.fillText(midiToName(midi, true), 6, y + 3);
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
  const midi = freq === null ? null : freqToMidiFloat(freq);
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

function readLayout() {
  const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLayout() {
  if (!workspaceEl) {
    return;
  }
  const layout = {};
  workspaceEl.querySelectorAll(".draggable-panel").forEach((panel) => {
    const id = panel.dataset.panelId;
    layout[id] = {
      left: panel.offsetLeft,
      top: panel.offsetTop,
      width: panel.offsetWidth
    };
  });
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

function updateWorkspaceHeight() {
  if (!workspaceEl) {
    return;
  }
  let maxBottom = 0;
  workspaceEl.querySelectorAll(".draggable-panel").forEach((panel) => {
    maxBottom = Math.max(maxBottom, panel.offsetTop + panel.offsetHeight);
  });
  workspaceEl.style.minHeight = `${Math.max(900, maxBottom + 20)}px`;
}

function clampPanel(panel) {
  const maxLeft = Math.max(0, workspaceEl.clientWidth - panel.offsetWidth);
  const maxTop = Math.max(0, workspaceEl.clientHeight - panel.offsetHeight);
  const nextLeft = Math.min(maxLeft, Math.max(0, panel.offsetLeft));
  const nextTop = Math.min(maxTop, Math.max(0, panel.offsetTop));
  panel.style.left = `${nextLeft}px`;
  panel.style.top = `${nextTop}px`;
}

function onDragMove(event) {
  if (!dragState) {
    return;
  }
  const nextLeft = event.clientX - dragState.pointerOffsetX;
  const nextTop = event.clientY - dragState.pointerOffsetY;
  dragState.panel.style.left = `${nextLeft}px`;
  dragState.panel.style.top = `${nextTop}px`;
  clampPanel(dragState.panel);
  updateWorkspaceHeight();
}

function onDragEnd() {
  if (!dragState) {
    return;
  }
  dragState.panel.classList.remove("dragging");
  dragState.panel.releasePointerCapture(dragState.pointerId);
  dragState = null;
  saveLayout();
}

function onDragStart(event, panel) {
  event.preventDefault();
  panel.style.zIndex = String(zCounter++);
  panel.classList.add("dragging");
  panel.setPointerCapture(event.pointerId);
  dragState = {
    panel,
    pointerId: event.pointerId,
    pointerOffsetX: event.clientX - panel.offsetLeft,
    pointerOffsetY: event.clientY - panel.offsetTop
  };
}

function setupDraggablePanels() {
  if (!workspaceEl || panelsInitialized) {
    return;
  }

  const layout = readLayout();
  const workspaceRect = workspaceEl.getBoundingClientRect();
  const panels = Array.from(workspaceEl.querySelectorAll(PANEL_SELECTOR));

  panels.forEach((panel, index) => {
    if (!panel.dataset.panelId) {
      panel.dataset.panelId = panel.classList[0] || `panel-${index + 1}`;
    }

    if (!panel.querySelector(".drag-handle")) {
      const handle = document.createElement("div");
      handle.className = "drag-handle";
      handle.textContent = "Drag";
      handle.addEventListener("pointerdown", (event) => onDragStart(event, panel));
      panel.insertBefore(handle, panel.firstChild);
    }

    const rect = panel.getBoundingClientRect();
    const fallbackLeft = rect.left - workspaceRect.left;
    const fallbackTop = rect.top - workspaceRect.top;
    const saved = layout[panel.dataset.panelId];
    const left = saved && Number.isFinite(saved.left) ? saved.left : fallbackLeft;
    const top = saved && Number.isFinite(saved.top) ? saved.top : fallbackTop;
    const width = saved && Number.isFinite(saved.width) ? saved.width : rect.width;

    panel.classList.add("draggable-panel");
    panel.style.left = `${Math.max(0, left)}px`;
    panel.style.top = `${Math.max(0, top)}px`;
    panel.style.width = `${Math.max(280, Math.min(workspaceEl.clientWidth, width))}px`;
    panel.style.zIndex = String(zCounter++);
    clampPanel(panel);
  });

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
  panelsInitialized = true;
  updateWorkspaceHeight();
}

function relayoutPanelsAfterResize() {
  if (!workspaceEl) {
    return;
  }
  workspaceEl.querySelectorAll(".draggable-panel").forEach((panel) => {
    const maxWidth = workspaceEl.clientWidth;
    const currentWidth = Math.min(maxWidth, panel.offsetWidth);
    panel.style.width = `${Math.max(280, currentWidth)}px`;
    clampPanel(panel);
  });
  updateWorkspaceHeight();
  saveLayout();
}

function renderFingerings(writtenMidi) {
  const entry = FINGERING_DB[writtenMidi];
  fingeringListEl.innerHTML = "";

  if (!entry) {
    fingeringNoteEl.textContent = `No fingering data in this tool for ${midiToName(writtenMidi, true)} yet.`;
    return;
  }

  fingeringNoteEl.textContent = `Showing ${entry.fingerings.length} fingering option(s) for ${entry.noteLabel}.`;

  entry.fingerings.forEach((fingering) => {
    const card = document.createElement("article");
    card.className = "fingering-card";

    const title = document.createElement("h3");
    title.textContent = fingering.name;

    const type = document.createElement("p");
    type.innerHTML = `<strong>Type:</strong> ${fingering.type}`;

    const keys = document.createElement("p");
    keys.innerHTML = `<strong>Keys:</strong> ${fingering.keys}`;

    const info = document.createElement("p");
    info.innerHTML = `<strong>Info:</strong> ${fingering.info}`;

    card.appendChild(title);
    card.appendChild(type);
    card.appendChild(keys);
    card.appendChild(info);
    fingeringListEl.appendChild(card);
  });
}

function renderFromMidi(concertMidi, detectedFrequency = null) {
  const tuning = tuningSelect.value;
  const transpose = TUNING_OFFSETS[tuning];
  const writtenMidi = concertMidi + transpose;
  currentWrittenMidi = writtenMidi;

  const concertLabel = midiToName(concertMidi, true);
  const writtenLabel = midiToName(writtenMidi, true);

  concertNoteEl.textContent = concertLabel;
  writtenNoteEl.textContent = `${writtenLabel} (${tuning} clarinet)`;

  if (detectedFrequency) {
    const cents = centsOff(detectedFrequency, concertMidi);
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
  const pitch = autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch > 65 && pitch < 2100) {
    const stable = getStablePitch(pitch);
    const midi = freqToMidi(stable);
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

    pitchHistory = [];
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
  tuningSelect.dataset.previous = tuningSelect.value;
  setupDraggablePanels();

  tuningSelect.addEventListener("change", saveTuning);
  retryBtn.addEventListener("click", startMicrophone);
  stopBtn.addEventListener("click", stopMicrophone);
  window.addEventListener("resize", () => {
    relayoutPanelsAfterResize();
    renderPitchTrace();
    renderSpectrumHistogram(audioContext ? audioContext.sampleRate : null);
  });

  concertFreqEl.textContent = "";
  renderPitchTrace();
  renderSpectrumHistogram();
  startMicrophone();
}

init();
