import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITestStore, testStore } from "../../states/testStore";
import { IUIStore, uiStore } from "../../states/uiStore";

@customElement("offcanvas-list-ui")
export class OffcanvasList extends LitElement {
  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  createRenderRoot() {
    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    return this;
  }

  render() {
    return html`
      <!-- 
                    OPTION
                -->
      <div
        class="offcanvas offcanvas-start"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabindex="-1"
        id="option_top"
        aria-labelledby="offcanvasRightLabel"
        style="width: 30%;"
      >
        <div class="offcanvas-header">
          <h5 id="offcanvasRightLabel" class="text-light ms-3 mt-1">옵션</h5>
          <button
            type="button"
            class="btn btn-transparent btn-sm"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          >
            <span class="material-symbols-outlined icon-white">close</span>
          </button>
        </div>
        <div class="offcanvas-body"></div>
      </div>

      <!-- 
                    TIMELINE OPTION
                -->
      <div
        class="offcanvas offcanvas-bottom"
        data-bs-scroll="true"
        data-bs-backdrop="false"
        tabindex="-1"
        id="option_bottom"
        aria-labelledby="offcanvasRightLabel"
        style="height: calc(${this.resize.vertical
          .bottom}% - 2rem); visibility: visible;"
      >
        <div class="offcanvas-header row d-flex justify-content-between">
          <div class="col"></div>
          <div class="col text-end"></div>
        </div>
        <div class="">
          <input
            type="hidden"
            id="timelineOptionTargetElement"
            value="aaaa-aaaa-aaaa-aaaa"
          />

          <div id="timelineOptionBody" class="d-none"></div>
        </div>
      </div>
    `;
  }
}
