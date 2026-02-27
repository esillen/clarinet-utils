(function () {
  let barEl = null;
  let statusEl = null;
  let startBtn = null;
  let stopBtn = null;
  let pitchEl = null;
  let canvasEl = null;
  let contentEl = null;
  let actionsWrapEl = null;
  let statusWrapEl = null;
  let pitchWrapEl = null;
  let ctx = null;

  let onStart = null;
  let onStop = null;
  let hasStopControl = true;

  let rafId = null;
  let listening = false;
  let hasStartedThisPageLoad = false;
  let targetLevel = 0;
  let smoothLevel = 0;
  let lastSignalAt = 0;
  const HISTORY_SIZE = 120;
  const FAST_FRAME_INTERVAL_MS = 16;
  const MEDIUM_FRAME_INTERVAL_MS = 24;
  const SLOW_FRAME_INTERVAL_MS = 33;
  const BACKGROUND_FRAME_INTERVAL_MS = 66;
  const history = new Array(HISTORY_SIZE).fill(0);
  let lastFrameAt = 0;
  let frameIntervalMs = SLOW_FRAME_INTERVAL_MS;
  let frameCostEmaMs = 0.8;

  let cachedW = 0;
  let cachedH = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function ensureDom() {
    if (barEl) {
      return;
    }

    barEl = document.createElement("div");
    barEl.className = "bottom-bar";

    canvasEl = document.createElement("canvas");
    canvasEl.className = "bottom-bar-canvas";
    barEl.appendChild(canvasEl);

    contentEl = document.createElement("div");
    contentEl.className = "bottom-bar-content";

    statusWrapEl = document.createElement("div");
    statusWrapEl.className = "bottom-bar-section bottom-bar-section-status";

    actionsWrapEl = document.createElement("div");
    actionsWrapEl.className = "bottom-bar-section bottom-bar-section-actions";

    pitchWrapEl = document.createElement("div");
    pitchWrapEl.className = "bottom-bar-section bottom-bar-section-pitch";

    startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.textContent = "Start";

    stopBtn = document.createElement("button");
    stopBtn.type = "button";
    stopBtn.textContent = "Stop";
    stopBtn.disabled = true;

    startBtn.addEventListener("click", async () => {
      if (!onStart || startBtn.disabled) {
        return;
      }
      hasStartedThisPageLoad = true;
      startBtn.classList.remove("needs-attention");
      await onStart();
    });

    stopBtn.addEventListener("click", async () => {
      if (!onStop || stopBtn.disabled) {
        return;
      }
      await onStop();
    });

    const actionsEl = document.createElement("div");
    actionsEl.className = "bottom-bar-actions";
    actionsEl.appendChild(startBtn);
    actionsEl.appendChild(stopBtn);

    statusEl = document.createElement("span");
    statusEl.className = "bottom-bar-status";
    statusEl.textContent = "waiting";

    pitchEl = document.createElement("span");
    pitchEl.className = "bottom-bar-pitch";
    pitchEl.textContent = "concert: - | transposed: -";

    statusWrapEl.appendChild(statusEl);
    actionsWrapEl.appendChild(actionsEl);
    pitchWrapEl.appendChild(pitchEl);

    contentEl.appendChild(statusWrapEl);
    contentEl.appendChild(actionsWrapEl);
    contentEl.appendChild(pitchWrapEl);
    barEl.appendChild(contentEl);
    document.body.appendChild(barEl);
    document.body.classList.add("has-bottom-bar");

    ctx = canvasEl.getContext("2d");
  }

  function resizeCanvasIfNeeded() {
    if (!canvasEl || !ctx) {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.floor(canvasEl.clientWidth));
    const h = Math.max(1, Math.floor(canvasEl.clientHeight));
    if (w === cachedW && h === cachedH) {
      return;
    }
    cachedW = w;
    cachedH = h;
    canvasEl.width = Math.floor(w * dpr);
    canvasEl.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pushHistory(value) {
    history.push(value);
    if (history.length > HISTORY_SIZE) {
      history.shift();
    }
  }

  function drawWave(timeMs) {
    if (!ctx) {
      return;
    }
    const perf = window.ClarinetPerf;
    const t0 = perf && perf.isEnabled() ? performance.now() : 0;
    const width = cachedW || 1;
    const height = cachedH || 1;

    ctx.clearRect(0, 0, width, height);

    const centerY = height * 0.5;
    const baseAmp = listening ? Math.max(1.6, height * 0.07) : Math.max(1.1, height * 0.04);
    const dynamicAmp = listening ? height * (0.08 + smoothLevel * 0.22) : height * 0.02;

    ctx.fillStyle = listening ? "rgba(32, 66, 76, 0.91)" : "rgba(171, 178, 183, 0.9)";
    ctx.fillRect(0, 0, width, height);

    const lineCount = 2;
    const speed = listening ? 0.0023 + smoothLevel * 0.0105 : 0.00075;
    for (let line = 0; line < lineCount; line += 1) {
      const phase = (timeMs * speed) + line * 1.18;
      const lineAlpha = (listening ? 0.58 : 0.26) + smoothLevel * (listening ? 0.34 : 0.05) - line * 0.08;
      ctx.strokeStyle = listening
        ? `rgba(213, 247, 255, ${lineAlpha * 0.9})`
        : `rgba(244, 247, 249, ${lineAlpha * 0.85})`;
      ctx.lineWidth = Math.max(1.2, 1.9 - line * 0.2);
      ctx.beginPath();

      for (let i = 0; i < history.length; i += 1) {
        const x = (i / (history.length - 1)) * width;
        const historyWeight = history[i];
        const slowWave = Math.sin((i * 0.06) + phase) * baseAmp;
        const fastWave = Math.sin((i * 0.19) + phase * 1.85) * (dynamicAmp * historyWeight);
        const y = centerY + slowWave + fastWave;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    if (perf && t0 > 0) {
      perf.record("bottomBar.drawWave", performance.now() - t0);
    }
  }

  function animate(timeMs) {
    const perf = window.ClarinetPerf;
    if (timeMs - lastFrameAt < frameIntervalMs) {
      rafId = requestAnimationFrame(animate);
      return;
    }
    lastFrameAt = timeMs;
    const t0 = performance.now();
    resizeCanvasIfNeeded();

    const ageMs = performance.now() - lastSignalAt;
    if (ageMs > 180) {
      targetLevel *= listening ? 0.86 : 0.95;
    }

    smoothLevel += (targetLevel - smoothLevel) * 0.16;
    smoothLevel = clamp(smoothLevel, 0, 1);

    const historyValue = clamp((listening ? 0.11 : 0.055) + smoothLevel * (listening ? 1.0 : 0.12), 0.05, 1);
    pushHistory(historyValue);

    drawWave(timeMs);
    const frameCostMs = performance.now() - t0;
    frameCostEmaMs += (frameCostMs - frameCostEmaMs) * 0.12;

    let targetInterval = listening ? FAST_FRAME_INTERVAL_MS : SLOW_FRAME_INTERVAL_MS;
    if (frameCostEmaMs > 3.5) {
      targetInterval = Math.max(targetInterval, SLOW_FRAME_INTERVAL_MS);
    } else if (frameCostEmaMs > 1.8) {
      targetInterval = Math.max(targetInterval, MEDIUM_FRAME_INTERVAL_MS);
    }
    if (document.hidden) {
      targetInterval = BACKGROUND_FRAME_INTERVAL_MS;
    }
    frameIntervalMs += (targetInterval - frameIntervalMs) * 0.22;

    if (perf && perf.isEnabled()) {
      perf.record("bottomBar.frame", frameCostMs);
    }
    rafId = requestAnimationFrame(animate);
  }

  function ensureLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  function setListening(nextListening) {
    ensureDom();
    listening = Boolean(nextListening);
    barEl.classList.toggle("listening", listening);
    barEl.classList.toggle("waiting", !listening);
    statusEl.textContent = listening ? "listening" : "waiting";
    if (hasStopControl) {
      startBtn.hidden = listening;
      stopBtn.hidden = !listening;
    } else {
      startBtn.hidden = false;
      stopBtn.hidden = true;
    }
    startBtn.classList.toggle("is-warm", !listening);
    stopBtn.classList.toggle("is-cold", listening);
    const shouldPulseStart = !hasStartedThisPageLoad && !listening && !startBtn.disabled && !startBtn.hidden;
    startBtn.classList.toggle("needs-attention", shouldPulseStart);
    ensureLoop();
  }

  function updateFromTimeDomain(buffer) {
    if (!buffer || buffer.length === 0) {
      return;
    }
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const value = buffer[i];
      sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    const normalized = clamp((rms - 0.003) / 0.055, 0, 1);
    targetLevel = Math.max(targetLevel * 0.86, normalized);
    lastSignalAt = performance.now();
  }

  function setStartEnabled(enabled) {
    ensureDom();
    startBtn.disabled = !enabled;
    const shouldPulseStart = !hasStartedThisPageLoad && !listening && enabled && !startBtn.hidden;
    startBtn.classList.toggle("needs-attention", shouldPulseStart);
  }

  function setStopEnabled(enabled) {
    ensureDom();
    if (stopBtn.hidden) {
      return;
    }
    stopBtn.disabled = !enabled;
  }

  function setDetectedPitches(concertLabel, transposedLabel) {
    ensureDom();
    const concert = concertLabel || "-";
    const transposed = transposedLabel || "-";
    pitchEl.innerHTML = `<span class="bottom-bar-pitch-line">concert: ${concert}</span><span class="bottom-bar-pitch-sep"> | </span><span class="bottom-bar-pitch-line">transposed: ${transposed}</span>`;
  }

  function clearDetectedPitches() {
    setDetectedPitches("-", "-");
  }

  function configure(options = {}) {
    ensureDom();
    onStart = typeof options.onStart === "function" ? options.onStart : null;
    onStop = typeof options.onStop === "function" ? options.onStop : null;

    startBtn.textContent = options.startLabel || "Start";
    stopBtn.textContent = options.stopLabel || "Stop";
    hasStopControl = options.showStop !== false;
    stopBtn.hidden = !hasStopControl;
    setStartEnabled(options.startEnabled !== false);
    setStopEnabled(Boolean(options.stopEnabled));

    setListening(Boolean(options.listening));
    if (options.showPitch === false) {
      pitchWrapEl.hidden = true;
      contentEl.classList.add("without-pitch");
    } else {
      pitchWrapEl.hidden = false;
      contentEl.classList.remove("without-pitch");
    }
    clearDetectedPitches();
  }

  function init(options = {}) {
    configure(options);
    return {
      setListening,
      setWaiting() {
        setListening(false);
      },
      updateFromTimeDomain,
      setStartEnabled,
      setStopEnabled,
      setDetectedPitches,
      clearDetectedPitches,
      configure
    };
  }

  function bootstrap() {
    ensureDom();
    setListening(false);
    window.addEventListener("resize", resizeCanvasIfNeeded);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }

  window.BottomBar = {
    init
  };
})();
