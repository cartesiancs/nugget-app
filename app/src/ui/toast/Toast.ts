import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IUIStore, uiStore } from "../../states/uiStore";

@customElement("toast-list-ui")
export class ToastList extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        class="toast-container position-fixed bottom-50 start-50 translate-middle"
      >
        <div
          class="toast fade hide"
          id="loadMetadataToast"
          role="alert"
          data-bs-animation="true"
          data-bs-autohide="true"
          data-bs-delay="9000"
          aria-live="assertive"
          aria-atomic="true"
          style="background-color: rgba(37, 38, 43, 0.73);"
        >
          <div class="toast-body">
            <div class="text-center text-light">Load Metadata</div>
            <div class="progress mt-2 mb-1">
              <div
                class="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                aria-valuenow="100"
                aria-valuemin="0"
                aria-valuemax="100"
                style="width: 100%"
              ></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
