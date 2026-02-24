(function () {
  const FINGERING_VISUALS = {
  template: {
    imageUrl: "assets/clarinet-fingering-template.svg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Clarinet-fingering-template.svg",
    license: "CC0"
  },
  publicDomainChart: {
    imageUrl: "assets/clarinette-doigte.jpg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Clarinette_doigte.jpg",
    license: "Public domain"
  }
};

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

  const WFG_SOURCE_NOTES = "Source: Woodwind Fingering Guide (Boehm clarinet compact notation).";
  const WFG_OVERRIDE_DB = {
    52: { noteLabel: "E3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123E|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123|123E", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123E|123F", info: WFG_SOURCE_NOTES }
    ] },
    53: { noteLabel: "F3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|123F", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123F|123", info: WFG_SOURCE_NOTES }
    ] },
    54: { noteLabel: "F#3 / Gb3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123F#|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123|123F#", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123F#|123F", info: WFG_SOURCE_NOTES }
    ] },
    55: { noteLabel: "G3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|123", info: WFG_SOURCE_NOTES }
    ] },
    56: { noteLabel: "G#3 / Ab3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|123G#", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123G#|123", info: WFG_SOURCE_NOTES }
    ] },
    57: { noteLabel: "A3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|12-", info: WFG_SOURCE_NOTES }
    ] },
    58: { noteLabel: "A#3 / Bb3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|1--", info: WFG_SOURCE_NOTES }
    ] },
    59: { noteLabel: "B3", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|-2-", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123|1-B-", info: WFG_SOURCE_NOTES }
    ] },
    60: { noteLabel: "C4", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123|---", info: WFG_SOURCE_NOTES }
    ] },
    61: { noteLabel: "C#4 / Db4", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 123C#|---", info: WFG_SOURCE_NOTES }
    ] },
    62: { noteLabel: "D4", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 12-|---", info: WFG_SOURCE_NOTES }
    ] },
    63: { noteLabel: "D#4 / Eb4", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 12-^{Eb}|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 12-|_{4}---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 1--|1--", info: WFG_SOURCE_NOTES }
    ] },
    64: { noteLabel: "E4", fingerings: [
      { name: "Standard", type: "Primary", keys: "T 1--|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 1-3|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 1--|--3", info: WFG_SOURCE_NOTES }
    ] },
    65: { noteLabel: "F4", fingerings: [
      { name: "Standard", type: "Primary", keys: "T ---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T --3|---", info: WFG_SOURCE_NOTES }
    ] },
    66: { noteLabel: "F#4 / Gb4", fingerings: [
      { name: "Standard", type: "Primary", keys: "1--|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T ---|34---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 1-3|---", info: WFG_SOURCE_NOTES }
    ] },
    67: { noteLabel: "G4", fingerings: [
      { name: "Standard", type: "Primary", keys: "---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T ---|_{34}---", info: WFG_SOURCE_NOTES }
    ] },
    68: { noteLabel: "G#4 / Ab4", fingerings: [
      { name: "Standard", type: "Primary", keys: "G#---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "1--|1-B-", info: WFG_SOURCE_NOTES }
    ] },
    69: { noteLabel: "A4", fingerings: [
      { name: "Standard", type: "Primary", keys: "A---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "T 123C#|123", info: WFG_SOURCE_NOTES }
    ] },
    70: { noteLabel: "A#4 / Bb4", fingerings: [
      { name: "Standard", type: "Primary", keys: "R A---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "A---|2---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R 1--|---", info: WFG_SOURCE_NOTES }
    ] },
    71: { noteLabel: "B4", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123E|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123|123E", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123E|123F", info: WFG_SOURCE_NOTES }
    ] },
    72: { noteLabel: "C5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|123F", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123F|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123F#|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123F#|12-", info: WFG_SOURCE_NOTES }
    ] },
    73: { noteLabel: "C#5 / Db5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123F#|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123|123F#", info: WFG_SOURCE_NOTES }
    ] },
    74: { noteLabel: "D5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|123", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123|123G#", info: WFG_SOURCE_NOTES }
    ] },
    75: { noteLabel: "D#5 / Eb5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|123G#", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123G#|123", info: WFG_SOURCE_NOTES }
    ] },
    76: { noteLabel: "E5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|12-", info: WFG_SOURCE_NOTES }
    ] },
    77: { noteLabel: "F5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|1--", info: WFG_SOURCE_NOTES }
    ] },
    78: { noteLabel: "F#5 / Gb5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|-2-", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123C#|---", info: WFG_SOURCE_NOTES }
    ] },
    79: { noteLabel: "G5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 12-|12-", info: WFG_SOURCE_NOTES }
    ] },
    80: { noteLabel: "G#5 / Ab5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 123C#|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 12-|1--", info: WFG_SOURCE_NOTES }
    ] },
    81: { noteLabel: "A5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 12-|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 1--|1--", info: WFG_SOURCE_NOTES }
    ] },
    82: { noteLabel: "A#5 / Bb5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T 1--|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 1-3|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 1--|--3", info: WFG_SOURCE_NOTES }
    ] },
    83: { noteLabel: "B5", fingerings: [
      { name: "Standard", type: "Primary", keys: "R T ---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T --3|---", info: WFG_SOURCE_NOTES }
    ] },
    84: { noteLabel: "C6", fingerings: [
      { name: "Standard", type: "Primary", keys: "R ---|---", info: WFG_SOURCE_NOTES },
      { name: "Alt", type: "Alternate", keys: "R T 123|1-B-", info: WFG_SOURCE_NOTES }
    ] }
  };

  Object.keys(FINGERING_DB).forEach((midiKey) => {
    delete FINGERING_DB[midiKey];
  });
  Object.keys(WFG_OVERRIDE_DB).forEach((midiKey) => {
    FINGERING_DB[midiKey] = WFG_OVERRIDE_DB[midiKey];
  });

  function getVisualGuide(type) {
    return type === "Trill" ? FINGERING_VISUALS.publicDomainChart : FINGERING_VISUALS.template;
  }

  let templateSvgTextPromise = null;

  function loadTemplateSvgText() {
    if (!templateSvgTextPromise) {
      templateSvgTextPromise = fetch(FINGERING_VISUALS.template.imageUrl, { mode: "cors" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Template SVG fetch failed (${response.status})`);
          }
          return response.text();
        });
    }
    return templateSvgTextPromise;
  }

  function normalizeLabel(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function splitFingeringTokens(keysText) {
    return String(keysText || "")
      .split("+")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  const FINGERING_TOKENS = [
    "L:T",
    "L:R",
    "L:A",
    "L:1",
    "L:2",
    "L:3",
    "L:E",
    "L:F",
    "L:F#",
    "L:G#",
    "L:C#",
    "L:EB",
    "R:1",
    "R:2",
    "R:3",
    "R:AR1",
    "R:AR2",
    "R:AR3",
    "R:AR4",
    "R:E",
    "R:F",
    "R:F#",
    "R:G#",
    "R:B"
  ];

  const TOKEN_FIRST_SEEN_MIDI = {};
  FINGERING_TOKENS.forEach((token) => {
    TOKEN_FIRST_SEEN_MIDI[token] = null;
  });

  // Default mapping: canonical unique key names -> template layer labels.
  // This is intentionally editable by users in the layer mapping utility.
  const TEXT_TOKEN_TO_LAYER_LABELS = {
    "L:T": ["f1"],
    "L:R": ["register key"],
    "L:A": ["a1"],
    "L:1": ["fis1"],
    "L:2": ["d1"],
    "L:3": ["c1"],
    "L:E": ["e_left"],
    "L:F": ["f_left"],
    "L:F#": ["fis_left"],
    "L:G#": ["ais1"],
    "L:C#": ["cis1"],
    "L:EB": ["dis"],
    "R:1": ["bes"],
    "R:2": ["a"],
    "R:3": ["g"],
    "R:AR1": ["additional_right_4"],
    "R:AR2": ["additional_right_3"],
    "R:AR3": ["additional_right_2"],
    "R:AR4": ["additional_right_1"],
    "R:E": ["e"],
    "R:F": ["f"],
    "R:F#": ["fis"],
    "R:G#": ["gis"],
    "R:B": ["ais"]
  };
  const TEXT_TOKEN_LAYER_MAPPING_STORAGE_KEY = "clarinet_text_token_layer_mapping_v1";

  // Explicit mapping database: 24-key clarinet model -> template layer label(s).
  const KEY_TO_LAYER_LABELS = {
    thumb_hole: ["fis1", "f1"],
    register_key: ["register key"],
    lh1_hole: ["d1"],
    lh1_ring: ["d1"],
    lh2_hole: ["cis1"],
    lh2_ring: ["cis1"],
    lh3_hole: ["c1"],
    lh3_ring: ["c1"],
    rh1_hole: ["a"],
    rh1_ring: ["a"],
    rh2_hole: ["g"],
    rh2_ring: ["g"],
    rh3_hole: ["fis"],
    rh3_ring: ["fis"],
    lh_pinky_eb: ["e_left"],
    lh_pinky_fc: ["f_left"],
    lh_pinky_fsharp: ["fis_left"],
    rh_pinky_eb: ["e"],
    rh_pinky_fc: ["f"],
    rh_pinky_fsharp: ["fis"],
    bis_key: ["ais"],
    side_c_key: ["cis1"],
    side_eb_key: ["dis"],
    trill_key: ["a1"]
  };
  const LAYER_MAPPING_STORAGE_KEY = "clarinet_layer_mapping_v1";

  // Explicit parsing database: text tokens -> logical clarinet keys.
  const KEY_ALIASES = [
    { keyId: "lh1_hole", tokens: ["lh1", "firstfinger", "leftindex"] },
    { keyId: "lh2_hole", tokens: ["lh2"] },
    { keyId: "lh3_hole", tokens: ["lh3"] },
    { keyId: "rh1_hole", tokens: ["rh1"] },
    { keyId: "rh2_hole", tokens: ["rh2"] },
    { keyId: "rh3_hole", tokens: ["rh3"] },
    { keyId: "thumb_hole", tokens: ["thumb"] },
    { keyId: "register_key", tokens: ["register"] },
    { keyId: "side_c_key", tokens: ["sideckey"] },
    { keyId: "side_eb_key", tokens: ["sideeb", "sidebb", "side"] },
    { keyId: "bis_key", tokens: ["bis"] },
    { keyId: "trill_key", tokens: ["trill"] },
    { keyId: "lh_pinky_eb", tokens: ["ebkey", "pinkyeb", "eb"] },
    { keyId: "lh_pinky_fc", tokens: ["fckey", "pinkyfc", "f/ckey"] },
    { keyId: "rh_pinky_fsharp", tokens: ["fsharpcsharp", "fsharpc", "f#/c#"] }
  ];

  function parseKeyIdsFromText(keysText) {
    const text = normalizeLabel(keysText);
    const keyIds = new Set();

    KEY_ALIASES.forEach((entry) => {
      if (entry.tokens.some((token) => text.includes(token))) {
        keyIds.add(entry.keyId);
      }
    });

    // Promote hole detections to corresponding ring keys in 24-key model.
    if (keyIds.has("lh1_hole")) keyIds.add("lh1_ring");
    if (keyIds.has("lh2_hole")) keyIds.add("lh2_ring");
    if (keyIds.has("lh3_hole")) keyIds.add("lh3_ring");
    if (keyIds.has("rh1_hole")) keyIds.add("rh1_ring");
    if (keyIds.has("rh2_hole")) keyIds.add("rh2_ring");
    if (keyIds.has("rh3_hole")) keyIds.add("rh3_ring");

    return keyIds;
  }

  function buildFingeringKeyIndex() {
    const index = {};
    Object.keys(FINGERING_DB).forEach((midiKey) => {
      const midi = Number(midiKey);
      const entry = FINGERING_DB[midi];
      index[midi] = entry.fingerings.map((fingering) => {
        const keyIds = Array.from(parseKeyIdsFromText(fingering.keys));
        // Keep parsed keys directly on object to avoid reparsing at render time.
        fingering.keyIds = keyIds;
        return {
          name: fingering.name,
          keyIds
        };
      });
    });
    return index;
  }

  const FINGERING_KEY_INDEX = buildFingeringKeyIndex();
  let activeLayerMapping = { ...KEY_TO_LAYER_LABELS };
  let activeTextTokenLayerMapping = { ...TEXT_TOKEN_TO_LAYER_LABELS };
  let normalizedTextTokenLayerMapping = {};

  function buildNormalizedTokenMapping(mapping) {
    const out = {};
    Object.keys(mapping || {}).forEach((token) => {
      const normalized = normalizeLabel(token);
      if (!normalized) {
        return;
      }
      const labels = Array.isArray(mapping[token]) ? mapping[token] : [];
      out[normalized] = labels
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0);
    });
    return out;
  }

  function sanitizeLayerMapping(raw) {
    if (!raw || typeof raw !== "object") {
      return {};
    }

    const sanitized = {};
    Object.keys(KEY_TO_LAYER_LABELS).forEach((keyId) => {
      const value = raw[keyId];
      if (!Array.isArray(value)) {
        return;
      }
      const labels = value
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0);
      if (labels.length > 0) {
        sanitized[keyId] = Array.from(new Set(labels));
      }
    });
    return sanitized;
  }

  function sanitizeTextTokenLayerMapping(raw) {
    if (!raw || typeof raw !== "object") {
      return {};
    }

    const sanitized = {};
    FINGERING_TOKENS.forEach((token) => {
      if (!Object.prototype.hasOwnProperty.call(raw, token)) {
        return;
      }
      const value = Array.isArray(raw[token]) ? raw[token] : [];
      const labels = value
        .map((item) => String(item || "").trim())
        .filter((item) => item.length > 0);
      // Keep explicit empty arrays: they intentionally override defaults to "no pressed layer".
      sanitized[token] = Array.from(new Set(labels));
    });
    return sanitized;
  }

  function readLayerMappingOverride() {
    try {
      const raw = localStorage.getItem(LAYER_MAPPING_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return sanitizeLayerMapping(parsed);
    } catch {
      return {};
    }
  }

  function readTextTokenLayerMappingOverride() {
    try {
      const raw = localStorage.getItem(TEXT_TOKEN_LAYER_MAPPING_STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return sanitizeTextTokenLayerMapping(parsed);
    } catch {
      return {};
    }
  }

  function refreshLayerMappingOverride() {
    const override = readLayerMappingOverride();
    activeLayerMapping = { ...KEY_TO_LAYER_LABELS, ...override };
    return activeLayerMapping;
  }

  function refreshTextTokenLayerMappingOverride() {
    const override = readTextTokenLayerMappingOverride();
    activeTextTokenLayerMapping = { ...TEXT_TOKEN_TO_LAYER_LABELS, ...override };
    normalizedTextTokenLayerMapping = buildNormalizedTokenMapping(activeTextTokenLayerMapping);
    return activeTextTokenLayerMapping;
  }

  function writeLayerMappingOverride(mapping) {
    const sanitized = sanitizeLayerMapping(mapping);
    localStorage.setItem(LAYER_MAPPING_STORAGE_KEY, JSON.stringify(sanitized));
    refreshLayerMappingOverride();
  }

  function writeTextTokenLayerMappingOverride(mapping) {
    const sanitized = sanitizeTextTokenLayerMapping(mapping);
    localStorage.setItem(TEXT_TOKEN_LAYER_MAPPING_STORAGE_KEY, JSON.stringify(sanitized));
    refreshTextTokenLayerMappingOverride();
  }

  function clearLayerMappingOverride() {
    localStorage.removeItem(LAYER_MAPPING_STORAGE_KEY);
    refreshLayerMappingOverride();
  }

  function clearTextTokenLayerMappingOverride() {
    localStorage.removeItem(TEXT_TOKEN_LAYER_MAPPING_STORAGE_KEY);
    refreshTextTokenLayerMappingOverride();
  }

  refreshLayerMappingOverride();
  refreshTextTokenLayerMappingOverride();

  function getMappedLayerLabelsForUniqueKey(uniqueKey) {
    const labels = activeTextTokenLayerMapping[uniqueKey];
    if (!Array.isArray(labels)) {
      return [];
    }
    return labels.slice();
  }

  function normalizeNoteToken(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/\u266f/g, "#")
      .replace(/\u266d/g, "b")
      .toUpperCase();
  }

  function buildNoteNameIndex() {
    const noteToMidi = {};
    Object.keys(FINGERING_DB).forEach((midiKey) => {
      const midi = Number(midiKey);
      const entry = FINGERING_DB[midi];
      const variants = String(entry.noteLabel || "")
        .split("/")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      variants.forEach((variant) => {
        noteToMidi[normalizeNoteToken(variant)] = midi;
      });

      if (window.ClarinetCore && typeof window.ClarinetCore.midiToName === "function") {
        const written = window.ClarinetCore.midiToName(midi, true);
        noteToMidi[normalizeNoteToken(written)] = midi;
      }
    });
    return noteToMidi;
  }

  const NOTE_NAME_TO_MIDI = buildNoteNameIndex();

  function resolveNoteTokenToMidi(token, currentMidi = null) {
    const normalized = normalizeNoteToken(token);
    if (!normalized) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(NOTE_NAME_TO_MIDI, normalized)) {
      return NOTE_NAME_TO_MIDI[normalized];
    }

    const withoutOctaveMatch = normalized.match(/^([A-G])(#|B)?$/);
    if (!withoutOctaveMatch) {
      return null;
    }

    const root = `${withoutOctaveMatch[1]}${withoutOctaveMatch[2] || ""}`;
    const candidates = Object.keys(NOTE_NAME_TO_MIDI)
      .filter((name) => name.startsWith(root) && /\d+$/.test(name))
      .map((name) => NOTE_NAME_TO_MIDI[name]);
    const unique = Array.from(new Set(candidates));
    if (unique.length === 0) {
      return null;
    }

    if (Number.isFinite(currentMidi)) {
      unique.sort((a, b) => {
        const distanceA = Math.abs(a - currentMidi);
        const distanceB = Math.abs(b - currentMidi);
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
        return b - a;
      });
      return unique[0];
    }

    unique.sort((a, b) => a - b);
    return unique[Math.floor(unique.length / 2)];
  }

  function mapLegacyKeyIdToSymbolToken(keyId) {
    const map = {
      thumb_hole: "L:T",
      register_key: "L:R",
      lh1_hole: "L:1",
      lh1_ring: "L:1",
      lh2_hole: "L:2",
      lh2_ring: "L:2",
      lh3_hole: "L:3",
      lh3_ring: "L:3",
      rh1_hole: "R:1",
      rh1_ring: "R:1",
      rh2_hole: "R:2",
      rh2_ring: "R:2",
      rh3_hole: "R:3",
      rh3_ring: "R:3",
      lh_pinky_eb: "L:E",
      rh_pinky_eb: "R:E",
      lh_pinky_fc: "L:F",
      rh_pinky_fc: "R:F",
      lh_pinky_fsharp: "L:F#",
      rh_pinky_fsharp: "R:F#",
      bis_key: "R:B",
      side_c_key: "L:C#",
      side_eb_key: "L:EB",
      trill_key: "L:A"
    };
    return map[keyId] || null;
  }

  function normalizeWfgNotationText(text) {
    return String(text || "")
      .replace(/[–—−]/g, "-")
      .replace(/[♯]/g, "#")
      .replace(/[♭]/g, "b");
  }

  function normalizeWfgExtraToken(token) {
    const raw = String(token || "").trim().toUpperCase();
    if (!raw) {
      return "";
    }
    if (raw === "D#" || raw === "EB") return "EB";
    if (raw === "A#" || raw === "BB") return "B";
    if (raw === "G#" || raw === "F#" || raw === "E" || raw === "F" || raw === "B") return raw;
    return raw;
  }

  function addWfgSymbolToken(side, symbol, outSet) {
    const normalized = normalizeWfgExtraToken(symbol);
    if (!normalized) {
      return;
    }
    const token = `${side}:${normalized}`;
    if (FINGERING_TOKENS.includes(token)) {
      outSet.add(token);
    }
  }

  function parseWfgNotationToTokens(notation) {
    const normalized = normalizeWfgNotationText(notation);
    if (!normalized.includes("|")) {
      return [];
    }
    const [leftRaw, rightRaw] = normalized.split("|");
    const outSet = new Set();

    function collectSide(sideRaw, side) {
      let segment = String(sideRaw || "").toUpperCase();
      segment = segment.replace(/~/g, "");

      const extraMatches = Array.from(segment.matchAll(/[\^_]\{([^}]+)\}/g));
      extraMatches.forEach((match) => {
        const chunk = String(match[1] || "");
        chunk.split(/[\s,]+/).forEach((part) => {
          if (!part) {
            return;
          }
          if (/^\d+$/.test(part) && side === "R") {
            part.split("").forEach((digit) => {
              if (["1", "2", "3", "4"].includes(digit)) {
                outSet.add(`R:AR${digit}`);
              }
            });
            return;
          }
          addWfgSymbolToken(side, part, outSet);
        });
      });

      segment = segment.replace(/[\^_]\{[^}]+\}/g, "");

      if (side === "L") {
        if (segment.includes("T")) outSet.add("L:T");
        if (segment.includes("R")) outSet.add("L:R");
        if (segment.includes("A")) outSet.add("L:A");
      }

      if (segment.includes("1")) outSet.add(`${side}:1`);
      if (segment.includes("2")) outSet.add(`${side}:2`);
      if (segment.includes("3")) outSet.add(`${side}:3`);

      const bareTokens = segment.match(/[A-G](?:#|B)?/g) || [];
      bareTokens.forEach((part) => addWfgSymbolToken(side, part, outSet));
    }

    collectSide(leftRaw, "L");
    collectSide(rightRaw, "R");

    return Array.from(outSet);
  }

  function resolveKeysTextToLayerLabels(keysText) {
    const layers = new Set();

    const wfgTokens = parseWfgNotationToTokens(keysText);
    if (wfgTokens.length > 0) {
      wfgTokens.forEach((token) => {
        const mappedLabels = getMappedLayerLabelsForUniqueKey(token);
        mappedLabels.forEach((label) => {
          if (label) {
            layers.add(label);
          }
        });
      });
      if (layers.size > 0) {
        return layers;
      }
    }

    const fallbackKeyIds = parseKeyIdsFromText(keysText);
    fallbackKeyIds.forEach((keyId) => {
      const mappedToken = mapLegacyKeyIdToSymbolToken(keyId);
      if (!mappedToken) {
        return;
      }
      const mappedLabels = getMappedLayerLabelsForUniqueKey(mappedToken);
      mappedLabels.forEach((label) => {
        if (label) {
          layers.add(label);
        }
      });
    });
    return layers;
  }

  function inferTextTokenLayerMappingFromLabels(availableLabels) {
    const normalizedAvailable = new Set((availableLabels || []).map((label) => normalizeLabel(label)));
    const has = (label) => normalizedAvailable.has(normalizeLabel(label));
    const pick = (...labels) => labels.filter((label) => has(label));

    const mapping = {};
    FINGERING_TOKENS.forEach((token) => {
      mapping[token] = [];
    });

    mapping["L:T"] = pick("f1");
    mapping["L:R"] = pick("register key");
    mapping["L:A"] = pick("a1");
    mapping["L:1"] = pick("fis1");
    mapping["L:2"] = pick("d1");
    mapping["L:3"] = pick("c1");
    mapping["L:E"] = pick("e_left");
    mapping["L:F"] = pick("f_left");
    mapping["L:F#"] = pick("fis_left");
    mapping["L:G#"] = pick("ais1");
    mapping["L:C#"] = pick("cis1");
    mapping["L:EB"] = pick("dis");
    mapping["R:1"] = pick("bes");
    mapping["R:2"] = pick("a");
    mapping["R:3"] = pick("g");
    mapping["R:AR1"] = pick("additional_right_4");
    mapping["R:AR2"] = pick("additional_right_3");
    mapping["R:AR3"] = pick("additional_right_2");
    mapping["R:AR4"] = pick("additional_right_1");
    mapping["R:E"] = pick("e");
    mapping["R:F"] = pick("f");
    mapping["R:F#"] = pick("fis");
    mapping["R:G#"] = pick("gis");
    mapping["R:B"] = pick("ais");

    return sanitizeTextTokenLayerMapping(mapping);
  }

  function setLayerVisibility(layer, visible) {
    const style = layer.getAttribute("style") || "";
    const parts = style
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !part.startsWith("display:"));
    parts.push(`display:${visible ? "inline" : "none"}`);
    layer.setAttribute("style", parts.join(";"));
  }

  function getRequestedLayerLabelsFromKeys(keysSource, options = {}) {
    if (typeof keysSource === "string") {
      const resolved = resolveKeysTextToLayerLabels(keysSource, { writtenMidi: options.writtenMidi });
      if (resolved.size > 0) {
        return resolved;
      }
    }

    const layers = new Set();
    const keyIds = Array.isArray(keysSource)
      ? new Set(keysSource)
      : parseKeyIdsFromText(keysSource);
    keyIds.forEach((keyId) => {
      const layerLabels = activeLayerMapping[keyId] || [];
      layerLabels.forEach((label) => layers.add(label));
    });

    return layers;
  }

  async function buildLayeredTemplateSvg(fingering, options = {}) {
    const svgText = await loadTemplateSvgText();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const sourceSvg = doc.querySelector("svg");
    if (!sourceSvg) {
      return null;
    }

    const layers = Array.from(sourceSvg.querySelectorAll("g")).filter((group) => (
      group.getAttribute("inkscape:groupmode") === "layer" || group.getAttribute("groupmode") === "layer"
    ));
    if (layers.length === 0) {
      return null;
    }

    const selectedLayerIds = new Set();
    const labelsToEnable = getRequestedLayerLabelsFromKeys(fingering.keys || fingering.keyIds, {
      writtenMidi: options.writtenMidi
    });

    layers.forEach((layer) => {
      const id = layer.getAttribute("id");
      const label = layer.getAttribute("inkscape:label") || "";
      if (!id) {
        return;
      }
      if (labelsToEnable.has(label)) {
        selectedLayerIds.add(id);
      }
    });

    if (selectedLayerIds.size === 0) {
      return null;
    }

    const outSvg = sourceSvg.cloneNode(true);
    const outLayers = Array.from(outSvg.querySelectorAll("g")).filter((group) => (
      group.getAttribute("inkscape:groupmode") === "layer" || group.getAttribute("groupmode") === "layer"
    ));

    outLayers.forEach((layer) => {
      const id = layer.getAttribute("id");
      if (selectedLayerIds.has(id)) {
        setLayerVisibility(layer, true);
      } else {
        setLayerVisibility(layer, false);
      }
    });

    outSvg.classList.add("fingering-inline-svg");
    outSvg.classList.add("fingering-overlay-svg");
    if (!outSvg.getAttribute("viewBox")) {
      const width = parseFloat(outSvg.getAttribute("width") || "0");
      const height = parseFloat(outSvg.getAttribute("height") || "0");
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        outSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }
    }
    return outSvg;
  }

  async function tryApplyTemplateLayers(frame, fingering, options = {}) {
    try {
      const inlineSvg = await buildLayeredTemplateSvg(fingering, options);
      if (!inlineSvg) {
        return;
      }
      const existing = frame.querySelector(".fingering-overlay-svg");
      if (existing) {
        existing.remove();
      }
      frame.appendChild(inlineSvg);
      frame.classList.add("fingering-layered");
    } catch {
      // Keep base image if layer-based rendering cannot be resolved.
    }
  }

  function buildVisualFrame(fingering, visualGuide, showHoleOverlay, options = {}) {
    const frame = document.createElement("div");
    frame.className = "fingering-image-frame";

    const image = document.createElement("img");
    image.src = visualGuide.imageUrl;
    image.alt = `${fingering.name} fingering visual guide`;
    image.loading = "lazy";

    frame.appendChild(image);

    if (showHoleOverlay && visualGuide === FINGERING_VISUALS.template) {
      tryApplyTemplateLayers(frame, fingering, options);
    }

    return frame;
  }

  function buildVisualFigure(fingering, visualGuide, showHoleOverlay, options = {}) {
    const visual = document.createElement("figure");
    visual.className = "fingering-visual";
    const frame = buildVisualFrame(fingering, visualGuide, showHoleOverlay, options);
    const caption = document.createElement("figcaption");
    caption.innerHTML = `Visual guide: <a href="${visualGuide.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> (${visualGuide.license}).`;
    visual.appendChild(frame);
    visual.appendChild(caption);
    return visual;
  }

  function renderFingeringVisualFrame(fingering, options = {}) {
    const visualGuide = options.visualGuide || getVisualGuide(fingering.type);
    const showHoleOverlay = options.showHoleOverlay !== false;
    return buildVisualFrame(fingering, visualGuide, showHoleOverlay, options);
  }

  function renderFingeringCard(fingering, options = {}) {
    const compact = Boolean(options.compact);
    const showVisual = options.showVisual !== false;
    const compactShowImage = Boolean(options.compactShowImage);
    const horizontal = Boolean(options.horizontal);
    const hideKeys = Boolean(options.hideKeys);
    const showHoleOverlay = Boolean(options.showHoleOverlay);
    const card = document.createElement("article");
    card.className = "fingering-card";
    if (compact) {
      card.classList.add("fingering-card-compact");
    }
    if (horizontal) {
      card.classList.add("fingering-card-horizontal");
    }

    const title = document.createElement("h3");
    title.textContent = fingering.name;

    const type = document.createElement("p");
    type.innerHTML = `<strong>Type:</strong> ${fingering.type}`;

    const info = document.createElement("p");
    info.innerHTML = `<strong>Info:</strong> ${fingering.info}`;
    const content = document.createElement("div");
    content.className = "fingering-content";
    content.appendChild(title);
    content.appendChild(type);
    if (!hideKeys) {
      const keys = document.createElement("p");
      keys.innerHTML = `<strong>Keys:</strong> ${fingering.keys}`;
      content.appendChild(keys);
    }
    content.appendChild(info);

    if (showVisual) {
      const visualGuide = getVisualGuide(fingering.type);
      if (compact && !compactShowImage) {
        const guide = document.createElement("p");
        guide.className = "fingering-guide-link";
        guide.innerHTML = `Guide: <a href="${visualGuide.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> (${visualGuide.license}).`;
        content.appendChild(guide);
      } else {
        const visual = buildVisualFigure(fingering, visualGuide, showHoleOverlay, options);
        if (horizontal) {
          card.appendChild(visual);
          card.appendChild(content);
          return card;
        }
        card.appendChild(content);
        card.appendChild(visual);
        return card;
      }
    }

    card.appendChild(content);
    return card;
  }

  function getReferenceHtml() {
    return [
      `Fingering data: <a href="https://www.wfg.woodwind.org/clarinet/" target="_blank" rel="noopener noreferrer">Woodwind Fingering Guide (clarinet)</a>`,
      `Primary/Alternate chart: <a href="${FINGERING_VISUALS.template.sourceUrl}" target="_blank" rel="noopener noreferrer">Clarinet-fingering-template.svg</a> (${FINGERING_VISUALS.template.license})`,
      `Trill/convention chart: <a href="${FINGERING_VISUALS.publicDomainChart.sourceUrl}" target="_blank" rel="noopener noreferrer">Clarinette doigte.jpg</a> (${FINGERING_VISUALS.publicDomainChart.license})`
    ].join(" · ");
  }

  function getEntries() {
    return Object.keys(FINGERING_DB)
      .map((midi) => Number(midi))
      .sort((a, b) => a - b)
      .map((midi) => ({ writtenMidi: midi, ...FINGERING_DB[midi] }));
  }

  window.ClarinetFingerings = {
    visuals: FINGERING_VISUALS,
    db: FINGERING_DB,
    layerMappingStorageKey: LAYER_MAPPING_STORAGE_KEY,
    textTokenLayerMappingStorageKey: TEXT_TOKEN_LAYER_MAPPING_STORAGE_KEY,
    keyToLayerLabels: KEY_TO_LAYER_LABELS,
    textTokenToLayerLabels: TEXT_TOKEN_TO_LAYER_LABELS,
    keyAliases: KEY_ALIASES,
    fingeringKeyIndex: FINGERING_KEY_INDEX,
    getFingeringTokens() {
      return FINGERING_TOKENS.slice();
    },
    getFingeringTokenFirstSeenMidi() {
      return { ...TOKEN_FIRST_SEEN_MIDI };
    },
    inferTextTokenLayerMappingFromLabels,
    getEntries,
    getVisualGuide,
    renderFingeringVisualFrame,
    parseKeyIdsFromText,
    getActiveLayerMapping() {
      return { ...activeLayerMapping };
    },
    getActiveTextTokenLayerMapping() {
      return { ...activeTextTokenLayerMapping };
    },
    readLayerMappingOverride,
    readTextTokenLayerMappingOverride,
    writeLayerMappingOverride,
    writeTextTokenLayerMappingOverride,
    clearLayerMappingOverride,
    clearTextTokenLayerMappingOverride,
    refreshLayerMappingOverride,
    refreshTextTokenLayerMappingOverride,
    resolveKeysTextToLayerLabels,
    getEntry(writtenMidi) {
      return FINGERING_DB[writtenMidi] || null;
    },
    renderFingeringCard,
    getReferenceHtml
  };
})();
