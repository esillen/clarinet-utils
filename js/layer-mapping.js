const statusEl = document.getElementById("mapping-status");
const gridEl = document.getElementById("mapping-grid");
const saveBtn = document.getElementById("mapping-save");
const inferBtn = document.getElementById("mapping-infer");
const resetBtn = document.getElementById("mapping-reset");
const refreshBtn = document.getElementById("mapping-refresh");
const exportBtn = document.getElementById("mapping-export");
const importBtn = document.getElementById("mapping-import");
const jsonEl = document.getElementById("mapping-json");
const keyCountEl = document.getElementById("mapping-key-count");

let layerLabels = [];
let templateSvgText = "";
let itemIds = [];
let mappingDraft = {};

function normalizeLabel(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#a22331" : "";
}

function getLayerGroups(svgElement) {
  return Array.from(svgElement.querySelectorAll("g")).filter((group) => (
    group.getAttribute("inkscape:groupmode") === "layer" || group.getAttribute("groupmode") === "layer"
  ));
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

function styleInteractiveLayer(layer, selected) {
  const paintables = layer.querySelectorAll("path, circle, ellipse, rect, polygon, polyline, line, use");
  layer.classList.add("mapping-layer-group");
  layer.classList.toggle("is-selected", selected);
  layer.classList.toggle("is-unselected", !selected);
  paintables.forEach((node) => {
    node.setAttribute("pointer-events", "visiblePainted");
    node.style.cursor = "pointer";
  });
}

function buildInteractiveSvg(itemId) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateSvgText, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) {
    return null;
  }

  if (!svg.getAttribute("viewBox")) {
    const width = parseFloat(svg.getAttribute("width") || "0");
    const height = parseFloat(svg.getAttribute("height") || "0");
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }
  }
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.classList.add("mapping-template-svg");

  const selected = new Set(mappingDraft[itemId] || []);
  const groups = getLayerGroups(svg);
  groups.forEach((layer) => {
    const label = (layer.getAttribute("inkscape:label") || layer.getAttribute("id") || "").trim();
    if (!label) {
      setLayerVisibility(layer, false);
      return;
    }

    if (normalizeLabel(label) === normalizeLabel("Base layer")) {
      setLayerVisibility(layer, true);
      layer.classList.add("mapping-base-layer");
      return;
    }

    if (!layerLabels.includes(label)) {
      setLayerVisibility(layer, false);
      return;
    }

    setLayerVisibility(layer, true);
    layer.dataset.layerLabel = label;
    styleInteractiveLayer(layer, selected.has(label));
  });

  return svg;
}

function createSelectedPills(labels) {
  const wrap = document.createElement("div");
  wrap.className = "mapping-selected";
  if (!labels || labels.length === 0) {
    wrap.textContent = "No layers selected yet.";
    return wrap;
  }
  labels.forEach((label) => {
    const pill = document.createElement("span");
    pill.className = "mapping-pill";
    pill.textContent = label;
    wrap.appendChild(pill);
  });
  return wrap;
}

function createLayerToggleList(itemId, selectedLabels) {
  const selected = new Set(selectedLabels);
  const wrap = document.createElement("div");
  wrap.className = "mapping-layer-list";

  layerLabels.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mapping-layer-btn";
    if (selected.has(label)) {
      btn.classList.add("is-selected");
    }
    btn.dataset.itemId = itemId;
    btn.dataset.layerLabel = label;
    btn.textContent = label;
    wrap.appendChild(btn);
  });

  return wrap;
}

function renderMappingRows() {
  gridEl.innerHTML = "";
  if (keyCountEl) {
    keyCountEl.textContent = `Showing ${itemIds.length} fingering text tokens.`;
  }

  itemIds.forEach((itemId) => {
    const row = document.createElement("div");
    row.className = "mapping-row";

    const label = document.createElement("label");
    label.className = "mapping-key";
    label.textContent = itemId;

    const canvas = document.createElement("div");
    canvas.className = "mapping-canvas";
    canvas.dataset.itemId = itemId;
    const svg = buildInteractiveSvg(itemId);
    if (svg) {
      canvas.appendChild(svg);
    }

    const selectedLabels = (mappingDraft[itemId] || []).slice().sort((a, b) => a.localeCompare(b));
    const selectedWrap = createSelectedPills(selectedLabels);
    const layerList = createLayerToggleList(itemId, selectedLabels);

    row.appendChild(label);
    row.appendChild(canvas);
    row.appendChild(selectedWrap);
    row.appendChild(layerList);
    gridEl.appendChild(row);
  });
}

function toggleLayerForItem(itemId, layerLabel) {
  const selected = new Set(mappingDraft[itemId] || []);
  if (selected.has(layerLabel)) {
    selected.delete(layerLabel);
  } else {
    selected.add(layerLabel);
  }
  mappingDraft[itemId] = Array.from(selected).sort((a, b) => a.localeCompare(b));
  renderMappingRows();
}

function bindCanvasClick() {
  gridEl.addEventListener("click", (event) => {
    const layerBtn = event.target.closest("button.mapping-layer-btn");
    if (layerBtn) {
      const itemId = layerBtn.dataset.itemId;
      const layerLabel = layerBtn.dataset.layerLabel;
      if (itemId && layerLabel) {
        toggleLayerForItem(itemId, layerLabel);
      }
      return;
    }

    const layerGroup = event.target.closest("g[data-layer-label]");
    if (!layerGroup) {
      return;
    }
    const canvas = event.target.closest(".mapping-canvas");
    if (!canvas) {
      return;
    }
    const itemId = canvas.dataset.itemId;
    const layerLabel = layerGroup.dataset.layerLabel;
    if (!itemId || !layerLabel) {
      return;
    }
    toggleLayerForItem(itemId, layerLabel);
  });
}

function readDraftMapping() {
  const out = {};
  itemIds.forEach((itemId) => {
    const values = Array.isArray(mappingDraft[itemId]) ? mappingDraft[itemId] : [];
    out[itemId] = values.slice();
  });
  return out;
}

function setDraftMapping(mapping) {
  const out = {};
  itemIds.forEach((itemId) => {
    const values = Array.isArray(mapping[itemId]) ? mapping[itemId] : [];
    const cleaned = values
      .map((item) => String(item || "").trim())
      .filter((item) => item.length > 0);
    out[itemId] = Array.from(new Set(cleaned));
  });
  mappingDraft = out;
}

function inferMappingFromLayerNames(labels) {
  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.inferTextTokenLayerMappingFromLabels === "function") {
    return window.ClarinetFingerings.inferTextTokenLayerMappingFromLabels(labels);
  }
  return {};
}

function applyInferredMapping() {
  const inferred = inferMappingFromLayerNames(layerLabels);
  setDraftMapping(inferred);
  renderMappingRows();
  setStatus("Inferred token mapping from layer names. Review and adjust by clicking layers.");
}

async function readTemplateLayerLabels() {
  const response = await fetch("assets/clarinet-fingering-template.svg");
  if (!response.ok) {
    throw new Error(`Could not read template SVG (${response.status})`);
  }
  templateSvgText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateSvgText, "image/svg+xml");
  const labels = Array.from(doc.querySelectorAll("g"))
    .filter((layer) => layer.getAttribute("inkscape:groupmode") === "layer" || layer.getAttribute("groupmode") === "layer")
    .map((layer) => layer.getAttribute("inkscape:label") || layer.getAttribute("id") || "")
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0 && normalizeLabel(item) !== normalizeLabel("Base layer"));

  return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b));
}

function readTokenIds() {
  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.getFingeringTokens === "function") {
    const tokens = window.ClarinetFingerings.getFingeringTokens();
    if (Array.isArray(tokens) && tokens.length > 0) {
      return tokens;
    }
  }

  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.getActiveTextTokenLayerMapping === "function") {
    return Object.keys(window.ClarinetFingerings.getActiveTextTokenLayerMapping()).sort((a, b) => a.localeCompare(b));
  }

  return [];
}

function readActiveMapping() {
  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.refreshTextTokenLayerMappingOverride === "function") {
    window.ClarinetFingerings.refreshTextTokenLayerMappingOverride();
  }
  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.getActiveTextTokenLayerMapping === "function") {
    return window.ClarinetFingerings.getActiveTextTokenLayerMapping();
  }
  return {};
}

async function reloadAll() {
  try {
    setStatus("Loading layers...");
    layerLabels = await readTemplateLayerLabels();
    itemIds = readTokenIds();
    if (itemIds.length === 0) {
      throw new Error("No fingering text tokens were found.");
    }
    setDraftMapping(readActiveMapping());
    renderMappingRows();
    setStatus(`Loaded ${layerLabels.length} layer labels and ${itemIds.length} text tokens.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function exportCurrent() {
  const mapping = readDraftMapping();
  jsonEl.value = JSON.stringify(mapping, null, 2);
  setStatus("Exported current mapping to JSON box.");
}

function saveCurrent() {
  const mapping = readDraftMapping();
  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.writeTextTokenLayerMappingOverride === "function") {
    window.ClarinetFingerings.writeTextTokenLayerMappingOverride(mapping);
    setStatus("Saved token mapping to localStorage. Reload fingering pages to verify.");
    return;
  }
  setStatus("Token mapping API is not available.", true);
}

function resetDefaults() {
  if (window.ClarinetFingerings && typeof window.ClarinetFingerings.clearTextTokenLayerMappingOverride === "function") {
    window.ClarinetFingerings.clearTextTokenLayerMappingOverride();
  }
  setDraftMapping(readActiveMapping());
  renderMappingRows();
  jsonEl.value = "";
  setStatus("Reset to default text token → layer mapping.");
}

function importFromJson() {
  try {
    const parsed = JSON.parse(jsonEl.value || "{}");
    setDraftMapping(parsed);
    renderMappingRows();
    if (window.ClarinetFingerings && typeof window.ClarinetFingerings.writeTextTokenLayerMappingOverride === "function") {
      window.ClarinetFingerings.writeTextTokenLayerMappingOverride(readDraftMapping());
    }
    setStatus("Imported and saved mapping from JSON.");
  } catch (error) {
    setStatus(`Import failed: ${error.message}`, true);
  }
}

function init() {
  saveBtn.addEventListener("click", saveCurrent);
  inferBtn.addEventListener("click", applyInferredMapping);
  resetBtn.addEventListener("click", resetDefaults);
  refreshBtn.addEventListener("click", reloadAll);
  exportBtn.addEventListener("click", exportCurrent);
  importBtn.addEventListener("click", importFromJson);
  bindCanvasClick();
  reloadAll();
}

init();
