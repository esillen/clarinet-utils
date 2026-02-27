(function () {
  const VF = window.Vex && window.Vex.Flow;
  const DEFAULT_NOTE_COLOR = "#000000";
  const NOTE_COLORS = {
    correct: "#0f7c62",
    toPlay: "#1e3a66",
    incorrect: "#c23f4d",
    neutral: DEFAULT_NOTE_COLOR
  };

  const SCALE_KEY_SIGNATURE = {
    C_MAJOR: "C",
    G_MAJOR: "G",
    D_MAJOR: "D",
    A_MAJOR: "A",
    E_MAJOR: "E",
    B_MAJOR: "B",
    F_SHARP_MAJOR: "F#",
    C_SHARP_MAJOR: "C#",
    F_MAJOR: "F",
    BB_MAJOR: "Bb",
    EB_MAJOR: "Eb",
    AB_MAJOR: "Ab",
    DB_MAJOR: "Db",
    GB_MAJOR: "Gb",
    CB_MAJOR: "Cb",
    A_MINOR: "Am",
    E_MINOR: "Em",
    B_MINOR: "Bm",
    F_SHARP_MINOR: "F#m",
    C_SHARP_MINOR: "C#m",
    G_SHARP_MINOR: "G#m",
    D_SHARP_MINOR: "D#m",
    A_SHARP_MINOR: "A#m",
    D_MINOR: "Dm",
    G_MINOR: "Gm",
    C_MINOR: "Cm",
    F_MINOR: "Fm",
    BB_MINOR: "Bbm",
    EB_MINOR: "Ebm",
    AB_MINOR: "Abm",
    CHROMATIC: null
  };

  function preferFlatsForScale(scale) {
    const key = String(scale || "CHROMATIC").toUpperCase();
    const sharpScales = new Set([
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
    return !sharpScales.has(key);
  }

  function getScaleKeySignature(scale) {
    const key = String(scale || "CHROMATIC").toUpperCase();
    return SCALE_KEY_SIGNATURE[key] !== undefined ? SCALE_KEY_SIGNATURE[key] : null;
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

  function parseNoteName(noteName) {
    const match = String(noteName || "").trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
    if (!match) {
      return null;
    }
    return {
      letter: match[1].toUpperCase(),
      accidental: match[2] || "",
      octave: Number(match[3])
    };
  }

  function midiToNoteName(midi, scale, explicitSpelling) {
    if (explicitSpelling) {
      const parsed = parseNoteName(explicitSpelling);
      if (parsed) {
        return parsed;
      }
    }
    const preferFlats = preferFlatsForScale(scale);
    const name = window.ClarinetCore.midiToName(midi, preferFlats);
    return parseNoteName(name);
  }

  function signatureAccidentalMap(signature) {
    const map = {};
    const sharps = ["F", "C", "G", "D", "A", "E", "B"];
    const flats = ["B", "E", "A", "D", "G", "C", "F"];
    const table = {
      C: 0,
      G: 1,
      D: 2,
      A: 3,
      E: 4,
      B: 5,
      "F#": 6,
      "C#": 7,
      F: -1,
      Bb: -2,
      Eb: -3,
      Ab: -4,
      Db: -5,
      Gb: -6,
      Cb: -7,
      Am: 0,
      Em: 1,
      Bm: 2,
      "F#m": 3,
      "C#m": 4,
      "G#m": 5,
      "D#m": 6,
      "A#m": 7,
      Dm: -1,
      Gm: -2,
      Cm: -3,
      Fm: -4,
      Bbm: -5,
      Ebm: -6,
      Abm: -7
    };
    const count = table[signature] || 0;
    if (count > 0) {
      for (let i = 0; i < count; i += 1) {
        map[sharps[i]] = "#";
      }
    } else if (count < 0) {
      for (let i = 0; i < Math.abs(count); i += 1) {
        map[flats[i]] = "b";
      }
    }
    return map;
  }

  function createStaveNote(note, scale, keySignature, noteColor) {
    const midi = Number(note.writtenMidi !== undefined ? note.writtenMidi : note);
    const explicitSpelling = Array.isArray(note.spellings) && note.spellings.length > 0
      ? note.spellings[0]
      : (note.spelling || null);
    const parsed = midiToNoteName(midi, scale, explicitSpelling);
    if (!parsed) {
      return null;
    }
    const key = `${parsed.letter.toLowerCase()}/${parsed.octave}`;
    const staveNote = new VF.StaveNote({
      keys: [key],
      duration: "q",
      clef: "treble"
    });

    const signatureMap = signatureAccidentalMap(keySignature);
    if (parsed.accidental) {
      if (signatureMap[parsed.letter] !== parsed.accidental) {
        staveNote.addModifier(new VF.Accidental(parsed.accidental), 0);
      }
    } else if (signatureMap[parsed.letter]) {
      staveNote.addModifier(new VF.Accidental("n"), 0);
    }

    const fill = note.fill || noteColor || DEFAULT_NOTE_COLOR;
    staveNote.setStyle({
      fillStyle: fill,
      strokeStyle: fill
    });
    staveNote.setStemStyle({ strokeStyle: note.stemColor || fill });
    staveNote.setLedgerLineStyle({ strokeStyle: note.stemColor || fill });

    if (note.visible === false) {
      staveNote.setStyle({ fillStyle: "transparent", strokeStyle: "transparent" });
      staveNote.setStemStyle({ strokeStyle: "transparent" });
      staveNote.setLedgerLineStyle({ strokeStyle: "transparent" });
    }

    return staveNote;
  }

  function renderNoteSequenceSvg(options = {}) {
    const width = Number(options.width) || 360;
    const height = Number(options.height) || 190;
    const scale = options.scale || "CHROMATIC";
    const notes = Array.isArray(options.notes) ? options.notes : [];
    const noteColor = options.noteHeadFill || options.noteColor || DEFAULT_NOTE_COLOR;
    const keySignature = getScaleKeySignature(scale);

    if (!VF) {
      const fallback = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      fallback.setAttribute("viewBox", `0 0 ${width} ${height}`);
      fallback.setAttribute("class", options.className || "staff-svg");
      return fallback;
    }

    const host = document.createElement("div");
    const renderer = new VF.Renderer(host, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont("Avenir Next, sans-serif", 10, "");

    const paddingX = Math.max(12, Math.round(width * 0.02));
    const stave = new VF.Stave(paddingX, Math.round(height * 0.22), Math.max(20, width - paddingX * 2));
    stave.addClef("treble");
    if (keySignature) {
      stave.addKeySignature(keySignature);
    }
    stave.setContext(context).draw();

    const defaultNote = { writtenMidi: 67, fill: NOTE_COLORS.neutral, stemColor: NOTE_COLORS.neutral };
    const workingNotes = notes.length > 0 ? notes : [defaultNote];
    const staveNotes = workingNotes
      .map((note) => createStaveNote(note, scale, keySignature, noteColor))
      .filter(Boolean);

    const voice = new VF.Voice({ num_beats: staveNotes.length || 1, beat_value: 4 });
    if (staveNotes.length === 0) {
      const empty = createStaveNote(defaultNote, scale, keySignature, noteColor);
      voice.addTickables([empty]);
    } else {
      voice.addTickables(staveNotes);
    }

    new VF.Formatter().joinVoices([voice]).format([voice], Math.max(20, stave.getWidth() - 24));
    voice.draw(context, stave);

    const svg = host.querySelector("svg");
    if (svg) {
      svg.setAttribute("class", options.className || "staff-svg");
      svg.setAttribute("preserveAspectRatio", "xMinYMid meet");
      return svg;
    }
    return document.createElementNS("http://www.w3.org/2000/svg", "svg");
  }

  window.ClarinetVexRenderer = {
    renderNoteSequenceSvg,
    getDisplayedSpellingVariants,
    preferFlatsForScale,
    NOTE_COLORS
  };
})();
