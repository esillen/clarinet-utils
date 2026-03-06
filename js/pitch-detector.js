(function () {
  const SETTINGS_STORAGE_KEY = "clarinet_pitch_settings_v1";
  const DEFAULT_SETTINGS = Object.freeze({
    yinThreshold: 0.15,
    probabilityThreshold: 0.7,
    minFrequency: 70,
    maxFrequency: 500,
    volumeThreshold: 0.015,
    noiseFloorAlpha: 0.995
  });
  const yinBufferCache = new Map();
  let settings = loadSettings();
  let noiseFloor = 0.01;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sanitizeSettings(raw) {
    const next = {
      yinThreshold: clamp(Number(raw.yinThreshold), 0.05, 0.35),
      probabilityThreshold: clamp(Number(raw.probabilityThreshold), 0.3, 0.95),
      minFrequency: clamp(Number(raw.minFrequency), 40, 300),
      maxFrequency: clamp(Number(raw.maxFrequency), 250, 2200),
      volumeThreshold: clamp(Number(raw.volumeThreshold), 0.001, 0.08),
      noiseFloorAlpha: clamp(Number(raw.noiseFloorAlpha), 0.9, 0.999)
    };
    if (!Number.isFinite(next.yinThreshold)) next.yinThreshold = DEFAULT_SETTINGS.yinThreshold;
    if (!Number.isFinite(next.probabilityThreshold)) next.probabilityThreshold = DEFAULT_SETTINGS.probabilityThreshold;
    if (!Number.isFinite(next.minFrequency)) next.minFrequency = DEFAULT_SETTINGS.minFrequency;
    if (!Number.isFinite(next.maxFrequency)) next.maxFrequency = DEFAULT_SETTINGS.maxFrequency;
    if (!Number.isFinite(next.volumeThreshold)) next.volumeThreshold = DEFAULT_SETTINGS.volumeThreshold;
    if (!Number.isFinite(next.noiseFloorAlpha)) next.noiseFloorAlpha = DEFAULT_SETTINGS.noiseFloorAlpha;
    if (next.maxFrequency <= next.minFrequency + 5) {
      next.maxFrequency = next.minFrequency + 5;
    }
    return next;
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }
      const parsed = JSON.parse(raw);
      return sanitizeSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  function getSettings() {
    return { ...settings };
  }

  function emitSettingsChanged() {
    window.dispatchEvent(new CustomEvent("clarinet:pitch-settings", { detail: getSettings() }));
  }

  function updateSettings(nextPartial) {
    settings = sanitizeSettings({ ...settings, ...(nextPartial || {}) });
    saveSettings();
    emitSettingsChanged();
    return getSettings();
  }

  function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    noiseFloor = 0.01;
    saveSettings();
    emitSettingsChanged();
    return getSettings();
  }

  function getYinBuffer(size) {
    if (!yinBufferCache.has(size)) {
      yinBufferCache.set(size, new Float32Array(size));
    }
    return yinBufferCache.get(size);
  }

  function calculateRms(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / Math.max(1, buffer.length));
  }

  function autoCorrelate(buffer, sampleRate) {
    const perf = window.ClarinetPerf;
    return perf && perf.isEnabled()
      ? perf.measure("pitch.autoCorrelate", () => runYinPitchDetect(buffer, sampleRate))
      : runYinPitchDetect(buffer, sampleRate);
  }

  function runYinPitchDetect(buffer, sampleRate) {
    const rms = calculateRms(buffer);
    if (rms < noiseFloor * 1.5) {
      noiseFloor = settings.noiseFloorAlpha * noiseFloor + (1 - settings.noiseFloorAlpha) * rms;
    }
    const effectiveVolume = Math.max(0, rms - noiseFloor);
    if (effectiveVolume < settings.volumeThreshold) {
      return -1;
    }

    const bufferSize = buffer.length;
    const yinBufferSize = Math.floor(bufferSize / 2);
    if (yinBufferSize < 4) {
      return -1;
    }
    const yin = getYinBuffer(yinBufferSize);

    const minTau = Math.max(2, Math.floor(sampleRate / settings.maxFrequency));
    const maxTau = Math.min(yinBufferSize - 1, Math.floor(sampleRate / settings.minFrequency));
    if (maxTau <= minTau) {
      return -1;
    }

    yin[0] = 1;
    let runningSum = 0;

    for (let tau = 1; tau < yinBufferSize; tau += 1) {
      let delta = 0;
      for (let i = 0; i < yinBufferSize; i += 1) {
        const diff = buffer[i] - buffer[i + tau];
        delta += diff * diff;
      }
      runningSum += delta;
      yin[tau] = runningSum > 0 ? (delta * tau) / runningSum : 1;
    }

    let foundTau = -1;
    let tau = minTau;
    while (tau < maxTau) {
      if (yin[tau] < settings.yinThreshold) {
        while (tau + 1 < maxTau && yin[tau + 1] < yin[tau]) {
          tau += 1;
        }
        foundTau = tau;
        break;
      }
      tau += 1;
    }

    if (foundTau === -1) {
      let minVal = yin[minTau];
      foundTau = minTau;
      for (let i = minTau + 1; i < maxTau; i += 1) {
        if (yin[i] < minVal) {
          minVal = yin[i];
          foundTau = i;
        }
      }
      if (minVal > 0.5) {
        return -1;
      }
    }

    let betterTau = foundTau;
    if (foundTau > 0 && foundTau < yinBufferSize - 1) {
      const s0 = yin[foundTau - 1];
      const s1 = yin[foundTau];
      const s2 = yin[foundTau + 1];
      const denominator = 2 * (2 * s1 - s2 - s0);
      if (Math.abs(denominator) > 1e-8) {
        const adjustment = (s2 - s0) / denominator;
        if (Math.abs(adjustment) < 1) {
          betterTau = foundTau + adjustment;
        }
      }
    }

    const frequency = sampleRate / betterTau;
    const probability = 1 - yin[foundTau];
    if (
      !Number.isFinite(frequency) ||
      frequency < settings.minFrequency ||
      frequency > settings.maxFrequency ||
      probability < settings.probabilityThreshold
    ) {
      return -1;
    }
    return frequency;
  }

  function createMedianSmoother(windowSize = 7) {
    const history = [];
    return {
      push(value) {
        history.push(value);
        if (history.length > windowSize) {
          history.shift();
        }
        const sorted = [...history].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
      },
      clear() {
        history.length = 0;
      }
    };
  }

  window.PitchFinder = {
    autoCorrelate,
    createMedianSmoother,
    getSettings,
    updateSettings,
    resetSettings
  };
})();
