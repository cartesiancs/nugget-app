import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import mime from "../../functions/mime";

@customElement("automatic-caption")
export class AutomaticCaption extends LitElement {
  isLoadVideo: boolean;
  videoPath: string;
  constructor() {
    super();

    this.isLoadVideo = false;
    this.videoPath = "";
  }

  createRenderRoot() {
    return this;
  }

  handleClickLoadVideo() {
    window.electronAPI.req.dialog.openFile().then((result) => {
      const filePath = result;
      const fileType = mime.lookup(filePath).type;
      if (fileType == "video") {
        this.isLoadVideo = true;
        this.videoPath = filePath;
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
        <video src=${this.videoPath}></video>
        <button
          class="btn btn-sm btn-default text-light mt-1 ${this.isLoadVideo
            ? "d-none"
            : ""}"
          @click=${this.handleClickLoadVideo}
        >
          Load video
        </button>
      </div>
    `;
  }
}
