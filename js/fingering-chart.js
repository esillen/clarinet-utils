const searchEl = document.getElementById("chart-search");
const summaryEl = document.getElementById("chart-summary");
const resultsEl = document.getElementById("chart-results");

const allEntries = window.ClarinetFingerings.getEntries();

function renderMiniStaff(writtenMidi, noteLabel = "") {
  const spellings = window.ClarinetStaffRenderer.getDisplayedSpellingVariants(noteLabel, writtenMidi);
  const svg = window.ClarinetStaffRenderer.renderNoteSequenceSvg({
    width: 140,
    height: 90,
    scale: "CHROMATIC",
    notes: [{ writtenMidi, spellings, fill: "#10634f", stemColor: "#10634f" }]
  });
  svg.classList.add("chart-staff-svg");
  return svg;
}

function matchesSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    entry.noteLabel,
    window.ClarinetCore.midiToName(entry.writtenMidi, true)
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
  const query = searchEl.value.trim().toLowerCase();

  resultsEl.innerHTML = "";

  let noteMatchCount = 0;
  let fingeringCount = 0;

  allEntries.forEach((entry) => {
    if (!matchesSearch(entry, query)) {
      return;
    }

    noteMatchCount += 1;
    fingeringCount += entry.fingerings.length;
    resultsEl.appendChild(renderEntry(entry, entry.fingerings));
  });

  summaryEl.textContent = `${noteMatchCount} notes · ${fingeringCount} fingerings`;
}

function init() {
  searchEl.addEventListener("input", render);

  render();
}

init();
