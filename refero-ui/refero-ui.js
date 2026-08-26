/* ==========================================================================
   Refero UI — behavior
   Vanilla ES. No dependencies, no build step, no inline handlers.

   Everything initializes by scanning `data-rui-*` attributes. For markup you
   add later, call `ReferoUI.init(someRootElement)` — every enhancer is
   idempotent, so re-running over the whole document is harmless.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---------- tiny helpers --------------------------------------------- */

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /** Mark a node as handled by one enhancer; returns false if already done.
      The flag lives on a JS property, never on dataset — a dataset flag would
      collide with the very `data-rui-*` attributes components read from. */
  function claim(el, key) {
    var reg = el.ruiInitialized || (el.ruiInitialized = {});
    if (reg[key]) return false;
    reg[key] = true;
    return true;
  }

  function prefersReducedMotion() {
    return global.matchMedia
      ? global.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  }

  var FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  function focusable(root) {
    return $$(FOCUSABLE, root).filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  /** Trap Tab inside `root` until the returned function is called. */
  function trapFocus(root) {
    function onKey(e) {
      if (e.key !== "Tab") return;
      var items = focusable(root);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    root.addEventListener("keydown", onKey);
    return function () {
      root.removeEventListener("keydown", onKey);
    };
  }

  var scrollLocks = 0;
  function lockScroll() {
    if (scrollLocks++ === 0) {
      var pad = global.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (pad > 0) document.body.style.paddingRight = pad + "px";
    }
  }
  function unlockScroll() {
    if (--scrollLocks <= 0) {
      scrollLocks = 0;
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }

  /** Roving tabindex over a list; only the active item is tabbable. */
  function roving(items, activeIndex) {
    items.forEach(function (el, i) {
      el.tabIndex = i === activeIndex ? 0 : -1;
    });
  }

  function nextIndex(current, delta, length) {
    return (current + delta + length) % length;
  }

  /* ---------- theme ----------------------------------------------------- */

  var STORE_KEY = "rui-theme";

  function readStoredTheme() {
    try {
      return localStorage.getItem(STORE_KEY);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "light" || theme === "dark") root.setAttribute("data-theme", theme);
    else root.removeAttribute("data-theme");
    try {
      if (theme === "system") localStorage.removeItem(STORE_KEY);
      else localStorage.setItem(STORE_KEY, theme);
    } catch (e) {
      /* private mode — the choice just won't persist */
    }
    syncThemeControls(theme);
    document.dispatchEvent(new CustomEvent("rui:themechange", { detail: { theme: theme } }));
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "system";
  }

  function syncThemeControls(theme) {
    $$("[data-rui-theme-toggle] [data-theme-value]").forEach(function (btn) {
      var on = btn.dataset.themeValue === theme;
      btn.setAttribute("aria-checked", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
    });
  }

  function initThemeToggle(root) {
    $$("[data-rui-theme-toggle]", root).forEach(function (group) {
      if (!claim(group, "Theme")) return;
      group.setAttribute("role", "radiogroup");
      var opts = $$("[data-theme-value]", group);
      opts.forEach(function (btn, i) {
        btn.setAttribute("role", "radio");
        btn.type = "button";
        btn.addEventListener("click", function () {
          applyTheme(btn.dataset.themeValue);
        });
        btn.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var t = opts[nextIndex(i, d, opts.length)];
          t.focus();
          applyTheme(t.dataset.themeValue);
        });
      });
    });
    syncThemeControls(currentTheme());
  }

  /* ---------- tabs ------------------------------------------------------ */

  function initTabs(root) {
    $$("[data-rui-tabs]", root).forEach(function (wrap) {
      if (!claim(wrap, "Tabs")) return;
      var list = $("[role='tablist']", wrap);
      if (!list) return;
      var tabs = $$("[role='tab']", list);
      var vertical = list.getAttribute("aria-orientation") === "vertical";

      function select(idx, moveFocus) {
        tabs.forEach(function (tab, i) {
          var on = i === idx;
          tab.setAttribute("aria-selected", on ? "true" : "false");
          tab.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(tab.getAttribute("aria-controls") || "");
          if (panel) panel.hidden = !on;
        });
        if (moveFocus) tabs[idx].focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () {
          select(i, false);
        });
        tab.addEventListener("keydown", function (e) {
          var prev = vertical ? "ArrowUp" : "ArrowLeft";
          var next = vertical ? "ArrowDown" : "ArrowRight";
          var idx = null;
          if (e.key === next) idx = nextIndex(i, 1, tabs.length);
          else if (e.key === prev) idx = nextIndex(i, -1, tabs.length);
          else if (e.key === "Home") idx = 0;
          else if (e.key === "End") idx = tabs.length - 1;
          if (idx === null) return;
          e.preventDefault();
          select(idx, true);
        });
      });

      var initial = tabs.findIndex(function (t) {
        return t.getAttribute("aria-selected") === "true";
      });
      select(initial < 0 ? 0 : initial, false);
    });
  }

  /* ---------- segmented control ----------------------------------------- */

  function initSegmented(root) {
    $$("[data-rui-segmented]", root).forEach(function (group) {
      if (!claim(group, "Seg")) return;
      group.setAttribute("role", "radiogroup");
      var items = $$("[role='radio'],.rui-segmented__item", group);

      function select(idx, moveFocus) {
        items.forEach(function (el, i) {
          el.setAttribute("role", "radio");
          el.setAttribute("aria-checked", i === idx ? "true" : "false");
          el.tabIndex = i === idx ? 0 : -1;
        });
        if (moveFocus) items[idx].focus();
        group.dispatchEvent(
          new CustomEvent("rui:change", { detail: { value: items[idx].dataset.value || items[idx].textContent.trim(), index: idx } })
        );
      }

      items.forEach(function (el, i) {
        el.type = "button";
        el.addEventListener("click", function () {
          select(i, false);
        });
        el.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          select(nextIndex(i, d, items.length), true);
        });
      });

      var initial = items.findIndex(function (el) {
        return el.getAttribute("aria-checked") === "true";
      });
      select(initial < 0 ? 0 : initial, false);
    });
  }

  /* ---------- toggles: chips, switches, pressed buttons ------------------ */

  function initToggles(root) {
    $$("[data-rui-chip],[data-rui-toggle]", root).forEach(function (el) {
      if (!claim(el, "Toggle")) return;
      if (el.tagName === "BUTTON") el.type = "button";
      if (!el.hasAttribute("aria-pressed")) el.setAttribute("aria-pressed", "false");
      el.addEventListener("click", function () {
        var on = el.getAttribute("aria-pressed") === "true";
        el.setAttribute("aria-pressed", on ? "false" : "true");
        el.dispatchEvent(new CustomEvent("rui:change", { bubbles: true, detail: { pressed: !on } }));
      });
    });

    $$("[data-rui-switch]", root).forEach(function (el) {
      if (!claim(el, "Switch")) return;
      if (el.tagName === "BUTTON") el.type = "button";
      el.setAttribute("role", "switch");
      if (!el.hasAttribute("aria-checked")) el.setAttribute("aria-checked", "false");
      function toggle() {
        if (el.hasAttribute("disabled")) return;
        var on = el.getAttribute("aria-checked") === "true";
        el.setAttribute("aria-checked", on ? "false" : "true");
        el.dispatchEvent(new CustomEvent("rui:change", { bubbles: true, detail: { checked: !on } }));
      }
      el.addEventListener("click", toggle);
      // <button> fires click on Space and Enter already; a non-button host needs this.
      if (el.tagName !== "BUTTON") {
        el.tabIndex = 0;
        el.addEventListener("keydown", function (e) {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle();
          }
        });
      }
    });
  }

  /* ---------- search field ---------------------------------------------- */

  function initSearch(root) {
    $$("[data-rui-search]", root).forEach(function (wrap) {
      if (!claim(wrap, "Search")) return;
      var input = $("input", wrap);
      var clear = $("[data-rui-search-clear]", wrap);
      if (!input) return;

      function sync() {
        wrap.dataset.hasValue = input.value ? "true" : "false";
      }
      input.addEventListener("input", sync);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && input.value) {
          e.stopPropagation();
          input.value = "";
          sync();
        }
      });
      if (clear) {
        clear.type = "button";
        if (!clear.getAttribute("aria-label")) clear.setAttribute("aria-label", "Clear search");
        clear.addEventListener("click", function () {
          input.value = "";
          sync();
          input.focus();
          input.dispatchEvent(new Event("input", { bubbles: true }));
        });
      }
      sync();
    });
  }

  /* ---------- slider ----------------------------------------------------- */

  function initSlider(root) {
    $$("[data-rui-slider]", root).forEach(function (input) {
      if (!claim(input, "Slider")) return;
      var out = document.getElementById(input.dataset.ruiSlider || "");
      var suffix = input.dataset.suffix || "";
      function sync() {
        if (out) out.textContent = input.value + suffix;
        input.setAttribute("aria-valuetext", input.value + suffix);
      }
      input.addEventListener("input", sync);
      sync();
    });
  }

  /* ---------- accordion --------------------------------------------------- */

  function initAccordion(root) {
    $$("[data-rui-accordion]", root).forEach(function (acc) {
      if (!claim(acc, "Accordion")) return;
      var multiple = acc.dataset.multiple === "true";
      var triggers = $$("[data-rui-accordion-trigger]", acc);

      triggers.forEach(function (trigger) {
        trigger.type = "button";
        var panel = document.getElementById(trigger.getAttribute("aria-controls") || "");
        if (!panel) return;
        var open = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
        panel.hidden = !open;
        panel.setAttribute("role", "region");
        if (trigger.id) panel.setAttribute("aria-labelledby", trigger.id);

        trigger.addEventListener("click", function () {
          var isOpen = trigger.getAttribute("aria-expanded") === "true";
          if (!multiple && !isOpen) {
            triggers.forEach(function (other) {
              if (other === trigger) return;
              other.setAttribute("aria-expanded", "false");
              var p = document.getElementById(other.getAttribute("aria-controls") || "");
              if (p) p.hidden = true;
            });
          }
          trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
          panel.hidden = isOpen;
        });
      });
    });
  }

  /* ---------- flyout state machine (menus, popovers) ---------------------- */

  /* Closed flyouts are display:none so they cannot widen the page. These
     helpers step through opening -> true and closing -> false so the fade
     still runs in both directions, and clamp the panel inside the viewport. */
  function placeFlyout(panel) {
    panel.style.marginLeft = "0px";
    var r = panel.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var shift = 0;
    if (r.right > vw - 8) shift = -(r.right - (vw - 8));
    if (r.left + shift < 8) shift = 8 - r.left;
    if (shift) panel.style.marginLeft = Math.round(shift) + "px";
  }

  function flyoutOpen(host, panel) {
    global.clearTimeout(host.ruiFlyoutTimer);
    host.dataset.open = "opening";
    placeFlyout(panel);
    if (prefersReducedMotion()) {
      host.dataset.open = "true";
      return;
    }
    global.requestAnimationFrame(function () {
      global.requestAnimationFrame(function () {
        if (host.dataset.open === "opening") host.dataset.open = "true";
      });
    });
  }

  function flyoutClose(host, panel) {
    global.clearTimeout(host.ruiFlyoutTimer);
    host.dataset.open = "closing";
    var finish = function () {
      if (host.dataset.open === "closing") {
        host.dataset.open = "false";
        panel.style.marginLeft = "";
      }
    };
    if (prefersReducedMotion()) finish();
    else host.ruiFlyoutTimer = global.setTimeout(finish, 200);
  }

  function flyoutIsOpen(host) {
    return host.dataset.open === "true" || host.dataset.open === "opening";
  }

  /* ---------- dropdown menu ------------------------------------------------ */

  var openMenus = [];

  function closeAllMenus(except) {
    openMenus.slice().forEach(function (m) {
      if (m.el !== except) m.close(false);
    });
  }

  function initMenu(root) {
    $$("[data-rui-menu]", root).forEach(function (menu) {
      if (!claim(menu, "Menu")) return;
      var trigger = $("[data-rui-menu-trigger]", menu);
      var list = $("[role='menu']", menu);
      if (!trigger || !list) return;
      var items = $$("[role='menuitem']", list);

      trigger.type = "button";
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.setAttribute("aria-expanded", "false");
      items.forEach(function (it) {
        it.tabIndex = -1;
        if (it.tagName === "BUTTON") it.type = "button";
      });

      var record = { el: menu, close: close };

      function open(focusIndex) {
        closeAllMenus(menu);
        flyoutOpen(menu, list);
        trigger.setAttribute("aria-expanded", "true");
        openMenus.push(record);
        if (typeof focusIndex === "number" && items[focusIndex]) items[focusIndex].focus();
      }

      function close(restoreFocus) {
        if (!flyoutIsOpen(menu)) return;
        flyoutClose(menu, list);
        trigger.setAttribute("aria-expanded", "false");
        openMenus = openMenus.filter(function (m) {
          return m !== record;
        });
        if (restoreFocus !== false) trigger.focus();
      }

      trigger.addEventListener("click", function () {
        if (flyoutIsOpen(menu)) close();
        else open();
      });

      trigger.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(0);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          open(items.length - 1);
        }
      });

      list.addEventListener("keydown", function (e) {
        var i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          items[nextIndex(i, 1, items.length)].focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          items[nextIndex(i, -1, items.length)].focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          items[0].focus();
        } else if (e.key === "End") {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (e.key === "Escape") {
          e.preventDefault();
          close();
        } else if (e.key === "Tab") {
          close(false);
        }
      });

      items.forEach(function (it) {
        it.addEventListener("click", function () {
          close();
        });
      });
    });
  }

  /* ---------- popover ------------------------------------------------------ */

  function initPopover(root) {
    $$("[data-rui-popover]", root).forEach(function (pop) {
      if (!claim(pop, "Popover")) return;
      var trigger = $("[data-rui-popover-trigger]", pop);
      var panel = $("[data-rui-popover-panel]", pop);
      if (!trigger || !panel) return;
      if (!panel.id) panel.id = "rui-pop-" + Math.random().toString(36).slice(2, 8);
      trigger.type = "button";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", panel.id);

      var record = { el: pop, close: close };

      function open() {
        closeAllMenus(pop);
        flyoutOpen(pop, panel);
        trigger.setAttribute("aria-expanded", "true");
        openMenus.push(record);
      }
      function close(restoreFocus) {
        if (!flyoutIsOpen(pop)) return;
        flyoutClose(pop, panel);
        trigger.setAttribute("aria-expanded", "false");
        openMenus = openMenus.filter(function (m) {
          return m !== record;
        });
        if (restoreFocus !== false) trigger.focus();
      }

      trigger.addEventListener("click", function () {
        if (flyoutIsOpen(pop)) close();
        else open();
      });
      pop.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
      });
    });
  }

  document.addEventListener("pointerdown", function (e) {
    openMenus.slice().forEach(function (m) {
      if (!m.el.contains(e.target)) m.close(false);
    });
  });

  /* ---------- tooltip ------------------------------------------------------ */

  var tipEl = null;
  var tipTimer = null;

  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "rui-tooltip";
    tipEl.setAttribute("role", "tooltip");
    tipEl.id = "rui-tooltip-singleton";
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function showTip(trigger) {
    var text = trigger.dataset.ruiTooltip;
    if (!text) return;
    var tip = ensureTip();
    tip.textContent = text;
    tip.dataset.open = "true";
    trigger.setAttribute("aria-describedby", tip.id);

    var r = trigger.getBoundingClientRect();
    var t = tip.getBoundingClientRect();
    var gap = 8;
    var top = r.top - t.height - gap;
    if (top < 8) top = r.bottom + gap;
    var left = r.left + r.width / 2 - t.width / 2;
    left = Math.max(8, Math.min(left, global.innerWidth - t.width - 8));
    tip.style.top = Math.round(top) + "px";
    tip.style.left = Math.round(left) + "px";
  }

  function hideTip(trigger) {
    global.clearTimeout(tipTimer);
    if (tipEl) tipEl.dataset.open = "false";
    if (trigger) trigger.removeAttribute("aria-describedby");
  }

  function initTooltip(root) {
    $$("[data-rui-tooltip]", root).forEach(function (el) {
      if (!claim(el, "Tip")) return;
      var delay = prefersReducedMotion() ? 0 : 120;
      el.addEventListener("pointerenter", function () {
        global.clearTimeout(tipTimer);
        tipTimer = global.setTimeout(function () {
          showTip(el);
        }, delay);
      });
      el.addEventListener("pointerleave", function () {
        hideTip(el);
      });
      el.addEventListener("focus", function () {
        showTip(el);
      });
      el.addEventListener("blur", function () {
        hideTip(el);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Escape") hideTip(el);
      });
    });
  }

  /* ---------- modal --------------------------------------------------------- */

  var modalStack = [];

  function openModal(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    var dialog = $("[role='dialog'],[role='alertdialog']", overlay) || overlay;
    var returnTo = document.activeElement;

    overlay.hidden = false;
    lockScroll();
    // one frame so the opacity/transform transition actually runs
    global.requestAnimationFrame(function () {
      overlay.dataset.open = "true";
    });

    var release = trapFocus(dialog);
    var first = $("[data-rui-autofocus]", dialog) || focusable(dialog)[0] || dialog;
    if (!dialog.hasAttribute("tabindex")) dialog.tabIndex = -1;
    first.focus();

    modalStack.push({ id: id, overlay: overlay, release: release, returnTo: returnTo });
  }

  function closeModal(id) {
    var idx = id
      ? modalStack.findIndex(function (m) {
          return m.id === id;
        })
      : modalStack.length - 1;
    if (idx < 0) return;
    var m = modalStack.splice(idx, 1)[0];
    m.overlay.dataset.open = "false";
    m.release();
    unlockScroll();
    var done = function () {
      m.overlay.hidden = true;
    };
    if (prefersReducedMotion()) done();
    else global.setTimeout(done, 200);
    if (m.returnTo && m.returnTo.focus) m.returnTo.focus();
  }

  function initModal(root) {
    $$("[data-rui-modal-open]", root).forEach(function (btn) {
      if (!claim(btn, "ModalOpen")) return;
      if (btn.tagName === "BUTTON") btn.type = "button";
      btn.addEventListener("click", function () {
        openModal(btn.dataset.ruiModalOpen);
      });
    });

    $$("[data-rui-modal]", root).forEach(function (overlay) {
      if (!claim(overlay, "Modal")) return;
      overlay.hidden = true;
      overlay.dataset.open = "false";
      var dialog = $("[role='dialog'],[role='alertdialog']", overlay);
      if (dialog && !dialog.hasAttribute("aria-modal")) dialog.setAttribute("aria-modal", "true");

      overlay.addEventListener("mousedown", function (e) {
        if (e.target === overlay && overlay.dataset.dismissable !== "false") closeModal(overlay.id);
      });
      $$("[data-rui-modal-close]", overlay).forEach(function (btn) {
        if (btn.tagName === "BUTTON") btn.type = "button";
        btn.addEventListener("click", function () {
          closeModal(overlay.id);
        });
      });
    });
  }

  /* ---------- toasts --------------------------------------------------------- */

  var ICONS = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-5"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5 3 19h18L12 4.5Z"/><path d="M12 10v4M12 17h.01"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  };

  var CLOSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';

  function toaster() {
    var el = $(".rui-toaster");
    if (el) return el;
    el = document.createElement("div");
    el.className = "rui-toaster";
    // polite live region: announced without interrupting
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "false");
    document.body.appendChild(el);
    return el;
  }

  function toast(opts) {
    opts = opts || {};
    var variant = opts.variant || "info";
    var node = document.createElement("div");
    node.className = "rui-toast rui-toast--" + variant;

    var icon = document.createElement("span");
    icon.className = "rui-toast__icon";
    icon.innerHTML = ICONS[variant] || ICONS.info;

    var text = document.createElement("div");
    text.className = "rui-toast__text";
    var title = document.createElement("p");
    title.className = "rui-toast__title";
    title.textContent = opts.title || "";
    text.appendChild(title);
    if (opts.description) {
      var desc = document.createElement("p");
      desc.className = "rui-toast__desc";
      desc.textContent = opts.description;
      text.appendChild(desc);
    }

    var close = document.createElement("button");
    close.type = "button";
    close.className = "rui-toast__close";
    close.setAttribute("aria-label", "Dismiss notification");
    close.innerHTML = CLOSE_ICON;

    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(close);
    toaster().appendChild(node);

    var timer;
    function dismiss() {
      global.clearTimeout(timer);
      node.dataset.leaving = "true";
      var remove = function () {
        if (node.parentNode) node.parentNode.removeChild(node);
      };
      if (prefersReducedMotion()) remove();
      else global.setTimeout(remove, 200);
    }
    close.addEventListener("click", dismiss);
    var duration = typeof opts.duration === "number" ? opts.duration : 4200;
    if (duration > 0) timer = global.setTimeout(dismiss, duration);
    node.addEventListener("pointerenter", function () {
      global.clearTimeout(timer);
    });
    node.addEventListener("pointerleave", function () {
      if (duration > 0) timer = global.setTimeout(dismiss, 1600);
    });
    return dismiss;
  }

  function initToastTriggers(root) {
    $$("[data-rui-toast]", root).forEach(function (btn) {
      if (!claim(btn, "Toast")) return;
      if (btn.tagName === "BUTTON") btn.type = "button";
      btn.addEventListener("click", function () {
        toast({
          variant: btn.dataset.ruiToast || "info",
          title: btn.dataset.toastTitle || "Notification",
          description: btn.dataset.toastDesc || "",
        });
      });
    });
  }

  /* ---------- command palette ------------------------------------------------ */

  function initPalette(root) {
    $$("[data-rui-palette]", root).forEach(function (overlay) {
      if (!claim(overlay, "Palette")) return;
      var input = $("[data-rui-palette-input]", overlay);
      var list = $("[role='listbox']", overlay);
      if (!input || !list) return;
      var items = $$("[role='option']", list);
      var empty = $("[data-rui-palette-empty]", overlay);
      var returnTo = null;
      var release = null;

      overlay.hidden = true;
      overlay.dataset.open = "false";
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-autocomplete", "list");
      input.setAttribute("aria-controls", list.id || (list.id = "rui-palette-list"));

      function visible() {
        return items.filter(function (it) {
          return !it.hidden;
        });
      }

      function highlight(el) {
        items.forEach(function (it) {
          it.setAttribute("aria-selected", it === el ? "true" : "false");
        });
        if (el) {
          input.setAttribute("aria-activedescendant", el.id);
          el.scrollIntoView({ block: "nearest" });
        } else {
          input.removeAttribute("aria-activedescendant");
        }
      }

      function filter() {
        var q = input.value.trim().toLowerCase();
        items.forEach(function (it) {
          var hay = (it.dataset.keywords || "") + " " + it.textContent;
          it.hidden = q ? hay.toLowerCase().indexOf(q) === -1 : false;
        });
        $$("[data-rui-palette-group]", list).forEach(function (g) {
          var any = false;
          var n = g.nextElementSibling;
          while (n && !n.hasAttribute("data-rui-palette-group")) {
            if (!n.hidden) any = true;
            n = n.nextElementSibling;
          }
          g.hidden = !any;
        });
        var vis = visible();
        if (empty) empty.hidden = vis.length > 0;
        highlight(vis[0] || null);
      }

      function open() {
        returnTo = document.activeElement;
        overlay.hidden = false;
        lockScroll();
        global.requestAnimationFrame(function () {
          overlay.dataset.open = "true";
        });
        release = trapFocus(overlay);
        input.value = "";
        filter();
        input.focus();
      }

      function close() {
        if (overlay.hidden) return;
        overlay.dataset.open = "false";
        if (release) release();
        release = null;
        unlockScroll();
        var done = function () {
          overlay.hidden = true;
        };
        if (prefersReducedMotion()) done();
        else global.setTimeout(done, 200);
        if (returnTo && returnTo.focus) returnTo.focus();
      }

      function choose(el) {
        if (!el) return;
        close();
        overlay.dispatchEvent(
          new CustomEvent("rui:select", { detail: { value: el.dataset.value || el.textContent.trim() } })
        );
        toast({ variant: "info", title: "Ran command", description: (el.dataset.value || el.textContent.trim()) });
      }

      items.forEach(function (it, i) {
        if (!it.id) it.id = "rui-palette-opt-" + i;
        it.addEventListener("click", function () {
          choose(it);
        });
        it.addEventListener("pointermove", function () {
          highlight(it);
        });
      });

      input.addEventListener("input", filter);
      overlay.addEventListener("keydown", function (e) {
        var vis = visible();
        var cur = vis.indexOf($("[aria-selected='true']", list));
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          highlight(vis[nextIndex(cur, 1, vis.length)]);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          highlight(vis[nextIndex(cur, -1, vis.length)]);
        } else if (e.key === "Enter") {
          e.preventDefault();
          choose(vis[cur < 0 ? 0 : cur]);
        }
      });
      overlay.addEventListener("mousedown", function (e) {
        if (e.target === overlay) close();
      });

      $$("[data-rui-palette-open]").forEach(function (btn) {
        if (!claim(btn, "PaletteOpen")) return;
        if (btn.tagName === "BUTTON") btn.type = "button";
        btn.addEventListener("click", open);
      });

      document.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
          e.preventDefault();
          if (overlay.hidden) open();
          else close();
        }
      });
    });
  }

  /* ---------- global Escape: menus and modals -------------------------------- */

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (openMenus.length) {
      openMenus[openMenus.length - 1].close();
      return;
    }
    if (modalStack.length) {
      var top = modalStack[modalStack.length - 1];
      if (top.overlay.dataset.dismissable !== "false") closeModal(top.id);
    }
  });

  /* ---------- pagination ------------------------------------------------------ */

  function initPagination(root) {
    $$("[data-rui-pagination]", root).forEach(function (nav) {
      if (!claim(nav, "Pager")) return;
      nav.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-page]");
        if (!btn || !nav.contains(btn)) return;
        $$("[data-page]", nav).forEach(function (b) {
          b.removeAttribute("aria-current");
        });
        btn.setAttribute("aria-current", "page");
        nav.dispatchEvent(new CustomEvent("rui:change", { detail: { page: btn.dataset.page } }));
      });
    });
  }

  /* ---------- demo-only helpers used by index.html ---------------------------- */

  function initCopy(root) {
    $$("[data-rui-copy]", root).forEach(function (btn) {
      if (!claim(btn, "Copy")) return;
      btn.type = "button";
      btn.addEventListener("click", function () {
        var pre = document.getElementById(btn.dataset.ruiCopy || "");
        if (!pre) return;
        var text = pre.innerText;
        var ok = function () {
          toast({ variant: "success", title: "Copied to clipboard", description: "Markup is ready to paste." });
        };
        if (global.navigator.clipboard && global.isSecureContext) {
          global.navigator.clipboard.writeText(text).then(ok, fallback);
        } else {
          fallback();
        }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
          document.body.appendChild(ta);
          ta.select();
          var done = false;
          try {
            done = document.execCommand("copy");
          } catch (err) {
            done = false;
          }
          document.body.removeChild(ta);
          if (done) ok();
          else toast({ variant: "warning", title: "Copy blocked", description: "Select the code and copy it manually." });
        }
      });
    });
  }

  function initLoadingDemo(root) {
    $$("[data-rui-loading-demo]", root).forEach(function (btn) {
      if (!claim(btn, "LoadDemo")) return;
      btn.type = "button";
      btn.addEventListener("click", function () {
        if (btn.dataset.loading === "true") return;
        btn.dataset.loading = "true";
        btn.setAttribute("aria-busy", "true");
        global.setTimeout(function () {
          btn.dataset.loading = "false";
          btn.removeAttribute("aria-busy");
          toast({ variant: "success", title: "Collection published", description: "42 references are now public." });
        }, 1600);
      });
    });
  }

  function initProgressDemo(root) {
    $$("[data-rui-progress-demo]", root).forEach(function (wrap) {
      if (!claim(wrap, "ProgDemo")) return;
      var bar = $(".rui-progress__bar", wrap);
      var meter = wrap.closest("[role='progressbar']") || $("[role='progressbar']", wrap);
      var btn = $("[data-rui-progress-step]", wrap);
      if (!bar || !btn) return;
      var value = parseInt(wrap.dataset.value || "24", 10);
      function render() {
        bar.style.width = value + "%";
        if (meter) {
          meter.setAttribute("aria-valuenow", String(value));
          meter.setAttribute("aria-valuetext", value + "% uploaded");
        }
      }
      btn.type = "button";
      btn.addEventListener("click", function () {
        value = value >= 100 ? 0 : Math.min(100, value + 18);
        render();
      });
      render();
    });
  }

  function initScrollSpy(root) {
    var nav = $("[data-rui-scrollspy]", root);
    if (!nav || !claim(nav, "Spy")) return;
    var links = $$("a[href^='#']", nav);
    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var t = document.getElementById(id);
      if (!t) return;
      map[id] = a;
      targets.push(t);
    });
    if (!targets.length || !global.IntersectionObserver) return;
    var seen = {};
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          seen[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0;
        });
        var best = null;
        targets.forEach(function (t) {
          if (seen[t.id] && (!best || seen[t.id] > seen[best.id])) best = t;
        });
        links.forEach(function (a) {
          a.removeAttribute("aria-current");
        });
        if (best && map[best.id]) map[best.id].setAttribute("aria-current", "true");
      },
      { rootMargin: "-72px 0px -60% 0px", threshold: [0, 0.15, 0.5, 1] }
    );
    targets.forEach(function (t) {
      io.observe(t);
    });
  }

  /* ---------- public surface --------------------------------------------------- */

  function init(root) {
    root = root || document;
    initThemeToggle(root);
    initTabs(root);
    initSegmented(root);
    initToggles(root);
    initSearch(root);
    initSlider(root);
    initAccordion(root);
    initMenu(root);
    initPopover(root);
    initTooltip(root);
    initModal(root);
    initToastTriggers(root);
    initPalette(root);
    initPagination(root);
    initCopy(root);
    initLoadingDemo(root);
    initProgressDemo(root);
    initScrollSpy(root);
    return root;
  }

  var ReferoUI = {
    init: init,
    toast: toast,
    openModal: openModal,
    closeModal: closeModal,
    setTheme: applyTheme,
    getTheme: currentTheme,
    version: "1.0.0",
  };

  global.ReferoUI = ReferoUI;

  // Apply the stored theme as early as possible, before first paint if we can.
  var stored = readStoredTheme();
  if (stored === "light" || stored === "dark") document.documentElement.setAttribute("data-theme", stored);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init(document);
    });
  } else {
    init(document);
  }
})(typeof window !== "undefined" ? window : this);
