import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "./ControlSetting";
import "./ControlText";
import "./ControlExtension";
import "./ControlRender";
import "./ControlUtilities";
import "./ControlFilter";
import "../../features/preview/previewTopBar";
import "../../features/record/screenRecord";
import "../../features/record/audioRecord";
import "../../features/ytdown/ytDownload";

import "../../../../automatic-caption/src/automaticCaption";

import { IUIStore, uiStore } from "../../states/uiStore";
import { TimelineController } from "../../controllers/timeline";
import {
  IControlPanelStore,
  controlPanelStore,
} from "../../states/controlPanelStore";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("control-ui")
export class Control extends LitElement {
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline: any = this.timelineState.timeline;

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  isAbleResize: boolean = false;

  @property()
  targetResize: "panel" | "preview" = "panel";

  @property()
  controlPanel: IControlPanelStore = controlPanelStore.getInitialState();

  @property()
  activePanel = this.controlPanel.active;

  @property()
  nowActivePanel = this.controlPanel.nowActive;

  @property()
  isPanelCollapsed: boolean = true;

  // Track preview fullscreen state so we can toggle the icon
  @property()
  isPreviewFullScreen: boolean = false;

  constructor() {
    super();

    // Listen to browser fullscreen changes to keep icon in sync
    window.addEventListener("fullscreenchange", () => {
      this.isPreviewFullScreen = document.fullscreenElement != null;
      this.requestUpdate();
    });
  }

  // ---------------------------------------------------------------------------
  // Preview fullscreen helpers
  // ---------------------------------------------------------------------------

  _togglePreviewFullScreen() {
    const videoBox = document.getElementById("videobox");
    if (!videoBox) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen on the preview container
      (videoBox as HTMLElement).requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  _renderPreviewFullScreenButton() {
    return html`<button
      class="btn btn-xs2 btn-transparent position-absolute"
      style="bottom: 0.5rem; right: 0.5rem; z-index: 50;"
      @click=${this._togglePreviewFullScreen}
      title="Toggle full-screen"
    >
      <span class="material-symbols-outlined icon-white icon-md">
        ${this.isPreviewFullScreen ? "fullscreen_exit" : "fullscreen"}
      </span>
    </button>`;
  }

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    controlPanelStore.subscribe((state) => {
      this.activePanel = state.active;
      this.nowActivePanel = state.nowActive;
    });

    window.addEventListener("mouseup", this._handleMouseUp.bind(this));
    window.addEventListener("mousemove", this._handleMouseMove.bind(this));

    return this;
  }

  _handleMouseMove(e) {
    // Resizing disabled – no operation
    return;
  }

  _handleMouseUp() {
    // Resizing disabled – no operation
    return;
  }

  _handleClickResizePanel() {
    // Resizing disabled – no operation
    return;
  }

  _handleClickResizePreview() {
    // Resizing disabled – no operation
    return;
  }

  _handleComplateAutoCaption(e) {
    const result = e.detail.result;
    const control = document.querySelector("element-control");

    for (let index = 0; index < result.length; index++) {
      const element = result[index];
      control.addText(element);
    }
  }

  _handleChangeCursorType(e) {
    const type = e.detail.type;

    this.timelineState.setCursorType(type);
  }

  _togglePanelDrawer() {
    console.log('Drawer toggle clicked. Current state:', this.isPanelCollapsed);
    this.isPanelCollapsed = !this.isPanelCollapsed;
    console.log('Drawer new state:', this.isPanelCollapsed);
    this.requestUpdate(); // Force re-render to ensure UI updates
  }

  render() {
    return html`
      <div
        id="split_col_1"
        class="h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 26%; /* ${this.resize.horizontal.panel}% */"
      >
        <div
          class="split-col-bar d-flex align-items-center justify-content-center ${this.isPanelCollapsed ? 'collapsed' : ''}"
        >
          <span
            class="material-symbols-outlined drawer-toggle"
            style="cursor: pointer; user-select: none; font-size: 32px; padding: 12px; background: ${this.isPanelCollapsed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}; border-radius: 8px; margin-left: 20px; border: ${this.isPanelCollapsed ? 'none' : '2px solid rgba(255,255,255,0.3)'};"
            @click=${this._togglePanelDrawer}
            title="${this.isPanelCollapsed ? 'Open drawer' : 'Close drawer'}"
          >
            ${this.isPanelCollapsed ? "chevron_right" : "chevron_left"}
          </span>
        </div>

        <div
          class="h-100 w-100 overflow-y-hidden overflow-x-hidden position-absolute"
          style="transform: translateX(${this.isPanelCollapsed ? "-100%" : "0"}); transition: transform 0.3s ease;"
        >
          <div class="d-flex align-items-start h-100">
            <div
              id="sidebar"
              class="nav sidebar-nav flex-column nav-pills bg-dark h-100 pt-1"
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
                data-bs-target="#nav-filter"
                type="button"
                role="tab"
                aria-selected="false"
              >
                <span class="material-symbols-outlined"> library_books</span>
              </button>

              <button
                class="btn-nav"
                data-bs-toggle="pill"
                data-bs-target="#nav-util"
                type="button"
                role="tab"
                aria-selected="false"
              >
                <span class="material-symbols-outlined"> page_info</span>
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
                <control-ui-setting />
              </div>

              <div class="tab-pane fade" id="nav-draft" role="tabpanel">
                <asset-browser></asset-browser>
              </div>

              <div class="tab-pane fade" id="nav-text" role="tabpanel">
                <control-ui-text />
              </div>

              <div class="tab-pane fade" id="nav-option" role="tabpanel">
                <control-ui-extension />
              </div>

              <div class="tab-pane fade" id="nav-util" role="tabpanel">
                <control-ui-util />
              </div>

              <div class="tab-pane fade" id="nav-filter" role="tabpanel">
                <control-ui-filter />
              </div>

              <div class="tab-pane fade" id="nav-output" role="tabpanel">
                <control-ui-render />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PREVIEW -->
      <div
        id="split_col_2"
        class="h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 48%; /* ${this.resize.horizontal.preview}% */"
      >
        <div class="split-col-bar"></div>

        <preview-top-bar></preview-top-bar>

        <div
          style="height: calc(100% - 2rem);"
          class="position-relative d-flex align-items-center justify-content-center w-200 ${this
            .nowActivePanel == ""
            ? ""
            : "d-none"}"
        >
          <div id="videobox" class="position-relative d-flex justify-content-center align-items-center w-100" style="margin-top: 2rem;">
            <div id="video" class="video" style="background-color: #000000; border-radius: 20px; border: none;">
              <preview-canvas></preview-canvas>
              <element-control></element-control>
              <drag-alignment-guide></drag-alignment-guide>
            </div>
            ${this._renderPreviewFullScreenButton()}
          </div>
        </div>

        <div
          style="height: calc(100% - 2rem);"
          class="position-relative d-flex align-items-center justify-content-center ${this
            .nowActivePanel == "record"
            ? ""
            : "d-none"}"
        >
          <screen-record-panel></screen-record-panel>
        </div>

        <div
          style="height: calc(100% - 2rem);"
          class="position-relative d-flex align-items-center justify-content-center ${this
            .nowActivePanel == "audioRecord"
            ? ""
            : "d-none"}"
        >
          <audio-record-panel></audio-record-panel>
        </div>

        <div
          style="height: calc(100% - 2rem);"
          class="position-relative d-flex align-items-center justify-content-center ${this
            .nowActivePanel == "ytDownload"
            ? ""
            : "d-none"}"
        >
          <youtube-download></youtube-download>
        </div>

        <div
          style="height: calc(100% - 2rem);"
          class="position-relative d-flex align-items-center justify-content-center ${this
            .nowActivePanel == "automaticCaption"
            ? ""
            : "d-none"}"
        >
          <automatic-caption
            .timeline=${this.timeline}
            .isDev=${false}
            @editComplate=${this._handleComplateAutoCaption}
            @changeCursorType=${this._handleChangeCursorType}
          ></automatic-caption>
        </div>
      </div>

      <!-- OPTION-->
      <div
        id="split_col_3"
        class="h-100 overflow-y-scroll overflow-x-hidden position-relative option-window p-2 w-100"
        style="width: 26%; /* ${this.resize.horizontal.option}% */ background: linear-gradient(180deg, rgba(17, 18, 21, 0) 0%, rgba(50, 53, 62, 0.2) 100%); border: none;"
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
          <option-shape></option-shape>
        </option-group>
      </div>
    `;
  }
}
