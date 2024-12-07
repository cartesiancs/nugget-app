import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";

@customElement("timeline-ui")
export class Timeline extends LitElement {
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineCursor = this.timelineState.cursor;

  @property()
  isAbleResize: boolean = false;

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  isPlay: boolean = false;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineCursor = state.cursor;
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    window.addEventListener("mouseup", this._handleMouseUp.bind(this));
    window.addEventListener("mousemove", this._handleMouseMove.bind(this));

    return this;
  }

  _handleMouseMove(e) {
    const elementControlComponent = document.querySelector("element-control");

    if (this.isAbleResize) {
      const topBarHeight = 60;

      const windowHeight = window.innerHeight + topBarHeight;
      const nowY = e.clientY;
      const resizeY = 100 - (nowY / windowHeight) * 103; // 103인 이유는 Vertical 전체가 windowHeight의 97%이기 떄문.
      if (resizeY <= 20) {
        this.uiState.updateVertical(20);
        elementControlComponent.resizeEvent();
        return false;
      }

      this.uiState.updateVertical(resizeY);
      elementControlComponent.resizeEvent();
    }
  }

  _handleMouseUp() {
    this.isAbleResize = false;
  }

  _handleClickResizeBar() {
    this.isAbleResize = true;
  }

  _handleClickPlay() {
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.play();
    this.isPlay = true;
  }

  _handleClickStop() {
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.stop();
    this.isPlay = false;
  }

  _handleClickReset() {
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.reset();
  }

  togglePlayButton() {
    if (this.isPlay) {
      return html`<button
        id="playToggle"
        class="btn btn-xs btn-transparent"
        @click=${this._handleClickStop}
      >
        <span class="material-symbols-outlined icon-white icon-md">
          stop_circle
        </span>
      </button>`;
    } else {
      return html`<button
        id="playToggle"
        class="btn btn-xs btn-transparent"
        @click=${this._handleClickPlay}
      >
        <span class="material-symbols-outlined icon-white icon-md">
          play_circle
        </span>
      </button>`;
    }
  }

  render() {
    return html`
      <div
        class="split-bottom-bar cursor-row-resize "
        @mousedown=${this._handleClickResizeBar}
      ></div>

      <div class="row mb-2">
        <div class="col-4">
          <div class="d-flex justify-content-start">
            ${this.togglePlayButton()}

            <button
              class="btn btn-xs btn-transparent ms-2"
              @click=${this._handleClickReset}
            >
              <span class="material-symbols-outlined icon-white icon-md">
                replay_circle_filled
              </span>
            </button>
            <b class="text-light ms-2"
              >${new Date(this.timelineCursor).toISOString().slice(11, 22)}</b
            >
          </div>
        </div>
        <div class="col-5">
          <div id="keyframeEditorButtonGroup" class="d-none">
            <button
              type="button"
              class="btn btn-dark btn-sm"
              data-bs-dismiss="offcanvas"
              onclick="document.querySelector('keyframe-editor').hideKeyframeEditorButtonGroup()"
              aria-label="close"
            >
              키프레임 에디터 닫기
            </button>
            <div
              class="btn-group"
              role="group"
              id="timelineOptionLineEditor"
            ></div>
          </div>
        </div>

        <div class="col-3 row d-flex align-items-center m-0 p-0">
          <element-timeline-range></element-timeline-range>
        </div>
      </div>

      <element-timeline-ruler></element-timeline-ruler>
      <element-timeline id="split_inner_bottom"></element-timeline>
    `;
  }
}
