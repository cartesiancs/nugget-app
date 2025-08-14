import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("right-panel")
export class RightPanel extends LitElement {
  @property()
  isRightPanelCollapsed: boolean = true;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
            <div
        id="right_panel_container"
        class="h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 100%; height: 100%;"
      >
        <div
          class="h-100 w-100 overflow-y-hidden overflow-x-hidden position-absolute"
          style="transform: translateX(${this.isRightPanelCollapsed ? "100%" : "0"}); transition: transform 0.3s ease;"
        >
          <!-- Right panel content -->
          <div
            class="h-100 w-100"
            style="background: #000000;"
          >
          </div>
        </div>
      </div>
    `;
  }
}
