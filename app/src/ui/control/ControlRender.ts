import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IProjectStore, projectStore } from "../../states/projectStore";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { RenderController } from "../../controllers/render";

@customElement("control-ui-render")
export class ControlRender extends LitElement {
  private renderControl = new RenderController();

  @property()
  projectState: IProjectStore = projectStore.getInitialState();

  @property()
  nowDirectory = this.projectState.nowDirectory;

  createRenderRoot() {
    projectStore.subscribe((state) => {
      this.nowDirectory = state.nowDirectory;
    });

    return this;
  }

  handleClickActionButton() {
    //this.renderControll.requestRender();
  }

  handleClickRenderButton() {
    this.renderControl.requestRender();
  }

  render() {
    return html` <label class="form-label text-light">화질 설정</label>
      <br />
      <div class="text-light mb-2">
        <div class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="radio"
            name="inputCheckBitrate"
            id="bitrate_row"
            value="1000"
            disabled
          />
          <label class="form-check-label">낮음</label>
        </div>
        <div class="form-check form-check-inline">
          <input
            class="form-check-input"
            type="radio"
            name="inputCheckBitrate"
            id="bitrate_high"
            value="5000"
            checked
          />
          <label class="form-check-label">높음</label>
        </div>
      </div>

      <button class="btn btn-blue-fill" @click=${this.handleClickRenderButton}>
        Export
      </button>`;
  }
}
