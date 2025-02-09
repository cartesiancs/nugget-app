import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LocaleController } from "../../controllers/locale";
import axios from "axios";
import { Buffer } from "buffer";

@customElement("gif-preset")
export class ControlText extends LitElement {
  returnArray: any;
  constructor() {
    super();

    this.getGif();
  }

  createRenderRoot() {
    return this;
  }

  async _handleClickGif(gifurl) {
    const response = await fetch(gifurl);
    const control = document.querySelector("element-control");

    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }

    const fileBlob = await response.blob();
    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    window.electronAPI.req.stream
      .saveBufferToTempFile(buffer, "gif")
      .then((path) => {
        console.log(path);
        control.addGif(fileBlob, path.path);
      });
  }

  async getGif() {
    const request = await axios.get(`http://127.0.0.1:8000/api/gif?q=starwars`);

    const result = request.data.result.data;

    this.returnArray = [];

    for (let index = 0; index < result.length; index++) {
      const element = result[index];

      this.returnArray.push(html`
        <div
          class="col-6 d-flex flex-column bd-highlight overflow-hidden mt-1 asset"
          @click=${() => this._handleClickGif(element.images.original.url)}
        >
          <img src=${element.images.original.url} />
        </div>
      `);
    }

    this.requestUpdate();
  }

  render() {
    return html` <div class="row px-2">${this.returnArray}</div>`;
  }
}
