import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./ControlSetting";
import "./ControlText";
import "./ControlExtension";
import "./ControlRender";
import "./ControlUtilities";
import "./ControlFilter";
import "../../features/asset/assetBrowser";

@customElement("control-panel")
export class ControlPanel extends LitElement {
  @property()
  isPanelCollapsed: boolean = false;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        id="split_col_1"
        class="h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 100%; height: 100%;"
      >
        <div
          class="h-100 w-100 overflow-y-hidden overflow-x-hidden position-absolute"
          style="transform: translateX(${this.isPanelCollapsed ? "-100%" : "0"}); transition: transform 0.3s ease;"
        >
          <!-- Hidden sidebar navigation (controlled by external action bar) -->
          <div
            id="sidebar"
            class="nav sidebar-nav flex-column nav-pills bg-dark h-100 pt-1"
            style="width: 2.5rem; display: none;"
            role="tablist"
            aria-orientation="vertical"
          >
            <button
              class="btn-nav active"
              data-bs-toggle="pill"
              data-bs-target="#nav-home"
              type="button"
              role="tab"
              aria-selected="true"
            >
              <span class="material-symbols-outlined"> settings</span>
            </button>

            <button
              class="btn-nav"
              data-bs-toggle="pill"
              data-bs-target="#nav-draft"
              type="button"
              role="tab"
              aria-selected="false"
            >
              <span class="material-symbols-outlined"> draft</span>
            </button>

            <button
              class="btn-nav"
              data-bs-toggle="pill"
              data-bs-target="#nav-text"
              type="button"
              role="tab"
              aria-selected="false"
            >
              <span class="material-symbols-outlined"> text_fields</span>
            </button>

            <button
              class="btn-nav"
              data-bs-toggle="pill"
              data-bs-target="#nav-filter"
              type="button"
              role="tab"
              aria-selected="false"
            >
              <span class="material-symbols-outlined"> library_books</span>
            </button>

            <button
              class="btn-nav"
              data-bs-toggle="pill"
              data-bs-target="#nav-util"
              type="button"
              role="tab"
              aria-selected="false"
            >
              <span class="material-symbols-outlined"> page_info</span>
            </button>

            <button
              class="btn-nav"
              data-bs-toggle="pill"
              data-bs-target="#nav-option"
              type="button"
              role="tab"
              aria-selected="false"
            >
              <span class="material-symbols-outlined"> extension</span>
            </button>

            <button
              class="btn-nav"
              data-bs-toggle="pill"
              data-bs-target="#nav-output"
              type="button"
              role="tab"
              aria-selected="false"
            >
              <span class="material-symbols-outlined"> output</span>
            </button>
          </div>
          
          <!-- Tab content fills the entire panel width -->
          <div
            class="tab-content overflow-y-scroll overflow-x-hidden p-3 h-100 w-100"
            style="border-radius: 12px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); margin: 8px;"
          >
            <div
              class="tab-pane fade show active"
              id="nav-home"
              role="tabpanel"
            >
              <control-ui-setting />
            </div>

            <div class="tab-pane fade" id="nav-draft" role="tabpanel">
              <asset-browser></asset-browser>
            </div>

            <div class="tab-pane fade" id="nav-text" role="tabpanel">
              <control-ui-text />
            </div>

            <div class="tab-pane fade" id="nav-option" role="tabpanel">
              <control-ui-extension />
            </div>

            <div class="tab-pane fade" id="nav-util" role="tabpanel">
              <control-ui-util />
            </div>

            <div class="tab-pane fade" id="nav-filter" role="tabpanel">
              <control-ui-filter />
            </div>

            <div class="tab-pane fade" id="nav-output" role="tabpanel">
              <control-ui-render />
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
