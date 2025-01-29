import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("overlay-webcam")
export class OverlayWebcam extends LitElement {
  render() {
    return html` <div class="overlay"></div> `;
  }

  static styles = css`
    .overlay {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      width: 200px;
      height: 200px;
      background-color: #ffffff;
      border-radius: 100px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "overlay-webcam": OverlayWebcam;
  }
}
