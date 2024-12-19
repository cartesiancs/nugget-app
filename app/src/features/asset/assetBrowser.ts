import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AssetController } from "../../controllers/asset";
import { LocaleController } from "../../controllers/locale";

@customElement("asset-browser")
export class AssetBrowser extends LitElement {
  directory: string;
  constructor() {
    super();

    this.directory = "";
  }

  createRenderRoot() {
    return this;
  }

  private assetControl = new AssetController();

  render() {
    return html`<div class="d-flex flex-row p-0 mt-2">
      <button
        ref="arrowup"
        class="btn btn-transparent btn-sm"
        @click=${this.clickPrevDirectoryButton}
      >
        <span class="material-symbols-outlined icon-sm"> arrow_upward </span>
      </button>
      <input
        ref="text"
        type="text"
        class="form-control"
        aria-describedby="basic-addon1"
        value=""
        disabled
      />
    </div>`;
  }

  updateDirectoryInput(path) {
    let directoryInput: any =
      this.querySelector("div").querySelector("input[ref='text']");
    directoryInput.value = path;
  }

  clickPrevDirectoryButton() {
    this.directory = document.querySelector("asset-list").nowDirectory;
    if (this.directory == "") {
      return 0;
    }

    let splitNowDirectory = this.directory.split("/");
    let splitPrevDirectory = splitNowDirectory.slice(
      -splitNowDirectory.length,
      -1,
    );

    this.assetControl.requestAllDir(splitPrevDirectory.join("/"));
  }
}
