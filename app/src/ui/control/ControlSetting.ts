import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITestStore, testStore } from "../../states/testStore";

@customElement("control-ui-setting")
export class ControlSetting extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html` <p class="text-secondary" ref="appVersion"></p>

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
