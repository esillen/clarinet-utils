(function () {
  // Optical tweak for note vertical centering (positive = down, negative = up),
  // scaled by staff spacing so it adapts across render sizes.
  const NOTE_VERTICAL_NUDGE_SPACING_FACTOR = 0.26;
  const ACCIDENTAL_TUNING = {
    sharp: {
      scale: 0.76,
      dxFactor: 2.62,
      dyFactor: 0.62
    },
    flat: {
      scale: 1,
      dxFactor: 2.32,
      dyFactor: 0.4
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createSvgElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function noteYForNamedNote(note, staffTop, spacing) {
    const pitch = String(note || "").slice(0, -1);
    const octave = Number(String(note || "").slice(-1));
    const map = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
    const letter = pitch.charAt(0);
    const diatonic = octave * 7 + (map[letter] || 0);
    const ref = 4 * 7 + 2; // E4
    const step = diatonic - ref;
    const slot = spacing / 2;
    const rawY = staffTop + 4 * spacing - step * slot;
    const nudgePx = spacing * NOTE_VERTICAL_NUDGE_SPACING_FACTOR;
    return Math.round(rawY / slot) * slot + nudgePx;
  }

  function getDisplayedSpellingVariants(noteLabel, writtenMidi) {
    const fallback = window.ClarinetCore.midiToName(writtenMidi, true);
    const source = String(noteLabel || fallback);
    const explicit = source
      .split("/")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const withFallback = explicit.length > 0 ? explicit : [fallback];

    const fallbackOctaveMatch = fallback.match(/(\d+)$/);
    const fallbackOctave = fallbackOctaveMatch ? fallbackOctaveMatch[1] : "";

    const normalized = withFallback.map((item) => (/\d+$/.test(item) ? item : `${item}${fallbackOctave}`));
    return Array.from(new Set(normalized)).slice(0, 2);
  }

  function parseAccidental(noteName) {
    const pitch = String(noteName || "").slice(0, -1).trim();
    const sharpOrFlat = pitch.match(/^[A-G](#|b)$/);
    if (!sharpOrFlat) return "";
    if (sharpOrFlat[1] === "#") return "\u266F";
    if (sharpOrFlat[1] === "b") return "\u266D";
    return "";
  }

  function preferFlatsForScale(scale) {
    const key = String(scale || "CHROMATIC").toUpperCase();
    const SHARP_SCALES = new Set([
      "G_MAJOR",
      "D_MAJOR",
      "A_MAJOR",
      "E_MAJOR",
      "B_MAJOR",
      "F_SHARP_MAJOR",
      "C_SHARP_MAJOR",
      "E_MINOR",
      "B_MINOR",
      "F_SHARP_MINOR",
      "C_SHARP_MINOR",
      "G_SHARP_MINOR",
      "D_SHARP_MINOR",
      "A_SHARP_MINOR"
    ]);
    return !SHARP_SCALES.has(key);
  }

  function buildLayout(width, height, count) {
    const spacing = clamp(Math.round(height * 0.045), 6, 9);
    const staffTop = Math.round((height - 4 * spacing) / 2);
    const staffLeft = Math.round(spacing * 6.2);
    const staffRight = Math.round(width - spacing * 1.8);
    const clefX = Math.round(staffLeft - spacing * 0.2);
    const clefY = Math.round(staffTop + spacing * 2.05);
    const clefSize = Math.round(spacing * 7.9);

    const usableCount = Math.max(count, 1);
    const startX = staffLeft + spacing * 6.2;
    const endX = staffRight - spacing * 1.2;
    const step = usableCount > 1 ? (endX - startX) / (usableCount - 1) : 0;

    return {
      spacing,
      staffTop,
      staffLeft,
      staffRight,
      clefX,
      clefY,
      clefSize,
      startX,
      step,
      dualDx: spacing * 1.9,
      noteHeadRx: spacing * 0.85,
      noteHeadRy: spacing * 0.62,
      noteRotateDeg: -13,
      stemLength: spacing * 3.4,
      stemWidth: Math.max(1, spacing * 0.14),
      accidentalBaseSize: spacing * 3.4,
      ledgerHalfWidth: spacing * 1.45,
      ledgerWidth: Math.max(1, spacing * 0.14),
      staffWidth: Math.max(1, spacing * 0.14)
    };
  }

  function getAccidentalMetrics(layout, accidentalSymbol) {
    if (accidentalSymbol === "\u266F") {
      return {
        size: layout.accidentalBaseSize * ACCIDENTAL_TUNING.sharp.scale,
        dx: layout.spacing * ACCIDENTAL_TUNING.sharp.dxFactor,
        dy: layout.spacing * ACCIDENTAL_TUNING.sharp.dyFactor
      };
    }
    if (accidentalSymbol === "\u266D") {
      return {
        size: layout.accidentalBaseSize * ACCIDENTAL_TUNING.flat.scale,
        dx: layout.spacing * ACCIDENTAL_TUNING.flat.dxFactor,
        dy: layout.spacing * ACCIDENTAL_TUNING.flat.dyFactor
      };
    }
    return {
      size: layout.accidentalBaseSize,
      dx: layout.spacing * ACCIDENTAL_TUNING.sharp.dxFactor,
      dy: layout.spacing * ACCIDENTAL_TUNING.sharp.dyFactor
    };
  }

  // Main API: only width, height, scale, notes are required.
  function renderNoteSequenceSvg(options = {}) {
    const notes = Array.isArray(options.notes) ? options.notes : [];
    const width = Number(options.width) || 360;
    const height = Number(options.height) || 190;
    const scale = options.scale || "CHROMATIC";
    const className = options.className || "staff-svg";
    const noteHeadFill = options.noteHeadFill || "#122420";
    const stemColorDefault = options.stemColor || "#122420";
    const ledgerColor = options.ledgerColor || "#1a2a27";
    const staffColor = options.staffColor || "#1a2a27";
    const showClef = options.showClef !== false;

    const layout = buildLayout(width, height, notes.length);
    const preferFlats = preferFlatsForScale(scale);

    const svg = createSvgElement("svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", className);

    for (let i = 0; i < 5; i += 1) {
      const y = layout.staffTop + i * layout.spacing;
      const line = createSvgElement("line");
      line.setAttribute("x1", String(layout.staffLeft));
      line.setAttribute("x2", String(layout.staffRight));
      line.setAttribute("y1", String(y));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", staffColor);
      line.setAttribute("stroke-width", String(layout.staffWidth));
      svg.appendChild(line);
    }

    if (showClef) {
      const clef = createSvgElement("text");
      clef.setAttribute("x", String(layout.clefX));
      clef.setAttribute("y", String(layout.clefY));
      clef.setAttribute("font-size", String(layout.clefSize));
      clef.setAttribute("font-family", "serif");
      clef.setAttribute("dominant-baseline", "middle");
      clef.textContent = "\uD834\uDD1E";
      svg.appendChild(clef);
    }

    const noteSpecs = [];
    notes.forEach((note, noteIndex) => {
      if (!note || note.visible === false) {
        return;
      }

      const writtenMidi = Number(note.writtenMidi !== undefined ? note.writtenMidi : note.midi !== undefined ? note.midi : note);
      if (!Number.isFinite(writtenMidi)) {
        return;
      }

      const xCenter = layout.startX + noteIndex * layout.step;
      const spellings = Array.isArray(note.spellings) && note.spellings.length > 0
        ? note.spellings
        : [note.spelling || window.ClarinetCore.midiToName(writtenMidi, preferFlats)];

      spellings.slice(0, 2).forEach((spelling, spellingIndex) => {
        noteSpecs.push({
          y: noteYForNamedNote(spelling, layout.staffTop, layout.spacing),
          x: xCenter + (spellings.length > 1 ? (spellingIndex === 0 ? -layout.dualDx : layout.dualDx) : 0),
          accidental: parseAccidental(spelling),
          fill: note.fill || noteHeadFill,
          stemColor: note.stemColor || stemColorDefault
        });
      });
    });

    const minStaffY = layout.staffTop;
    const maxStaffY = layout.staffTop + 4 * layout.spacing;

    noteSpecs.forEach((spec) => {
      const ledgerYs = [];
      if (spec.y < minStaffY - layout.spacing / 2) {
        for (let y = minStaffY - layout.spacing; y >= spec.y - 1; y -= layout.spacing) {
          ledgerYs.push(y);
        }
      } else if (spec.y > maxStaffY + layout.spacing / 2) {
        for (let y = maxStaffY + layout.spacing; y <= spec.y + 1; y += layout.spacing) {
          ledgerYs.push(y);
        }
      }

      ledgerYs.forEach((ly) => {
        const ledger = createSvgElement("line");
        ledger.setAttribute("x1", String(spec.x - layout.ledgerHalfWidth));
        ledger.setAttribute("x2", String(spec.x + layout.ledgerHalfWidth));
        ledger.setAttribute("y1", String(ly));
        ledger.setAttribute("y2", String(ly));
        ledger.setAttribute("stroke", ledgerColor);
        ledger.setAttribute("stroke-width", String(layout.ledgerWidth));
        svg.appendChild(ledger);
      });
    });

    noteSpecs.forEach((spec) => {
      const noteHead = createSvgElement("ellipse");
      noteHead.setAttribute("cx", String(spec.x));
      noteHead.setAttribute("cy", String(spec.y));
      noteHead.setAttribute("rx", String(layout.noteHeadRx));
      noteHead.setAttribute("ry", String(layout.noteHeadRy));
      noteHead.setAttribute("transform", `rotate(${layout.noteRotateDeg} ${spec.x} ${spec.y})`);
      noteHead.setAttribute("fill", spec.fill);
      svg.appendChild(noteHead);

      const stem = createSvgElement("line");
      const stemUp = spec.y > layout.staffTop + 2 * layout.spacing;
      stem.setAttribute("x1", String(stemUp ? spec.x + layout.noteHeadRx - 1 : spec.x - layout.noteHeadRx + 1));
      stem.setAttribute("x2", String(stemUp ? spec.x + layout.noteHeadRx - 1 : spec.x - layout.noteHeadRx + 1));
      stem.setAttribute("y1", String(spec.y));
      stem.setAttribute("y2", String(stemUp ? spec.y - layout.stemLength : spec.y + layout.stemLength));
      stem.setAttribute("stroke", spec.stemColor);
      stem.setAttribute("stroke-width", String(layout.stemWidth));
      svg.appendChild(stem);

      if (spec.accidental) {
        const accidentalMetrics = getAccidentalMetrics(layout, spec.accidental);
        const accidental = createSvgElement("text");
        accidental.setAttribute("x", String(spec.x - accidentalMetrics.dx));
        accidental.setAttribute("y", String(spec.y + accidentalMetrics.dy));
        accidental.setAttribute("font-size", String(accidentalMetrics.size));
        accidental.setAttribute("font-family", "serif");
        accidental.textContent = spec.accidental;
        svg.appendChild(accidental);
      }
    });

    return svg;
  }

  function renderStaffSvg(options = {}) {
    const writtenMidi = Number(options.writtenMidi);
    const noteLabel = String(options.noteLabel || "");
    const spellings = getDisplayedSpellingVariants(noteLabel, writtenMidi);

    return renderNoteSequenceSvg({
      width: options.width || 360,
      height: options.height || 190,
      scale: options.scale || "CHROMATIC",
      className: options.className || "staff-svg",
      notes: [{ writtenMidi, spellings }],
      noteHeadFill: options.noteHeadFill,
      stemColor: options.stemColor,
      ledgerColor: options.ledgerColor,
      staffColor: options.staffColor
    });
  }

  window.ClarinetStaffRenderer = {
    renderStaffSvg,
    renderNoteSequenceSvg,
    getDisplayedSpellingVariants,
    preferFlatsForScale
  };
})();
