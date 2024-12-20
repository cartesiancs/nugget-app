import { LitElement, PropertyValues, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { millisecondsToPx, pxToMilliseconds } from "../../utils/time";
import { IUIStore, uiStore } from "../../states/uiStore";
import { ImageElementType } from "../../@types/timeline";

@customElement("keyframe-editor")
export class KeyframeEditor extends LitElement {
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
  prevElementId: any;
  isDrag: boolean;
  clickDot: string;
  clickIndex: number;

  constructor() {
    super();

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

    this.prevElementId = "";

    this.selectLine = 0;

    this.clickIndex = -1;
    this.clickDot = "";
    this.isDrag = false;

    this.addEventListener("scroll", this.handleScroll.bind(this));
  }

  @property()
  isShow;

  @property()
  elementId;

  @property()
  animationType;

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

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineScroll = state.scroll;
      this.timelineCursor = state.cursor;

      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;

      this.drawCanvas();
    });

    return this;
  }

  render() {
    try {
      console.log(this.timeline);
      if (this.isShow) {
        if (this.prevElementId != this.elementId) {
          if (
            this.timeline[this.elementId].animation[this.animationType]
              .isActivate
          ) {
            this.points = [
              ...this.timeline[this.elementId].animation[this.animationType]
                .points,
            ];
          } else {
            this.points = [[[0, 0]], [[0, 0]]];
          }
          this.prevElementId = this.elementId;
        }

        try {
          // position이면 2개 나머지는 1개
          this.lineCount = 2;

          this.clearLineEditorGroup();

          for (let line = 0; line < this.lineCount; line++) {
            this.addLineEditor(line);
          }

          this.changeLineEditor(0);
        } catch (error) {}
      }

      if (this.isShow) {
        this.showKeyframeEditorButtonGroup();

        this.classList.add(
          "h-100",
          "w-100",
          "position-absolute",
          "overflow-hidden",
        );

        this.timeline[this.elementId].animation[this.animationType].isActivate =
          true;

        return html` <div>
          <canvas
            id="keyframeEditerCanvasRef"
            style="width: 100%; left: ${this.resize.timelineVertical
              .leftOption}px; position: absolute;"
            @mousewheel=${this._handleMouseWheel}
            @mousedown=${this._handleMouseDown}
            @mousemove=${this._handleMouseMove}
            @mouseup=${this._handleMouseUp}
          ></canvas>
        </div>`;
      } else {
        this.hideKeyframeEditorButtonGroup();
      }
    } catch (error) {}
  }

  private drawDots(ctx) {
    const pointsX = this.timeline[this.elementId].animation.position.x;
    const pointsY = this.timeline[this.elementId].animation.position.y;

    this.drawDotsLoop({
      ctx: ctx,
      dots: pointsX,
      color: "#403af0",
      subColor: "#b7bcf7",
    });

    this.drawDotsLoop({
      ctx: ctx,
      dots: pointsY,
      color: "#e83535",
      subColor: "#ed7979",
    });
  }

  drawDotsLoop({ ctx, dots, color, subColor }) {
    for (let index = 0; index < dots.length; index++) {
      const element = dots[index];
      ctx.fillStyle = color;

      ctx.beginPath();

      const x =
        millisecondsToPx(
          element.p[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;

      const y = element.p[1];
      ctx.arc(x, element.p[1], 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = subColor;

      ctx.beginPath();
      const sx =
        millisecondsToPx(
          element.cs[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;
      const sy = element.cs[1];
      ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      const ex =
        millisecondsToPx(
          element.ce[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;
      const ey = element.ce[1];
      ctx.arc(ex, ey, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = subColor;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      ctx.strokeStyle = subColor;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  private drawLines(ctx) {
    const pointsX = this.timeline[this.elementId].animation.position.ax;
    const pointsY = this.timeline[this.elementId].animation.position.ay;

    ctx.strokeStyle = "#403af0";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let index = 0; index < pointsX.length; index++) {
      const element = pointsX[index];
      const x =
        millisecondsToPx(
          element[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;
      ctx.lineTo(x, element[1]);
    }
    ctx.stroke();

    ctx.strokeStyle = "#e83535";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let index = 0; index < pointsY.length; index++) {
      const element = pointsY[index];
      const x =
        millisecondsToPx(
          element[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;
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
    if (!this.isShow) {
      return false;
    }

    try {
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
    } catch (error) {}
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;

    this.drawCanvas();

    if (newScroll >= 0) {
      this.timelineState.setScroll(newScroll);
    }
  }

  _handleMouseMove(e) {
    //console.log(e);
    const px =
      pxToMilliseconds(e.offsetX, this.timelineRange) +
      pxToMilliseconds(this.timelineScroll, this.timelineRange) -
      this.timeline[this.elementId].startTime;
    const py = e.offsetY;
    const lineToAlpha = this.selectLine == 0 ? "x" : "y";

    //console.log(px);

    if (this.isDrag) {
      this.timeline[this.elementId].animation.position[lineToAlpha][
        this.clickIndex
      ][this.clickDot][0] = px;
      this.timeline[this.elementId].animation.position[lineToAlpha][
        this.clickIndex
      ][this.clickDot][1] = py;

      this.interpolate(this.selectLine);

      this.drawCanvas();
    }
  }

  _handleMouseDown(e) {
    const lineToAlpha = this.selectLine == 0 ? "x" : "y";

    const padding = 100;
    const px =
      pxToMilliseconds(e.offsetX, this.timelineRange) +
      pxToMilliseconds(this.timelineScroll, this.timelineRange) -
      this.timeline[this.elementId].startTime;
    const py = e.offsetY;

    for (
      let index = 0;
      index <
      this.timeline[this.elementId].animation.position[lineToAlpha].length;
      index++
    ) {
      const element =
        this.timeline[this.elementId].animation.position[lineToAlpha][index];

      if (
        element.cs[0] > px - padding &&
        element.cs[0] < px + padding &&
        element.cs[1] > py - padding &&
        element.cs[1] < py + padding
      ) {
        this.clickIndex = index;
        this.clickDot = "cs";
        this.isDrag = true;
      }

      if (
        element.ce[0] > px - padding &&
        element.ce[0] < px + padding &&
        element.ce[1] > py - padding &&
        element.ce[1] < py + padding
      ) {
        this.clickIndex = index;
        this.clickDot = "ce";
        this.isDrag = true;
      }
    }

    if (!this.isDrag) {
      this.addPoint({
        x: px,
        y: py,
        line: this.selectLine,
      });
      this.drawCanvas();
    }

    return;
  }

  _handleMouseUp() {
    this.isDrag = false;
  }

  updated() {
    this.drawCanvas();
  }

  showKeyframeEditorButtonGroup() {}

  hideKeyframeEditorButtonGroup() {
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

    console.log(this.timeline[this.elementId].animation[this.animationType]);

    // this.timeline[this.elementId].animation[this.animationType].x.push({
    //   type: "cubic",
    //   p: [Math.round(x), Math.round(y)],
    //   cs: [Math.round(x), Math.round(y)],
    //   ce: [Math.round(x), Math.round(y)],
    // });

    this.interpolate(line);

    // let loadPointLength =
    //   this.points[line][this.points[line].length - 1][0] - 1;
    // let allPoints = this.smoothQuadraticBezier(
    //   this.points[line],
    //   this.points[line].length * 10,
    // );

    this.timeline[this.elementId].animation[this.animationType].isActivate =
      true;
    // this.timeline[this.elementId].animation[this.animationType].points[line] =
    //   this.points[line];
  }

  insertPointInMiddle({ x, y, line }) {
    const lineToAlpha = line == 0 ? "x" : "y";
    const subDots = 100;

    if (
      this.timeline[this.elementId].animation[this.animationType][lineToAlpha]
        .length -
        1 ==
      0
    ) {
      this.timeline[this.elementId].animation[this.animationType][
        lineToAlpha
      ].push({
        type: "cubic",
        p: [x, y],
        cs: [x - subDots, y],
        ce: [x + subDots, y],
      });
      return 0;
    }

    for (
      let index = 0;
      index <
      this.timeline[this.elementId].animation[this.animationType][lineToAlpha]
        .length;
      index++
    ) {
      if (
        this.timeline[this.elementId].animation[this.animationType][lineToAlpha]
          .length -
          1 ==
        index
      ) {
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ].splice(index + 1, 0, {
          type: "cubic",
          p: [x, y],
          cs: [x - subDots, y],
          ce: [x + subDots, y],
        });
        return 0;
      } else if (
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][index].p[0] < x &&
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][index + 1].p[0] > x
      ) {
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ].splice(index + 1, 0, {
          type: "cubic",
          p: [x, y],
          cs: [x - subDots, y],
          ce: [x + subDots, y],
        });
        return 0;
      }
    }
  }

  interpolate(line) {
    const lineToAlpha = line == 0 ? "x" : "y";
    const lineToAllAlpha = line == 0 ? "ax" : "ay";

    const array =
      this.timeline[this.elementId].animation[this.animationType][lineToAlpha];

    const interpolationArray = [];

    for (let ic = 0; ic < array.length - 1; ic++) {
      const interval = array[ic + 1].p[0] - array[ic].p[0];
      const intervalFrames = Math.round(interval / (1000 / 60)); // 60은 fps

      console.log(intervalFrames, "interval");
      const interpolation = this.cubic(
        array[ic],
        array[ic + 1],
        intervalFrames,
      );

      for (let index = 0; index < interpolation.length; index++) {
        const element = interpolation[index];

        interpolationArray.push(element);
      }
    }

    this.timeline[this.elementId].animation[this.animationType][
      lineToAllAlpha
    ] = interpolationArray;

    console.log(interpolationArray);
  }

  cubic(d0, d1, iteration = 30) {
    let result = [];

    for (let t = 0; t <= 1; t = t + 1 / iteration) {
      const x =
        Math.pow(1 - t, 3) * d0.p[0] +
        3 * Math.pow(1 - t, 2) * t * d0.ce[0] +
        3 * (1 - t) * Math.pow(t, 2) * d1.cs[0] +
        Math.pow(t, 3) * d1.p[0];
      const y =
        Math.pow(1 - t, 3) * d0.p[1] +
        3 * Math.pow(1 - t, 2) * t * d0.ce[1] +
        3 * (1 - t) * Math.pow(t, 2) * d1.cs[1] +
        Math.pow(t, 3) * d1.p[1];
      result.push([x, y]);
    }

    return result;
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
