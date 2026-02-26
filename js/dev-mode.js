(function () {
  const STORAGE_KEY = "clarinet_dev_mode_v1";

  function readDevMode() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function writeDevMode(enabled) {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  }

  function applyDevMode(enabled) {
    document.documentElement.classList.toggle("dev-mode-on", enabled);
    const devOnlyNodes = document.querySelectorAll("[data-dev-only]");
    devOnlyNodes.forEach((node) => {
      node.hidden = !enabled;
    });
  }

  function createToggle(initialValue) {
    const shell = document.createElement("label");
    shell.className = "dev-mode-toggle";
    shell.title = "Developer mode";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = initialValue;
    checkbox.setAttribute("aria-label", "Developer mode");

    const caption = document.createElement("span");
    caption.textContent = "Dev";

    shell.appendChild(checkbox);
    shell.appendChild(caption);

    checkbox.addEventListener("change", () => {
      const enabled = checkbox.checked;
      writeDevMode(enabled);
      applyDevMode(enabled);
    });

    return shell;
  }

  function init() {
    const enabled = readDevMode();
    applyDevMode(enabled);
    if (document.body && document.body.hasAttribute("data-show-dev-toggle")) {
      document.body.appendChild(createToggle(enabled));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
