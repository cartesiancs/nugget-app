import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IUIStore, uiStore } from "../../states/uiStore";
import { IKeyframeStore, keyframeStore } from "../../states/keyframeStore";

@customElement("offcanvas-list-ui")
export class OffcanvasList extends LitElement {
  @property()
  keyframeState: IKeyframeStore = keyframeStore.getInitialState();

  @property()
  target = this.keyframeState.target;

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  createRenderRoot() {
    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    keyframeStore.subscribe((state) => {
      this.target = state.target;
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
          .bottom}% - 90px); visibility: visible;"
      >
        <div class="">
          <input
            type="hidden"
            id="timelineOptionTargetElement"
            value="aaaa-aaaa-aaaa-aaaa"
          />

          <div id="timelineOptionBody">
            <keyframe-editor
              elementId="${this.target.elementId}"
              isShow="${this.target.isShow}"
              animationType="${this.target.animationType}"
            ></keyframe-editor>
          </div>
        </div>
      </div>
    `;
  }
}
