import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { uiStore } from "../../states/uiStore";
import { Buffer } from "buffer";
import { AssetController } from "../../controllers/asset";
import { v4 as uuidv4 } from "uuid";

@customElement("youtube-download")
export class YoutubeDownload extends LitElement {
  canvasMaxHeight: any;
  video: HTMLVideoElement;
  isRecord: boolean;
  mediaRecorder: MediaRecorder | any;
  recordedChunks: any;
  startTime: number;
  endTime: number;
  stream: MediaStream | any;

  constructor() {
    super();
    this.canvasMaxHeight = "100%";
    this.video = document.createElement("video");
    this.isRecord = false;
    this.mediaRecorder = undefined;
    this.recordedChunks = undefined;
    this.startTime = 0;
    this.endTime = 0;

    window.electronAPI.res.ytdlp.finish((evt, localpath) => {
      console.log("EEE", localpath);
      this.assetControl.add(localpath);

      document
        .querySelector("toast-box")
        .showToast({ message: "Download complete", delay: "4000" });
    });
  }

  private assetControl = new AssetController();

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  control = this.timelineState.control;

  @property({ type: String })
  url: string = "";

  _handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.url = target.value;
  }

  async _handleClickDownload() {
    const tempPath = await window.electronAPI.req.app.getTempPath();
    const uuidKey = uuidv4();

    window.electronAPI.req.ytdlp.downloadVideo(this.url, {
      savePath: `${tempPath.path}/${uuidKey}.webm`,
      filename: uuidKey,
    });

    document
      .querySelector("toast-box")
      .showToast({ message: "Download request", delay: "4000" });
  }

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.control = state.control;
    });

    uiStore.subscribe((state) => {
      this.canvasMaxHeight =
        document.querySelector("#split_col_2").clientHeight;
    });

    return this;
  }

  render() {
    return html`
      <div
        class="d-flex"
        style="flex-direction: column; padding: 1rem; justify-content: center; align-items: center; gap: 1rem;"
      >
        <input
          type="text"
          .value=${this.url}
          @input=${this._handleInputChange}
          placeholder="Enter Youtube URL"
          class="form-control bg-default text-light"
        />
        <button class="btn btn-primary" @click=${this._handleClickDownload}>
          download
        </button>
      </div>
    `;
  }
}
