import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  IRenderOptionStore,
  renderOptionStore,
} from "../../states/renderOptionStore";

@customElement("control-ui-setting")
export class ControlSetting extends LitElement {
  @property()
  renderOptionStore: IRenderOptionStore = renderOptionStore.getInitialState();

  @property()
  renderOption = this.renderOptionStore.options;

  @property()
  appVersion = "";

  createRenderRoot() {
    renderOptionStore.subscribe((state) => {
      this.renderOption = state.options;
    });

    window.electronAPI.req.app.getAppInfo().then((result) => {
      this.appVersion = `Nugget v${result.data.version}`;
    });

    return this;
  }

  _handleUpdatePreviewSizeW(e) {
    this.renderOption.previewSize.w = e.target.value;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  _handleUpdatePreviewSizeH(e) {
    this.renderOption.previewSize.h = e.target.value;
    this.renderOptionStore.updateOptions(this.renderOption);
  }

  render() {
    return html` <p class="text-secondary" ref="appVersion">
        ${this.appVersion}
      </p>

      <input id="projectFile" type="text" class="d-none" name="" />

      <div class="input-group mb-3">
        <input
          id="projectFolder"
          type="text"
          class="form-control bg-default text-light"
          placeholder="/"
          disabled
        />
        <button
          class="btn btn-sm btn-default text-light"
          onclick="NUGGET.directory.select()"
        >
          프로젝트 폴더 지정
        </button>
      </div>

      <label class="form-label text-light">영상 시간</label>
      <div class="input-group mb-3">
        <input
          id="projectDuration"
          type="number"
          class="form-control bg-default text-light"
          placeholder="진행초 e.g) 0"
          onchange="document.querySelector('element-timeline-ruler').updateRulerLength(this)"
          value="10"
        />
        <span class="input-group-text bg-default text-light" id="basic-addon2"
          >초</span
        >
      </div>

      <label class="form-label text-light">프레임</label>
      <div class="input-group mb-3">
        <input
          id="projectDuration"
          type="number"
          class="form-control bg-default text-light"
          placeholder=""
          value="60"
          disabled
        />
        <span class="input-group-text bg-default text-light" id="basic-addon2"
          >fps</span
        >
      </div>

      <label class="form-label text-light">해상도</label>
      <div class="d-flex flex-row bd-highlight mb-2">
        <input
          id="previewSizeH"
          type="number"
          class="form-control bg-default text-light me-1"
          value=${this.renderOption.previewSize.h}
          @change=${this._handleUpdatePreviewSizeH}
        />
        <input
          id="previewSizeW"
          type="number"
          class="form-control bg-default text-light"
          value=${this.renderOption.previewSize.w}
          @change=${this._handleUpdatePreviewSizeW}
        />
      </div>

      <button
        class="btn btn-sm btn-default text-light mt-1"
        onclick="NUGGET.project.save()"
      >
        프로젝트 저장
      </button>
      <button
        class="btn btn-sm btn-default text-light mt-1"
        onclick="NUGGET.project.load()"
      >
        프로젝트 불러오기
      </button>
      <!-- <button class="btn btn-sm bg-primary text-light mt-1" onclick="window.electronAPI.req.progressBar.test()">PROGRESSBARTEST </button> -->
      <br />

      <button
        type="button"
        class="btn btn-sm btn-default text-light mt-1"
        data-bs-toggle="modal"
        data-bs-target="#shortKey"
      >
        <span class="material-symbols-outlined"> keyboard </span>
      </button>

      <br />`;
  }
}
