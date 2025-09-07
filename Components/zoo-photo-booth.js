// components/zoo-photo-booth.js
class ZooPhotoBooth extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._stream = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui;border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:8px;box-shadow:0 2px 10px rgba(0,0,0,.05)}
        .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}
        video, canvas, img.preview{width: 320px; height: 240px; background:#111; border-radius:12px; object-fit:cover}
        canvas{display:none}
        .controls button{
          border:0; padding:.5rem .8rem; border-radius:8px; cursor:pointer;
          background:#3b82f6; color:#fff
        }
        .controls button.secondary{ background:#10b981 }
        .controls button.ghost{ background:#6b7280 }
        .note{font-size:.9rem; color:#555}
        .error{color:#b91c1c; font-weight:600; margin-top:6px}
        input[type="file"]{display:none}
        label.file-btn{
          border:0; padding:.5rem .8rem; border-radius:8px; cursor:pointer;
          background:#6b7280; color:#fff; margin-left:4px
        }
      </style>

      <div class="row">
        <video id="video" playsinline></video>
        <canvas id="canvas" width="320" height="240"></canvas>
        <img id="preview" class="preview" alt="Snapshot preview" style="display:none"/>
      </div>

      <div class="row controls">
        <button id="start">Start Camera</button>
        <button id="capture" class="secondary" disabled>Take Photo</button>
        <button id="retake" class="ghost" disabled>Retake</button>
        <button id="use" class="secondary" disabled>Use Photo</button>

        <input id="file" type="file" accept="image/*" capture="user">
        <label class="file-btn" for="file">Upload instead</label>
      </div>

      <div class="note">All photos stay on this device unless you submit the form.</div>
      <div id="err" class="error" role="alert" style="display:none"></div>
    `;

    this._els = {
      video: this.shadowRoot.getElementById("video"),
      canvas: this.shadowRoot.getElementById("canvas"),
      preview: this.shadowRoot.getElementById("preview"),
      start: this.shadowRoot.getElementById("start"),
      capture: this.shadowRoot.getElementById("capture"),
      retake: this.shadowRoot.getElementById("retake"),
      use: this.shadowRoot.getElementById("use"),
      file: this.shadowRoot.getElementById("file"),
      err: this.shadowRoot.getElementById("err"),
    };

    this._els.start.addEventListener("click", () => this._startCamera());
    this._els.capture.addEventListener("click", () => this._capture());
    this._els.retake.addEventListener("click", () => this._retake());
    this._els.use.addEventListener("click", () => this._emitPhoto());
    this._els.file.addEventListener("change", (e) => this._fromFile(e));
  }

  disconnectedCallback() { this._stopCamera(); }

  async _startCamera() {
    try {
      this._hideError();
      this._stopCamera();
      const constraints = { video: { facingMode: "user", width: 320, height: 240 }, audio: false };
      this._stream = await navigator.mediaDevices.getUserMedia(constraints);
      this._els.video.srcObject = this._stream;
      await this._els.video.play();
      this._toggleButtons({ start:false, capture:true, retake:false, use:false });
      this._els.preview.style.display = "none";
      this._els.video.style.display = "block";
      this._els.canvas.style.display = "none";
    } catch (err) {
      console.error("getUserMedia failed:", err);
      this._showError("Camera blocked or unavailable. You can upload a photo instead.");
      this._toggleButtons({ start:true, capture:false, retake:false, use:false });
    }
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop());
      this._stream = null;
    }
  }

  _capture() {
    const { video, canvas, preview } = this._els;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    preview.src = canvas.toDataURL("image/jpeg", 0.92);
    preview.style.display = "block";
    video.style.display = "none";
    canvas.style.display = "none"; // keep offscreen
    this._toggleButtons({ start:false, capture:false, retake:true, use:true });
  }

  _retake() {
    this._els.preview.style.display = "none";
    if (this._stream) {
      this._els.video.style.display = "block";
      this._toggleButtons({ start:false, capture:true, retake:false, use:false });
    } else {
      this._toggleButtons({ start:true, capture:false, retake:false, use:false });
    }
  }

  _emitPhoto() {
    const dataUrl = this._els.preview.src;
    if (!dataUrl) return;
    // Emit to parent page
    this.dispatchEvent(new CustomEvent("photo-taken", {
      bubbles: true,
      composed: true,
      detail: { dataUrl }
    }));
  }

  _fromFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      this._showError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this._els.preview.src = reader.result;
      this._els.preview.style.display = "block";
      this._els.video.style.display = "none";
      this._toggleButtons({ start:false, capture:false, retake:true, use:true });
    };
    reader.readAsDataURL(file);
  }

  _toggleButtons(map) {
    this._els.start.disabled   = map.start   === false ? false : !!map.start;
    this._els.capture.disabled = map.capture === false ? false : !!map.capture;
    this._els.retake.disabled  = map.retake  === false ? false : !!map.retake;
    this._els.use.disabled     = map.use     === false ? false : !!map.use;
  }

  _showError(msg) { this._els.err.textContent = msg; this._els.err.style.display = "block"; }
  _hideError() { this._els.err.style.display = "none"; }
}
customElements.define("zoo-photo-booth", ZooPhotoBooth);