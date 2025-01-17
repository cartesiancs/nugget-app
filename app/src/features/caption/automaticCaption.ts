import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import mime from "../../functions/mime";
import { v4 as uuidv4 } from "uuid";

@customElement("automatic-caption")
export class AutomaticCaption extends LitElement {
  isLoadVideo: boolean;
  videoPath: string;
  isProgressProcessing: boolean;
  processingVideoModal: any;
  analyzingVideoModal: any;
  constructor() {
    super();

    this.isLoadVideo = false;
    this.isProgressProcessing = false;
    this.videoPath = "";

    this.processingVideoModal = undefined;
    this.analyzingVideoModal = undefined;

    window.electronAPI.res.ffmpeg.extractAudioFromVideoProgress(
      (event, progress) => {
        this.processingVideoModal.show();
        console.log(progress);
      },
    );

    window.electronAPI.res.ffmpeg.extractAudioFromVideoFinish(
      (event, outputWav) => {
        this.isProgressProcessing = true;
        this.processingVideoModal.hide();
        this.analyzingVideoModal.show();
        this.requestUpdate();

        console.log(outputWav);
      },
    );
  }

  createRenderRoot() {
    return this;
  }

  async handleClickLoadVideo() {
    this.processingVideoModal = new bootstrap.Modal(
      document.getElementById("ProcessingVideo"),
      {
        keyboard: false,
      },
    );

    this.analyzingVideoModal = new bootstrap.Modal(
      document.getElementById("AnalyzingVideo"),
      {
        keyboard: false,
      },
    );

    window.electronAPI.req.dialog.openFile().then(async (result) => {
      const filePath = result;
      const fileType = mime.lookup(filePath).type;
      if (fileType == "video") {
        this.isLoadVideo = true;
        this.videoPath = filePath;

        const tempPath = await window.electronAPI.req.app.getTempPath();
        const outputAudio = tempPath.path + `${uuidv4()}.wav`;

        console.log(tempPath, outputAudio);

        window.electronAPI.req.ffmpeg.extractAudioFromVideo(
          outputAudio,
          filePath,
        );

        this.processingVideoModal.show();

        this.requestUpdate();
        // pass
      }
    });
  }

  render() {
    return html`
      <div
        class="d-flex"
        style="flex-direction: column;
    padding: 1rem;     justify-content: center;
    align-items: center;
    gap: 1rem;"
      >
        <video width="200" src=${this.videoPath}></video>
        <button
          class="btn btn-sm btn-default text-light mt-1 ${this.isLoadVideo
            ? "d-none"
            : ""}"
          @click=${this.handleClickLoadVideo}
        >
          Load video
        </button>
      </div>

      <div
        class="modal fade"
        id="ProcessingVideo"
        data-bs-keyboard="false"
        data-bs-backdrop="static"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content bg-dark">
            <div class="modal-body">
              <h5 class="modal-title text-white font-weight-lg">
                영상 오디오 추출중...
              </h5>

              <b class="text-secondary">영상 처리중 </b>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="AnalyzingVideo"
        data-bs-keyboard="false"
        data-bs-backdrop="static"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content bg-dark">
            <div class="modal-body">
              <h5 class="modal-title text-white font-weight-lg">
                영상 캡션 분석중...
              </h5>

              <b class="text-secondary">영상 처리중 </b>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
