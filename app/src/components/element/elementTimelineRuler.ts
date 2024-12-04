import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("element-timeline-ruler")
export class ElementTimelineRuler extends LitElement {
  @query("#elementTimelineRulerCanvasRef") canvas!: HTMLCanvasElement;

  mousemoveEventHandler: any;
  mouseTimeout: any;
  rulerType: string;
  timeMagnification: number;
  imeMagnification: number;
  resizeInterval: string | number;
  width: any;
  height: number;
  constructor() {
    super();
    this.mousemoveEventHandler = undefined;
    this.mouseTimeout = undefined;
    this.rulerType = "sec";
    this.timeMagnification = 1;
    this.addEventListener("mousedown", this.handleMousedown);
    document.addEventListener("mouseup", this.handleMouseup.bind(this));
  }

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineRange = this.timelineState.range;

  @property()
  timelineScroll = this.timelineState.scroll;

  @property()
  timelineCursor = this.timelineState.cursor;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineScroll = state.scroll;
      this.timelineCursor = state.cursor;
      this.timelineRange = state.range;

      const timeMagnification = this.timelineRange / 4;
      this.timeMagnification = timeMagnification * 1.1111111111;

      this.drawRuler();
    });

    return this;
  }

  render() {
    this.classList.add("ps-0", "overflow-hidden", "position-absolute");
    this.style.top = "40px";

    this.width = document.querySelector("element-timeline").clientWidth;
    this.height = 30;

    return html`<canvas
      id="elementTimelineRulerCanvasRef"
      width="${this.width}"
      height="${this.height}"
      style="width: ${this.width}px; height: ${this.height}px;"
    ></canvas>`;
  }

  updated() {
    this.drawRuler();
  }

  private millisecondsToPx(ms) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertPixel = (ms / 5) * timeMagnification;
    const result = Number(convertPixel.toFixed(0));
    if (result <= 0) {
      return 0;
    }

    return result;
  }

  drawCursorHead() {
    const ctx = this.canvas.getContext("2d");

    const now =
      this.millisecondsToPx(this.timelineCursor) - this.timelineScroll + 1;

    const size = 6;
    const top = 16;

    ctx.fillStyle = "#dbdaf0";

    ctx.beginPath();
    ctx.moveTo(now - size, top);
    ctx.lineTo(now, this.canvas.height);
    ctx.lineTo(now + size, top);
    ctx.lineWidth = 2;
    ctx.fill();
  }

  drawRuler() {
    this.width = document.querySelector("element-timeline").clientWidth;

    const ctx = this.canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    this.canvas.style.width = `${this.width}px`;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(dpr, dpr);

    let range = 1;
    let unitSplit = 1;
    let unit = "s";

    if (this.timeMagnification >= 0.5) {
      range = 1;
      unitSplit = 1;
      unit = "s";
    } else if (this.timeMagnification < 0.5 && this.timeMagnification >= 0.1) {
      range = 5;
      unitSplit = 1;
      unit = "s";
    } else if (this.timeMagnification < 0.1 && this.timeMagnification >= 0.01) {
      range = 60;
      unitSplit = 60;
      unit = "m";
    } else if (
      this.imeMagnification < 0.01 &&
      this.timeMagnification >= 0.001
    ) {
      range = 60 * 5;
      unitSplit = 60;
      unit = "m";
    } else {
      range = 60 * 60;
      unitSplit = 60 * 60;
      unit = "h";
    }

    let startPoint =
      -this.timelineScroll % (180 * this.timeMagnification * range); //18 * 10 * 3
    let startNumber = Math.floor(
      this.timelineScroll / (180 * this.timeMagnification * range),
    );

    let term = 18 * this.timeMagnification;
    let maxCount = Number(this.width / term) + term;

    for (let count = 0; count < maxCount; count++) {
      if (count % range > 0) {
        continue;
      }

      let point = term * count + startPoint;

      let startX = point;
      let startY = 15;
      let endX = point;
      let endY = 20;

      ctx.beginPath();

      if (count % (10 * range) == 0) {
        startY = 10;
        ctx.strokeStyle = "#e3e3e3";
        ctx.font = "12px serif";
        ctx.strokeText(
          `${(Number(count / 10) + startNumber * range) / unitSplit}${unit}`,
          startX - term / 2,
          10,
        );
      } else {
        ctx.strokeStyle = "#e3e3e3";
      }
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    this.drawCursorHead();
  }

  addTickNumber(licount) {
    // let addedli = '<li></li>'.repeat(licount)
    // this.querySelector("ul").innerHTML = addedli
  }

  updateRulerSpace(timeMagnification) {
    // const timeMagnification = timelineRange / 4;
    // this.timeMagnification = timeMagnification * 1.1111111111;
    // this.drawRuler();
  }

  updateRulerLength(e) {
    this.updateTimelineEnd();
  }

  updateTimelineEnd() {
    const elementTimelineEnd = document.querySelector("element-timeline-end");
    const projectDuration = document.querySelector("#projectDuration").value;

    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;

    elementTimelineEnd.setEndTimeline({
      px: ((projectDuration * 1000) / 5) * timeMagnification,
    });
  }

  changeWidth(px) {
    this.style.width = `${px}px`;
  }

  setTopPosition(px) {
    //this.style.top = `${px}px`
  }

  moveTime(e) {
    const elementTimeline = document.querySelector("element-timeline");
    const elementControl = document.querySelector("element-control");
    const cursorDom = document.querySelector("element-timeline-cursor");

    elementControl.progress = e.pageX + this.timelineScroll;

    elementControl.stop();
    elementControl.appearAllElementInTime();

    cursorDom.style.left = `${e.pageX}px`;
  }

  pxToMilliseconds(px) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertMs = (px * 5) / timeMagnification;
    return Number(convertMs.toFixed(0));
  }

  handleMousemove(e) {
    const elementTimeline = document.querySelector("element-timeline");
    const elementControl = document.querySelector("element-control");
    const cursorDom = document.querySelector("element-timeline-cursor");

    this.timelineState.setCursor(
      this.pxToMilliseconds(e.pageX + this.timelineScroll),
    );
    cursorDom.style.left = `${e.pageX + this.timelineScroll}px`;

    this.moveTime(e);

    clearTimeout(this.mouseTimeout);

    this.mouseTimeout = setTimeout(() => {
      clearInterval(this.resizeInterval);
      this.moveTime(e);
    }, 100);
  }

  handleMousedown(e) {
    e.stopPropagation();
    this.mousemoveEventHandler = this.handleMousemove.bind(this);
    document.addEventListener("mousemove", this.mousemoveEventHandler);
  }

  handleMouseup(e) {
    document.removeEventListener("mousemove", this.mousemoveEventHandler);
  }
}
