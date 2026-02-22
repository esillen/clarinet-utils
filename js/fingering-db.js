(function () {
const FINGERING_VISUALS = {
  template: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Clarinet-fingering-template.svg",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Clarinet-fingering-template.svg",
    license: "CC0"
  },
  publicDomainChart: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Clarinette_doigte.jpg",
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

  function getVisualGuide(type) {
    return type === "Trill" ? FINGERING_VISUALS.publicDomainChart : FINGERING_VISUALS.template;
  }

  function renderFingeringCard(fingering, options = {}) {
    const compact = Boolean(options.compact);
    const showVisual = options.showVisual !== false;
    const card = document.createElement("article");
    card.className = "fingering-card";
    if (compact) {
      card.classList.add("fingering-card-compact");
    }

    const title = document.createElement("h3");
    title.textContent = fingering.name;

    const type = document.createElement("p");
    type.innerHTML = `<strong>Type:</strong> ${fingering.type}`;

    const keys = document.createElement("p");
    keys.innerHTML = `<strong>Keys:</strong> ${fingering.keys}`;

    const info = document.createElement("p");
    info.innerHTML = `<strong>Info:</strong> ${fingering.info}`;

    card.appendChild(title);
    card.appendChild(type);
    card.appendChild(keys);
    card.appendChild(info);

    if (showVisual) {
      const visualGuide = getVisualGuide(fingering.type);
      if (compact) {
        const guide = document.createElement("p");
        guide.className = "fingering-guide-link";
        guide.innerHTML = `Guide: <a href="${visualGuide.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> (${visualGuide.license}).`;
        card.appendChild(guide);
      } else {
        const visual = document.createElement("figure");
        visual.className = "fingering-visual";

        const image = document.createElement("img");
        image.src = visualGuide.imageUrl;
        image.alt = `${fingering.name} fingering visual guide`;
        image.loading = "lazy";

        const caption = document.createElement("figcaption");
        caption.innerHTML = `Visual guide: <a href="${visualGuide.sourceUrl}" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> (${visualGuide.license}).`;

        visual.appendChild(image);
        visual.appendChild(caption);
        card.appendChild(visual);
      }
    }

    return card;
  }

  function getReferenceHtml() {
    return [
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
    getEntries,
    getEntry(writtenMidi) {
      return FINGERING_DB[writtenMidi] || null;
    },
    renderFingeringCard,
    getReferenceHtml
  };
})();
