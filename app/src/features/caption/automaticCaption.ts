import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import mime from "../../functions/mime";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { LocaleController } from "../../controllers/locale";
import { useTimelineStore } from "../../states/timelineStore";

@customElement("automatic-caption")
export class AutomaticCaption extends LitElement {
  isLoadVideo: boolean;
  videoPath: string;
  isProgressProcessing: boolean;
  processingVideoModal: any;
  analyzingVideoModal: any;
  analyzedText: any[];
  selectVideoModal: any;
  selectedRow: any;
  videoRows: any;
  hasUpdatedOnce: boolean;
  panelVideoModal: any;
  isPlay: boolean;
  private _start: any;
  private _previousTimeStamp: any;
  private _done: boolean;
  private _animationFrameId: any;
  progress: number;
  previousProgress: number;
  splitCursor: number[];

  constructor() {
    super();

    this.isLoadVideo = false;
    this.isProgressProcessing = false;
    this.videoPath = "";
    this.analyzedText = [];

    this.processingVideoModal = undefined;
    this.analyzingVideoModal = undefined;

    this.selectedRow = null;

    this.hasUpdatedOnce = false;

    this.isPlay = false;
    this.progress = 0;
    this.previousProgress = 0;

    this._start = undefined;
    this._previousTimeStamp = undefined;
    this._done = false;
    this._animationFrameId = null;

    this.splitCursor = [0, 0];

    window.addEventListener("keydown", this._handleKeydown.bind(this));

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

  @query("#previewCanvasCaption") canvas!: HTMLCanvasElement;

  private lc = new LocaleController(this);

  createRenderRoot() {
    return this;
  }

  handleRowSelection(rowId) {
    this.selectedRow = rowId;
    console.log("Selected Row:", this.selectedRow);
    this.requestUpdate();
  }

  async analyzeAudioToText(audioPath) {
    const serverUrl = document.querySelector("#NuggetAutoServer").value;
    const response = await fetch(audioPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    const audioBlob = await response.blob();

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");

    const request = await axios.post(`${serverUrl}/audio/test`, formData);

    const result = request.data.result;

    this.analyzingVideoModal.hide();

    this.analyzedText = [];

    for (let index = 0; index < result.length; index++) {
      const element = result[index];
      this.analyzedText.push(element.words);
    }

    this.requestUpdate();

    this.panelVideoModal.show();

    console.log("RESULT", result);
  }

  async handleClickLoadVideo() {
    this.videoRows = this.timelineMap();
    this.requestUpdate();

    this.selectVideoModal.show();

    // window.electronAPI.req.dialog.openFile().then(async (result) => {
    //   const filePath = result;
    //   const fileType = mime.lookup(filePath).type;
    //   if (fileType == "video") {
    //     this.isLoadVideo = true;
    //     this.videoPath = filePath;
    //     this.processingVideoModal.show();

    //     const tempPath = await window.electronAPI.req.app.getTempPath();
    //     const outputAudio = tempPath.path + `${uuidv4()}.wav`;

    //     console.log(tempPath, outputAudio);

    //     window.electronAPI.req.ffmpeg.extractAudioFromVideo(
    //       outputAudio,
    //       filePath,
    //     );

    //     this.requestUpdate();
    //     // pass
    //   }
    // });
  }

  async handleClickSelectVideo() {
    this.selectVideoModal.hide();
    this.isLoadVideo = true;
    this.videoPath = this.selectedRow;
    this.processingVideoModal.show();

    const tempPath = await window.electronAPI.req.app.getTempPath();
    const outputAudio = tempPath.path + `${uuidv4()}.wav`;

    console.log(tempPath, outputAudio);

    window.electronAPI.req.ffmpeg.extractAudioFromVideo(
      outputAudio,
      this.selectedRow,
    );

    this.requestUpdate();
  }

  handleClickComplate() {}

  updated() {
    if (this.hasUpdatedOnce == false) {
      this.selectVideoModal = new bootstrap.Modal(
        document.getElementById("SelectVideo"),
        {
          keyboard: false,
        },
      );

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

      this.panelVideoModal = new bootstrap.Modal(
        document.getElementById("VideoPanel"),
        {
          keyboard: false,
        },
      );
    }

    this.hasUpdatedOnce = true;
  }

  _step(timestamp) {
    if (this._start === undefined) {
      this._start = timestamp;
    }
    const elapsed = timestamp - this._start;
    this.progress = this.previousProgress + elapsed;

    const video: HTMLVideoElement = document.querySelector(
      "#captionPreviewVideo",
    );

    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.drawImage(video, 0, 0, 1920, 1080);

    let nowCaptionIndex = 0;

    for (let index = 0; index < this.analyzedText.length; index++) {
      const element: any = this.analyzedText[index];
      let partText: any = [];

      for (let indexpart = 0; indexpart < element.length; indexpart++) {
        const partElement = element[indexpart];
        const isNow =
          this.progress / 1000 > partElement.start &&
          this.progress / 1000 < partElement.end + 1;

        if (isNow) {
          nowCaptionIndex = index;
          break;
        }
      }
    }

    this.drawCaption(nowCaptionIndex);

    this.requestUpdate();

    if (!this._done) {
      this._animationFrameId = window.requestAnimationFrame((ts) =>
        this._step(ts),
      );
    }
  }

  drawCaption(index) {
    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    const fontSize = 52;
    const fontName = "notosanskr";
    const text = this.analyzedText[index]
      .map((item) => {
        return item.word;
      })
      .join(" ");

    const screenWidth = 1920;
    const screenHeight = 1080;
    const xPadding = 100;
    const yPadding = 100;

    const x = xPadding;
    const y = screenHeight - yPadding - fontSize;
    const w = screenWidth - xPadding * 2;
    const h = fontSize;

    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 0;
    ctx.letterSpacing = `0px`;

    ctx.font = `${fontSize}px ${fontName}`;

    const fontBoxWidth = ctx.measureText(text).width;

    ctx.fillStyle = "#ffffff";

    ctx.fillText(text, x + w / 2 - fontBoxWidth / 2, y);
  }

  playVideo() {
    this.isPlay = true;
    this._start = undefined;
    this._previousTimeStamp = undefined;
    this._done = false;

    if (this._animationFrameId) {
      window.cancelAnimationFrame(this._animationFrameId);
    }

    this._animationFrameId = window.requestAnimationFrame((ts) =>
      this._step(ts),
    );

    const video: HTMLVideoElement = document.querySelector(
      "#captionPreviewVideo",
    );
    video.play();

    this.requestUpdate();
  }

  stopVideo() {
    this.isPlay = false;
    this.previousProgress = this.progress;
    const video: HTMLVideoElement = document.querySelector(
      "#captionPreviewVideo",
    );
    video.pause();

    if (this._animationFrameId) {
      window.cancelAnimationFrame(this._animationFrameId);
    }
    this._done = true;

    this.requestUpdate();
  }

  resetVideo() {
    this.isPlay = false;
    this._done = true;
    this.progress = 0;
    this.previousProgress = 0;

    const video: HTMLVideoElement = document.querySelector(
      "#captionPreviewVideo",
    );
    video.currentTime = 0;

    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.drawImage(video, 0, 0, 1920, 1080);

    this.requestUpdate();
  }

  clickCaptionText(index, indexPart, time) {
    this.stopVideo();
    if (time != -1) {
      this.progress = time * 1000;
      this.previousProgress = time * 1000;

      const video: HTMLVideoElement = document.querySelector(
        "#captionPreviewVideo",
      );
      video.currentTime = time;

      const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(video, 0, 0, 1920, 1080);
    }

    this.splitCursor = [index, indexPart];
    this.requestUpdate();
  }

  splitCaption() {
    const index = this.splitCursor[0];
    const indexPart = this.splitCursor[1] + 1;

    if (index < 0 || index > this.analyzedText.length) {
      throw new Error("Invalid index");
    }

    const prevValue = this.analyzedText[index].slice(0, indexPart);
    const nextValue = this.analyzedText[index].slice(indexPart);

    console.log(prevValue, nextValue);

    this.analyzedText.splice(index, 1, prevValue);

    this.analyzedText.splice(index + 1, 0, nextValue);

    this.requestUpdate();
  }

  _handleKeydown(event) {
    if (event.keyCode == 13) {
      // enter
      this.splitCaption();
    }
  }

  render() {
    let analyzedTextMap: any = [];

    for (let index = 0; index < this.analyzedText.length; index++) {
      const element: any = this.analyzedText[index];
      let partText: any = [];

      for (let indexPart = 0; indexPart < element.length; indexPart++) {
        const partElement = element[indexPart];
        const isNow =
          this.progress / 1000 > partElement.start &&
          this.progress / 1000 < partElement.end;

        const isNowCursor =
          this.splitCursor[0] == index && this.splitCursor[1] == indexPart;

        partText.push(
          html`<span
              @click=${() =>
                this.clickCaptionText(
                  index,
                  indexPart,
                  partElement.start || -1,
                )}
              class="${isNow ? "caption-part active" : "caption-part"}"
              >${partElement.word}</span
            >
            <div class="${isNowCursor ? "caption-split" : "d-none"}"></div>`,
        );
      }
      analyzedTextMap.push(
        html`<span class="text-light caption">${partText} </span>`,
      );
    }

    return html`
      <style>
        .caption {
          background-color: #19181a;
          color: #ffffff;
          padding: 0.5rem;
          border: 1px solid #26262b;
          border-radius: 8px;
          height: fit-content;
          width: fit-content;
          cursor: text;
        }

        .caption-part {
          background-color: #1b1a1c;
          color: #ffffff;
          padding: 0.125rem 0.2rem;
          margin-bottom: 0.1rem;
          border: 2px solid #26262b;
          border-radius: 8px;
          height: fit-content;
          width: fit-content;
          display: inline-block;
        }

        .caption-part.active {
          background-color: #423d47;
          color: #ffffff;
          padding: 0.125rem 0.2rem;
          margin-bottom: 0.1rem;
          border: 2px solid #3838d3;
          border-radius: 8px;
          height: fit-content;
          width: fit-content;
          display: inline-block;
        }

        .caption-split {
          width: 2px;
          background-color: #3838d3;
          height: 1rem;
          display: inline-block;
        }
      </style>
      <div
        class="d-flex"
        style="flex-direction: column;
    padding: 1rem;     justify-content: center;
    align-items: center;
    gap: 1rem;"
      >
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

      <div
        class="modal fade"
        id="SelectVideo"
        data-bs-keyboard="false"
        data-bs-backdrop="static"
        tabindex="-1"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-body">
              <h5 class="modal-title font-weight-lg">
                Select video from Timeline
              </h5>

              <b class="text-secondary"
                >타임라인에 기입한 영상 레이어를 선택합니다.</b
              >

              <table class="table table-striped ">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Video</th>
                    <th scope="col">Select</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.renderRows()}
                </tbody>
              </table>

              <div class="mt-3">
                <div class="flex row gap-2">
                  <button
                    type="button"
                    class="col btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    ${this.lc.t("modal.close")}
                  </button>
                  <button
                    ?disabled=${this.selectedRow == null}
                    type="button"
                    class="col btn btn-primary"
                    data-bs-dismiss="modal"
                    @click=${this.handleClickSelectVideo}
                  >
                    선택 완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="modal fade"
        id="VideoPanel"
        data-bs-keyboard="false"
        data-bs-backdrop="static"
        tabindex="-1"
      >
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content bg-dark">
            <div class="modal-body">
              <div class="d-flex col gap-2 mt-4">
                <div
                  class="d-flex row gap-2"
                  style="width: 400px;position: fixed;"
                >
                  <canvas
                    id="previewCanvasCaption"
                    style="width: 400px;"
                    width="1920"
                    height="1080"
                  ></canvas>

                  <video
                    class="d-none col-3"
                    id="captionPreviewVideo"
                    src=${this.videoPath}
                  ></video>

                  <span class="text-light"
                    >${Math.round(this.progress / 1000)}s</span
                  >

                  <div class="d-flex col gap-2">
                    <button
                      class=" btn btn-sm btn-secondary"
                      @click=${this.resetVideo}
                    >
                      reset
                    </button>
                    <button
                      class="${this.isPlay
                        ? "d-none"
                        : ""} btn btn-sm btn-secondary"
                      @click=${this.playVideo}
                    >
                      play
                    </button>

                    <button
                      class="${!this.isPlay
                        ? "d-none"
                        : ""}  btn btn-sm btn-danger"
                      @click=${this.stopVideo}
                    >
                      stop
                    </button>
                  </div>
                </div>

                <div
                  class="col-6"
                  style="position: absolute;
    right: 20px;"
                >
                  <div class="d-flex row gap-2">${analyzedTextMap}</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <div class="flex row gap-2 w-100">
                <button
                  type="button"
                  class="col btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  ${this.lc.t("modal.close")}
                </button>
                <button
                  type="button"
                  class="col btn btn-primary"
                  data-bs-dismiss="modal"
                  @click=${this.handleClickComplate}
                >
                  Complate Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  timelineMap(): any {
    const timeline = useTimelineStore.getState().timeline;
    const timelineArray: any = [];
    let index = 1;

    for (const key in timeline) {
      if (Object.prototype.hasOwnProperty.call(timeline, key)) {
        const element = timeline[key];

        if (element.filetype == "video") {
          timelineArray.push({ id: index, video: element.localpath });
          index += 1;
        }
      }
    }

    console.log(timelineArray);

    return timelineArray;
  }

  renderRows() {
    try {
      return this.videoRows.map(
        (row) => html`
          <tr @click="${() => this.handleRowSelection(row.video)}">
            <th scope="row">${row.id}</th>
            <td>${row.video}</td>
            <td>
              <input
                type="radio"
                name="videoSelect"
                .checked="${this.selectedRow === row.video}"
              />
            </td>
          </tr>
        `,
      );
    } catch (error) {
      return html``;
    }
  }
}
