(function initializeFingeringRenderer() {
  const fingerings = window.ClarinetFingerings;
  if (!fingerings) {
    return;
  }

  let templateMetaPromise = null;
  const overlayPrototypeCache = new Map();
  const overlayPromiseCache = new Map();
  const GENERIC_WFG_INFO = "Source: Woodwind Fingering Guide (Boehm clarinet compact notation).";

  function setLayerVisibility(layer, visible) {
    const style = layer.getAttribute("style") || "";
    const parts = style
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !part.startsWith("display:"));
    parts.push(`display:${visible ? "inline" : "none"}`);
    layer.setAttribute("style", parts.join(";"));
  }

  async function loadTemplateMeta() {
    if (!templateMetaPromise) {
      templateMetaPromise = fingerings.loadTemplateSvgText().then((svgText) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const sourceSvg = doc.querySelector("svg");
        if (!sourceSvg) {
          return null;
        }

        const layers = Array.from(sourceSvg.querySelectorAll("g")).filter((group) => (
          group.getAttribute("inkscape:groupmode") === "layer" || group.getAttribute("groupmode") === "layer"
        ));
        if (!sourceSvg.getAttribute("viewBox")) {
          const width = parseFloat(sourceSvg.getAttribute("width") || "0");
          const height = parseFloat(sourceSvg.getAttribute("height") || "0");
          if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
            sourceSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
          }
        }

        const labelToIds = new Map();
        layers.forEach((layer) => {
          const id = layer.getAttribute("id");
          const label = layer.getAttribute("inkscape:label") || "";
          if (!id || !label) {
            return;
          }
          if (!labelToIds.has(label)) {
            labelToIds.set(label, []);
          }
          labelToIds.get(label).push(id);
        });

        return { sourceSvg, layers, labelToIds };
      });
    }
    return templateMetaPromise;
  }

  async function buildOverlayPrototypeFromLabels(labelsToEnable) {
    const meta = await loadTemplateMeta();
    if (!meta || !labelsToEnable || labelsToEnable.size === 0) {
      return null;
    }

    const selectedLayerIds = new Set();
    labelsToEnable.forEach((label) => {
      const ids = meta.labelToIds.get(label);
      if (!ids || ids.length === 0) {
        return;
      }
      ids.forEach((id) => selectedLayerIds.add(id));
    });

    if (selectedLayerIds.size === 0) {
      return null;
    }

    const outSvg = meta.sourceSvg.cloneNode(true);
    const outLayers = Array.from(outSvg.querySelectorAll("g")).filter((group) => (
      group.getAttribute("inkscape:groupmode") === "layer" || group.getAttribute("groupmode") === "layer"
    ));

    outLayers.forEach((layer) => {
      const id = layer.getAttribute("id");
      setLayerVisibility(layer, Boolean(id && selectedLayerIds.has(id)));
    });

    outSvg.classList.add("fingering-inline-svg");
    outSvg.classList.add("fingering-overlay-svg");
    return outSvg;
  }

  async function getCachedOverlaySvg(fingering, options = {}) {
    const labelsToEnable = fingerings.resolveLayerLabelsForFingering(fingering.keys || fingering.keyIds, {
      writtenMidi: options.writtenMidi
    });
    if (!labelsToEnable || labelsToEnable.size === 0) {
      return null;
    }

    const cacheKey = Array.from(labelsToEnable).sort().join("|");
    if (overlayPrototypeCache.has(cacheKey)) {
      return overlayPrototypeCache.get(cacheKey).cloneNode(true);
    }
    if (!overlayPromiseCache.has(cacheKey)) {
      const promise = buildOverlayPrototypeFromLabels(labelsToEnable)
        .then((prototype) => {
          if (prototype) {
            overlayPrototypeCache.set(cacheKey, prototype);
          }
          overlayPromiseCache.delete(cacheKey);
          return prototype;
        })
        .catch((error) => {
          overlayPromiseCache.delete(cacheKey);
          throw error;
        });
      overlayPromiseCache.set(cacheKey, promise);
    }

    const prototype = await overlayPromiseCache.get(cacheKey);
    return prototype ? prototype.cloneNode(true) : null;
  }

  async function tryApplyTemplateLayers(frame, fingering, options = {}) {
    try {
      const inlineSvg = await getCachedOverlaySvg(fingering, options);
      if (!inlineSvg || !frame.isConnected) {
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
    image.loading = "eager";
    image.decoding = "async";
    frame.appendChild(image);

    if (showHoleOverlay && visualGuide === fingerings.visuals.template) {
      tryApplyTemplateLayers(frame, fingering, options);
    }

    return frame;
  }

  function buildVisualFigure(fingering, visualGuide, showHoleOverlay, options = {}) {
    const visual = document.createElement("figure");
    visual.className = "fingering-visual";
    const frame = buildVisualFrame(fingering, visualGuide, showHoleOverlay, options);
    visual.appendChild(frame);
    return visual;
  }

  function compactNotation(keysText) {
    return String(keysText || "").trim();
  }

  function deriveDescription(fingering, options = {}) {
    const info = String(fingering.info || "").trim();
    if (info && info !== GENERIC_WFG_INFO) {
      return info;
    }

    const labels = fingerings.resolveLayerLabelsForFingering(fingering.keys || fingering.keyIds, {
      writtenMidi: options.writtenMidi
    });
    const rightPinkyLabels = new Set([
      "e",
      "f",
      "fis",
      "gis",
      "ais",
      "additional_right_1",
      "additional_right_2",
      "additional_right_3",
      "additional_right_4"
    ]);
    const leftPinkyLabels = new Set([
      "e_left",
      "f_left",
      "fis_left",
      "ais1",
      "dis",
      "cis1"
    ]);

    let hasRightPinky = false;
    let hasLeftPinky = false;
    labels.forEach((label) => {
      if (rightPinkyLabels.has(label)) {
        hasRightPinky = true;
      }
      if (leftPinkyLabels.has(label)) {
        hasLeftPinky = true;
      }
    });

    if (hasLeftPinky && hasRightPinky) {
      return "Use in combination with little-finger keys on both hands.";
    }
    if (hasRightPinky) {
      return "Use in combination with fingerings using right little finger or no little fingers.";
    }
    if (hasLeftPinky) {
      return "Use in combination with fingerings using left little finger or no little fingers.";
    }
    if (String(fingering.keys || "").includes("R")) {
      return "Includes register key support for upper-register response.";
    }
    return "No little fingers required.";
  }

  function renderFingeringVisualFrame(fingering, options = {}) {
    const visualGuide = options.visualGuide || fingerings.getVisualGuide(fingering.type);
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

    const notation = document.createElement("p");
    notation.innerHTML = `<strong>Notation:</strong> ${compactNotation(fingering.keys)}`;
    const description = document.createElement("p");
    description.innerHTML = `<strong>Description:</strong> ${deriveDescription(fingering, options)}`;
    const content = document.createElement("div");
    content.className = "fingering-content";
    content.appendChild(title);
    content.appendChild(type);
    content.appendChild(notation);
    if (!hideKeys) {
      const keys = document.createElement("p");
      keys.innerHTML = `<strong>Keys:</strong> ${fingering.keys}`;
      content.appendChild(keys);
    }
    content.appendChild(description);

    if (showVisual) {
      const visualGuide = fingerings.getVisualGuide(fingering.type);
      if (compact && !compactShowImage) {
        // Keep compact card text-only when image is disabled.
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

  fingerings.renderFingeringVisualFrame = renderFingeringVisualFrame;
  fingerings.renderFingeringCard = renderFingeringCard;
  fingerings.formatCompactNotation = compactNotation;
  fingerings.describeFingering = deriveDescription;
})();
