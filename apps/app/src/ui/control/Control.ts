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
      <style>
        /* Default centered position */
        .video-container {
          transform: translateX(-50%) !important;
        }
        
        /* Move left when panel is open */
        body.panel-open .video-container {
          transform: translateX(-75%) !important;
        }
        
        /* Ensure smooth transition */
        .video-container {
          transition: transform 0.3s ease !important;
        }
      </style>
      
      <!-- PREVIEW CENTERED -->
      <div
        id="split_col_2"
        class="h-100 overflow-y-hidden overflow-x-hidden position-relative p-0"
        style="width: 100%;"
      >
        <div
          style="
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            height: 100%;
            max-width: 1200px;
            width: 100%;
            z-index: 1;
            transition: transform 0.3s ease;
          "
          class="d-flex flex-column align-items-center justify-content-flex-start video-container"
        >
          <!-- Controls above video -->
          <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding: 20px 0 10px 0;">
            <preview-top-bar></preview-top-bar>
          </div>
          
          <!-- Video box centered -->
          <div id="videobox" class="d-flex justify-content-center align-items-center w-100 flex-grow-1" style="padding: 0 20px 20px 20px;">
            <div id="video" class="video" style="background-color: #000000; border-radius: 20px; border: none; width: 600px; aspect-ratio: 16/9; max-width: 70%; margin: 0 auto; position: relative;">
              <preview-canvas></preview-canvas>
              <element-control></element-control>
              <drag-alignment-guide></drag-alignment-guide>
            </div>
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
    `;
  }
}
