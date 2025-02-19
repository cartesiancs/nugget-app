import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IProjectStore, projectStore } from "../../states/projectStore";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { RenderController } from "../../controllers/render";
import { LocaleController } from "../../controllers/locale";
import { getLocationEnv } from "../../functions/getLocationEnv";
import axios from "axios";
import { renderOptionStore } from "../../states/renderOptionStore";
import { v4 as uuidv4 } from "uuid";

@customElement("control-ui-render")
export class ControlRender extends LitElement {
  private renderControl = new RenderController();
  private lc = new LocaleController(this);

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

  async requestHttpRender() {
    const tempPath = await window.electronAPI.req.app.getTempPath();
    const renderOptionState = renderOptionStore.getState().options;
    const elementControlComponent = document.querySelector("element-control");

    const projectDuration = renderOptionState.duration;
    const projectFolder = tempPath.path;
    const projectRatio = elementControlComponent.previewRatio;
    const previewSizeH = renderOptionState.previewSize.h;
    const previewSizeW = renderOptionState.previewSize.w;
    const backgroundColor = renderOptionState.backgroundColor;

    const videoBitrate = Number(document.querySelector("#videoBitrate").value);
    const uuidKey = uuidv4();

    if (projectFolder == "") {
      document
        .querySelector("toast-box")
        .showToast({ message: "Select a project folder", delay: "4000" });

      return 0;
    }

    let options = {
      videoDuration: projectDuration,
      videoDestination: `${projectFolder}/${uuidKey}.mp4`,
      videoDestinationFolder: projectFolder,
      videoBitrate: videoBitrate,
      previewRatio: projectRatio,
      backgroundColor: backgroundColor,
      previewSize: {
        w: previewSizeW,
        h: previewSizeH,
      },
    };

    let timeline = Object.fromEntries(
      Object.entries(useTimelineStore.getState().timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );

    for (const key in timeline) {
      if (Object.prototype.hasOwnProperty.call(timeline, key)) {
        timeline[key].localpath = `file:/${timeline[key].localpath}`;
      }
    }

    axios.post("/api/render", {
      options: options,
      timeline: timeline,
    });
  }

  handleClickActionButton() {
    //this.renderControll.requestRender();
  }

  handleClickRenderButton() {
    this.renderControl.requestRender();
  }

  handleClickRenderV2Button() {
    const env = getLocationEnv();
    if (env == "electron") {
      this.renderControl.requestRenderV2();
    } else {
      this.requestHttpRender();
    }
  }

  render() {
    return html`
      <label class="form-label text-light"
        >${this.lc.t("setting.bitrate")}</label
      >
      <div class="input-group mb-3">
        <input
          id="videoBitrate"
          type="number"
          class="form-control bg-default text-light"
          placeholder=""
          value="5000"
        />
        <span class="input-group-text bg-default text-light" id="basic-addon2"
          >${this.lc.t("setting.bitrate_unit")}</span
        >
      </div>

      <br />
      <!-- <div class="text-light mb-2">
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
      </div> -->

      <!-- <button class="btn btn-blue-fill" @click=${this
        .handleClickRenderButton}>
        ${this.lc.t("setting.export")}
      </button> -->

      <button
        class="btn btn-blue-fill"
        @click=${this.handleClickRenderV2Button}
      >
        Render
      </button>
    `;
  }
}
