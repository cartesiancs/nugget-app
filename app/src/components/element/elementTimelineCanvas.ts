import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

/* NOTE:

캔버스 타임라인 그리기 (완료)
이미지(static) 타임라인 조정 (완료)
영상(dynamic) 타임라인 조정
타임라인 호버시 마우스커서 변환 (완료)
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
  targetId: string;
  isDrag: boolean;
  firstClickPosition: { x: number; y: number };
  targetLastPosition: { x: number; y: number };
  targetStartTime: number;
  targetDuration: number;
  targetMediaType: "static" | "dynamic";
  cursorType: "none" | "move" | "stretchStart" | "stretchEnd";

  constructor() {
    super();

    this.targetId = "";
    this.targetStartTime = 0;
    this.targetDuration = 1000;
    this.isDrag = false;
    this.firstClickPosition = { x: 0, y: 0 };
    this.cursorType = "none";

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

  updateTargetPosition({ targetId, dx }: { targetId: string; dx: number }) {
    this.timeline[targetId].startTime =
      this.targetStartTime + this.pxToMilliseconds(dx);
    this.timelineState.patchTimeline(this.timeline);
  }

  updateTargetStartStretch({ targetId, dx }: { targetId: string; dx: number }) {
    this.timeline[targetId].startTime =
      this.targetStartTime + this.pxToMilliseconds(dx);
    this.timeline[targetId].duration =
      this.targetDuration - this.pxToMilliseconds(dx);

    this.timelineState.patchTimeline(this.timeline);
  }

  updateTargetEndStretch({ targetId, dx }: { targetId: string; dx: number }) {
    this.timeline[targetId].duration =
      this.targetDuration + this.pxToMilliseconds(dx);

    this.timelineState.patchTimeline(this.timeline);
  }

  findTarget({ x, y }: { x: number; y: number }): {
    targetId: string;
    cursorType: "none" | "move" | "stretchStart" | "stretchEnd";
  } {
    let index = 1;
    let targetId = "";
    let cursorType = "none";

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const defaultWidth = this.millisecondsToPx(
          this.timeline[elementId].duration
        );
        const defaultHeight = 30;
        const startY = index * defaultHeight * 1.2;
        const startX =
          this.millisecondsToPx(this.timeline[elementId].startTime) -
          this.timelineScroll;

        const endX = startX + defaultWidth;
        const endY = startY + defaultHeight;
        const stretchArea = 10;

        console.log(elementId, startY);

        if (
          x > startX - stretchArea &&
          x < endX + stretchArea &&
          y > startY &&
          y < endY
        ) {
          targetId = elementId;
          if (x > startX - stretchArea && x < startX + stretchArea) {
            return { targetId: targetId, cursorType: "stretchStart" };
          } else if (x > endX - stretchArea && x < endX + stretchArea) {
            return { targetId: targetId, cursorType: "stretchEnd" };
          } else {
            return { targetId: targetId, cursorType: "move" };
          }
        }

        index += 1;
      }
    }

    return { targetId: "", cursorType: "none" };
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;
    this.repositionCursor();

    if (newScroll >= 0) {
      this.timelineState.setScroll(newScroll);
    }
  }

  _handleMouseMove(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    const target = this.findTarget({ x: x, y: y });
    const cursorType = target.cursorType;

    if (cursorType == "move") {
      this.style.cursor = "pointer";
    } else if (cursorType == "stretchEnd" || cursorType == "stretchStart") {
      this.style.cursor = "ew-resize";
    } else {
      this.style.cursor = "default";
    }

    if (this.isDrag) {
      const dx = x - this.firstClickPosition.x;

      if (this.cursorType == "move") {
        this.updateTargetPosition({ targetId: this.targetId, dx: dx });
      } else if (this.cursorType == "stretchStart") {
        this.updateTargetStartStretch({ targetId: this.targetId, dx: dx });
      } else if (this.cursorType == "stretchEnd") {
        this.updateTargetEndStretch({ targetId: this.targetId, dx: dx });
      }
    }
  }

  _handleMouseDown(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    const target = this.findTarget({ x: x, y: y });
    this.targetId = target.targetId;
    this.cursorType = target.cursorType;
    console.log(this.targetId, this.cursorType);

    this.firstClickPosition.x = e.offsetX;
    this.firstClickPosition.y = e.offsetY;

    this.targetStartTime = this.timeline[this.targetId].startTime;
    this.targetDuration = this.timeline[this.targetId].duration;

    this.isDrag = true;
  }

  _handleMouseUp(e) {
    this.isDrag = false;
  }

  renderCanvas() {
    return html`<canvas
      id="elementTimelineCanvasRef"
      style="width: 100%;"
      @mousewheel=${this._handleMouseWheel}
      @mousemove=${this._handleMouseMove}
      @mousedown=${this._handleMouseDown}
      @mouseup=${this._handleMouseUp}
    ></canvas>`;
  }

  protected render(): unknown {
    return html` ${this.renderCanvas()}`;
  }
}
