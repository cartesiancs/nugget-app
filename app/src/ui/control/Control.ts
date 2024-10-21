import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITestStore, testStore } from "../../states/testStore";
import "./ControlSetting";
import "./ControlText";
import "./ControlExtension";
import "./ControlRender";

@customElement("control-ui")
export class Control extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        id="split_col_1"
        class="bg-darker h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 30%;"
      >
        <div class="split-col-bar" onmousedown="startSplitColumns(1)"></div>

        <div
          class=" h-100 w-100 overflow-y-hidden overflow-x-hidden position-absolute "
        >
          <div class="d-flex align-items-start h-100">
            <div
              id="sidebar"
              class="nav flex-column nav-pills bg-dark h-100 pt-1"
              style="width: 2.5rem;"
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
            <div
              class="tab-content overflow-y-scroll overflow-x-hidden  p-2 h-100"
              style="width: calc(100% - 2.5rem);"
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
                <asset-list></asset-list>
              </div>

              <div class="tab-pane fade" id="nav-text" role="tabpanel">
                <control-ui-text />
              </div>

              <div class="tab-pane fade" id="nav-option" role="tabpanel">
                <control-ui-extension />
              </div>

              <div class="tab-pane fade" id="nav-output" role="tabpanel">
                <control-ui-render />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PREVIEW -->
      <div
        id="split_col_2"
        class="h-100 position-relative d-flex align-items-center justify-content-center"
        style="width: 50%;"
      >
        <div class="split-col-bar" onmousedown="startSplitColumns(2)"></div>

        <div id="videobox">
          <div class="d-flex justify-content-center">
            <div id="video" class="video">
              <canvas id="preview" class="preview"></canvas>
              <element-control></element-control>
              <drag-alignment-guide></drag-alignment-guide>
            </div>
          </div>
        </div>
      </div>

      <!-- OPTION-->
      <div
        id="split_col_3"
        class="bg-darker h-100 overflow-y-hidden overflow-x-hidden position-relative p-2"
        style="width: 20%;"
      >
        <input
          type="hidden"
          id="optionTargetElement"
          value="aaaa-aaaa-aaaa-aaaa"
        />

        <option-group>
          <option-text></option-text>
          <option-image></option-image>
          <option-video></option-video>
          <option-audio></option-audio>
        </option-group>
      </div>
    `;
  }
}
