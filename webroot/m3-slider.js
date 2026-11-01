/**
 * <m3-slider> — Material Design 3 Expressive slider
 *
 * Geometry: 16dp track, 4x44dp pill handle, 6dp gap on both sides of the handle.
 * Motion:  handle/track travel uses a spatial curve, finger tracking is instant,
 *          press scale and the value bubble use expressive easing.
 *
 * API compatible with mdui-slider:
 *   attributes: min / max / step / value / disabled / aria-label
 *   properties: min / max / step / value (numbers)
 *   events:     input (live) / change (commit)
 */
(() => {
  const CSS = `
    :host {
      display: block;
      -webkit-tap-highlight-color: transparent;
      --_track-h: 16px;
      --_gap: 6px;
      --_handle-w: 4px;
      --_active: rgb(var(--mdui-color-primary));
      --_inactive: rgb(var(--mdui-color-secondary-container));
      --_handle: rgb(var(--mdui-color-primary));
      --_state: rgba(var(--mdui-color-primary), 0.12);
      --_dot: rgba(var(--mdui-color-on-surface-variant), 0.38);
      --_bubble-bg: rgb(var(--mdui-color-primary));
      --_bubble-fg: rgb(var(--mdui-color-on-primary));
      --_ease-standard: cubic-bezier(0.2, 0, 0, 1);
      --_ease-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
      --_ease-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
      --_ease-spring: cubic-bezier(0.34, 1.26, 0.5, 1);
      --_travel: 240ms;
    }

    :host([disabled]) {
      opacity: 0.38;
      pointer-events: none;
    }

    .root {
      position: relative;
      display: block;
      width: 100%;
      height: 44px;
      contain: layout style;
    }

    /* ---- tracks ---- */

    .track {
      position: absolute;
      top: 50%;
      height: var(--_track-h);
      margin-top: calc(var(--_track-h) / -2);
      border-radius: var(--md-sys-shape-corner-full, 999px);
      transition:
        left var(--_travel) var(--_ease-standard),
        width var(--_travel) var(--_ease-standard);
    }

    .track-active {
      left: 2px;
      width: max(0px, calc(var(--pos, 0%) - var(--_gap) - var(--_handle-w) / 2 - 2px));
      background: var(--_active);
    }

    .track-inactive {
      left: max(2px, calc(var(--pos, 0%) + var(--_gap) + var(--_handle-w) / 2));
      right: 2px;
      background: var(--_inactive);
    }

    .stop {
      position: absolute;
      top: 50%;
      right: 3px;
      width: 4px;
      height: 4px;
      margin-top: -2px;
      border-radius: var(--md-sys-shape-corner-full, 999px);
      background: var(--_dot);
    }

    /* ---- press state layer (does not scale with the handle) ---- */

    .state {
      position: absolute;
      top: 50%;
      left: clamp(2px, var(--pos, 0%), calc(100% - 2px));
      width: 40px;
      height: 40px;
      margin-top: -20px;
      transform: translateX(-50%);
      border-radius: var(--md-sys-shape-corner-full, 999px);
      background: var(--_state);
      opacity: 0;
      pointer-events: none;
      transition:
        left var(--_travel) var(--_ease-standard),
        opacity 140ms var(--_ease-standard);
    }

    :host([data-pressed]) .state {
      opacity: 1;
      transition:
        left var(--_travel) var(--_ease-standard),
        opacity 90ms var(--_ease-decelerate);
    }

    /* ---- handle ---- */

    .handle {
      position: absolute;
      top: 50%;
      left: clamp(2px, var(--pos, 0%), calc(100% - 2px));
      width: var(--_handle-w);
      height: 44px;
      margin-top: -22px;
      transform: translateX(-50%) scaleX(1);
      transform-origin: center;
      border-radius: 2px;
      background: var(--_handle);
      will-change: transform;
      transition:
        left var(--_travel) var(--_ease-standard),
        transform 220ms var(--_ease-spring);
    }

    :host([data-pressed]) .handle {
      transform: translateX(-50%) scaleX(2);
    }

    :host(:focus-within) .handle {
      outline: 2px solid var(--_handle);
      outline-offset: 2px;
    }

    /* ---- value bubble ---- */

    .bubble {
      position: absolute;
      top: -8px;
      left: clamp(26px, var(--pos, 0%), calc(100% - 26px));
      display: flex;
      align-items: center;
      height: 28px;
      padding: 0 10px;
      border-radius: var(--md-sys-shape-corner-full, 999px);
      background: var(--_bubble-bg);
      color: var(--_bubble-fg);
      font: var(--md-sys-typescale-label-medium, 500 12px/16px Roboto, "Noto Sans SC", sans-serif);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, -100%) scale(0.6);
      transform-origin: center bottom;
      transition:
        opacity 80ms var(--_ease-accelerate),
        transform 120ms var(--_ease-accelerate);
    }

    :host([data-pressed]) .bubble {
      opacity: 1;
      transform: translate(-50%, -100%) scale(1);
      transition:
        opacity 120ms var(--_ease-decelerate),
        transform 280ms var(--_ease-spring);
    }

    /* ---- finger tracking: no catch-up animation while dragging ---- */

    :host([data-dragging]) .handle {
      transition: transform 220ms var(--_ease-spring);
    }

    :host([data-dragging]) .state {
      transition: opacity 90ms var(--_ease-decelerate);
    }

    :host([data-dragging]) .track {
      transition: none;
    }

    /* ---- input ---- */

    input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
    }
  `;

  const template = document.createElement("template");
  template.innerHTML = `
    <style>${CSS}</style>
    <div class="root">
      <div class="track track-inactive" part="track-inactive"></div>
      <div class="track track-active" part="track-active"></div>
      <div class="stop" part="stop-indicator"></div>
      <div class="state" part="state-layer"></div>
      <div class="handle" part="handle"></div>
      <div class="bubble" part="value-indicator" aria-hidden="true"></div>
      <input type="range" part="input">
    </div>
  `;

  const DRAG_THRESHOLD = 3;

  function formatValue(value) {
    const rounded = Math.round(Number(value) * 100) / 100;
    return String(rounded);
  }

  class M3Slider extends HTMLElement {
    static get observedAttributes() {
      return ["min", "max", "step", "value", "disabled", "aria-label"];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" }).append(template.content.cloneNode(true));
      this._input = this.shadowRoot.querySelector("input");
      this._handle = this.shadowRoot.querySelector(".handle");
      this._bubble = this.shadowRoot.querySelector(".bubble");
      this._pos = null;
      this._pointerId = null;
      this._startX = 0;
      this._dragging = false;

      this._input.addEventListener("input", () => {
        this.setAttribute("value", this._input.value);
        this.dispatchEvent(new Event("input", { bubbles: true }));
      });

      this._input.addEventListener("change", () => {
        this._release();
        this.dispatchEvent(new Event("change", { bubbles: true }));
      });

      this._onPointerDown = (event) => {
        if (this.hasAttribute("disabled")) return;
        this._pointerId = event.pointerId;
        this._startX = event.clientX;
        this._dragging = false;
        this.toggleAttribute("data-pressed", true);
      };

      this._onPointerMove = (event) => {
        if (this._pointerId === null || this._dragging) return;
        if (Math.abs(event.clientX - this._startX) > DRAG_THRESHOLD) {
          this._dragging = true;
          this.toggleAttribute("data-dragging", true);
        }
      };

      this._onRelease = () => this._release();

      this._input.addEventListener("pointerdown", this._onPointerDown);
      this._input.addEventListener("pointermove", this._onPointerMove);
      this._input.addEventListener("pointerup", this._onRelease);
      this._input.addEventListener("pointercancel", this._onRelease);
      window.addEventListener("pointerup", this._onRelease);
      window.addEventListener("pointercancel", this._onRelease);
    }

    disconnectedCallback() {
      window.removeEventListener("pointerup", this._onRelease);
      window.removeEventListener("pointercancel", this._onRelease);
    }

    get min() {
      const value = Number(this.getAttribute("min"));
      return Number.isFinite(value) ? value : 0;
    }

    set min(value) {
      this.setAttribute("min", String(value));
    }

    get max() {
      const value = Number(this.getAttribute("max"));
      return Number.isFinite(value) ? value : 100;
    }

    set max(value) {
      this.setAttribute("max", String(value));
    }

    get step() {
      const value = Number(this.getAttribute("step"));
      return Number.isFinite(value) && value > 0 ? value : 1;
    }

    set step(value) {
      this.setAttribute("step", String(value));
    }

    get value() {
      const value = Number(this.getAttribute("value"));
      return Number.isFinite(value) ? value : this.min;
    }

    set value(value) {
      this.setAttribute("value", String(value));
    }

    connectedCallback() {
      this._syncInput();
      this._render();
    }

    attributeChangedCallback() {
      this._syncInput();
      this._render();
    }

    _release() {
      this._pointerId = null;
      this._dragging = false;
      this.removeAttribute("data-pressed");
      this.removeAttribute("data-dragging");
    }

    _syncInput() {
      const input = this._input;
      if (!input) return;
      const min = this.min;
      const max = Math.max(min, this.max);
      const clamped = Math.min(max, Math.max(min, this.value));

      // Only write when the value actually differs: reassigning input.value
      // during a drag interrupts the native gesture and causes stutter.
      if (input.min !== String(min)) input.min = String(min);
      if (input.max !== String(max)) input.max = String(max);
      if (input.step !== String(this.step)) input.step = String(this.step);
      if (input.value !== String(clamped)) input.value = String(clamped);
      if (input.disabled !== this.hasAttribute("disabled")) {
        input.disabled = this.hasAttribute("disabled");
      }

      const label = this.getAttribute("aria-label");
      if (label) {
        if (input.getAttribute("aria-label") !== label) input.setAttribute("aria-label", label);
      } else if (input.hasAttribute("aria-label")) {
        input.removeAttribute("aria-label");
      }
    }

    _render() {
      const min = this.min;
      const max = Math.max(min, this.max);
      const value = Math.min(max, Math.max(min, this.value));
      const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
      const pos = `${percent}%`;
      if (this._pos !== pos) {
        this._pos = pos;
        this.style.setProperty("--pos", pos);
      }
      const text = formatValue(value);
      if (this._bubble && this._bubble.textContent !== text) {
        this._bubble.textContent = text;
      }
    }
  }

  if (!customElements.get("m3-slider")) customElements.define("m3-slider", M3Slider);
})();
