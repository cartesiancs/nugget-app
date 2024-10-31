import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

/* NOTE:

캔버스 타임라인 그리기 (완료)
이미지(static) 타임라인 조정
영상(dynamic) 타임라인 조정
타임라인 호버시 마우스커서 변환
마그넷
애니메이션 패널 (하단 키프레임 표시)
아이템 삭제
아이템 복제
아이템 클릭시 선택됨
타임라인 커서
타임라인 종료 표시

*/
@customElement("element-timeline-canvas")
export class elementTimelineCanvas extends LitElement {
  constructor() {
    super();

    window.addEventListener("resize", this.drawCanvas);
  }

  @query("#elementTimelineCanvasRef") canvas!: HTMLCanvasElement;

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  @property()
  timelineRange = this.timelineState.range;

  @property()
  timelineScroll = this.timelineState.scroll;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineScroll = state.scroll;

      this.drawCanvas();
    });

    return this;
  }

  millisecondsToPx(ms) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertPixel = (ms / 5) * timeMagnification;
    return Number(convertPixel.toFixed(0));
  }

  pxToMilliseconds(px) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertMs = (px * 5) / timeMagnification;
    return Number(convertMs.toFixed(0));
  }

  drawCanvas() {
    const timelineElements = [];
    let index = 1;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      this.canvas.height =
        document.querySelector("element-timeline").offsetHeight;
      this.canvas.width = window.innerWidth;
      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        document.querySelector("element-timeline").offsetHeight
      );

      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          const width = this.millisecondsToPx(
            this.timeline[elementId].duration
          );
          const height = 30;
          const top = index * height * 1.2;
          const left =
            this.millisecondsToPx(this.timeline[elementId].startTime) -
            this.timelineScroll;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.rect(left, top, width, height);
          ctx.fill();

          index += 1;
        }
      }
    }
  }

  repositionCursor() {
    const cursorDom = document.querySelector("element-timeline-cursor");
    const controlDom = document.querySelector("element-control");

    const progress = controlDom.progress;

    cursorDom.style.left = `${progress - this.timelineScroll}px`;
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;
    this.repositionCursor();

    if (newScroll >= 0) {
      this.timelineState.setScroll(newScroll);
    }
  }

  renderCanvas() {
    return html`<canvas
      id="elementTimelineCanvasRef"
      style="width: 100%;"
      @mousewheel=${this._handleMouseWheel}
    ></canvas>`;
  }

  protected render(): unknown {
    return html` ${this.renderCanvas()}`;
  }
}
