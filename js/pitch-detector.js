(function () {
  function autoCorrelate(buffer, sampleRate) {
    const perf = window.ClarinetPerf;
    return perf && perf.isEnabled()
      ? perf.measure("pitch.autoCorrelate", () => runAutoCorrelate(buffer, sampleRate))
      : runAutoCorrelate(buffer, sampleRate);
  }

  function runAutoCorrelate(buffer, sampleRate) {
    const size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i += 1) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / size);
    if (rms < 0.01) {
      return -1;
    }

    let r1 = 0;
    let r2 = size - 1;
    const threshold = 0.2;

    for (let i = 0; i < size / 2; i += 1) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }

    for (let i = 1; i < size / 2; i += 1) {
      if (Math.abs(buffer[size - i]) < threshold) {
        r2 = size - i;
        break;
      }
    }

    const sliced = buffer.slice(r1, r2);
    const newSize = sliced.length;
    const corr = new Array(newSize).fill(0);

    for (let i = 0; i < newSize; i += 1) {
      for (let j = 0; j < newSize - i; j += 1) {
        corr[i] += sliced[j] * sliced[j + i];
      }
    }

    let dip = 0;
    while (dip + 1 < corr.length && corr[dip] > corr[dip + 1]) {
      dip += 1;
    }

    let maxPos = -1;
    let maxVal = -1;
    for (let i = dip; i < corr.length; i += 1) {
      if (corr[i] > maxVal) {
        maxVal = corr[i];
        maxPos = i;
      }
    }

    if (maxPos <= 0) {
      return -1;
    }

    return sampleRate / maxPos;
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
