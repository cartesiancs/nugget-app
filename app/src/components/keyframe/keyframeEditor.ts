import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import {
  ImageElementType,
  ITimelineStore,
  useTimelineStore,
} from "../../states/timelineStore";
import { millisecondsToPx } from "../../utils/time";
import { uiStore } from "../../states/uiStore";

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

    return this;
  }

  render() {
    this.showKeyframeEditorButtonGroup();

    // this.divBody = this.querySelector("div");
    // this.svgBody = this.divBody.querySelector("svg");
    // this.keyframePointBody = this.divBody.querySelector("keyframe-point");

    // this.lineCount =
    //   this.timeline[this.elementId].animation[this.animationType].points.length;

    // if (
    //   this.timeline[this.elementId].animation[this.animationType].isActivate ==
    //   false
    // ) {
    //   //NOTE: 나중에 opacity 추가할때는 따로 수정
    //   this.points[0][0][1] = this.timeline[this.elementId].location.x;
    //   this.points[1][0][1] = this.timeline[this.elementId].location.y;
    // } else {
    //   this.points[0][0][1] =
    //     this.timeline[this.elementId].animation[
    //       this.animationType
    //     ].points[0][0][1];
    //   this.points[1][0][1] =
    //     this.timeline[this.elementId].animation[
    //       this.animationType
    //     ].points[1][0][1];
    // }

    // this.clearLineEditorGroup();

    // for (let line = 0; line < this.lineCount; line++) {
    //   this.addLineEditor(line);
    //   this.drawLine(line, true);
    //   this.loadPoint(line);
    // }

    // const timelineRange = Number(
    //   document.querySelector("element-timeline-range").value,
    // );
    // const timeMagnification = timelineRange / 4;

    // this.addPadding({
    //   px: (this.timeline[this.elementId].startTime / 5) * timeMagnification,
    //   type: "start",
    // });

    // this.querySelector("div").classList.add("position-relative");
    //this.querySelector("div").style.height = `${this.scrollHeight}px`

    this.classList.add(
      "h-100",
      "w-100",
      "position-absolute",
      "overflow-scroll",
    );

    // let animationPanel = document.querySelector(
    //   `animation-panel[element-id="${this.elementId}"]`,
    // );
    // animationPanel.updateItem();

    this.timeline[this.elementId].animation[this.animationType].isActivate =
      true;

    // this.timelineState.patchTimeline(this.timeline);

    console.log(this.timeline);

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
      ctx.fillStyle = "#dbdaf0";

      ctx.beginPath();
      const x =
        millisecondsToPx(element[0], this.timelineRange) - this.timelineScroll;
      ctx.arc(element[0], element[1], 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (let index = 0; index < pointsY.length; index++) {
      const element = pointsY[index];
      ctx.fillStyle = "#dbdaf0";

      ctx.beginPath();
      ctx.arc(element[0], element[1], 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private drawLines(ctx) {
    const pointsX = this.timeline[this.elementId].animation.position.points[0];
    const pointsY = this.timeline[this.elementId].animation.position.points[1];

    ctx.strokeStyle = "#dbdaf0";

    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let index = 0; index < pointsX.length; index++) {
      const element = pointsX[index];

      ctx.lineTo(element[0], element[1]);
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
    const insertX = e.offsetX;
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

  loadPoint(line) {
    if (
      this.timeline[this.elementId].animation[this.animationType].isActivate ==
      true
    ) {
      let points =
        this.timeline[this.elementId].animation[this.animationType].points[
          line
        ];

      for (let index = 0; index < points.length; index++) {
        const element = points[index];
        if (element[0] == 0) {
          continue;
        }
        this.addPoint({
          x: element[0],
          y: element[1],
          line: line,
        });
      }

      this.drawLine(line, true);
    }
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
    //let allPoints = this.getInterpolatedPoints(loadPointLength, line);

    this.timeline[this.elementId].animation[this.animationType].isActivate =
      true;
    this.timeline[this.elementId].animation[this.animationType].points[line] =
      this.points[line];
    // this.timeline[this.elementId].animation[this.animationType].allpoints[
    //   line
    // ] = allPoints;
  }

  drawPoint({ x, y, line }) {
    const timelineRange = Number(
      document.querySelector("element-timeline-range").value,
    );
    const timeMagnification = timelineRange / 4;

    let insertY = y - 4;
    let insertX = (x - 4) * timeMagnification;

    this.keyframePointBody.insertAdjacentHTML(
      "beforeend",
      `<div class="position-absolute keyframe-point" style="top: ${insertY}px; left: ${insertX}px;"></div>`,
    );
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

  drawLine(line, isinit = true) {
    this.querySelector("svg").insertAdjacentHTML(
      "beforeend",
      `
        <polyline id="keyframePolyline${line}" />
        <path id="keyframePath${line}" class="keyframe-path-${line + 1}" />
        <path id="keyframeHiddenPath${line}" class="d-none" />`,
    );

    const timelineRange = Number(
      document.querySelector("element-timeline-range").value,
    );
    const timeMagnification = timelineRange / 4;

    let points: any = [];

    for (let index = 0; index < this.points[line].length; index++) {
      points.push([
        this.points[line][index][0] * timeMagnification,
        this.points[line][index][1],
      ]);
    }

    this.path[line] = this.svgBody.querySelector(
      `path[id='keyframePath${line}']`,
    );
    this.path[line].setAttribute("d", this.drawPath(points, this.tension));

    this.hiddenPath[line] = this.svgBody.querySelector(
      `path[id='keyframeHiddenPath${line}']`,
    );
    this.hiddenPath[line].setAttribute(
      "d",
      this.drawPath(this.points[line], this.tension),
    );

    let loadPointLength =
      this.points[line][this.points[line].length - 1][0] - 1;
    let allPoints = this.getInterpolatedPoints(loadPointLength, line);
    this.timeline[this.elementId].animation[this.animationType].allpoints[
      line
    ] = allPoints;
  }

  drawPath(points, tension) {
    if (tension == null) tension = 1;
    let size = points.length * 2;
    let last = size - 4;
    let path = "M" + [points[0][0], points[0][1]];
    let now = 0;

    for (let i = 0; i < size - 2; i += 2) {
      let x0 = now ? points[now - 1][0] : points[0][0];
      let y0 = now ? points[now - 1][1] : points[0][1];
      let x1 = points[now][0];
      let y1 = points[now][1];
      let x2 = points[now + 1][0];
      let y2 = points[now + 1][1];
      let x3 = i !== last ? points[now + 2][0] : x2;
      let y3 = i !== last ? points[now + 2][1] : y2;
      let cp1x = x1 + ((x2 - x0) / 6) * tension;
      let cp1y = y1 + ((y2 - y0) / 6) * tension;
      let cp2x = x2 - ((x3 - x1) / 6) * tension;
      let cp2y = y2 - ((y3 - y1) / 6) * tension;
      now += 1;
      path += "C" + [cp1x, cp1y, cp2x, cp2y, x2, y2];
    }
    return path;
  }

  getPointAt(x, line) {
    let from = 0;
    let to = this.hiddenPath[line].getTotalLength();
    let current = (from + to) / 2;
    let point = this.hiddenPath[line].getPointAtLength(current);

    while (Math.abs(point.x - x) > 0.5) {
      if (point.x < x) from = current;
      else to = current;
      current = (from + to) / 2;
      point = this.hiddenPath[line].getPointAtLength(current);
    }

    return {
      x: point.x,
      y: point.y,
    };
  }

  getInterpolatedPoints(loadPointLength, line) {
    let points = [];
    let indexDivision = 4;
    let indexAt = 0;

    for (
      let index = 0;
      index < Math.round(loadPointLength / indexDivision);
      index++
    ) {
      points.push(this.getPointAt(indexAt, line));
      indexAt += 4;
    }

    return points;
  }

  handleMousedown(e) {
    const timelineRange = Number(
      document.querySelector("element-timeline-range").value,
    );
    const timeMagnification = timelineRange / 4;

    let insertX = e.offsetX / timeMagnification;
    let insertY = e.offsetY;
    this.addPoint({
      x: insertX,
      y: insertY,
      line: this.selectLine,
    });

    this.drawLine(this.selectLine, true);

    let animationPanel = document.querySelector(
      `animation-panel[element-id="${this.elementId}"]`,
    );
    animationPanel.updateItem();
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
