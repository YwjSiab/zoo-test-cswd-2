// components/zoo-animal-card.js
import { toggleAnimalStatus, toggleAnimalHealth } from "../ZooOperations.js";

class ZooAnimalCard extends HTMLElement {
  // If you want to pass data via an attribute:
  static get observedAttributes() { return ["animal"]; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" }); // Shadow DOM = isolated styles/markup
  }

  // Convenience getter/setter for the "animal" data
  get data() {
    const raw = this.getAttribute("animal");
    return raw ? JSON.parse(raw) : null;
  }
  set data(obj) {
    this.setAttribute("animal", JSON.stringify(obj));
  }

  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  disconnectedCallback() {
    // Clean up listeners if you add any on window/document
  }

render() {
    const a = this._getLatestAnimal();
    if (!a) {
      this.shadowRoot.innerHTML = `<em>No animal provided</em>`;
      return;
    }

    this.shadowRoot.innerHTML = `
        <style>
            :host{display:block;font-family:system-ui;border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:8px;box-shadow:0 2px 10px rgba(0,0,0,.05)}
            h3{margin:.25rem 0;font-size:1.1rem}
            small{color:#6b7280}
            .row{margin:.25rem 0}
            a.name {
                display:inline-block;            
                padding:2px 6px;                 
                text-decoration:none; color:#111;
                border-radius:20px;
            }
    button{margin-right:8px;border:0;padding:.5rem .8rem;border-radius:8px;cursor:pointer;background:#10b981;color:white}
    button.secondary{background:#3b82f6}
  </style>

    <z-hover-highlight selector="a">
        <div class="wrapper">
            <a href="#animal-${a.id}">
                ${a.name} <small>(${a.species})</small>
            </a>
        </div>
    </z-hover-highlight>

        <div class="row">Status: <b id="status-${a.id}">${a.status}</b></div>
        <div class="row">Health: <b id="health-${a.id}">${a.health}</b></div>
        <div class="row">
            <button id="toggleStatus">Toggle Status</button>
            <button id="toggleHealth" class="secondary">Toggle Health</button>
        </div>
    `;

    const statusBtn = this.shadowRoot.getElementById("toggleStatus");
    const healthBtn = this.shadowRoot.getElementById("toggleHealth");

    statusBtn.onclick = () => {
      toggleAnimalStatus(a.id, window.animals || []);
      const latest = this._getLatestAnimal();
      const statusEl = this.shadowRoot.getElementById(`status-${a.id}`);
      if (statusEl && latest) statusEl.textContent = latest.status;
      this.data = latest || a;
      this.dispatchEvent(new CustomEvent("animal-updated", {
        bubbles: true, detail: { id: a.id, status: latest?.status }
      }));
    };

    healthBtn.onclick = () => {
      toggleAnimalHealth(a.id, window.animals || []);
      const latest = this._getLatestAnimal();
      const healthEl = this.shadowRoot.getElementById(`health-${a.id}`);
      if (healthEl && latest) healthEl.textContent = latest.health;
      this.data = latest || a;
      this.dispatchEvent(new CustomEvent("animal-updated", {
        bubbles: true, detail: { id: a.id, health: latest?.health }
      }));
    };

    const link = this.shadowRoot.querySelector(".wrapper a");
    
    if (link) {
      const onEnter = () => { this._active = true; this._reposition(); };
      const onLeave = () => {
        this._active = false;
        const hl = this.shadowRoot.querySelector(".highlight");
        if (hl) hl.style.opacity = "0";
      };
      link.addEventListener("mouseenter", onEnter);
      link.addEventListener("focus", onEnter);
      link.addEventListener("mouseleave", onLeave);
      link.addEventListener("blur", onLeave);
      window.addEventListener("scroll", this._reposition, { passive:true });
      window.addEventListener("resize", this._reposition);
    }
  }
}

customElements.define("zoo-animal-card", ZooAnimalCard);