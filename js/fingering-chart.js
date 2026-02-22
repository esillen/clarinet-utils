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
  summary.textContent = `${entry.noteLabel} · concert ${getConcertNoteLabel(entry.writtenMidi)} · ${fingerings.length} fingering(s)`;

  const subtitle = document.createElement("p");
  subtitle.className = "muted";
  subtitle.textContent = `${entry.noteLabel} written (${window.ClarinetCore.midiToName(entry.writtenMidi, true)})`;

  const list = document.createElement("ul");
  list.className = "chart-fingering-list";

  fingerings.forEach((fingering) => {
    const item = document.createElement("li");
    item.className = "chart-fingering-item";
    item.innerHTML = [
      `<span class="chart-fingering-type">${fingering.type}</span>`,
      `<strong>${fingering.name}</strong>`,
      `<span class="chart-fingering-keys">${fingering.keys}</span>`,
      `<span class="chart-fingering-info">${fingering.info}</span>`
    ].join(" · ");
    list.appendChild(item);
  });

  group.appendChild(summary);
  group.appendChild(subtitle);
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
