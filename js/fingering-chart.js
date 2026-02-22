const chartTuningEl = document.getElementById("chart-tuning");
const noteFilterEl = document.getElementById("chart-note-filter");
const typeFilterEl = document.getElementById("chart-type-filter");
const searchEl = document.getElementById("chart-search");
const summaryEl = document.getElementById("chart-summary");
const resultsEl = document.getElementById("chart-results");
const chartVisualRefsEl = document.getElementById("chart-visual-refs");

let currentTuning = "Bb";
const allEntries = window.ClarinetFingerings.getEntries();

function getConcertNoteLabel(writtenMidi) {
  const transpose = window.ClarinetCore.TUNING_OFFSETS[currentTuning] || 0;
  const concertMidi = writtenMidi - transpose;
  return window.ClarinetCore.midiToName(concertMidi, true);
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

function renderMiniStaff(writtenMidi) {
  const width = 140;
  const height = 90;
  const left = 30;
  const right = width - 8;
  const staffTop = 28;
  const spacing = 7;
  const x = 82;
  const y = noteYForStaff(writtenMidi, staffTop, spacing);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "chart-staff-svg");

  for (let i = 0; i < 5; i += 1) {
    const lineY = staffTop + i * spacing;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(left));
    line.setAttribute("x2", String(right));
    line.setAttribute("y1", String(lineY));
    line.setAttribute("y2", String(lineY));
    line.setAttribute("stroke", "#1a2a27");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
  }

  const clef = document.createElementNS("http://www.w3.org/2000/svg", "text");
  clef.setAttribute("x", "4");
  clef.setAttribute("y", "52");
  clef.setAttribute("font-size", "34");
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
    ledger.setAttribute("x1", String(x - 11));
    ledger.setAttribute("x2", String(x + 11));
    ledger.setAttribute("y1", String(ly));
    ledger.setAttribute("y2", String(ly));
    ledger.setAttribute("stroke", "#122420");
    ledger.setAttribute("stroke-width", "1");
    svg.appendChild(ledger);
  });

  const noteHead = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
  noteHead.setAttribute("cx", String(x));
  noteHead.setAttribute("cy", String(y));
  noteHead.setAttribute("rx", "7");
  noteHead.setAttribute("ry", "5");
  noteHead.setAttribute("transform", `rotate(-20 ${x} ${y})`);
  noteHead.setAttribute("fill", "#10634f");
  svg.appendChild(noteHead);

  const stem = document.createElementNS("http://www.w3.org/2000/svg", "line");
  const stemUp = y > staffTop + 2 * spacing;
  stem.setAttribute("x1", String(stemUp ? x + 6 : x - 6));
  stem.setAttribute("x2", String(stemUp ? x + 6 : x - 6));
  stem.setAttribute("y1", String(y));
  stem.setAttribute("y2", String(stemUp ? y - 22 : y + 22));
  stem.setAttribute("stroke", "#10634f");
  stem.setAttribute("stroke-width", "1.1");
  svg.appendChild(stem);

  return svg;
}

function populateNoteFilter() {
  const fragment = document.createDocumentFragment();

  allEntries.forEach((entry) => {
    const option = document.createElement("option");
    option.value = String(entry.writtenMidi);
    option.textContent = `${entry.noteLabel} (written)`;
    fragment.appendChild(option);
  });

  noteFilterEl.appendChild(fragment);
}

function matchesSearch(entry, fingering, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.noteLabel,
    window.ClarinetCore.midiToName(entry.writtenMidi, true),
    fingering.name,
    fingering.type,
    fingering.keys,
    fingering.info
  ].join(" ").toLowerCase();

  return haystack.includes(query);
}

function renderEntry(entry, fingerings) {
  const group = document.createElement("details");
  group.className = "chart-entry";
  if (noteFilterEl.value !== "all") {
    group.open = true;
  }

  const summary = document.createElement("summary");
  summary.className = "chart-entry-summary";
  summary.textContent = `${entry.noteLabel} · ${fingerings.length} fingering(s)`;

  const subtitle = document.createElement("p");
  subtitle.className = "muted";
  subtitle.textContent = `Written: ${window.ClarinetCore.midiToName(entry.writtenMidi, true)} · Concert: ${getConcertNoteLabel(entry.writtenMidi)}`;

  const preview = document.createElement("div");
  preview.className = "chart-note-preview";
  preview.appendChild(renderMiniStaff(entry.writtenMidi));

  const list = document.createElement("ul");
  list.className = "chart-fingering-list";

  fingerings.forEach((fingering) => {
    const item = document.createElement("li");
    item.className = "chart-fingering-item";
    item.innerHTML = [
      `<span class="chart-fingering-type">${fingering.type}</span>`,
      `<strong>${fingering.name}</strong>`,
      `<span class="chart-fingering-info">${fingering.info}</span>`
    ].join(" · ");
    list.appendChild(item);
  });

  group.appendChild(summary);
  group.appendChild(subtitle);
  group.appendChild(preview);
  group.appendChild(list);
  return group;
}

function render() {
  const selectedNote = noteFilterEl.value;
  const selectedType = typeFilterEl.value;
  const query = searchEl.value.trim().toLowerCase();

  resultsEl.innerHTML = "";

  let noteMatchCount = 0;
  let fingeringCount = 0;

  allEntries.forEach((entry) => {
    if (selectedNote !== "all" && entry.writtenMidi !== Number(selectedNote)) {
      return;
    }

    const filteredFingerings = entry.fingerings.filter((fingering) => {
      const typeMatch = selectedType === "all" || fingering.type === selectedType;
      if (!typeMatch) {
        return false;
      }
      return matchesSearch(entry, fingering, query);
    });

    if (filteredFingerings.length === 0) {
      return;
    }

    noteMatchCount += 1;
    fingeringCount += filteredFingerings.length;
    resultsEl.appendChild(renderEntry(entry, filteredFingerings));
  });

  summaryEl.textContent = `Showing ${fingeringCount} fingering(s) across ${noteMatchCount} note(s).`;
}

function init() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  chartTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;
  chartVisualRefsEl.innerHTML = window.ClarinetFingerings.getReferenceHtml();

  populateNoteFilter();

  noteFilterEl.addEventListener("change", render);
  typeFilterEl.addEventListener("change", render);
  searchEl.addEventListener("input", render);

  render();
}

init();
