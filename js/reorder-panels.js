(function () {
  function initReorderableWorkspace(options) {
    const workspaceSelector = options.workspaceSelector;
    const itemSelector = options.itemSelector;
    const storageKey = options.storageKey;
    const handleLabel = options.handleLabel || "Reorder section";
    const longPressMs = options.longPressMs || 260;

    const workspace = document.querySelector(workspaceSelector);
    if (!workspace) {
      return;
    }

    let activeItem = null;
    let activePointerId = null;
    let pressTimer = null;
    let pressedItem = null;
    let pressedPointerType = null;
    let startX = 0;
    let startY = 0;
    let latestY = 0;
    let reordering = false;

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

    function clearPressTimer() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }

    function findInsertionTarget(y) {
      const items = Array.from(workspace.querySelectorAll(itemSelector)).filter((item) => item !== activeItem);
      return items.find((item) => {
        const rect = item.getBoundingClientRect();
        return y < rect.top + rect.height / 2;
      }) || null;
    }

    function animateReflow(mutator) {
      const beforeRects = new Map();
      Array.from(workspace.querySelectorAll(itemSelector)).forEach((item) => {
        if (item !== activeItem) {
          beforeRects.set(item, item.getBoundingClientRect());
        }
      });

      mutator();

      Array.from(workspace.querySelectorAll(itemSelector)).forEach((item) => {
        if (item === activeItem) {
          return;
        }
        const before = beforeRects.get(item);
        if (!before) {
          return;
        }
        const after = item.getBoundingClientRect();
        const dy = before.top - after.top;
        if (Math.abs(dy) < 0.5) {
          return;
        }
        item.style.transition = "none";
        item.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          item.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
          item.style.transform = "";
        });
      });
    }

    function updateDraggedVisual(y) {
      if (!activeItem) {
        return;
      }
      const dy = y - startY;
      activeItem.style.transform = `translateY(${dy}px) scale(1.01)`;
    }

    function reorderAtY(y) {
      if (!activeItem) {
        return;
      }
      const target = findInsertionTarget(y);
      const shouldMove = (target && target !== activeItem) || (!target && workspace.lastElementChild !== activeItem);
      if (!shouldMove) {
        return;
      }

      animateReflow(() => {
        if (target && target !== activeItem) {
          workspace.insertBefore(activeItem, target);
        } else if (!target) {
          workspace.appendChild(activeItem);
        }
      });
    }

    function beginReorder(item, pointerId) {
      activeItem = item;
      activePointerId = pointerId;
      reordering = true;
      item.classList.add("is-reordering");
      item.style.willChange = "transform";
      document.body.classList.add("reordering-active");
      updateDraggedVisual(latestY);
    }

    function stopReorder(save) {
      clearPressTimer();
      if (activeItem) {
        activeItem.classList.remove("is-reordering");
        activeItem.style.willChange = "";
        activeItem.style.transform = "";
      }
      document.body.classList.remove("reordering-active");

      activeItem = null;
      activePointerId = null;
      pressedItem = null;
      pressedPointerType = null;
      reordering = false;

      if (save) {
        saveOrder();
      }
    }

    function onHandlePointerDown(event) {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }

      const handle = event.currentTarget;
      const item = handle.closest(itemSelector);
      if (!item) {
        return;
      }

      pressedItem = item;
      pressedPointerType = event.pointerType || "mouse";
      startX = event.clientX;
      startY = event.clientY;
      latestY = event.clientY;

      if (pressedPointerType === "touch") {
        clearPressTimer();
        pressTimer = setTimeout(() => {
          beginReorder(item, event.pointerId);
          reorderAtY(startY);
        }, longPressMs);
      } else {
        beginReorder(item, event.pointerId);
        reorderAtY(startY);
      }
    }

    function onPointerMove(event) {
      if (!pressedItem && !activeItem) {
        return;
      }

      if (reordering) {
        if (activePointerId !== null && event.pointerId !== activePointerId) {
          return;
        }
        event.preventDefault();
        latestY = event.clientY;
        updateDraggedVisual(event.clientY);
        reorderAtY(event.clientY);
        return;
      }

      if (pressedPointerType === "touch") {
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const moved = Math.sqrt(dx * dx + dy * dy);
        if (moved > 12) {
          clearPressTimer();
          pressedItem = null;
          pressedPointerType = null;
        }
      }
    }

    function onPointerUp(event) {
      if (reordering) {
        if (activePointerId !== null && event.pointerId !== activePointerId) {
          return;
        }
        stopReorder(true);
        return;
      }

      clearPressTimer();
      pressedItem = null;
      pressedPointerType = null;
    }

    function onPointerCancel() {
      stopReorder(false);
    }

    const items = Array.from(workspace.querySelectorAll(itemSelector));
    items.forEach((item, index) => {
      if (!item.dataset.panelId) {
        item.dataset.panelId = item.classList[0] || `panel-${index + 1}`;
      }
      item.classList.add("reorderable-panel");

      if (!item.querySelector(".drag-handle")) {
        const handle = document.createElement("button");
        handle.type = "button";
        handle.className = "drag-handle";
        handle.setAttribute("aria-label", handleLabel);
        handle.title = handleLabel;
        const grip = document.createElement("span");
        grip.className = "drag-grip";
        grip.setAttribute("aria-hidden", "true");
        handle.appendChild(grip);
        handle.addEventListener("pointerdown", onHandlePointerDown);
        handle.addEventListener("contextmenu", (event) => event.preventDefault());
        item.insertBefore(handle, item.firstChild);
      }
    });

    applySavedOrder();
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  }

  window.initReorderableWorkspace = initReorderableWorkspace;
})();
