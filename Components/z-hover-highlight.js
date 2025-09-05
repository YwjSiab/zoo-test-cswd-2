// @ts-nocheck
class ZHoverHighlight extends HTMLElement {
  static get observedAttributes() { return ["selector"]; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._activeEl = null;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; position:relative; }
        .hl {
          position:absolute; top:0; left:0;
          border-radius: 20px;
          background: rgba(255,255,255,.9);
          border-bottom: 2px solid #fff;
          box-shadow: 0 0 10px rgba(0,0,0,.2);
          transition: transform .18s, width .18s, height .18s, opacity .12s;
          opacity: 0; pointer-events: none;
        }
        /* Optional: nice baseline for slotted links */
        ::slotted(a), ::slotted(button[is-link]) {
          text-decoration:none; color:#111;
          background: rgba(0,0,0,.05);
          border-radius:20px; padding:2px 6px;
        }
      </style>
      <slot></slot>
      <span class="hl" aria-hidden="true"></span>
    `;

    this.hl = this.shadowRoot.querySelector(".hl");

    // bind handlers once
    this._onEnter = e => this._setActive(e.currentTarget);
    this._onFocus = e => this._setActive(e.currentTarget);
    this._onLeave = () => this._clearActive();
    this._reposition = () => this._activeEl && this._positionTo(this._activeEl);
  }

  get selector() { return this.getAttribute("selector") || "a"; }

  connectedCallback()  { this._bind(); }
  disconnectedCallback(){ this._unbind(); }
  attributeChangedCallback() { this._unbind(); this._bind(); }

  _bind() {
    this.links = this.querySelectorAll(this.selector);
    this.links.forEach(el => {
      el.addEventListener("mouseenter", this._onEnter);
      el.addEventListener("mouseleave", this._onLeave);
      el.addEventListener("focus", this._onFocus);
      el.addEventListener("blur", this._onLeave);
    });
    window.addEventListener("scroll", this._reposition, { passive:true });
    window.addEventListener("resize", this._reposition);
  }

  _unbind() {
    if (this.links) {
      this.links.forEach(el => {
        el.removeEventListener("mouseenter", this._onEnter);
        el.removeEventListener("mouseleave", this._onLeave);
        el.removeEventListener("focus", this._onFocus);
        el.removeEventListener("blur", this._onLeave);
      });
    }
    window.removeEventListener("scroll", this._reposition);
    window.removeEventListener("resize", this._reposition);
  }

  _setActive(el) {
    this._activeEl = el;
    this._positionTo(el);
    this.hl.style.opacity = "1";
  }
  _clearActive() {
    this._activeEl = null;
    this.hl.style.opacity = "0";
  }

  _positionTo(el) {
    const r = el.getBoundingClientRect();
    const host = this.getBoundingClientRect();

    // Convert document coords → host coords
    const left = (r.left + window.scrollX) - (host.left + window.scrollX);
    const top  = (r.top  + window.scrollY) - (host.top  + window.scrollY);

    this.hl.style.width  = `${r.width}px`;
    this.hl.style.height = `${r.height}px`;
    this.hl.style.transform = `translate(${left}px, ${top}px)`;
  }
}
customElements.define("z-hover-highlight", ZHoverHighlight);
