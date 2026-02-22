(function () {
  function initReorderableWorkspace(options) {
    const workspaceSelector = options.workspaceSelector;
    const itemSelector = options.itemSelector;
    const storageKey = options.storageKey;
    const handleText = options.handleText || "Drag to Reorder";

    const workspace = document.querySelector(workspaceSelector);
    if (!workspace) {
      return;
    }

    let draggedId = null;

    function readOrder() {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return [];
      }
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function saveOrder() {
      const order = Array.from(workspace.querySelectorAll(itemSelector)).map((item) => item.dataset.panelId);
      localStorage.setItem(storageKey, JSON.stringify(order));
    }

    function applySavedOrder() {
      const order = readOrder();
      if (order.length === 0) {
        return;
      }
      const itemsById = new Map(
        Array.from(workspace.querySelectorAll(itemSelector)).map((item) => [item.dataset.panelId, item])
      );
      order.forEach((id) => {
        const item = itemsById.get(id);
        if (item) {
          workspace.appendChild(item);
        }
      });
    }

    function findInsertionTarget(y) {
      const items = Array.from(workspace.querySelectorAll(itemSelector)).filter(
        (item) => item.dataset.panelId !== draggedId
      );
      return items.find((item) => {
        const rect = item.getBoundingClientRect();
        return y < rect.top + rect.height / 2;
      }) || null;
    }

    function onDragStart(event) {
      const handle = event.target.closest(".drag-handle");
      const item = handle ? handle.closest(itemSelector) : null;
      if (!item) {
        event.preventDefault();
        return;
      }

      draggedId = item.dataset.panelId;
      item.classList.add("is-reordering");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedId);
    }

    function onDragOver(event) {
      if (!draggedId) {
        return;
      }
      event.preventDefault();
      const dragged = workspace.querySelector(`[data-panel-id="${draggedId}"]`);
      if (!dragged) {
        return;
      }
      const target = findInsertionTarget(event.clientY);
      if (target && target !== dragged) {
        workspace.insertBefore(dragged, target);
      } else if (!target) {
        workspace.appendChild(dragged);
      }
    }

    function onDragEnd() {
      workspace.querySelectorAll(itemSelector).forEach((item) => item.classList.remove("is-reordering"));
      if (draggedId) {
        saveOrder();
      }
      draggedId = null;
    }

    const items = Array.from(workspace.querySelectorAll(itemSelector));
    items.forEach((item, index) => {
      if (!item.dataset.panelId) {
        item.dataset.panelId = item.classList[0] || `panel-${index + 1}`;
      }
      item.classList.add("reorderable-panel");

      if (!item.querySelector(".drag-handle")) {
        const handle = document.createElement("div");
        handle.className = "drag-handle";
        handle.textContent = handleText;
        handle.setAttribute("draggable", "true");
        handle.addEventListener("dragstart", onDragStart);
        handle.addEventListener("dragend", onDragEnd);
        item.insertBefore(handle, item.firstChild);
      }
    });

    applySavedOrder();
    workspace.addEventListener("dragover", onDragOver);
    workspace.addEventListener("drop", (event) => event.preventDefault());
    workspace.addEventListener("dragend", onDragEnd);
  }

  window.initReorderableWorkspace = initReorderableWorkspace;
})();
