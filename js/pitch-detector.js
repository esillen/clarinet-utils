(function () {
  const YIN_THRESHOLD = 0.15;
  const PROBABILITY_THRESHOLD = 0.7;
  const MIN_FREQUENCY = 70;
  const MAX_FREQUENCY = 500;
  const VOLUME_THRESHOLD = 0.015;
  const NOISE_FLOOR_ALPHA = 0.995;
  const yinBufferCache = new Map();
  let noiseFloor = 0.01;

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
      noiseFloor = NOISE_FLOOR_ALPHA * noiseFloor + (1 - NOISE_FLOOR_ALPHA) * rms;
    }
    const effectiveVolume = Math.max(0, rms - noiseFloor);
    if (effectiveVolume < VOLUME_THRESHOLD) {
      return -1;
    }

    const bufferSize = buffer.length;
    const yinBufferSize = Math.floor(bufferSize / 2);
    if (yinBufferSize < 4) {
      return -1;
    }
    const yin = getYinBuffer(yinBufferSize);

    const minTau = Math.max(2, Math.floor(sampleRate / MAX_FREQUENCY));
    const maxTau = Math.min(yinBufferSize - 1, Math.floor(sampleRate / MIN_FREQUENCY));
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
      if (yin[tau] < YIN_THRESHOLD) {
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
      frequency < MIN_FREQUENCY ||
      frequency > MAX_FREQUENCY ||
      probability < PROBABILITY_THRESHOLD
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
    createMedianSmoother
  };
})();
