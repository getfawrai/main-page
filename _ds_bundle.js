/* @ds-bundle: {"format":3,"namespace":"FawrAIDesignSystem_d83904","components":[],"sourceHashes":{"deliverables/deck-stage.js":"ad1c016a6256","ui_kits/marketing-site/HomeSections.jsx":"7f02eb87bd33","ui_kits/marketing-site/NavFooter.jsx":"6bf319ec694e","ui_kits/marketing-site/NavFooter.standalone.jsx":"28a69a0e8057","ui_kits/marketing-site/OtherPages.jsx":"846e4363a906","ui_kits/marketing-site/Primitives.jsx":"04373dd4ffd9","ui_kits/marketing-site/Primitives.standalone.jsx":"586e03309a8b","ui_kits/operator-console/ConsoleShell.jsx":"967c73e4e34d","ui_kits/operator-console/Screens.jsx":"4cac8b43e8ca"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.FawrAIDesignSystem_d83904 = window.FawrAIDesignSystem_d83904 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// deliverables/deck-stage.js
try { (() => {
/**
 * <deck-stage> — reusable web component for HTML decks.
 *
 * Handles:
 *  (a) speaker notes — reads <script type="application/json" id="speaker-notes">
 *      and posts {slideIndexChanged: N} to the parent window on nav.
 *  (b) keyboard navigation — ←/→, PgUp/PgDn, Space, Home/End, number keys.
 *  (c) press R to reset to slide 0 (with a tasteful keyboard hint).
 *  (d) bottom-center overlay showing slide count + hints, fades out on idle.
 *  (e) auto-scaling — inner canvas is a fixed design size (default 1920×1080)
 *      scaled with `transform: scale()` to fit the viewport, letterboxed.
 *      Set the `noscale` attribute to render at authored size (1:1) — the
 *      PPTX exporter sets this so its DOM capture sees unscaled geometry.
 *  (f) print — `@media print` lays every slide out as its own page at the
 *      design size, so the browser's Print → Save as PDF produces a clean
 *      one-page-per-slide PDF with no extra setup.
 *
 * Slides are HIDDEN, not unmounted. Non-active slides stay in the DOM with
 * `visibility: hidden` + `opacity: 0`, so their state (videos, iframes,
 * form inputs, React trees) is preserved across navigation.
 *
 * Lifecycle event — the component dispatches a `slidechange` CustomEvent on
 * itself whenever the active slide changes (including the initial mount).
 * The event bubbles and composes out of shadow DOM, so you can listen on
 * the <deck-stage> element or on document:
 *
 *   document.querySelector('deck-stage').addEventListener('slidechange', (e) => {
 *     e.detail.index         // new 0-based index
 *     e.detail.previousIndex // previous index, or -1 on init
 *     e.detail.total         // total slide count
 *     e.detail.slide         // the new active slide element
 *     e.detail.previousSlide // the prior slide element, or null on init
 *     e.detail.reason        // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
 *   });
 *
 * Persistence: none at the deck level. The host app keeps the current slide
 * in its own URL (?slide=) and re-delivers it via location.hash on load, so a
 * bare load with no hash always starts at slide 1.
 *
 * Usage:
 *   <deck-stage width="1920" height="1080">
 *     <section data-label="Title">...</section>
 *     <section data-label="Agenda">...</section>
 *   </deck-stage>
 *
 * Slides are the direct element children of <deck-stage>. Each slide is
 * automatically tagged with:
 *   - data-screen-label="NN Label"   (1-indexed, for comment flow)
 *   - data-om-validate="no_overflowing_text,no_overlapping_text,slide_sized_text"
 */

(() => {
  const DESIGN_W_DEFAULT = 1920;
  const DESIGN_H_DEFAULT = 1080;
  const OVERLAY_HIDE_MS = 1800;
  const VALIDATE_ATTR = 'no_overflowing_text,no_overlapping_text,slide_sized_text';
  const pad2 = n => String(n).padStart(2, '0');
  const stylesheet = `
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }
    .btn.reset {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.02em;
      padding: 0 10px 0 12px;
      gap: 6px;
      color: rgba(255,255,255,0.72);
    }
    .btn.reset .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1;
      color: rgba(255,255,255,0.88);
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    .divider {
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,0.18);
      margin: 0 2px;
    }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;
  class DeckStage extends HTMLElement {
    static get observedAttributes() {
      return ['width', 'height', 'noscale'];
    }
    constructor() {
      super();
      this._root = this.attachShadow({
        mode: 'open'
      });
      this._index = 0;
      this._slides = [];
      this._notes = [];
      this._hideTimer = null;
      this._mouseIdleTimer = null;
      this._onKey = this._onKey.bind(this);
      this._onResize = this._onResize.bind(this);
      this._onSlotChange = this._onSlotChange.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onTapBack = this._onTapBack.bind(this);
      this._onTapForward = this._onTapForward.bind(this);
    }
    get designWidth() {
      return parseInt(this.getAttribute('width'), 10) || DESIGN_W_DEFAULT;
    }
    get designHeight() {
      return parseInt(this.getAttribute('height'), 10) || DESIGN_H_DEFAULT;
    }
    connectedCallback() {
      this._render();
      this._loadNotes();
      this._syncPrintPageRule();
      window.addEventListener('keydown', this._onKey);
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, {
        passive: true
      });
      // Initial collection + layout happens via slotchange, which fires on mount.
    }
    disconnectedCallback() {
      window.removeEventListener('keydown', this._onKey);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._mouseIdleTimer) clearTimeout(this._mouseIdleTimer);
    }
    attributeChangedCallback() {
      if (this._canvas) {
        this._canvas.style.width = this.designWidth + 'px';
        this._canvas.style.height = this.designHeight + 'px';
        this._canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
        this._canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
        this._fit();
        this._syncPrintPageRule();
      }
    }
    _render() {
      const style = document.createElement('style');
      style.textContent = stylesheet;
      const stage = document.createElement('div');
      stage.className = 'stage';
      const canvas = document.createElement('div');
      canvas.className = 'canvas';
      canvas.style.width = this.designWidth + 'px';
      canvas.style.height = this.designHeight + 'px';
      canvas.style.setProperty('--deck-design-w', this.designWidth + 'px');
      canvas.style.setProperty('--deck-design-h', this.designHeight + 'px');
      const slot = document.createElement('slot');
      slot.addEventListener('slotchange', this._onSlotChange);
      canvas.appendChild(slot);
      stage.appendChild(canvas);

      // Tap zones (mobile): left third = back, right third = forward.
      const tapzones = document.createElement('div');
      tapzones.className = 'tapzones export-hidden';
      tapzones.setAttribute('aria-hidden', 'true');
      tapzones.setAttribute('data-noncommentable', '');
      const tzBack = document.createElement('div');
      tzBack.className = 'tapzone tapzone--back';
      const tzMid = document.createElement('div');
      tzMid.className = 'tapzone tapzone--mid';
      tzMid.style.pointerEvents = 'none';
      const tzFwd = document.createElement('div');
      tzFwd.className = 'tapzone tapzone--fwd';
      tzBack.addEventListener('click', this._onTapBack);
      tzFwd.addEventListener('click', this._onTapForward);
      tapzones.append(tzBack, tzMid, tzFwd);

      // Overlay: compact, solid black, with clickable controls.
      const overlay = document.createElement('div');
      overlay.className = 'overlay export-hidden';
      overlay.setAttribute('role', 'toolbar');
      overlay.setAttribute('aria-label', 'Deck controls');
      overlay.setAttribute('data-noncommentable', '');
      overlay.innerHTML = `
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
        <span class="divider"></span>
        <button class="btn reset" type="button" aria-label="Reset to first slide" title="Reset (R)">Reset<span class="kbd">R</span></button>
      `;
      overlay.querySelector('.prev').addEventListener('click', () => this._go(this._index - 1, 'click'));
      overlay.querySelector('.next').addEventListener('click', () => this._go(this._index + 1, 'click'));
      overlay.querySelector('.reset').addEventListener('click', () => this._go(0, 'click'));
      this._root.append(style, stage, tapzones, overlay);
      this._canvas = canvas;
      this._slot = slot;
      this._overlay = overlay;
      this._countEl = overlay.querySelector('.current');
      this._totalEl = overlay.querySelector('.total');
    }

    /** @page must live in the document stylesheet — it's a no-op inside
     *  shadow DOM. Inject/update a single <head> style tag so the print
     *  sheet matches the design size and Save-as-PDF yields one slide per
     *  page with no margins. */
    _syncPrintPageRule() {
      const id = 'deck-stage-print-page';
      let tag = document.getElementById(id);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = id;
        document.head.appendChild(tag);
      }
      tag.textContent = '@page { size: ' + this.designWidth + 'px ' + this.designHeight + 'px; margin: 0; } ' + '@media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } ' + '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }';
    }
    _onSlotChange() {
      this._collectSlides();
      this._restoreIndex();
      this._applyIndex({
        showOverlay: false,
        broadcast: true,
        reason: 'init'
      });
      this._fit();
    }
    _collectSlides() {
      const assigned = this._slot.assignedElements({
        flatten: true
      });
      this._slides = assigned.filter(el => {
        // Skip template/style/script nodes even if someone slots them.
        const tag = el.tagName;
        return tag !== 'TEMPLATE' && tag !== 'SCRIPT' && tag !== 'STYLE';
      });
      this._slides.forEach((slide, i) => {
        const n = i + 1;
        // Determine a label for comment flow: prefer explicit data-label,
        // then an existing data-screen-label, then first heading, else "Slide".
        let label = slide.getAttribute('data-label');
        if (!label) {
          const existing = slide.getAttribute('data-screen-label');
          if (existing) {
            // Strip any leading number the author may have included.
            label = existing.replace(/^\s*\d+\s*/, '').trim() || existing;
          }
        }
        if (!label) {
          const h = slide.querySelector('h1, h2, h3, [data-title]');
          if (h) label = (h.textContent || '').trim().slice(0, 40);
        }
        if (!label) label = 'Slide';
        slide.setAttribute('data-screen-label', `${pad2(n)} ${label}`);

        // Validation attribute for comment flow / auto-checks.
        if (!slide.hasAttribute('data-om-validate')) {
          slide.setAttribute('data-om-validate', VALIDATE_ATTR);
        }
        slide.setAttribute('data-deck-slide', String(i));
      });
      if (this._totalEl) this._totalEl.textContent = String(this._slides.length || 1);
      if (this._index >= this._slides.length) this._index = Math.max(0, this._slides.length - 1);
    }
    _loadNotes() {
      const tag = document.getElementById('speaker-notes');
      if (!tag) {
        this._notes = [];
        return;
      }
      try {
        const parsed = JSON.parse(tag.textContent || '[]');
        if (Array.isArray(parsed)) this._notes = parsed;
      } catch (e) {
        console.warn('[deck-stage] Failed to parse #speaker-notes JSON:', e);
        this._notes = [];
      }
    }
    _restoreIndex() {
      // The host's ?slide= param is delivered as a #<int> hash (1-indexed) on
      // the iframe src. No hash → slide 1; the deck itself keeps no position
      // state across loads.
      const h = (location.hash || '').match(/^#(\d+)$/);
      if (h) {
        const n = parseInt(h[1], 10) - 1;
        if (n >= 0 && n < this._slides.length) this._index = n;
      }
    }
    _applyIndex({
      showOverlay = true,
      broadcast = true,
      reason = 'init'
    } = {}) {
      if (!this._slides.length) return;
      const prev = this._prevIndex == null ? -1 : this._prevIndex;
      const curr = this._index;
      // Keep the iframe's own hash in sync so an in-iframe location.reload()
      // (reload banner path in viewer-handle.ts) lands on the current slide,
      // not the stale deep-link hash from initial load.
      try {
        history.replaceState(null, '', '#' + (curr + 1));
      } catch (e) {}
      this._slides.forEach((s, i) => {
        if (i === curr) s.setAttribute('data-deck-active', '');else s.removeAttribute('data-deck-active');
      });
      if (this._countEl) this._countEl.textContent = String(curr + 1);
      if (broadcast) {
        // (1) Legacy: host-window postMessage for speaker-notes renderers.
        try {
          window.postMessage({
            slideIndexChanged: curr
          }, '*');
        } catch (e) {}

        // (2) In-page CustomEvent on the <deck-stage> element itself.
        //     Bubbles and composes out of shadow DOM so slide code can listen:
        //       document.querySelector('deck-stage').addEventListener('slidechange', e => {
        //         e.detail.index, e.detail.previousIndex, e.detail.total, e.detail.slide, e.detail.reason
        //       });
        const detail = {
          index: curr,
          previousIndex: prev,
          total: this._slides.length,
          slide: this._slides[curr] || null,
          previousSlide: prev >= 0 ? this._slides[prev] || null : null,
          reason: reason // 'init' | 'keyboard' | 'click' | 'tap' | 'api'
        };
        this.dispatchEvent(new CustomEvent('slidechange', {
          detail,
          bubbles: true,
          composed: true
        }));
      }
      this._prevIndex = curr;
      if (showOverlay) this._flashOverlay();
    }
    _flashOverlay() {
      if (!this._overlay) return;
      this._overlay.setAttribute('data-visible', '');
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._overlay.removeAttribute('data-visible');
      }, OVERLAY_HIDE_MS);
    }
    _fit() {
      if (!this._canvas) return;
      // PPTX export sets noscale so the DOM capture sees authored-size
      // geometry — the scaled canvas is in shadow DOM, so the exporter's
      // resetTransformSelector can't reach .canvas.style.transform directly.
      if (this.hasAttribute('noscale')) {
        this._canvas.style.transform = 'none';
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / this.designWidth, vh / this.designHeight);
      this._canvas.style.transform = `scale(${s})`;
    }
    _onResize() {
      this._fit();
    }
    _onMouseMove() {
      // Keep overlay visible while mouse moves; hide after idle.
      this._flashOverlay();
    }
    _onTapBack(e) {
      e.preventDefault();
      this._go(this._index - 1, 'tap');
    }
    _onTapForward(e) {
      e.preventDefault();
      this._go(this._index + 1, 'tap');
    }
    _onKey(e) {
      // Ignore when the user is typing.
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key;
      let handled = true;
      if (key === 'ArrowRight' || key === 'PageDown' || key === ' ' || key === 'Spacebar') {
        this._go(this._index + 1, 'keyboard');
      } else if (key === 'ArrowLeft' || key === 'PageUp') {
        this._go(this._index - 1, 'keyboard');
      } else if (key === 'Home') {
        this._go(0, 'keyboard');
      } else if (key === 'End') {
        this._go(this._slides.length - 1, 'keyboard');
      } else if (key === 'r' || key === 'R') {
        this._go(0, 'keyboard');
      } else if (/^[0-9]$/.test(key)) {
        // 1..9 jump to that slide; 0 jumps to 10.
        const n = key === '0' ? 9 : parseInt(key, 10) - 1;
        if (n < this._slides.length) this._go(n, 'keyboard');
      } else {
        handled = false;
      }
      if (handled) {
        e.preventDefault();
        this._flashOverlay();
      }
    }
    _go(i, reason = 'api') {
      if (!this._slides.length) return;
      const clamped = Math.max(0, Math.min(this._slides.length - 1, i));
      if (clamped === this._index) {
        this._flashOverlay();
        return;
      }
      this._index = clamped;
      this._applyIndex({
        showOverlay: true,
        broadcast: true,
        reason
      });
    }

    // Public API ------------------------------------------------------------

    /** Current slide index (0-based). */
    get index() {
      return this._index;
    }
    /** Total slide count. */
    get length() {
      return this._slides.length;
    }
    /** Programmatically navigate. */
    goTo(i) {
      this._go(i, 'api');
    }
    next() {
      this._go(this._index + 1, 'api');
    }
    prev() {
      this._go(this._index - 1, 'api');
    }
    reset() {
      this._go(0, 'api');
    }
  }
  if (!customElements.get('deck-stage')) {
    customElements.define('deck-stage', DeckStage);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "deliverables/deck-stage.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/HomeSections.jsx
try { (() => {
const Hero = ({
  onPrimary,
  onSecondary
}) => /*#__PURE__*/React.createElement("section", {
  className: "fw-section fw-hero",
  style: {
    background: 'var(--fawr-navy)',
    color: 'var(--fawr-offwhite)',
    padding: '96px 64px 112px',
    position: 'relative',
    overflow: 'hidden'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1200,
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--fawr-gold)',
    marginBottom: 28
  }
}, "The brain behind every client relationship"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(40px, 5.4vw, 64px)',
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: '-0.022em',
    color: 'var(--fawr-offwhite)',
    margin: 0,
    maxWidth: 900,
    textWrap: 'balance'
  }
}, "We turn strangers into clients.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
  style: {
    color: 'var(--fawr-sage)'
  }
}, "And clients into loyal ones.")), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)',
    margin: '32px 0'
  }
}), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 19,
    lineHeight: 1.6,
    color: '#9DB0C2',
    maxWidth: 560,
    margin: 0
  }
}, "A fully managed AI-powered sales and client relationship system built for aesthetic and medical clinics in Dubai.", /*#__PURE__*/React.createElement("br", null), "Your clinic sees the bookings. We handle everything else."), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 14,
    marginTop: 40
  }
}, /*#__PURE__*/React.createElement(Button, {
  variant: "gold",
  onClick: onPrimary
}, "Book a strategy call")), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 72,
    display: 'flex',
    gap: 56,
    color: '#6E8297',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 11,
    color: 'var(--fawr-sage)'
  }
}, "Trusted by clinics across"), /*#__PURE__*/React.createElement("span", null, "Dubai"), /*#__PURE__*/React.createElement("span", null, "Abu Dhabi"), /*#__PURE__*/React.createElement("span", null, "Sharjah"), /*#__PURE__*/React.createElement("span", null, "Riyadh"), /*#__PURE__*/React.createElement("span", null, "Doha"))));
const ProofBand = () => {
  const stats = [{
    n: '3.2×',
    l: 'Average increase in qualified bookings in the first 90 days.'
  }, {
    n: '87%',
    l: 'Of cold leads re-engaged within 30 days of going live.'
  }, {
    n: '3 sec',
    l: 'Median response time, every hour of the day.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "fw-section fw-proof",
    style: {
      background: 'var(--fawr-navy)',
      padding: '96px 64px',
      borderTop: '1px solid var(--fawr-navy-80)',
      color: 'var(--fawr-offwhite)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionEyebrow, {
    color: "var(--fawr-gold)"
  }, "Proof, not promise"), /*#__PURE__*/React.createElement("div", {
    className: "fw-grid-3",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 48
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 72,
      fontWeight: 700,
      color: 'var(--fawr-gold)',
      letterSpacing: '-0.03em',
      lineHeight: 1,
      marginBottom: 14
    }
  }, s.n), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 16,
      lineHeight: 1.55,
      color: '#9DB0C2',
      maxWidth: 320,
      margin: 0
    }
  }, s.l))))));
};
const HowItWorks = () => {
  const steps = [{
    n: '01',
    t: 'We study your clinic.',
    p: ''
  }, {
    n: '02',
    t: 'We build and run the system.',
    p: ''
  }, {
    n: '03',
    t: 'Your clinic sees the bookings.',
    p: ''
  }];
  return /*#__PURE__*/React.createElement("section", {
    className: "fw-section fw-how",
    style: {
      background: 'var(--fawr-navy-90)',
      padding: '96px 64px',
      color: 'var(--fawr-offwhite)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionEyebrow, {
    color: "var(--fawr-gold)"
  }, "How it works"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 44,
      fontWeight: 700,
      color: 'var(--fawr-offwhite)',
      letterSpacing: '-0.018em',
      lineHeight: 1.15,
      margin: '0 0 64px',
      maxWidth: 720,
      textWrap: 'balance'
    }
  }, "Not a chatbot. A sales system disguised as a conversation."), /*#__PURE__*/React.createElement("div", {
    className: "fw-grid-3",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 48
    }
  }, steps.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.n
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--fawr-gold)',
      letterSpacing: '0.14em',
      marginBottom: 16
    }
  }, s.n), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 22,
      fontWeight: 600,
      color: 'var(--fawr-offwhite)',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      margin: '0 0 14px'
    }
  }, s.t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      lineHeight: 1.6,
      color: '#9DB0C2',
      margin: 0
    }
  }, s.p))))));
};
const Differentiator = () => {
  const rows = [['A fully managed system', 'Software the clinic has to run'], ['Remembers every conversation', 'FAQ style, Scripted'], ['Converts the leads you already pay for', 'A lead-generation tool'], ['Personalised to each patient', 'Broadcast messages, Generic follow ups'], ['Built for GCC', 'One-size-fits-all global tool']];
  return /*#__PURE__*/React.createElement("section", {
    className: "fw-section fw-diff",
    style: {
      background: 'var(--fawr-offwhite)',
      padding: '96px 64px',
      borderTop: '1px solid var(--fawr-line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement(SectionEyebrow, null, "What we are \u2014 and what we're not"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 38,
      fontWeight: 700,
      color: 'var(--fawr-navy)',
      letterSpacing: '-0.015em',
      lineHeight: 1.18,
      margin: '0 0 48px',
      maxWidth: 680,
      textWrap: 'balance'
    }
  }, "The market is full of chatbots. We differentiate by being clear about what FawrAI isn't."), /*#__PURE__*/React.createElement("div", {
    className: "fw-diff-table",
    style: {
      border: '1px solid var(--fawr-line)',
      borderRadius: 8,
      background: '#fff',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fw-diff-row fw-diff-head",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--fawr-offwhite)',
      borderBottom: '1px solid var(--fawr-line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 24px',
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--fawr-sage)',
      letterSpacing: '0.16em',
      textTransform: 'uppercase'
    }
  }, "FawrAI is"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 24px',
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      fontWeight: 600,
      color: '#B5554A',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      borderLeft: '1px solid var(--fawr-line)'
    }
  }, "FawrAI is not")), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "fw-diff-row",
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      borderBottom: i < rows.length - 1 ? '1px solid var(--fawr-line)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 24px',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--fawr-navy)',
      fontWeight: 500
    }
  }, r[0]), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 24px',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      color: 'var(--fg-2)',
      borderLeft: '1px solid var(--fawr-line)',
      textDecoration: 'line-through',
      textDecorationColor: 'rgba(181,85,74,.5)'
    }
  }, r[1]))))));
};
const TestimonialBlock = () => /*#__PURE__*/React.createElement("section", {
  className: "fw-section fw-testimonial",
  style: {
    background: 'var(--fawr-navy)',
    padding: '96px 64px',
    color: 'var(--fawr-offwhite)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 860,
    margin: '0 auto',
    textAlign: 'left'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)',
    marginBottom: 32
  }
}), /*#__PURE__*/React.createElement("blockquote", {
  style: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 30,
    lineHeight: 1.35,
    fontWeight: 500,
    color: 'var(--fawr-offwhite)',
    letterSpacing: '-0.012em',
    textWrap: 'pretty'
  }
}, "\"We went from chasing leads to choosing between them. The follow-ups feel like they come from someone who remembers my patients, because they do.\""), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginTop: 32
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: 'var(--fawr-sage)',
    color: 'var(--fawr-offwhite)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 15
  }
}, "LA"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--fawr-offwhite)'
  }
}, "Dr. Layla Al-Mansoori"), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: '#9DB0C2'
  }
}, "Founder \xB7 Noor Aesthetic Clinic \xB7 Dubai")))));
const CTABand = ({
  onClick
}) => /*#__PURE__*/React.createElement("section", {
  className: "fw-section fw-cta",
  style: {
    background: 'var(--fawr-navy)',
    color: 'var(--fawr-offwhite)',
    padding: '96px 64px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1000,
    margin: '0 auto'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)',
    marginBottom: 24
  }
}), /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 48,
    fontWeight: 700,
    color: 'var(--fawr-offwhite)',
    letterSpacing: '-0.02em',
    lineHeight: 1.12,
    margin: '0 0 20px',
    maxWidth: 760,
    textWrap: 'balance'
  }
}, "The relationships we build today are the bookings you don't have to pay for tomorrow."), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 18,
    color: '#9DB0C2',
    maxWidth: 560,
    lineHeight: 1.6,
    margin: '0 0 36px'
  }
}, "With fawrAI, your next 90 days will look different."), /*#__PURE__*/React.createElement(Button, {
  variant: "gold",
  onClick: onClick
}, "Book a strategy call \u2192")));
Object.assign(window, {
  Hero,
  ProofBand,
  HowItWorks,
  Differentiator,
  TestimonialBlock,
  CTABand
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/HomeSections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/NavFooter.jsx
try { (() => {
const Nav = ({
  current,
  onNav
}) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  const items = [{
    id: 'home',
    label: 'How it works'
  }];
  const go = id => {
    onNav(id);
    setMenuOpen(false);
  };
  return /*#__PURE__*/React.createElement("nav", {
    className: "fw-nav",
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: scrolled ? 'rgba(248,245,240,.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--fawr-line)' : '1px solid transparent',
      padding: '18px 64px',
      display: 'flex',
      alignItems: 'center',
      gap: 40,
      transition: 'all 220ms cubic-bezier(.2,.6,.2,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-logo",
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    },
    onClick: () => go('home')
  }, /*#__PURE__*/React.createElement(Logo, {
    light: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-links",
    style: {
      display: 'flex',
      gap: 32,
      marginLeft: 16
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    onClick: () => go(it.id),
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      fontWeight: 500,
      color: scrolled ? current === it.id ? 'var(--fawr-navy)' : 'var(--fawr-charcoal)' : current === it.id ? 'var(--fawr-gold)' : 'var(--fawr-offwhite)',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 140ms'
    }
  }, it.label))), /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-cta",
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => go('book')
  }, "Book a call")), /*#__PURE__*/React.createElement("button", {
    className: "fw-nav-burger",
    "aria-label": menuOpen ? 'Close menu' : 'Open menu',
    onClick: () => setMenuOpen(v => !v),
    style: {
      marginLeft: 'auto',
      display: 'none',
      width: 44,
      height: 44,
      background: 'transparent',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 22,
      height: 14,
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--fawr-offwhite)',
      top: menuOpen ? 6 : 0,
      transform: menuOpen ? 'rotate(45deg)' : 'none',
      transition: 'all 220ms cubic-bezier(.2,.6,.2,1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--fawr-offwhite)',
      top: 6,
      opacity: menuOpen ? 0 : 1,
      transition: 'opacity 140ms'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--fawr-offwhite)',
      top: menuOpen ? 6 : 12,
      transform: menuOpen ? 'rotate(-45deg)' : 'none',
      transition: 'all 220ms cubic-bezier(.2,.6,.2,1)'
    }
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-drawer",
    style: {
      position: 'fixed',
      top: 64,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--fawr-navy)',
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      zIndex: 19
    }
  }, [{
    id: 'contact',
    label: 'Contact us'
  }, {
    id: 'book',
    label: 'Book a strategy call'
  }, {
    id: 'about',
    label: 'Who are we'
  }].map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    onClick: () => go(it.id),
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 600,
      color: 'var(--fawr-offwhite)',
      padding: '20px 0',
      borderBottom: '1px solid var(--fawr-navy-80)',
      cursor: 'pointer',
      textDecoration: 'none',
      letterSpacing: '-0.01em'
    }
  }, it.label))));
};
const Footer = () => /*#__PURE__*/React.createElement("footer", {
  className: "fw-footer",
  style: {
    background: 'var(--fawr-navy)',
    color: 'var(--fg-on-navy-dim)',
    padding: '64px 64px 40px',
    marginTop: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  className: "fw-footer-grid",
  style: {
    display: 'flex',
    gap: 64,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    maxWidth: 1200,
    margin: '0 auto',
    paddingBottom: 40,
    borderBottom: '1px solid var(--fawr-line-dark)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    flex: '1 1 260px',
    minWidth: 220
  }
}, /*#__PURE__*/React.createElement("img", {
  src: "logo-light.png",
  alt: "FawrAI",
  style: {
    display: 'none'
  }
}), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: '#9DB0C2',
    marginTop: 16,
    maxWidth: 320,
    lineHeight: 1.6
  }
})), [{
  h: 'FawrAI',
  items: ['How it works', 'Results', 'For clinics']
}, {
  h: 'Company',
  items: ['About', 'Case studies', 'Careers']
}, {
  h: 'Contact',
  items: ['hello@fawrai.com', 'Dubai, UAE']
}].map(col => /*#__PURE__*/React.createElement("div", {
  key: col.h,
  style: {
    minWidth: 140
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--fawr-gold)',
    marginBottom: 14
  }
}, col.h), col.items.map(i => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: '#9DB0C2',
    padding: '4px 0',
    cursor: 'pointer'
  }
}, i))))), /*#__PURE__*/React.createElement("div", {
  className: "fw-footer-baseline",
  style: {
    maxWidth: 1200,
    margin: '0 auto',
    paddingTop: 24,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: '#6E8297'
  }
}, /*#__PURE__*/React.createElement("span", null, "FawrAI \xB7 fawrai.com \xB7 Dubai, UAE"), /*#__PURE__*/React.createElement("span", null, "\xA9 2026 FawrAI. All rights reserved.")));
Object.assign(window, {
  Nav,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/NavFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/NavFooter.standalone.jsx
try { (() => {
const Nav = ({
  current,
  onNav
}) => {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);
  const items = [{
    id: 'home',
    label: 'How it works'
  }];
  const go = id => {
    onNav(id);
    setMenuOpen(false);
  };
  return /*#__PURE__*/React.createElement("nav", {
    className: "fw-nav",
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: scrolled ? 'rgba(248,245,240,.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--fawr-line)' : '1px solid transparent',
      padding: '18px 64px',
      display: 'flex',
      alignItems: 'center',
      gap: 40,
      transition: 'all 220ms cubic-bezier(.2,.6,.2,1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-logo",
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center'
    },
    onClick: () => go('home')
  }, /*#__PURE__*/React.createElement(Logo, {
    light: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-links",
    style: {
      display: 'flex',
      gap: 32,
      marginLeft: 16
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    onClick: () => go(it.id),
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      fontWeight: 500,
      color: scrolled ? current === it.id ? 'var(--fawr-navy)' : 'var(--fawr-charcoal)' : current === it.id ? 'var(--fawr-gold)' : 'var(--fawr-offwhite)',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'color 140ms'
    }
  }, it.label))), /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-cta",
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => go('book')
  }, "Book a call")), /*#__PURE__*/React.createElement("button", {
    className: "fw-nav-burger",
    "aria-label": menuOpen ? 'Close menu' : 'Open menu',
    onClick: () => setMenuOpen(v => !v),
    style: {
      marginLeft: 'auto',
      display: 'none',
      width: 44,
      height: 44,
      background: 'transparent',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 22,
      height: 14,
      display: 'inline-block'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--fawr-offwhite)',
      top: menuOpen ? 6 : 0,
      transform: menuOpen ? 'rotate(45deg)' : 'none',
      transition: 'all 220ms cubic-bezier(.2,.6,.2,1)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--fawr-offwhite)',
      top: 6,
      opacity: menuOpen ? 0 : 1,
      transition: 'opacity 140ms'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'var(--fawr-offwhite)',
      top: menuOpen ? 6 : 12,
      transform: menuOpen ? 'rotate(-45deg)' : 'none',
      transition: 'all 220ms cubic-bezier(.2,.6,.2,1)'
    }
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "fw-nav-drawer",
    style: {
      position: 'fixed',
      top: 64,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--fawr-navy)',
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      zIndex: 19
    }
  }, [{
    id: 'contact',
    label: 'Contact us'
  }, {
    id: 'book',
    label: 'Book a strategy call'
  }, {
    id: 'about',
    label: 'Who are we'
  }].map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    onClick: () => go(it.id),
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 28,
      fontWeight: 600,
      color: 'var(--fawr-offwhite)',
      padding: '20px 0',
      borderBottom: '1px solid var(--fawr-navy-80)',
      cursor: 'pointer',
      textDecoration: 'none',
      letterSpacing: '-0.01em'
    }
  }, it.label))));
};
const Footer = () => /*#__PURE__*/React.createElement("footer", {
  className: "fw-footer",
  style: {
    background: 'var(--fawr-navy)',
    color: 'var(--fg-on-navy-dim)',
    padding: '64px 64px 40px',
    marginTop: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  className: "fw-footer-grid",
  style: {
    display: 'flex',
    gap: 64,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    maxWidth: 1200,
    margin: '0 auto',
    paddingBottom: 40,
    borderBottom: '1px solid var(--fawr-line-dark)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    flex: '1 1 260px',
    minWidth: 220
  }
}, /*#__PURE__*/React.createElement("img", {
  src: window.__resources.logoLight,
  alt: "FawrAI",
  style: {
    display: 'none'
  }
}), /*#__PURE__*/React.createElement("p", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: '#9DB0C2',
    marginTop: 16,
    maxWidth: 320,
    lineHeight: 1.6
  }
})), [{
  h: 'FawrAI',
  items: ['How it works', 'Results', 'For clinics']
}, {
  h: 'Company',
  items: ['About', 'Case studies', 'Careers']
}, {
  h: 'Contact',
  items: ['hello@fawrai.com', 'Dubai, UAE']
}].map(col => /*#__PURE__*/React.createElement("div", {
  key: col.h,
  style: {
    minWidth: 140
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--fawr-gold)',
    marginBottom: 14
  }
}, col.h), col.items.map(i => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: '#9DB0C2',
    padding: '4px 0',
    cursor: 'pointer'
  }
}, i))))), /*#__PURE__*/React.createElement("div", {
  className: "fw-footer-baseline",
  style: {
    maxWidth: 1200,
    margin: '0 auto',
    paddingTop: 24,
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: '#6E8297'
  }
}, /*#__PURE__*/React.createElement("span", null, "FawrAI \xB7 fawrai.com \xB7 Dubai, UAE"), /*#__PURE__*/React.createElement("span", null, "\xA9 2026 FawrAI. All rights reserved.")));
Object.assign(window, {
  Nav,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/NavFooter.standalone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/OtherPages.jsx
try { (() => {
const CaseStudy = ({
  onCTA
}) => /*#__PURE__*/React.createElement("article", {
  style: {
    background: 'var(--fawr-navy)'
  }
}, /*#__PURE__*/React.createElement("header", {
  style: {
    padding: '80px 64px 56px',
    maxWidth: 880,
    margin: '0 auto'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--fawr-offwhite)',
    marginBottom: 20,
    opacity: 0.85
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    color: 'var(--fawr-gold)',
    marginRight: 8
  }
}, "\u25CF"), "Case study \xB7 Dubai \xB7 2025"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 52,
    fontWeight: 700,
    color: 'var(--fawr-offwhite)',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    margin: '0 0 24px',
    textWrap: 'balance'
  }
}, "How Noor Aesthetic stopped chasing leads \u2014 and started choosing between them."), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)'
  }
})), /*#__PURE__*/React.createElement("section", {
  style: {
    background: 'var(--fawr-navy-90)',
    padding: '48px 64px',
    borderTop: '1px solid var(--fawr-navy-80)',
    borderBottom: '1px solid var(--fawr-navy-80)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 40
  }
}, [['+312%', 'qualified bookings, 90 days'], ['87%', 'of cold leads re-engaged'], ['3 sec', 'median reply time'], ['6×', 'return on FawrAI fee']].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
  key: l
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 40,
    fontWeight: 700,
    color: 'var(--fawr-gold)',
    letterSpacing: '-0.02em',
    lineHeight: 1
  }
}, n), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: '#9DB0C2',
    marginTop: 8
  }
}, l))))), /*#__PURE__*/React.createElement("section", {
  style: {
    padding: '72px 64px',
    background: 'var(--fawr-offwhite)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 680,
    margin: '0 auto',
    fontFamily: 'var(--font-body)',
    fontSize: 17,
    lineHeight: 1.7,
    color: 'var(--fg-1)'
  }
}, /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    color: 'var(--fawr-navy)',
    margin: '0 0 14px'
  }
}, "The bottleneck"), /*#__PURE__*/React.createElement("p", null, "Noor was spending AED 80,000/month on ads. Leads came in. Most never replied after the first message. The ones who did got a generic follow-up from a tired front desk at 6pm."), /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    color: 'var(--fawr-navy)',
    margin: '36px 0 14px'
  }
}, "What changed"), /*#__PURE__*/React.createElement("p", null, "FawrAI took over the first conversation. Every lead was remembered. Every follow-up referenced the last one. When a patient said \"maybe next month,\" FawrAI came back next month \u2014 with context, not a reminder."), /*#__PURE__*/React.createElement("div", {
  style: {
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 8,
    padding: '28px 32px',
    margin: '36px 0',
    borderLeft: '2px solid var(--fawr-gold)'
  }
}, /*#__PURE__*/React.createElement("p", {
  style: {
    margin: 0,
    fontSize: 18,
    color: 'var(--fawr-navy)',
    fontStyle: 'normal',
    fontWeight: 500
  }
}, "\"It never felt automated. And it never missed a patient.\""), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--fg-2)',
    marginTop: 10
  }
}, "\u2014 Dr. Layla Al-Mansoori, Founder")))), /*#__PURE__*/React.createElement("section", {
  style: {
    background: 'var(--fawr-navy)',
    padding: '80px 64px',
    textAlign: 'left'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 720,
    margin: '0 auto'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)',
    marginBottom: 20
  }
}), /*#__PURE__*/React.createElement("h2", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 36,
    fontWeight: 700,
    color: 'var(--fawr-offwhite)',
    letterSpacing: '-0.015em',
    margin: '0 0 28px'
  }
}, "Your clinic's next 90 days could look like this too."), /*#__PURE__*/React.createElement(Button, {
  variant: "gold",
  onClick: onCTA
}, "Book a strategy call \u2192"))));
const About = () => /*#__PURE__*/React.createElement("article", {
  style: {
    background: 'var(--fawr-navy)'
  }
}, /*#__PURE__*/React.createElement("header", {
  style: {
    padding: '96px 64px 48px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 860,
    margin: '0 auto'
  }
}, /*#__PURE__*/React.createElement(SectionEyebrow, {
  color: "var(--fawr-gold)"
}, "Who we are"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 52,
    fontWeight: 700,
    color: 'var(--fawr-offwhite)',
    letterSpacing: '-0.022em',
    lineHeight: 1.1,
    margin: 0,
    textWrap: 'balance'
  }
}, "FawrAI is the intelligence behind every client relationship a clinic owns."))), /*#__PURE__*/React.createElement("section", {
  style: {
    padding: '24px 64px 96px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 680,
    margin: '0 auto',
    fontFamily: 'var(--font-body)',
    fontSize: 18,
    lineHeight: 1.7,
    color: 'var(--fawr-offwhite)'
  }
}, /*#__PURE__*/React.createElement("p", null, "We built FawrAI for a specific market \u2014 aesthetic and medical clinics in Dubai and the GCC. The language, the tone, the cultural nuance. Baked in, not bolted on."), /*#__PURE__*/React.createElement("p", null), /*#__PURE__*/React.createElement("p", null, "We don't sell software. We sell outcomes. The clinic never touches the system. We build it, run it, and maintain it. You see the bookings."))));
const BookCall = () => {
  const [sent, setSent] = React.useState(false);
  if (sent) return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '128px 64px',
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 520,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 2,
      background: 'var(--fawr-gold)',
      marginBottom: 20
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 36,
      fontWeight: 700,
      color: 'var(--fawr-navy)',
      letterSpacing: '-0.015em',
      margin: '0 0 14px'
    }
  }, "Received. We'll be in touch inside 24 hours."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 17,
      color: 'var(--fg-1)',
      lineHeight: 1.6,
      margin: 0
    }
  }, "We read every submission. A founder will reply \u2014 with a specific answer to your bottleneck, not a calendar link.")));
  return /*#__PURE__*/React.createElement("section", {
    className: "fw-section fw-book",
    style: {
      padding: '80px 64px',
      background: 'var(--fawr-offwhite)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fw-book-grid",
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 80
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionEyebrow, null, "Book a strategy call"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 40,
      fontWeight: 700,
      color: 'var(--fawr-navy)',
      letterSpacing: '-0.018em',
      lineHeight: 1.15,
      margin: '0 0 20px',
      textWrap: 'balance'
    }
  }, "Tell us about your clinic. We'll tell you if FawrAI is a fit."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 17,
      lineHeight: 1.6,
      color: 'var(--fg-1)',
      maxWidth: 420,
      margin: 0
    }
  }, "We onboard three clinics a month. If yours is one, we'll show you exactly what the first 30 days look like, with numbers from a clinic in your size range."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      padding: '20px 0',
      borderTop: '1px solid var(--fawr-line)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--fg-2)',
      lineHeight: 1.8
    }
  }, /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", null)))), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      setSent(true);
    },
    style: {
      background: '#fff',
      border: '1px solid var(--fawr-line)',
      borderRadius: 12,
      padding: 32,
      boxShadow: 'var(--shadow-sm)'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Clinic name",
    placeholder: "Noor Aesthetic Clinic",
    defaultValue: "",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Your name",
    placeholder: "Dr. Layla Al-Mansoori",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    placeholder: "you@clinic.ae",
    required: true
  }), /*#__PURE__*/React.createElement(Input, {
    label: "WhatsApp (preferred)",
    placeholder: "+971 50 123 4567"
  }), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--fawr-navy)',
      marginBottom: 6
    }
  }, "What's your biggest bottleneck right now?"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-body)',
      fontSize: 15,
      padding: '14px 16px',
      background: '#fff',
      border: '1px solid var(--fawr-line)',
      borderRadius: 4,
      color: 'var(--fg-1)',
      resize: 'vertical'
    },
    placeholder: "One sentence is fine. We'll read every word."
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    full: true
  }, "Send \u2014 we'll reply inside 24 hours"))));
};
Object.assign(window, {
  CaseStudy,
  About,
  BookCall
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/OtherPages.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Primitives.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Shared primitives + design tokens used across the kit.
// Kept intentionally small — the kit leans on colors_and_type.css for tokens.

const {
  useState
} = React;
const Button = ({
  variant = 'primary',
  children,
  onClick,
  full,
  ...rest
}) => {
  const base = {
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 500,
    border: 0,
    cursor: 'pointer',
    padding: '14px 26px',
    borderRadius: 4,
    transition: 'all 220ms cubic-bezier(.2,.6,.2,1)',
    letterSpacing: '0.005em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: full ? '100%' : 'auto',
    justifyContent: 'center'
  };
  const variants = {
    primary: {
      background: 'var(--fawr-navy)',
      color: 'var(--fawr-offwhite)'
    },
    gold: {
      background: 'var(--fawr-gold)',
      color: 'var(--fawr-navy)',
      fontWeight: 600
    },
    outline: {
      background: 'transparent',
      color: 'var(--fawr-navy)',
      border: '1px solid var(--fawr-navy)'
    },
    outlineLight: {
      background: 'transparent',
      color: 'var(--fawr-offwhite)',
      border: '1px solid rgba(248,245,240,.3)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fawr-navy)',
      padding: '14px 8px'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      ...base,
      ...variants[variant]
    },
    onClick: onClick
  }, rest), children);
};
const SectionEyebrow = ({
  children,
  color = 'var(--fawr-sage)'
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 24
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 12,
    fontWeight: 600,
    color,
    marginBottom: 14
  }
}, children), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)'
  }
}));
const Logo = ({
  light
}) => /*#__PURE__*/React.createElement("img", {
  src: (light ? 'logo-light.png' : 'logo-dark.png') + '?v=3-tight',
  alt: "FawrAI",
  style: {
    width: 141.706,
    height: 'auto',
    display: 'block'
  }
});
const Input = ({
  label,
  hint,
  ...rest
}) => /*#__PURE__*/React.createElement("label", {
  style: {
    display: 'block',
    marginBottom: 18
  }
}, label && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--fawr-navy)',
    marginBottom: 6
  }
}, label), /*#__PURE__*/React.createElement("input", _extends({}, rest, {
  style: {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    padding: '14px 16px',
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 4,
    color: 'var(--fg-1)'
  }
})), hint && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--fg-3)',
    marginTop: 6
  }
}, hint));
Object.assign(window, {
  Button,
  SectionEyebrow,
  Logo,
  Input
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Primitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing-site/Primitives.standalone.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Shared primitives + design tokens used across the kit.
// Kept intentionally small — the kit leans on colors_and_type.css for tokens.

const {
  useState
} = React;
const Button = ({
  variant = 'primary',
  children,
  onClick,
  full,
  ...rest
}) => {
  const base = {
    fontFamily: "var(--font-body)",
    fontSize: 15,
    fontWeight: 500,
    border: 0,
    cursor: 'pointer',
    padding: '14px 26px',
    borderRadius: 4,
    transition: 'all 220ms cubic-bezier(.2,.6,.2,1)',
    letterSpacing: '0.005em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: full ? '100%' : 'auto',
    justifyContent: 'center'
  };
  const variants = {
    primary: {
      background: 'var(--fawr-navy)',
      color: 'var(--fawr-offwhite)'
    },
    gold: {
      background: 'var(--fawr-gold)',
      color: 'var(--fawr-navy)',
      fontWeight: 600
    },
    outline: {
      background: 'transparent',
      color: 'var(--fawr-navy)',
      border: '1px solid var(--fawr-navy)'
    },
    outlineLight: {
      background: 'transparent',
      color: 'var(--fawr-offwhite)',
      border: '1px solid rgba(248,245,240,.3)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fawr-navy)',
      padding: '14px 8px'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    style: {
      ...base,
      ...variants[variant]
    },
    onClick: onClick
  }, rest), children);
};
const SectionEyebrow = ({
  children,
  color = 'var(--fawr-sage)'
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    marginBottom: 24
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    fontSize: 12,
    fontWeight: 600,
    color,
    marginBottom: 14
  }
}, children), /*#__PURE__*/React.createElement("div", {
  style: {
    width: 48,
    height: 2,
    background: 'var(--fawr-gold)'
  }
}));
const Logo = ({
  light
}) => /*#__PURE__*/React.createElement("img", {
  src: light ? window.__resources.logoLight : window.__resources.logoDark,
  alt: "FawrAI",
  style: {
    width: 141.706,
    height: 'auto',
    display: 'block'
  }
});
const Input = ({
  label,
  hint,
  ...rest
}) => /*#__PURE__*/React.createElement("label", {
  style: {
    display: 'block',
    marginBottom: 18
  }
}, label && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--fawr-navy)',
    marginBottom: 6
  }
}, label), /*#__PURE__*/React.createElement("input", _extends({}, rest, {
  style: {
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    padding: '14px 16px',
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 4,
    color: 'var(--fg-1)'
  }
})), hint && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--fg-3)',
    marginTop: 6
  }
}, hint));
Object.assign(window, {
  Button,
  SectionEyebrow,
  Logo,
  Input
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing-site/Primitives.standalone.jsx", error: String((e && e.message) || e) }); }

// ui_kits/operator-console/ConsoleShell.jsx
try { (() => {
const {
  useState
} = React;
const Sidebar = ({
  current,
  onNav
}) => {
  const items = [{
    id: 'clinics',
    label: 'Clinics'
  }, {
    id: 'escalations',
    label: 'Escalations',
    badge: 3
  }, {
    id: 'analytics',
    label: 'Analytics'
  }, {
    id: 'ops',
    label: 'Ops log'
  }];
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 240,
      background: 'var(--fawr-navy)',
      color: 'var(--fawr-offwhite)',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--fawr-navy-80)',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 22px 28px',
      borderBottom: '1px solid var(--fawr-navy-80)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 20,
      fontWeight: 600,
      color: 'var(--fawr-offwhite)',
      letterSpacing: '-0.01em'
    }
  }, "fawr", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fawr-sage)'
    }
  }, "AI"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fawr-gold)'
    }
  }, ".")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 11,
      color: '#6E8297',
      marginTop: 4,
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }
  }, "Operator console")), /*#__PURE__*/React.createElement("nav", {
    style: {
      padding: '16px 12px'
    }
  }, items.map(it => {
    const active = current === it.id;
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      onClick: () => onNav(it.id),
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px',
        borderRadius: 4,
        color: active ? 'var(--fawr-offwhite)' : '#9DB0C2',
        background: active ? 'var(--fawr-navy-90)' : 'transparent',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        marginBottom: 2
      }
    }, /*#__PURE__*/React.createElement("span", null, it.label), it.badge && /*#__PURE__*/React.createElement("span", {
      style: {
        marginLeft: 'auto',
        background: 'var(--fawr-gold)',
        color: 'var(--fawr-navy)',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 999
      }
    }, it.badge));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      padding: '16px 22px',
      borderTop: '1px solid var(--fawr-navy-80)',
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      color: '#6E8297'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--fawr-offwhite)',
      fontSize: 13,
      fontWeight: 500
    }
  }, "Amina Saleh"), /*#__PURE__*/React.createElement("div", null, "Ops \xB7 Dubai")));
};
const TopBar = ({
  title,
  subtitle,
  actions
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '24px 40px',
    borderBottom: '1px solid var(--fawr-navy-80)',
    background: 'var(--fawr-navy)',
    color: 'var(--fawr-offwhite)',
    display: 'flex',
    alignItems: 'center',
    gap: 16
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--fawr-offwhite)',
    margin: 0,
    letterSpacing: '-0.01em'
  }
}, title), subtitle && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: '#9DB0C2',
    marginTop: 2
  }
}, subtitle)), /*#__PURE__*/React.createElement("div", {
  style: {
    marginLeft: 'auto'
  }
}, actions));
const Badge = ({
  tone = 'neutral',
  children
}) => {
  const tones = {
    neutral: {
      bg: 'var(--fawr-offwhite-2)',
      fg: 'var(--fawr-charcoal)',
      dot: '#9A9A9A'
    },
    active: {
      bg: 'rgba(138,158,133,.18)',
      fg: '#556D51',
      dot: '#6B8F6A'
    },
    warning: {
      bg: 'rgba(212,175,110,.18)',
      fg: '#8B6B2E',
      dot: 'var(--fawr-gold)'
    },
    danger: {
      bg: 'rgba(181,85,74,.14)',
      fg: '#8A3A31',
      dot: '#B5554A'
    },
    info: {
      bg: 'rgba(74,122,158,.14)',
      fg: '#2F5474',
      dot: '#4A7A9E'
    }
  }[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      fontWeight: 500,
      padding: '3px 10px',
      borderRadius: 999,
      background: tones.bg,
      color: tones.fg
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: tones.dot
    }
  }), children);
};
Object.assign(window, {
  Sidebar,
  TopBar,
  Badge
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/operator-console/ConsoleShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/operator-console/Screens.jsx
try { (() => {
const CLINICS = [{
  id: 1,
  name: 'Noor Aesthetic Clinic',
  city: 'Dubai',
  health: 'active',
  leads: 284,
  booked: 72,
  escalations: 0,
  trend: '+12%'
}, {
  id: 2,
  name: 'Sana Aesthetics',
  city: 'Abu Dhabi',
  health: 'warning',
  leads: 198,
  booked: 41,
  escalations: 2,
  trend: '+4%'
}, {
  id: 3,
  name: 'Aura Medical Skin',
  city: 'Dubai',
  health: 'active',
  leads: 312,
  booked: 88,
  escalations: 0,
  trend: '+18%'
}, {
  id: 4,
  name: 'Dr. Reem Clinic',
  city: 'Sharjah',
  health: 'danger',
  leads: 144,
  booked: 22,
  escalations: 1,
  trend: '−3%'
}, {
  id: 5,
  name: 'Lumi Beauty Med',
  city: 'Riyadh',
  health: 'active',
  leads: 401,
  booked: 104,
  escalations: 0,
  trend: '+9%'
}, {
  id: 6,
  name: 'Dar Al-Jamal',
  city: 'Doha',
  health: 'info',
  leads: 76,
  booked: 12,
  escalations: 0,
  trend: 'onboarding'
}];
const ClinicList = ({
  onOpen
}) => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopBar, {
  title: "Clinics",
  subtitle: "6 active \xB7 3 escalations pending \xB7 1 onboarding",
  actions: /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Add clinic")
}), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '32px 40px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4,1fr)',
    gap: 20,
    marginBottom: 32
  }
}, [{
  l: 'Leads this week',
  v: '1,415'
}, {
  l: 'Booked',
  v: '339',
  sub: '24% conversion'
}, {
  l: 'Re-engaged cold',
  v: '87',
  sub: 'from 104 targeted'
}, {
  l: 'Open escalations',
  v: '3',
  sub: 'SLA: 2h',
  alert: true
}].map(s => /*#__PURE__*/React.createElement("div", {
  key: s.l,
  style: {
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 8,
    padding: 20,
    borderLeft: s.alert ? '2px solid var(--fawr-gold)' : '1px solid var(--fawr-line)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--fawr-sage)',
    fontWeight: 600
  }
}, s.l), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 32,
    fontWeight: 700,
    color: 'var(--fawr-navy)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    margin: '8px 0 4px'
  }
}, s.v), s.sub && /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--fg-2)'
  }
}, s.sub)))), /*#__PURE__*/React.createElement("div", {
  style: {
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 8,
    overflow: 'hidden'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 40px',
    padding: '14px 20px',
    background: 'var(--fawr-offwhite-2)',
    borderBottom: '1px solid var(--fawr-line)',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--fawr-navy)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }
}, /*#__PURE__*/React.createElement("div", null, "Clinic"), /*#__PURE__*/React.createElement("div", null, "Status"), /*#__PURE__*/React.createElement("div", null, "Leads (7d)"), /*#__PURE__*/React.createElement("div", null, "Booked"), /*#__PURE__*/React.createElement("div", null, "Escalations"), /*#__PURE__*/React.createElement("div", null, "Trend"), /*#__PURE__*/React.createElement("div", null)), CLINICS.map((c, i) => /*#__PURE__*/React.createElement("div", {
  key: c.id,
  onClick: () => onOpen(c),
  style: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 40px',
    padding: '16px 20px',
    borderBottom: i < CLINICS.length - 1 ? '1px solid var(--fawr-line)' : 'none',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    color: 'var(--fg-1)',
    cursor: 'pointer',
    alignItems: 'center'
  },
  onMouseEnter: e => e.currentTarget.style.background = 'var(--fawr-offwhite)',
  onMouseLeave: e => e.currentTarget.style.background = '#fff'
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontWeight: 600,
    color: 'var(--fawr-navy)'
  }
}, c.name), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 12,
    color: 'var(--fg-2)',
    marginTop: 2
  }
}, c.city)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Badge, {
  tone: c.health
}, c.health === 'active' ? 'Healthy' : c.health === 'warning' ? 'Needs attention' : c.health === 'danger' ? 'At risk' : 'Onboarding')), /*#__PURE__*/React.createElement("div", {
  style: {
    fontVariantNumeric: 'tabular-nums'
  }
}, c.leads), /*#__PURE__*/React.createElement("div", {
  style: {
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--fawr-navy)',
    fontWeight: 600
  }
}, c.booked), /*#__PURE__*/React.createElement("div", {
  style: {
    color: c.escalations > 0 ? '#B5554A' : 'var(--fg-3)',
    fontWeight: c.escalations > 0 ? 600 : 400
  }
}, c.escalations), /*#__PURE__*/React.createElement("div", {
  style: {
    color: c.trend.startsWith('−') ? '#B5554A' : c.trend.startsWith('+') ? '#6B8F6A' : 'var(--fg-2)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13
  }
}, c.trend), /*#__PURE__*/React.createElement("div", {
  style: {
    color: 'var(--fg-3)',
    textAlign: 'right'
  }
}, "\u2192"))))));
const MESSAGES = [{
  side: 'fawr',
  time: '14:18',
  text: "Hi Maya — hope the Eid break treated you well. You were weighing hydrafacial vs the lumi package last month. Dr. Layla has two openings Thursday, and she'd start with the lumi consult since that's what you were drawn to. Want me to hold 4pm?"
}, {
  side: 'lead',
  time: '14:22',
  text: "Oh hi! Yes please, 4pm works. Also do you have the post-care pricing for lumi?"
}, {
  side: 'fawr',
  time: '14:22',
  text: "Holding 4pm Thursday for you. Post-care for lumi is AED 480/session, and Dr. Layla usually recommends 2 sessions over 6 weeks. I'll send a confirmation to your WhatsApp in a moment."
}, {
  side: 'lead',
  time: '14:25',
  text: "Perfect, thank you!"
}];
const ClinicDetail = ({
  clinic,
  onBack
}) => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopBar, {
  title: clinic.name,
  subtitle: `${clinic.city} · onboarded Nov 2025 · manager: Amina Saleh`,
  actions: /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    onClick: onBack
  }, "\u2190 All clinics"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "Intervene"))
}), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '28px 40px',
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: 28
  }
}, /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--fawr-navy)',
    margin: '0 0 14px'
  }
}, "Lead pipeline \xB7 last 7 days"), /*#__PURE__*/React.createElement("div", {
  style: {
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 8,
    overflow: 'hidden'
  }
}, [{
  n: 'Maya Al-Hashemi',
  ctx: 'Considering lumi package · consultation held Thu 4pm',
  status: 'active',
  tag: 'Warm',
  time: '2m'
}, {
  n: 'Fatima Rostami',
  ctx: 'Asked about pricing 3d ago · no reply · FawrAI scheduled follow-up',
  status: 'info',
  tag: 'Re-engaging',
  time: '1h'
}, {
  n: 'Jawad Khan',
  ctx: 'VIP · rebooking botox · Dr. Layla direct hand-off requested',
  status: 'warning',
  tag: 'Escalate',
  time: '3h'
}, {
  n: 'Sara Benali',
  ctx: 'Cold since Sept · gave birth · FawrAI paused outreach 90 days',
  status: 'neutral',
  tag: 'Paused',
  time: '1d'
}].map((l, i, a) => /*#__PURE__*/React.createElement("div", {
  key: l.n,
  style: {
    padding: '16px 20px',
    borderBottom: i < a.length - 1 ? '1px solid var(--fawr-line)' : 'none',
    display: 'flex',
    gap: 14,
    alignItems: 'center'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: 'var(--fawr-sage)',
    color: 'var(--fawr-offwhite)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 13,
    flexShrink: 0
  }
}, l.n.split(' ').map(w => w[0]).join('').slice(0, 2)), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    minWidth: 0
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    color: 'var(--fawr-navy)',
    fontSize: 14
  }
}, l.n), /*#__PURE__*/React.createElement(Badge, {
  tone: l.status
}, l.tag)), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--fg-2)',
    marginTop: 3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }
}, l.ctx)), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--fg-3)'
  }
}, l.time))))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--fawr-navy)',
    margin: '0 0 14px'
  }
}, "Live conversation \xB7 Maya Al-Hashemi"), /*#__PURE__*/React.createElement("div", {
  style: {
    background: '#fff',
    border: '1px solid var(--fawr-line)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    height: 520
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '14px 18px',
    borderBottom: '1px solid var(--fawr-line)',
    display: 'flex',
    alignItems: 'center',
    gap: 10
  }
}, /*#__PURE__*/React.createElement(Badge, {
  tone: "active"
}, "Handled by FawrAI"), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    color: 'var(--fg-2)'
  }
}, "Confidence 94% \xB7 Last reply 2m ago")), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    overflow: 'auto',
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: 'var(--fawr-offwhite)'
  }
}, MESSAGES.map((m, i) => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    alignSelf: m.side === 'fawr' ? 'flex-start' : 'flex-end',
    maxWidth: '80%',
    background: m.side === 'fawr' ? '#fff' : 'var(--fawr-navy)',
    color: m.side === 'fawr' ? 'var(--fg-1)' : 'var(--fawr-offwhite)',
    border: m.side === 'fawr' ? '1px solid var(--fawr-line)' : 'none',
    borderRadius: m.side === 'fawr' ? '8px 8px 8px 2px' : '8px 8px 2px 8px',
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    lineHeight: 1.55
  }
}, /*#__PURE__*/React.createElement("div", null, m.text), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10,
    color: m.side === 'fawr' ? 'var(--fg-3)' : '#9DB0C2',
    marginTop: 4,
    fontFamily: 'var(--font-mono)'
  }
}, m.time)))), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '12px 16px',
    borderTop: '1px solid var(--fawr-line)',
    display: 'flex',
    gap: 10
  }
}, /*#__PURE__*/React.createElement(Button, {
  variant: "outline"
}, "Take over"), /*#__PURE__*/React.createElement(Button, {
  variant: "ghost"
}, "Notes"), /*#__PURE__*/React.createElement(Button, {
  variant: "ghost",
  style: {
    marginLeft: 'auto',
    color: '#B5554A'
  }
}, "Escalate to clinic"))))));
Object.assign(window, {
  ClinicList,
  ClinicDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/operator-console/Screens.jsx", error: String((e && e.message) || e) }); }

})();
