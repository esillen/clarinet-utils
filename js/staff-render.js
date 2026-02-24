(function () {
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
    return Math.round(rawY / slot) * slot;
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

  function createSvgElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
  }

  function renderStaffSvg(options) {
    const {
      writtenMidi,
      noteLabel = "",
      className = "staff-svg",
      width = 360,
      height = 190,
      left = 48,
      right = width - 20,
      staffTop = 52,
      spacing = 7,
      noteX = 175,
      dualDx = 18,
      noteHeadRx = 10,
      noteHeadRy = 7,
      noteHeadFill = "#122420",
      noteRotateDeg = -20,
      stemLength = 34,
      stemWidth = 1.6,
      stemColor = "#122420",
      accidentalDx = 25,
      accidentalDy = 4,
      accidentalSize = 19,
      ledgerHalfWidth = 24,
      ledgerColor = "#1a2a27",
      ledgerWidth = 1.2,
      staffColor = "#1a2a27",
      staffWidth = 1.2,
      clefX = 12,
      clefY = 80,
      clefSize = 58
    } = options;

    const spellings = getDisplayedSpellingVariants(noteLabel, writtenMidi);
    const noteSpecs = spellings.map((spelling, index) => ({
      index,
      spelling,
      y: noteYForNamedNote(spelling, staffTop, spacing),
      x: noteX + (spellings.length > 1 ? (index === 0 ? -dualDx : dualDx) : 0),
      accidental: parseAccidental(spelling)
    }));

    const svg = createSvgElement("svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", className);

    for (let i = 0; i < 5; i += 1) {
      const y = staffTop + i * spacing;
      const line = createSvgElement("line");
      line.setAttribute("x1", String(left));
      line.setAttribute("x2", String(right));
      line.setAttribute("y1", String(y));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", staffColor);
      line.setAttribute("stroke-width", String(staffWidth));
      svg.appendChild(line);
    }

    const clef = createSvgElement("text");
    clef.setAttribute("x", String(clefX));
    clef.setAttribute("y", String(clefY));
    clef.setAttribute("font-size", String(clefSize));
    clef.setAttribute("font-family", "serif");
    clef.textContent = "\uD834\uDD1E";
    svg.appendChild(clef);

    const minStaffY = staffTop;
    const maxStaffY = staffTop + 4 * spacing;

    noteSpecs.forEach((spec) => {
      const ledgerYs = [];
      if (spec.y < minStaffY - spacing / 2) {
        for (let y = minStaffY - spacing; y >= spec.y - 1; y -= spacing) {
          ledgerYs.push(y);
        }
      } else if (spec.y > maxStaffY + spacing / 2) {
        for (let y = maxStaffY + spacing; y <= spec.y + 1; y += spacing) {
          ledgerYs.push(y);
        }
      }

      ledgerYs.forEach((ly) => {
        const ledger = createSvgElement("line");
        ledger.setAttribute("x1", String(spec.x - ledgerHalfWidth));
        ledger.setAttribute("x2", String(spec.x + ledgerHalfWidth));
        ledger.setAttribute("y1", String(ly));
        ledger.setAttribute("y2", String(ly));
        ledger.setAttribute("stroke", ledgerColor);
        ledger.setAttribute("stroke-width", String(ledgerWidth));
        svg.appendChild(ledger);
      });
    });

    noteSpecs.forEach((spec) => {
      const noteHead = createSvgElement("ellipse");
      noteHead.setAttribute("cx", String(spec.x));
      noteHead.setAttribute("cy", String(spec.y));
      noteHead.setAttribute("rx", String(noteHeadRx));
      noteHead.setAttribute("ry", String(noteHeadRy));
      noteHead.setAttribute("transform", `rotate(${noteRotateDeg} ${spec.x} ${spec.y})`);
      noteHead.setAttribute("fill", noteHeadFill);
      svg.appendChild(noteHead);

      const stem = createSvgElement("line");
      const stemUp = spec.y > staffTop + 2 * spacing;
      stem.setAttribute("x1", String(stemUp ? spec.x + noteHeadRx - 1 : spec.x - noteHeadRx + 1));
      stem.setAttribute("x2", String(stemUp ? spec.x + noteHeadRx - 1 : spec.x - noteHeadRx + 1));
      stem.setAttribute("y1", String(spec.y));
      stem.setAttribute("y2", String(stemUp ? spec.y - stemLength : spec.y + stemLength));
      stem.setAttribute("stroke", stemColor);
      stem.setAttribute("stroke-width", String(stemWidth));
      svg.appendChild(stem);

      if (spec.accidental) {
        const accidental = createSvgElement("text");
        let accidentalX = spec.x - accidentalDx;
        // In dual enharmonic rendering, keep the second flat close to its own notehead.
        if (noteSpecs.length > 1 && spec.accidental === "\u266D" && spec.index === 1) {
          accidentalX = spec.x - Math.max(8, accidentalDx - 10);
        }
        accidental.setAttribute("x", String(accidentalX));
        accidental.setAttribute("y", String(spec.y + accidentalDy));
        accidental.setAttribute("font-size", String(accidentalSize * 1.5));
        accidental.setAttribute("font-family", "serif");
        accidental.textContent = spec.accidental;
        svg.appendChild(accidental);
      }
    });

    return svg;
  }

  window.ClarinetStaffRenderer = {
    renderStaffSvg,
    getDisplayedSpellingVariants
  };
})();
