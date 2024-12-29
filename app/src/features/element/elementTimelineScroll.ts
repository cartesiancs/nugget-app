import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";

@customElement("element-timeline-bottom-scroll")
export class ElementTimelineBottomScroll extends LitElement {
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineRange = this.timelineState.range;

  @property()
  timelineScroll = this.timelineState.scroll;

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;
  isMove: boolean;
  left: number;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineRange = state.range;
      this.timelineScroll = state.scroll;
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    return this;
  }

  constructor() {
    super();
    this.isMove = false;
    this.left = 0;

    document.addEventListener("mousemove", this._handleMouseMove.bind(this));
    document.addEventListener("mouseup", this._handleMouseUp.bind(this));
  }

  render() {
    return html` <style>
        .timeline-bottom-scroll {
          width: 100%;
          height: 12px;
          background-color: #181a1c39;
          backdrop-filter: blur(8px);
          position: fixed;
          bottom: 0;
          left: ${this.resize.timelineVertical.leftOption}px;
          cursor: pointer;
        }

        .timeline-bottom-scroll-thumb {
          width: 20px;
          height: 12px;
          position: relative;
          background-color: #363b40;
          backdrop-filter: blur(8px);
          position: fixed;
          bottom: 0;

          cursor: pointer;
        }
      </style>

      <div class="timeline-bottom-scroll">
        <div
          @mousedown=${this._handleClickThumb}
          class="timeline-bottom-scroll-thumb"
          style="left: ${this.left}px;"
        ></div>
      </div>`;
  }

  _handleMouseUp(e) {
    this.isMove = false;
  }

  _handleMouseMove(e) {
    if (!this.isMove) return false;

    const x = e.clientX - this.resize.timelineVertical.leftOption;

    if (x <= 0) {
      this.left = 0;
      this.requestUpdate();
      this.timelineState.setScroll(0);
      return false;
    }
    this.left = x;
    this.requestUpdate();
    // const cursor = x;
    this.timelineState.setScroll(x * this.timelineRange);
  }

  _handleClickThumb(e) {
    this.isMove = true;
  }
}
