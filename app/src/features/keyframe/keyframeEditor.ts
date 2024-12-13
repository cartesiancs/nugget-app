import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { millisecondsToPx, pxToMilliseconds } from "../../utils/time";
import { uiStore } from "../../states/uiStore";
import { ImageElementType } from "../../@types/timeline";

@customElement("keyframe-editor")
export class KeyframeEditor extends LitElement {
  elementId: string;
  animationType: string;
  tension: number;
  divBody: any;
  svgBody: any;
  poly: {};
  path: {};
  hiddenPath: {};
  padding: { start: number; end: number };
  lineCount: number;
  points: number[][][];
  selectLine: number;
  keyframePointBody: any;

  constructor() {
    super();

    this.elementId = this.getAttribute("element-id");
    this.animationType = this.getAttribute("animation-type");

    this.tension = 1;
    this.divBody = undefined;
    this.svgBody = {};
    this.poly = {};
    this.path = {};
    this.hiddenPath = {};

    this.padding = {
      start: 0,
      end: 0,
    };

    this.lineCount = 1;
    this.points = [[[0, 0]], [[0, 0]]];

    this.selectLine = 0;

    this.addEventListener("scroll", this.handleScroll.bind(this));
  }

  @query("#keyframeEditerCanvasRef") canvas!: HTMLCanvasElement;

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  @property()
  timelineRange = this.timelineState.range;

  @property()
  timelineScroll = this.timelineState.scroll;

  @property()
  timelineCursor = this.timelineState.cursor;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineScroll = state.scroll;
      this.timelineCursor = state.cursor;

      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.drawCanvas();
    });

    this.lineCount =
      this.timeline[this.elementId].animation[this.animationType].points.length;

    this.clearLineEditorGroup();

    for (let line = 0; line < this.lineCount; line++) {
      this.addLineEditor(line);
    }

    this.changeLineEditor(0);

    return this;
  }

  render() {
    this.showKeyframeEditorButtonGroup();

    this.classList.add(
      "h-100",
      "w-100",
      "position-absolute",
      "overflow-scroll",
    );

    this.timeline[this.elementId].animation[this.animationType].isActivate =
      true;

    return html` <div style="overflow: hidden;">
      <canvas
        id="keyframeEditerCanvasRef"
        style="width: 100%;"
        @mousewheel=${this._handleMouseWheel}
        @click=${this._handleMouseClick}
      ></canvas>
    </div>`;
  }

  private drawDots(ctx) {
    const pointsX = this.timeline[this.elementId].animation.position.points[0];
    const pointsY = this.timeline[this.elementId].animation.position.points[1];

    //     ctx.beginPath();
    // ctx.moveTo(30, 50);
    // ctx.lineTo(150, 100);
    // ctx.stroke();

    for (let index = 0; index < pointsX.length; index++) {
      const element = pointsX[index];
      ctx.fillStyle = "#403af0";

      ctx.beginPath();

      const x =
        millisecondsToPx(element[0], this.timelineRange) - this.timelineScroll;
      ctx.arc(x, element[1], 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (let index = 0; index < pointsY.length; index++) {
      const element = pointsY[index];
      ctx.fillStyle = "#ed3c21";

      ctx.beginPath();
      const x =
        millisecondsToPx(element[0], this.timelineRange) - this.timelineScroll;
      ctx.arc(x, element[1], 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private drawLines(ctx) {
    const pointsX = this.timeline[this.elementId].animation.position.points[0];
    const pointsY = this.timeline[this.elementId].animation.position.points[1];

    ctx.strokeStyle = "#403af0";

    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let index = 0; index < pointsX.length; index++) {
      const element = pointsX[index];
      const x =
        millisecondsToPx(element[0], this.timelineRange) - this.timelineScroll;
      ctx.lineTo(x, element[1]);
    }

    ctx.stroke();

    ctx.strokeStyle = "#ed3c21";

    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let index = 0; index < pointsY.length; index++) {
      const element = pointsY[index];
      const x =
        millisecondsToPx(element[0], this.timelineRange) - this.timelineScroll;
      ctx.lineTo(x, element[1]);
    }

    ctx.stroke();
  }

  private drawCursor(ctx) {
    const now =
      millisecondsToPx(this.timelineCursor, this.timelineRange) -
      this.timelineScroll;

    ctx.fillStyle = "#dbdaf0";
    ctx.beginPath();
    ctx.rect(now, 0, 2, this.canvas.height);
    ctx.fill();
  }

  private drawLeftPadding(ctx) {
    const targetTimeline: ImageElementType = this.timeline[this.elementId];

    const startPx =
      millisecondsToPx(targetTimeline.startTime, this.timelineRange) -
      this.timelineScroll;

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.rect(0, 0, startPx, this.canvas.height);
    ctx.fill();
  }

  private drawRightPadding(ctx) {
    const targetTimeline: ImageElementType = this.timeline[this.elementId];

    const startPx =
      millisecondsToPx(
        targetTimeline.startTime + targetTimeline.duration,
        this.timelineRange,
      ) - this.timelineScroll;

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.rect(startPx, 0, this.canvas.width - startPx, this.canvas.height);
    ctx.fill();
  }

  private drawCanvas() {
    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;
      this.canvas.style.width = `${window.innerWidth}px`;

      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height =
        document.querySelector("element-timeline").offsetHeight * dpr;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.scale(dpr, dpr);

      ctx.fillStyle = "#0f1012";
      ctx.beginPath();
      ctx.rect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fill();

      this.drawLeftPadding(ctx);
      this.drawRightPadding(ctx);
      this.drawCursor(ctx);
      this.drawDots(ctx);
      this.drawLines(ctx);
    }
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;

    this.drawCanvas();

    if (newScroll >= 0) {
      this.timelineState.setScroll(newScroll);
    }
  }

  _handleMouseClick(e) {
    const insertX =
      pxToMilliseconds(e.offsetX, this.timelineRange) +
      pxToMilliseconds(this.timelineScroll, this.timelineRange);

    const insertY = e.offsetY;

    this.addPoint({
      x: insertX,
      y: insertY,
      line: this.selectLine,
    });
    this.drawCanvas();

    console.log(e.offsetX, e.offsetY, e);
  }

  updated() {
    this.drawCanvas();
  }

  showKeyframeEditorButtonGroup() {
    let targetButton = document.querySelector("#keyframeEditorButtonGroup");
    targetButton.classList.remove("d-none");
  }

  hideKeyframeEditorButtonGroup() {
    let targetButton = document.querySelector("#keyframeEditorButtonGroup");
    targetButton.classList.add("d-none");
    let keyframeEditor = document.getElementById("option_bottom");
    keyframeEditor.classList.remove("show");
    keyframeEditor.classList.add("hide");
    document
      .querySelector("element-timeline-canvas")
      .closeAnimationPanel(this.elementId);
  }

  addPadding({ px, type }) {
    let keyframePadding = this.divBody.querySelector("keyframe-padding");
    let keyframePoint = this.keyframePointBody;
    let svgBody: any = this.svgBody;

    const typeFunction = {
      start: () => {
        keyframePadding.style.width = `${px}px`;
        keyframePoint.style.left = `${px}px`;
        svgBody.style.left = `${px}px`;
      },
    };

    this.padding["start"] = px;
    typeFunction[type]();
  }

  highlightLineEditorButton(line) {
    for (let index = 0; index < this.lineCount; index++) {
      let button = document
        .querySelector("#timelineOptionLineEditor")
        .querySelector(`button[line='${index}']`);
      button.classList.remove("btn-primary");
      button.classList.add("btn-secondary");
    }

    let targeButton = document
      .querySelector("#timelineOptionLineEditor")
      .querySelector(`button[line='${line}']`);
    targeButton.classList.remove("btn-secondary");
    targeButton.classList.add("btn-primary");
  }

  changeLineEditor(line) {
    this.selectLine = Number(line);
    this.highlightLineEditorButton(line);
  }

  addLineEditor(line) {
    document
      .querySelector("#timelineOptionLineEditor")
      .insertAdjacentHTML(
        "beforeend",
        `<button line="${line}" onclick="document.querySelector('keyframe-editor').changeLineEditor('${line}')" type="button" class="btn btn-secondary btn-sm">Line${line}</button>`,
      );
  }

  clearLineEditorGroup() {
    document.querySelector("#timelineOptionLineEditor").innerHTML = "";
  }

  addPoint({ x, y, line }) {
    this.insertPointInMiddle({
      x: Math.round(x),
      y: Math.round(y),
      line: line,
    });

    // this.drawPoint({
    //   x: x,
    //   y: y,
    //   line: line,
    // });

    let loadPointLength =
      this.points[line][this.points[line].length - 1][0] - 1;
    //let allPoints = this.interpolateBezier(this.points[line]);

    this.timeline[this.elementId].animation[this.animationType].isActivate =
      true;
    this.timeline[this.elementId].animation[this.animationType].points[line] =
      this.points[line];
    // this.timeline[this.elementId].animation[this.animationType].allpoints[
    //   line
    // ] = allPoints;
  }

  insertPointInMiddle({ x, y, line }) {
    if (this.points[line].length - 1 == 0) {
      this.points[line].push([x, y]);
      return 0;
    }

    for (let index = 0; index < this.points[line].length; index++) {
      if (this.points[line].length - 1 == index) {
        this.points[line].splice(index + 1, 0, [x, y]);
        return 0;
      } else if (
        this.points[line][index][0] < x &&
        this.points[line][index + 1][0] > x
      ) {
        this.points[line].splice(index + 1, 0, [x, y]);
        return 0;
      }
    }
  }

  getRemovedDuplicatePoint({ x, line }) {
    let tmp = [];
    this.points[line].forEach((element) => {
      if (element[0] != x) {
        tmp.push(element);
      }
    });
    return tmp;
  }

  handleScroll(e) {
    let optionBottom = document.querySelector("#option_bottom");
    let isShowOptionBottom = optionBottom.classList.contains("show");
    if (isShowOptionBottom == false) {
      return 0;
    }
    let elementTimeline = document.querySelector("element-timeline");
    elementTimeline.scrollTo(this.scrollLeft, elementTimeline.scrollTop);
  }
}
