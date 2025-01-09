import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { uiStore } from "../../states/uiStore";
import { Buffer } from "buffer";
import { AssetController } from "../../controllers/asset";

@customElement("screen-record-panel")
export class ScreenRecordPanel extends LitElement {
  canvasMaxHeight: any;
  video: HTMLVideoElement;
  isRecord: boolean;
  mediaRecorder: MediaRecorder | any;
  recordedChunks: any;
  startTime: number;
  endTime: number;
  constructor() {
    super();

    this.canvasMaxHeight = "100%";
    this.video = document.createElement("video");
    this.isRecord = false;
    this.mediaRecorder = undefined;
    this.recordedChunks = undefined;
    this.startTime = 0;
    this.endTime = 0;
  }

  private assetControl = new AssetController();

  @query("#screenRecordCanvasRef") canvas!: HTMLCanvasElement;

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  control = this.timelineState.control;

  load() {
    const ctx = this.canvas.getContext("2d") as any;

    if (this.isRecord == false) {
      return;
    }

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    ctx.drawImage(
      this.video,
      0,
      0,
      this.video.videoWidth,
      this.video.videoHeight,
    );

    window.requestAnimationFrame(this.load.bind(this));
  }

  stop() {
    this.isRecord = false;
    console.log(this.mediaRecorder);
    this.mediaRecorder.stop();
    this.requestUpdate();
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60, displaySurface: "monitor" },
      });
      this.video.srcObject = stream;
      this.video.onloadedmetadata = () => this.video.play();

      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("AAAAf");

          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        this.endTime = Date.now();

        const duration = this.endTime - this.startTime;
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        window.electronAPI.req.stream.saveBufferToVideo(buffer).then((path) => {
          console.log(path, duration);

          if (path.status) {
            this.assetControl.addVideoWithDuration(path.path, duration);
          }
        });
      };
      console.log("AAAAd", stream);

      this.mediaRecorder.start();
      this.isRecord = true;
      this.load();
      this.requestUpdate();
    } catch (err) {
      console.error("Error starting screen recording:", err);
    }
  }

  _handleClickRecord() {
    this.startRecording();
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
        style="flex-direction: column;
    padding: 1rem;     justify-content: center;
    align-items: center;
    gap: 1rem;"
      >
        <canvas
          id="screenRecordCanvasRef"
          style="width: 60%; max-height: calc(${this
            .canvasMaxHeight}px - 40px);"
          width="1920"
          height="1080"
        ></canvas>

        <button
          class="btn btn-primary ${this.isRecord ? "d-none" : ""}"
          @click=${this._handleClickRecord}
        >
          record
        </button>
        <button
          class="btn btn-danger ${this.isRecord ? "" : "d-none"}"
          @click=${this.stop}
        >
          stop
        </button>
      </div>
    `;
  }
}
