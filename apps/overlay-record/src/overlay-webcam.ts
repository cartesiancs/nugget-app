import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("overlay-webcam")
export class OverlayWebcam extends LitElement {
  isRecord: boolean;
  constructor() {
    super();

    this.isRecord = true;
    window.electronAPI.res.overlayRecord.stop(() => {
      this.stopRecord();
    });
  }

  static styles = css`
    .overlay {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      overflow: hidden;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }

    .d-none {
      display: none;
    }
  `;

  render() {
    return html`
      <div class="overlay ${this.isRecord ? "" : "d-none"}">
        <video autoplay muted playsinline></video>
      </div>
    `;
  }

  stopRecord() {
    this.isRecord = false;
    this.requestUpdate();
  }

  firstUpdated() {
    const videoElement = this.shadowRoot?.querySelector(
      "video",
    ) as HTMLVideoElement;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        videoElement.srcObject = stream;
      })
      .catch((error) => {
        console.error("error: ", error);
      });
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "overlay-webcam": OverlayWebcam;
  }
}
