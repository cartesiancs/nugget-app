import { LitElement, PropertyValues, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { millisecondsToPx, pxToMilliseconds } from "../../utils/time";
import { IUIStore, uiStore } from "../../states/uiStore";
import { ImageElementType } from "../../@types/timeline";
import { KeyframeController } from "../../controllers/keyframe";

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
  verticalScroll: number;
  cursor: string;
  verticalRange: number;
  activePointIndex: number;

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

    this.cursor = "default";

    this.verticalScroll = 0;
    this.verticalRange = 1;

    this.activePointIndex = -1;

    this.addEventListener("scroll", this.handleScroll.bind(this));
    window.addEventListener("keydown", this._handleKeydown.bind(this));

    // try {
    //   // position이면 2개 나머지는 1개
    //   this.lineCount = 2;

    //   this.clearLineEditorGroup();

    //   for (let line = 0; line < this.lineCount; line++) {
    //     this.addLineEditor(line);
    //   }

    //   this.changeLineEditor(0);
    // } catch (error) {}
  }

  private keyframeControl = new KeyframeController(this);

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
  timeline: any = this.timelineState.timeline;

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
      if (this.isShow) {
        if (this.animationType == "position") {
          this.lineCount = 2;
        }
        if (["opacity", "scale", "rotation"].includes(this.animationType)) {
          this.lineCount = 1;
        }

        // if (this.prevElementId != this.elementId) {
        //   if (
        //     this.timeline[this.elementId].animation[this.animationType]
        //       .isActivate
        //   ) {
        //     this.points = [
        //       ...this.timeline[this.elementId].animation[this.animationType]
        //         .points,
        //     ];
        //   } else {
        //     this.points = [[[0, 0]], [[0, 0]]];
        //   }
        //   this.prevElementId = this.elementId;
        // }
      }

      if (this.isShow) {
        this.showKeyframeEditorButtonGroup();

        this.classList.add(
          "h-100",
          "w-100",
          "position-absolute",
          "overflow-hidden",
        );

        return html` <div style="display: flex;">
          <div
            class="d-flex row gap-2 p-2 ps-3"
            style="width: ${this.resize.timelineVertical.leftOption}px"
          >
            <span class="text-secondary">Line</span>
            <div
              class="btn-group p-2"
              role="group"
              id="timelineOptionLineEditor"
            >
              <button
                line="0"
                @click=${() => this.changeLineEditor("0")}
                type="button"
                class="btn ${this.selectLine == 0
                  ? "btn-primary"
                  : "btn-secondary"} btn-sm"
              >
                x
              </button>

              <button
                line="1"
                @click=${() => this.changeLineEditor("1")}
                type="button"
                class="btn ${this.selectLine == 1
                  ? "btn-primary"
                  : "btn-secondary"} btn-sm ${this.lineCount == 1
                  ? "d-none"
                  : ""}"
              >
                y
              </button>
            </div>

            <span class="text-secondary">Range</span>
            <input
              type="range"
              class="form-range p-2 ps-3"
              min="0.1"
              max="10"
              step="0.1"
              value="1"
              id="verticalRange"
              @change=${this.handleChangeVerticalRange}
              @input=${this.handleChangeVerticalRange}
            />
          </div>

          <canvas
            id="keyframeEditerCanvasRef"
            style="width: 100%; left: ${this.resize.timelineVertical
              .leftOption}px; position: absolute; cursor: ${this.cursor};"
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

  handleChangeVerticalRange(e) {
    this.verticalRange = parseFloat(e.target.value);
    this.requestUpdate();
  }

  drawRuler() {
    const ctx = this.canvas.getContext("2d") as any;

    const height = 1000;
    const width = 50;
    const step = 50;
    const iStep = step * 40;
    const center = this.verticalScroll;

    ctx.fillStyle = "#55585e";
    ctx.textAlign = "center";
    ctx.font = "9px Arial";

    for (let i = -iStep; i <= iStep; i += step) {
      const pos = center + i;
      ctx.fillText(i, width / 2, pos / this.verticalRange);
      ctx.fillRect(10, pos / this.verticalRange, 30, 0.5);
    }
  }

  private drawDots(ctx) {
    const points = this.timeline[this.elementId].animation[this.animationType];

    for (const key in points) {
      if (Object.prototype.hasOwnProperty.call(points, key)) {
        if (["x", "y"].includes(key)) {
          const point =
            this.timeline[this.elementId].animation[this.animationType][key];
          if (key == "x") {
            let color = this.selectLine == 0 ? "#403af0" : "#3d3e45";
            let subcolor = this.selectLine == 0 ? "#b7bcf7" : "#3d3e45";

            this.drawDotsLoop({
              ctx: ctx,
              dots: point,
              color: color,
              subColor: subcolor,
            });
          } else {
            let color = this.selectLine == 1 ? "#e83535" : "#3d3e45";
            let subcolor = this.selectLine == 1 ? "#ed7979" : "#3d3e45";

            this.drawDotsLoop({
              ctx: ctx,
              dots: point,
              color: color,
              subColor: subcolor,
            });
          }
        }
      }
    }
  }

  drawDotsLoop({ ctx, dots, color, subColor }) {
    for (let index = 0; index < dots.length; index++) {
      const element = dots[index];
      ctx.fillStyle = color;

      if (this.activePointIndex == index && this.activePointIndex != -1) {
        ctx.fillStyle = "#f7f414"; // yellow color
      }

      ctx.beginPath();

      const x =
        millisecondsToPx(
          element.p[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;

      const y = element.p[1] + this.verticalScroll;
      ctx.arc(x, y / this.verticalRange, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = subColor;

      ctx.beginPath();
      const sx =
        millisecondsToPx(
          element.cs[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;
      const sy = element.cs[1] + this.verticalScroll;
      ctx.arc(sx, sy / this.verticalRange, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.beginPath();
      const ex =
        millisecondsToPx(
          element.ce[0] + this.timeline[this.elementId].startTime,
          this.timelineRange,
        ) - this.timelineScroll;
      const ey = element.ce[1] + this.verticalScroll;
      ctx.arc(ex, ey / this.verticalRange, 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = subColor;

      ctx.beginPath();
      ctx.moveTo(x, y / this.verticalRange);
      ctx.lineTo(sx, sy / this.verticalRange);
      ctx.stroke();

      ctx.strokeStyle = subColor;

      ctx.beginPath();
      ctx.moveTo(x, y / this.verticalRange);
      ctx.lineTo(ex, ey / this.verticalRange);
      ctx.stroke();
    }
  }

  private drawLines(ctx) {
    const points = this.timeline[this.elementId].animation[this.animationType];

    for (const key in points) {
      if (Object.prototype.hasOwnProperty.call(points, key)) {
        if (["ax", "ay"].includes(key)) {
          const point =
            this.timeline[this.elementId].animation[this.animationType][key];
          ctx.strokeStyle = this.selectLine == 0 ? "#403af0" : "#3d3e45";
          if (key == "ay") {
            ctx.strokeStyle = this.selectLine == 1 ? "#e83535" : "#3d3e45";
          }

          ctx.beginPath();
          for (let index = 0; index < point.length; index++) {
            const element = point[index];
            const x =
              millisecondsToPx(
                element[0] + this.timeline[this.elementId].startTime,
                this.timelineRange,
              ) - this.timelineScroll;
            ctx.lineTo(
              x,
              (element[1] + this.verticalScroll) / this.verticalRange,
            );
          }
          ctx.stroke();
        }
      }
    }
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
    const targetTimeline: ImageElementType | any =
      this.timeline[this.elementId];

    const startPx =
      millisecondsToPx(targetTimeline.startTime, this.timelineRange) -
      this.timelineScroll;

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.rect(0, 0, startPx, this.canvas.height);
    ctx.fill();
  }

  private drawRightPadding(ctx) {
    const targetTimeline: ImageElementType | any =
      this.timeline[this.elementId];

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
        this.drawRuler();
        this.drawCursor(ctx);
        this.drawDots(ctx);
        this.drawLines(ctx);
      }
    } catch (error) {}
  }

  updated() {
    this.drawCanvas();
  }

  showKeyframeEditorButtonGroup() {}

  hideKeyframeEditorButtonGroup() {
    let keyframeEditor: any = document.getElementById("option_bottom");
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
    this.requestUpdate();
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

  getRemovedDuplicatePoint({ x, line }) {
    let tmp: any = [];
    this.points[line].forEach((element) => {
      if (element[0] != x) {
        tmp.push(element);
      }
    });
    return tmp;
  }

  removePoint() {
    if (this.activePointIndex == -1) {
      return false;
    }
    const lineToAlpha = this.selectLine == 0 ? "x" : "y";

    this.timeline[this.elementId].animation[this.animationType][
      lineToAlpha
    ].splice(this.activePointIndex, 1);

    this.activePointIndex == -1;

    this.timelineState.patchTimeline(this.timeline);
    this.keyframeControl.interpolate(
      this.selectLine,
      this.elementId,
      this.animationType,
    );
    this.requestUpdate();
  }

  checkBoundary(element, mouseX, mouseY) {
    const padding = 10;

    const csx =
      millisecondsToPx(
        element.cs[0] + this.timeline[this.elementId].startTime,
        this.timelineRange,
      ) - this.timelineScroll;

    const csy = (element.cs[1] + this.verticalScroll) / this.verticalRange;

    if (
      csx > mouseX - padding &&
      csx < mouseX + padding &&
      csy > mouseY - padding &&
      csy < mouseY + padding
    ) {
      return "cs";
    }

    const cex =
      millisecondsToPx(
        element.ce[0] + this.timeline[this.elementId].startTime,
        this.timelineRange,
      ) - this.timelineScroll;

    const cey = (element.ce[1] + this.verticalScroll) / this.verticalRange;

    if (
      cex > mouseX - padding &&
      cex < mouseX + padding &&
      cey > mouseY - padding &&
      cey < mouseY + padding
    ) {
      return "ce";
    }

    const dotx =
      millisecondsToPx(
        element.p[0] + this.timeline[this.elementId].startTime,
        this.timelineRange,
      ) - this.timelineScroll;

    const doty = (element.p[1] + this.verticalScroll) / this.verticalRange;

    if (
      dotx > mouseX - padding &&
      dotx < mouseX + padding &&
      doty > mouseY - padding &&
      doty < mouseY + padding
    ) {
      return "p";
    }

    return "n";
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

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;
    this.verticalScroll -= e.deltaY * this.verticalRange;

    this.drawCanvas();

    this.activePointIndex == -1;

    if (newScroll >= 0) {
      this.timelineState.setScroll(newScroll);
    }

    this.requestUpdate();
  }

  _handleMouseMove(e) {
    //console.log(e);
    const ox = e.offsetX;
    const oy = e.offsetY;
    const px =
      pxToMilliseconds(e.offsetX, this.timelineRange) +
      pxToMilliseconds(this.timelineScroll, this.timelineRange) -
      this.timeline[this.elementId].startTime;
    const py = e.offsetY * this.verticalRange - this.verticalScroll;
    const lineToAlpha = this.selectLine == 0 ? "x" : "y";
    const padding = 10;
    const paddingY = 10;

    let isCursorChange = false;

    for (
      let index = 0;
      index <
      this.timeline[this.elementId].animation[this.animationType][lineToAlpha]
        .length;
      index++
    ) {
      const element =
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][index];

      const check = this.checkBoundary(element, ox, oy);

      if (["p", "ce", "cs"].includes(check)) {
        this.cursor = "pointer";
        isCursorChange = true;
      }
    }

    if (isCursorChange == false) {
      this.cursor = "default";
    }

    //console.log(px);

    if (this.isDrag) {
      let isApply = true;
      if (this.clickDot == "p") {
        for (
          let index = 0;
          index <
          this.timeline[this.elementId].animation[this.animationType][
            lineToAlpha
          ].length;
          index++
        ) {
          const element =
            this.timeline[this.elementId].animation[this.animationType][
              lineToAlpha
            ][index];

          if (element.p[0] == px && index != this.clickIndex) {
            isApply = false;
          }
        }
      }

      if (isApply == false) {
        this.drawCanvas();
        return false;
      }

      this.timeline[this.elementId].animation[this.animationType][lineToAlpha][
        this.clickIndex
      ][this.clickDot][0] = px;
      this.timeline[this.elementId].animation[this.animationType][lineToAlpha][
        this.clickIndex
      ][this.clickDot][1] = py;

      if (this.clickDot == "p") {
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][this.clickIndex].ce[0] = px + 100;
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][this.clickIndex].ce[1] = py;

        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][this.clickIndex].cs[0] = px - 100;
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][this.clickIndex].cs[1] = py;
      }

      this.keyframeControl.interpolate(
        this.selectLine,
        this.elementId,
        this.animationType,
      );

      this.drawCanvas();
    }

    this.requestUpdate();
  }

  _handleMouseDown(e) {
    const lineToAlpha = this.selectLine == 0 ? "x" : "y";

    const padding = 100;
    const px =
      pxToMilliseconds(e.offsetX, this.timelineRange) +
      pxToMilliseconds(this.timelineScroll, this.timelineRange) -
      this.timeline[this.elementId].startTime;
    const py = e.offsetY * this.verticalRange - this.verticalScroll;

    const ox = e.offsetX;

    const oy = e.offsetY;
    for (
      let index = 0;
      index <
      this.timeline[this.elementId].animation[this.animationType][lineToAlpha]
        .length;
      index++
    ) {
      const element =
        this.timeline[this.elementId].animation[this.animationType][
          lineToAlpha
        ][index];

      const check = this.checkBoundary(element, ox, oy);

      if (check == "p") {
        this.clickIndex = index;
        this.clickDot = "p";
        this.activePointIndex = index;
        this.isDrag = true;
      } else if (check == "ce") {
        this.clickIndex = index;
        this.clickDot = "ce";
        this.isDrag = true;
      } else if (check == "cs") {
        this.clickIndex = index;
        this.clickDot = "cs";
        this.isDrag = true;
      }
    }

    if (!this.isDrag) {
      this.keyframeControl.addPoint({
        x: px,
        y: py,
        line: this.selectLine,
        elementId: this.elementId,
        animationType: this.animationType,
      });
      this.drawCanvas();
    }

    return;
  }

  _handleMouseUp() {
    this.isDrag = false;
  }

  _handleKeydown(event) {
    if (event.keyCode == 8) {
      // backspace

      if (this.activePointIndex != -1) {
        this.removePoint();
      }
    }
  }
}
