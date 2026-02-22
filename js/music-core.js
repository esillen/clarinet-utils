(function () {
  const STORAGE_KEY = "clarinet_tuning";
  const TUNING_OFFSETS = {
    Bb: 2,
    A: 3,
    C: 0
  };

  const NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  const SCALES = {
    C_MAJOR: { label: "C Major", root: 0, intervals: [0, 2, 4, 5, 7, 9, 11] },
    G_MAJOR: { label: "G Major", root: 7, intervals: [0, 2, 4, 5, 7, 9, 11] },
    D_MAJOR: { label: "D Major", root: 2, intervals: [0, 2, 4, 5, 7, 9, 11] },
    A_MAJOR: { label: "A Major", root: 9, intervals: [0, 2, 4, 5, 7, 9, 11] },
    F_MAJOR: { label: "F Major", root: 5, intervals: [0, 2, 4, 5, 7, 9, 11] },
    BB_MAJOR: { label: "B♭ Major", root: 10, intervals: [0, 2, 4, 5, 7, 9, 11] },
    A_MINOR: { label: "A Minor", root: 9, intervals: [0, 2, 3, 5, 7, 8, 10] },
    CHROMATIC: { label: "Chromatic", root: 0, intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
  };

  function readTuning(defaultValue = "Bb") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TUNING_OFFSETS[saved] !== undefined) {
      return saved;
    }
    localStorage.setItem(STORAGE_KEY, defaultValue);
    return defaultValue;
  }

  function writeTuning(value) {
    if (TUNING_OFFSETS[value] === undefined) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, value);
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

  function midiToName(midi, preferFlats = true) {
    const octave = Math.floor(midi / 12) - 1;
    const pitchClass = midi % 12;
    const names = preferFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP;
    return `${names[pitchClass]}${octave}`;
  }

  function centsOff(freq, midi) {
    return Math.round(1200 * Math.log2(freq / midiToFreq(midi)));
  }

  window.ClarinetCore = {
    STORAGE_KEY,
    TUNING_OFFSETS,
    NOTE_NAMES_SHARP,
    NOTE_NAMES_FLAT,
    SCALES,
    readTuning,
    writeTuning,
    midiToFreq,
    freqToMidi,
    freqToMidiFloat,
    midiToName,
    centsOff
  };
})();
