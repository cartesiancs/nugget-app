import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";

@customElement("element-timeline-left-option")
export class ElementTimelineLeftOption extends LitElement {
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
  protected render(): unknown {
    return html`
      <canvas
        id="elementTimelineLeftOptionRef"
        style="width: ${this.resize.timelineVertical
          .leftOption}px;position: absolute; height: 100%;"
        class="tab-content"
      ></canvas>
    `;
  }
}
