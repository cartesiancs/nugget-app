import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { getLocationEnv } from "../../functions/getLocationEnv";

@customElement("warning-demo")
export class WarningDemo extends LitElement {
  hasUpdatedOnce: boolean;
  showWarn: any;

  @query("#showDemoWarn")
  modalEl;

  constructor() {
    super();
    this.hasUpdatedOnce = false;
  }

  updated() {
    if (!this.hasUpdatedOnce) {
      if (this.modalEl) {
        const myModal = new bootstrap.Modal(this.modalEl);
        if (getLocationEnv() == "demo") {
          myModal.show();
        }
      } else {
        console.error("Modal element not found in shadow DOM.");
      }
      this.hasUpdatedOnce = true;
    }
  }

  render() {
    return html` <div
      class="modal fade"
      id="showDemoWarn"
      tabindex="-1"
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-dark modal-dialog-centered">
        <div class="modal-content modal-dark modal-darker">
          <div class="modal-body modal-body-dark">
            <h6 class="modal-title text-light font-weight-lg mb-2">
              Nugget Demo Version
            </h6>

            <span class="text-light"
              >The results edited in the demo version cannot be
              <b class="text-danger">exported.</b> Please use the Electron
              installation version or use the host version from another
              provider.
            </span>

            <br />

            <button data-bs-dismiss="modal" class="btn btn-danger btn-sm mt-2">
              Process
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }
}
