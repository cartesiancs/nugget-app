import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
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
  hasUpdatedOnce: boolean;
  downloadModal: any;

  constructor() {
    super();
    this.canvasMaxHeight = "100%";
    this.video = document.createElement("video");
    this.isRecord = false;
    this.mediaRecorder = undefined;
    this.recordedChunks = undefined;
    this.startTime = 0;
    this.endTime = 0;
    this.hasUpdatedOnce = false;

    window.electronAPI.res.ytdlp.finish((evt, localpath) => {
      console.log("EEE", localpath);
      this.assetControl.add(localpath);
      this.downloadModal.hide();
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

  @query("#downloadVideoModal")
  modalEl;

  _handleInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.url = target.value;
  }

  async _handleClickDownload() {
    if (this.url == "") {
      document
        .querySelector("toast-box")
        .showToast({ message: "Url input is required.", delay: "2000" });

      return false;
    }
    const tempPath = await window.electronAPI.req.app.getTempPath();
    const uuidKey = uuidv4();

    this.downloadModal.show();

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

  updated() {
    if (!this.hasUpdatedOnce) {
      if (this.modalEl) {
        this.downloadModal = new bootstrap.Modal(this.modalEl);
      } else {
        console.error("Modal element not found in shadow DOM.");
      }

      this.hasUpdatedOnce = true;
    }
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
          style="
    width: 400px;
"
        />
        <button class="btn btn-primary" @click=${this._handleClickDownload}>
          download
        </button>
      </div>

      <div
        class="modal fade"
        id="downloadVideoModal"
        tabindex="-1"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-dialog-dark modal-dialog-centered">
          <div class="modal-content modal-dark modal-darker">
            <div class="modal-body modal-body-dark">
              <h6 class="modal-title text-light font-weight-lg mb-2">
                Download...
              </h6>
              <div class="progress">
                <div
                  class="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  aria-valuenow="100"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style="width: 100%"
                ></div>
              </div>
              <span
                class="text-secondary"
                style="font-size: 13px; cursor: pointer;"
                >Downloading the video.
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
