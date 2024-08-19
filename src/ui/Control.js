import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

class Control extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        id="split_col_1"
        class="bg-darker h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 30%;"
      >
        <div class="split-col-bar" onmousedown="startSplitColumns(1)"></div>

        <div
          class=" h-100 w-100 overflow-y-hidden overflow-x-hidden position-absolute "
        >
          <div class="d-flex align-items-start h-100">
            <div
              id="sidebar"
              class="nav flex-column nav-pills bg-dark h-100 pt-1"
              style="width: 2.5rem;"
              role="tablist"
              aria-orientation="vertical"
            >
              <button
                class="btn-nav active"
                data-bs-toggle="pill"
                data-bs-target="#nav-home"
                type="button"
                role="tab"
                aria-selected="true"
              >
                <span class="material-symbols-outlined"> settings</span>
              </button>

              <button
                class="btn-nav"
                data-bs-toggle="pill"
                data-bs-target="#nav-draft"
                type="button"
                role="tab"
                aria-selected="false"
              >
                <span class="material-symbols-outlined"> draft</span>
              </button>

              <button
                class="btn-nav"
                data-bs-toggle="pill"
                data-bs-target="#nav-text"
                type="button"
                role="tab"
                aria-selected="false"
              >
                <span class="material-symbols-outlined"> text_fields</span>
              </button>

              <button
                class="btn-nav"
                data-bs-toggle="pill"
                data-bs-target="#nav-option"
                type="button"
                role="tab"
                aria-selected="false"
              >
                <span class="material-symbols-outlined"> extension</span>
              </button>

              <button
                class="btn-nav"
                data-bs-toggle="pill"
                data-bs-target="#nav-output"
                type="button"
                role="tab"
                aria-selected="false"
              >
                <span class="material-symbols-outlined"> output</span>
              </button>
            </div>
            <div
              class="tab-content overflow-y-scroll overflow-x-hidden  p-2 h-100"
              style="width: calc(100% - 2.5rem);"
            >
              <div
                class="tab-pane fade show active"
                id="nav-home"
                role="tabpanel"
              >
                <p class="text-secondary" ref="appVersion"></p>

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
                  <span
                    class="input-group-text bg-default text-light"
                    id="basic-addon2"
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

                <br />
              </div>

              <div class="tab-pane fade" id="nav-draft" role="tabpanel">
                <asset-browser></asset-browser>
                <asset-list></asset-list>
              </div>

              <div class="tab-pane fade" id="nav-text" role="tabpanel">
                <div class="row px-2">
                  <div
                    class="col-4 d-flex flex-column bd-highlight overflow-hidden mt-1 asset"
                    onclick="elementControlComponent.addText()"
                  >
                    <span
                      class="material-symbols-outlined icon-lg align-self-center"
                    >
                      text_fields
                    </span>
                    <b
                      class="align-self-center text-ellipsis text-light text-center"
                      >텍스트</b
                    >
                  </div>
                </div>
              </div>

              <div class="tab-pane fade" id="nav-option" role="tabpanel">
                <button
                  class="btn btn-sm btn-default text-light mt-1"
                  onclick="ipc.extTest()"
                >
                  익스텐션 폴더 불러오기
                  <span class="material-symbols-outlined icon-xs">
                    developer_mode
                  </span>
                </button>

                <button
                  class="btn btn-sm btn-default text-light mt-1"
                  onclick="ipc.ext()"
                >
                  익스텐션 파일 불러오기
                </button>
                <br />

                <div id="extension_webview" class="mt-2">
                  <!-- <webview src="https://nugget.studio/"></webview> -->
                </div>
              </div>

              <div class="tab-pane fade" id="nav-output" role="tabpanel">
                <label class="form-label text-light">화질 설정</label>
                <br />
                <div class="text-light mb-2">
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inputCheckBitrate"
                      id="bitrate_row"
                      value="1000"
                      disabled
                    />
                    <label class="form-check-label">낮음</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inputCheckBitrate"
                      id="bitrate_high"
                      value="5000"
                      checked
                    />
                    <label class="form-check-label">높음</label>
                  </div>
                </div>

                <label class="form-label text-light">해상도</label>
                <br />
                <div class="text-light mb-2">
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inputCheckQuality"
                      id="quality_hd"
                      value="1280x720"
                      disabled
                    />
                    <label class="form-check-label">1280x720 HD</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="inputCheckQuality"
                      id="quality_fhd"
                      value="1920x1080"
                      checked
                    />
                    <label class="form-check-label">1080x1920 FHD</label>
                  </div>
                </div>

                <button class="btn btn-blue-fill" onclick="ipc.render()">
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PREVIEW -->
      <div
        id="split_col_2"
        class="h-100 position-relative d-flex align-items-center justify-content-center"
        style="width: 50%;"
      >
        <div class="split-col-bar" onmousedown="startSplitColumns(2)"></div>

        <div id="videobox">
          <div class="d-flex justify-content-center">
            <div id="video" class="video">
              <canvas id="preview" class="preview"></canvas>
              <element-control></element-control>
              <drag-alignment-guide></drag-alignment-guide>
            </div>
          </div>
        </div>
      </div>

      <!-- OPTION-->
      <div
        id="split_col_3"
        class="bg-darker h-100 overflow-y-hidden overflow-x-hidden position-relative p-2"
        style="width: 20%;"
      >
        <input
          type="hidden"
          id="optionTargetElement"
          value="aaaa-aaaa-aaaa-aaaa"
        />

        <option-group>
          <option-text></option-text>
          <option-image></option-image>
          <option-video></option-video>
          <option-audio></option-audio>
        </option-group>
      </div>
    `;
  }
}

export { Control };
