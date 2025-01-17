import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import mime from "../../functions/mime";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

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
        //this.processingVideoModal.show();
        console.log(progress);
      },
    );

    window.electronAPI.res.ffmpeg.extractAudioFromVideoFinish(
      (event, outputWav) => {
        this.isProgressProcessing = true;
        setTimeout(() => {
          this.processingVideoModal.hide();
          this.analyzingVideoModal.show();
        }, 500);

        this.analyzeAudioToText(outputWav);
        this.requestUpdate();

        console.log(outputWav);
      },
    );
  }

  createRenderRoot() {
    return this;
  }

  async analyzeAudioToText(audioPath) {
    const serverUrl = document.querySelector("#NuggetAutoServer").value;
    const response = await fetch(audioPath);

    console.log("AAAA");

    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    const audioBlob = await response.blob();

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    const request = await axios.post(`${serverUrl}/audio`, formData);

    const result = request.data.result;

    this.analyzingVideoModal.hide();

    console.log("RESULT", result);
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
        this.processingVideoModal.show();

        const tempPath = await window.electronAPI.req.app.getTempPath();
        const outputAudio = tempPath.path + `${uuidv4()}.wav`;

        console.log(tempPath, outputAudio);

        window.electronAPI.req.ffmpeg.extractAudioFromVideo(
          outputAudio,
          filePath,
        );

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
        <video
          width="200"
          class="${!this.isLoadVideo ? "d-none" : ""}"
          src=${this.videoPath}
        ></video>

        <div class="input-group">
          <span class="input-group-text bg-default text-light" id="basic-addon2"
            >NuggetAutoServer</span
          >
          <input
            id="NuggetAutoServer"
            type="text"
            class="form-control bg-default text-light ${this.isLoadVideo
              ? "d-none"
              : ""}"
            placeholder="http(s)://custom.domain:port"
            value="http://127.0.0.1:8000"
          />
        </div>

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
