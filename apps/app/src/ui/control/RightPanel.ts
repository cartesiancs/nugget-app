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
          <!-- Right panel content (completely black space) -->
          <div
            class="h-100 w-100 d-flex align-items-center justify-content-center"
            style="background: #000000; border-radius: 8px; margin: 8px;"
          >
            <div class="text-center text-white opacity-30">
              <div style="font-size: 32px; margin-bottom: 12px;">💬</div>
              <p style="font-size: 14px; color: rgba(255,255,255,0.3);">Chat Space</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
