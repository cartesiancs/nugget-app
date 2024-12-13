import { html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("preview-canvas")
export class PreviewCanvss extends LitElement {
  handleClickCanvas() {
    document.querySelector("element-control").handleClickPreview();
  }
  protected render() {
    return html` <canvas
      id="preview"
      class="preview"
      onclick="${this.handleClickCanvas()}"
    ></canvas>`;
  }
}
