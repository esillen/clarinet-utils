const showcaseGrid = document.getElementById("staff-showcase-grid");

const SHOWCASE_CASES = [
  {
    title: "Scale Check · C Major",
    width: 980,
    height: 220,
    scale: "C_MAJOR",
    notes: [60, 62, 64, 65, 67, 69, 71, 72]
  },
  {
    title: "Scale Check · G Major",
    width: 980,
    height: 220,
    scale: "G_MAJOR",
    notes: [67, 69, 71, 72, 74, 76, 78, 79]
  },
  {
    title: "Scale Check · D Major",
    width: 980,
    height: 220,
    scale: "D_MAJOR",
    notes: [62, 64, 66, 67, 69, 71, 73, 74]
  },
  {
    title: "Scale Check · F Major",
    width: 980,
    height: 220,
    scale: "F_MAJOR",
    notes: [65, 67, 69, 70, 72, 74, 76, 77]
  },
  {
    title: "Scale Check · B♭ Major",
    width: 980,
    height: 220,
    scale: "BB_MAJOR",
    notes: [58, 60, 62, 63, 65, 67, 69, 70]
  },
  {
    title: "Scale Check · A Minor",
    width: 980,
    height: 220,
    scale: "A_MINOR",
    notes: [57, 59, 60, 62, 64, 65, 67, 69]
  },
  {
    title: "Single Note · Medium · C Major",
    width: 420,
    height: 210,
    scale: "C_MAJOR",
    notes: [67]
  },
  {
    title: "Single Note · Small · G Major (sharp accidental)",
    width: 260,
    height: 140,
    scale: "G_MAJOR",
    notes: [66]
  },
  {
    title: "Single Note · Small · F Major (flat accidental)",
    width: 260,
    height: 140,
    scale: "F_MAJOR",
    notes: [70]
  },
  {
    title: "4 Notes · Medium · D Major",
    width: 520,
    height: 210,
    scale: "D_MAJOR",
    notes: [62, 64, 66, 69]
  },
  {
    title: "6 Notes · Medium · B♭ Major",
    width: 640,
    height: 210,
    scale: "BB_MAJOR",
    notes: [58, 60, 62, 63, 65, 67]
  },
  {
    title: "8 Notes · Wide · A Minor",
    width: 900,
    height: 220,
    scale: "A_MINOR",
    notes: [57, 59, 60, 62, 64, 65, 67, 69]
  },
  {
    title: "10 Notes · Wide · Chromatic",
    width: 980,
    height: 220,
    scale: "CHROMATIC",
    notes: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69]
  },
  {
    title: "Enharmonic Pair · Compact",
    width: 340,
    height: 170,
    scale: "CHROMATIC",
    notes: [{ writtenMidi: 68, spellings: ["G#4", "Ab4"] }]
  }
];

function renderCase(config) {
  const card = document.createElement("article");
  card.className = "staff-showcase-card";

  const title = document.createElement("h3");
  title.textContent = config.title;
  card.appendChild(title);

  const subtitle = document.createElement("p");
  subtitle.className = "muted";
  subtitle.textContent = `${config.width}x${config.height} · ${config.scale} · ${config.notes.length} note(s)`;
  card.appendChild(subtitle);

  const preferFlats = window.ClarinetStaffRenderer.preferFlatsForScale(config.scale);
  const intended = config.notes.map((item) => {
    if (typeof item === "number") {
      return `${window.ClarinetCore.midiToName(item, preferFlats)} (${item})`;
    }
    const midi = Number(item.writtenMidi !== undefined ? item.writtenMidi : item.midi);
    if (!Number.isFinite(midi)) {
      return "invalid";
    }
    if (Array.isArray(item.spellings) && item.spellings.length > 0) {
      return `${item.spellings.join(" / ")} (${midi})`;
    }
    return `${window.ClarinetCore.midiToName(midi, preferFlats)} (${midi})`;
  });
  const intendedEl = document.createElement("p");
  intendedEl.className = "muted";
  intendedEl.textContent = `Intended notes: ${intended.join(", ")}`;
  card.appendChild(intendedEl);

  const frame = document.createElement("div");
  frame.className = "staff-showcase-frame";
  const svg = window.ClarinetStaffRenderer.renderNoteSequenceSvg({
    width: config.width,
    height: config.height,
    scale: config.scale,
    notes: config.notes
  });
  svg.classList.add("staff-svg");
  frame.appendChild(svg);
  card.appendChild(frame);
  return card;
}

function init() {
  SHOWCASE_CASES.forEach((item) => {
    showcaseGrid.appendChild(renderCase(item));
  });
}

init();
