import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AssetController } from "../../controllers/asset";

@customElement("asset-upload-drop")
export class AssetDropUploader extends LitElement {
  private assetControl = new AssetController();

  constructor() {
    super();

    document.addEventListener("dragenter", this.handleDragEnter.bind(this));
    document.addEventListener("dragover", this.handleDragOver.bind(this));
    this.addEventListener("dragleave", this.handleDragLeave.bind(this));
    this.addEventListener("drop", this.handleDrop.bind(this));
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const template = this.template();

    this.classList.add("bg-dark", "position-absolute", "d-none");
    this.style.left = "0px";
    this.style.top = "0px";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.zIndex = "10000";
    this.style.opacity = "80%";
    this.style.paddingTop = "46vh";

    this.innerHTML = template;
  }

  template() {
    return `
        <div class="row justify-content-center align-items-start">
            <b class="col-12 align-self-center text-light position-fixed text-center">
                Drop File 
            </b>
        </div>`;
  }

  handleDragEnter() {
    this.classList.remove("d-none");
  }

  handleDragOver(e) {
    e.preventDefault();

    this.classList.remove("d-none");
  }

  handleDragLeave() {
    this.classList.add("d-none");
  }

  handleDrop(e) {
    e.preventDefault();
    try {
      let filePath = e.dataTransfer.files[0].path;
      console.log(e, filePath, e.dataTransfer);

      this.assetControl.add(filePath);
      this.classList.add("d-none");
    } catch (error) {
      setTimeout(() => {
        this.classList.add("d-none");
      }, 800);
    }
  }
}
