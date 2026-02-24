(function () {
  const REGISTER_RANGES = {
    chalumeau: { min: 52, max: 64 },
    clarion: { min: 65, max: 79 },
    altissimo: { min: 80, max: 96 }
  };

  const SCALE_STORAGE_KEY = "clarinet_scale_selection_v1";
  const REGISTER_STORAGE_KEY = "clarinet_register_selection_v1";

  function readScale(defaultScale = "C_MAJOR") {
    const saved = localStorage.getItem(SCALE_STORAGE_KEY);
    if (saved && window.ClarinetCore.SCALES[saved]) {
      return saved;
    }
    return defaultScale;
  }

  function writeScale(scale) {
    if (window.ClarinetCore.SCALES[scale]) {
      localStorage.setItem(SCALE_STORAGE_KEY, scale);
    }
  }

  function readRegisters(defaultValue = ["chalumeau", "clarion", "altissimo"]) {
    try {
      const parsed = JSON.parse(localStorage.getItem(REGISTER_STORAGE_KEY) || "null");
      if (!Array.isArray(parsed)) {
        return defaultValue;
      }
      const valid = parsed.filter((name) => REGISTER_RANGES[name]);
      return valid;
    } catch {
      return defaultValue;
    }
  }

  function writeRegisters(registers) {
    const valid = (registers || []).filter((name) => REGISTER_RANGES[name]);
    localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(valid));
  }

  function collectRegisterPool(selectedRegisters) {
    const pool = [];
    selectedRegisters.forEach((name) => {
      const range = REGISTER_RANGES[name];
      if (!range) {
        return;
      }
      for (let midi = range.min; midi <= range.max; midi += 1) {
        pool.push(midi);
      }
    });
    return Array.from(new Set(pool)).sort((a, b) => a - b);
  }

  function buildScaleFilter(scale) {
    const def = window.ClarinetCore.SCALES[scale] || window.ClarinetCore.SCALES.C_MAJOR;
    const allowedPitchClasses = new Set(def.intervals.map((interval) => (def.root + interval) % 12));
    return (midi) => allowedPitchClasses.has(((midi % 12) + 12) % 12);
  }

  function init(options) {
    const {
      scaleSelect,
      registerCheckboxes,
      defaultScale = "C_MAJOR",
      defaultRegisters = ["chalumeau", "clarion", "altissimo"]
    } = options || {};

    if (!scaleSelect || !registerCheckboxes) {
      throw new Error("initScaleRegisterControls requires scaleSelect and registerCheckboxes.");
    }

    const regMap = {
      chalumeau: registerCheckboxes.chalumeau,
      clarion: registerCheckboxes.clarion,
      altissimo: registerCheckboxes.altissimo
    };

    const savedScale = readScale(defaultScale);
    if (scaleSelect.querySelector(`option[value="${savedScale}"]`)) {
      scaleSelect.value = savedScale;
    }

    const savedRegisters = new Set(readRegisters(defaultRegisters));
    Object.keys(regMap).forEach((name) => {
      if (regMap[name]) {
        regMap[name].checked = savedRegisters.has(name);
      }
    });

    const persist = () => {
      writeScale(scaleSelect.value);
      const selected = Object.keys(regMap).filter((name) => regMap[name] && regMap[name].checked);
      writeRegisters(selected);
    };

    scaleSelect.addEventListener("change", persist);
    Object.values(regMap).forEach((checkbox) => {
      if (checkbox) {
        checkbox.addEventListener("change", persist);
      }
    });

    function getScale() {
      return scaleSelect.value;
    }

    function getSelectedRegisters() {
      return Object.keys(regMap).filter((name) => regMap[name] && regMap[name].checked);
    }

    function getRegisterPool() {
      return collectRegisterPool(getSelectedRegisters());
    }

    function filterToScale(midiValues) {
      const filter = buildScaleFilter(getScale());
      return (midiValues || []).filter((midi) => filter(midi));
    }

    function getScaleFilteredRegisterPool() {
      return filterToScale(getRegisterPool());
    }

    function setDisabled(disabled) {
      scaleSelect.disabled = disabled;
      Object.values(regMap).forEach((checkbox) => {
        if (checkbox) {
          checkbox.disabled = disabled;
        }
      });
    }

    function onChange(handler) {
      scaleSelect.addEventListener("change", handler);
      Object.values(regMap).forEach((checkbox) => {
        if (checkbox) {
          checkbox.addEventListener("change", handler);
        }
      });
    }

    return {
      scaleSelect,
      getScale,
      getSelectedRegisters,
      getRegisterPool,
      filterToScale,
      getScaleFilteredRegisterPool,
      setDisabled,
      onChange
    };
  }

  window.ClarinetScaleRegisterControls = {
    REGISTER_RANGES,
    init
  };
})();
