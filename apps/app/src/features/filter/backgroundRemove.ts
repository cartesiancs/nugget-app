import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LocaleController } from "../../controllers/locale";

@customElement("background-remove")
export class BackgroundRemove extends LitElement {
  constructor() {
    super();
  }

  @property()
  imagePath;

  @property()
  isLoad = false;

  private lc = new LocaleController(this);
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <button
        type="button"
        class="btn btn-sm mb-2 btn-default  text-light"
        @click=${this.handleClickRemove}
      >
        <div
          class="spinner-border ${this.isLoad ? "" : "d-none"}"
          style="
    width: 12px;
    height: 12px;
"
          role="status"
        >
          <span class="visually-hidden">Loading...</span>
        </div>
        AI Background Remove
      </button>
    `;
  }

  handleClickRemove() {
    this.isLoad = true;
    window.electronAPI.req.media
      .backgroundRemove(this.imagePath)
      .then((path) => {
        console.log(path.path);
        this.isLoad = false;
        this.dispatchEvent(
          new CustomEvent("onReturn", {
            detail: { path: path.path },
            bubbles: true,
            composed: true,
          }),
        );
      });
  }
}
