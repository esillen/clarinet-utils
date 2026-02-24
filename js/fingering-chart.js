const chartTuningEl = document.getElementById("chart-tuning");
const noteFilterEl = document.getElementById("chart-note-filter");
const typeFilterEl = document.getElementById("chart-type-filter");
const searchEl = document.getElementById("chart-search");
const summaryEl = document.getElementById("chart-summary");
const resultsEl = document.getElementById("chart-results");

let currentTuning = "Bb";
const allEntries = window.ClarinetFingerings.getEntries();

function getConcertNoteLabel(writtenMidi) {
  const transpose = window.ClarinetCore.TUNING_OFFSETS[currentTuning] || 0;
  const concertMidi = writtenMidi - transpose;
  return window.ClarinetCore.midiToName(concertMidi, true);
}

function renderMiniStaff(writtenMidi, noteLabel = "") {
  return window.ClarinetStaffRenderer.renderStaffSvg({
    writtenMidi,
    noteLabel,
    className: "chart-staff-svg",
    width: 140,
    height: 90,
    left: 30,
    right: 132,
    staffTop: 28,
    spacing: 7,
    noteX: 82,
    dualDx: 15,
    noteHeadRx: 7,
    noteHeadRy: 5,
    noteHeadFill: "#10634f",
    noteRotateDeg: -20,
    stemLength: 22,
    stemWidth: 1.1,
    stemColor: "#10634f",
    accidentalDx: 22,
    accidentalDy: 3,
    accidentalSize: 11,
    ledgerHalfWidth: 10,
    ledgerColor: "#122420",
    ledgerWidth: 1,
    staffColor: "#1a2a27",
    staffWidth: 1,
    clefX: 4,
    clefY: 52,
    clefSize: 34
  });
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
  const group = document.createElement("section");
  group.className = "chart-note-block";

  const title = document.createElement("h3");
  title.className = "chart-note-title";
  title.textContent = `${entry.noteLabel} (written ${window.ClarinetCore.midiToName(entry.writtenMidi, true)})`;
  group.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.className = "muted chart-note-subtitle";
  subtitle.textContent = `Concert: ${getConcertNoteLabel(entry.writtenMidi)}`;
  group.appendChild(subtitle);

  const rows = document.createElement("div");
  rows.className = "chart-note-rows";

  fingerings.forEach((fingering, index) => {
    const row = document.createElement("article");
    row.className = "chart-fingering-row";

    if (index === 0) {
      const clefCol = document.createElement("div");
      clefCol.className = "chart-clef-col";
      clefCol.appendChild(renderMiniStaff(entry.writtenMidi, entry.noteLabel));
      row.appendChild(clefCol);
    } else {
      const spacer = document.createElement("div");
      spacer.className = "chart-clef-spacer";
      spacer.setAttribute("aria-hidden", "true");
      row.appendChild(spacer);
    }

    const guide = window.ClarinetFingerings.getVisualGuide(fingering.type);
    const center = document.createElement("div");
    center.className = "chart-fingering-visual";
    const visualFrame = window.ClarinetFingerings.renderFingeringVisualFrame(fingering, {
      visualGuide: guide,
      showHoleOverlay: true,
      writtenMidi: entry.writtenMidi
    });
    center.appendChild(visualFrame);
    row.appendChild(center);

    const text = document.createElement("div");
    text.className = "chart-fingering-text";
    const notation = window.ClarinetFingerings.formatCompactNotation(fingering.keys);
    const description = window.ClarinetFingerings.describeFingering(fingering, {
      writtenMidi: entry.writtenMidi
    });
    text.innerHTML = [
      `<p><span class="chart-fingering-type">${fingering.type}</span> <strong>${fingering.name}</strong></p>`,
      `<p class="chart-fingering-keys"><strong>Notation:</strong> ${notation}</p>`,
      `<p class="chart-fingering-info">${description}</p>`
    ].join("");
    row.appendChild(text);

    rows.appendChild(row);
  });

  group.appendChild(rows);
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

  summaryEl.textContent = `${noteMatchCount} notes · ${fingeringCount} fingerings`;
}

function init() {
  currentTuning = window.ClarinetCore.readTuning("Bb");
  chartTuningEl.textContent = `Clarinet tuning: ${currentTuning}`;

  populateNoteFilter();

  noteFilterEl.addEventListener("change", render);
  typeFilterEl.addEventListener("change", render);
  searchEl.addEventListener("input", render);

  render();
}

init();
