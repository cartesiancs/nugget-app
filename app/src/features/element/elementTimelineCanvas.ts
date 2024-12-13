import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { consume, provide } from "@lit/context";
import {
  TimelineContentObject,
  timelineContext,
} from "../../context/timelineContext";
import { IUIStore, uiStore } from "../../states/uiStore";
import { darkenColor } from "../../utils/rgbColor";
import { TimelineController } from "../../controllers/timeline";

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
  cursorNow: number;
  targetTrim: { startTime: number; endTime: number };
  timelineColor: {};
  canvasVerticalScroll: number;
  copyedTimelineData: {};

  constructor() {
    super();

    this.targetId = "";
    this.targetStartTime = 0;
    this.targetDuration = 1000;
    this.targetTrim = {
      startTime: 0,
      endTime: 1000,
    };

    this.isDrag = false;
    this.firstClickPosition = { x: 0, y: 0 };
    this.cursorType = "none";
    this.cursorNow = 0;
    this.timelineColor = {};
    this.canvasVerticalScroll = 0;
    this.copyedTimelineData = {};

    window.addEventListener("resize", this.drawCanvas);
    window.addEventListener("keydown", this._handleKeydown.bind(this));
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

  @property()
  timelineCursor = this.timelineState.cursor;

  @property()
  isOpenAnimationPanelId = [];

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @consume({ context: timelineContext })
  @property({ attribute: false })
  public timelineOptions = {
    canvasVerticalScroll: 0,
  };

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineCursor = state.cursor;
      this.timelineScroll = state.scroll;

      this.setTimelineColor();
      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.drawCanvas();
    });

    return this;
  }

  setTimelineColor() {
    for (const key in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        if (!this.timelineColor.hasOwnProperty(key)) {
          this.timelineColor[key] = this.getRandomColor();
        }
      }
    }
  }

  private getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  private getRandomColor() {
    let rgbMinColor = { r: 45, g: 23, b: 56 };
    let rgbMaxColor = { r: 167, g: 139, b: 180 };

    let rgb = {
      r: this.getRandomArbitrary(rgbMinColor.r, rgbMaxColor.r),
      g: this.getRandomArbitrary(rgbMinColor.g, rgbMaxColor.g),
      b: this.getRandomArbitrary(rgbMinColor.b, rgbMaxColor.b),
    };

    let rgbColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    return rgbColor;
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

  private pxToMilliseconds(px) {
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;
    const convertMs = (px * 5) / timeMagnification;
    return Number(convertMs.toFixed(0));
  }

  private wrapText(ctx, text, x, y, maxWidth) {
    let ellipsis = "...";
    let truncatedText = text;

    if (ctx.measureText(text).width > maxWidth) {
      while (ctx.measureText(truncatedText + ellipsis).width > maxWidth) {
        truncatedText = truncatedText.slice(0, -1);
      }
      truncatedText += ellipsis;
    }

    const fontSize = 14;
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 0;
    ctx.font = `${fontSize}px "Noto Sans"`;
    ctx.fillText(truncatedText, x, y);
  }

  private deepCopy(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      const copy = [];
      obj.forEach((element, index) => {
        copy[index] = this.deepCopy(element);
      });
      return copy;
    } else {
      const copy = {};
      Object.keys(obj).forEach((key) => {
        copy[key] = this.deepCopy(obj[key]);
      });
      return copy;
    }
  }

  private copySeletedElement() {
    if (this.targetId != "") {
      let selected = {};

      let changedUUID = uuidv4();

      selected[changedUUID] = this.deepCopy(this.timeline[this.targetId]);

      this.copyedTimelineData = selected;
    }
  }

  private splitSeletedElement() {
    if (this.targetId == "") {
      return false;
    }

    let selected = {};
    const timelineRange = this.timelineRange;
    const timelineCursor = this.timelineCursor;
    const timeMagnification = timelineRange / 4;
    const convertMs = (timelineCursor * 5) / timeMagnification;
    let curserLeft = this.timelineCursor;

    let changedUUID = uuidv4();
    selected[changedUUID] = this.deepCopy(this.timeline[this.targetId]);

    if (
      elementUtils.getElementType(this.timeline[this.targetId].filetype) ==
      "dynamic"
    ) {
      let targetElementTrimStartTime =
        curserLeft -
        (selected[changedUUID].trim.startTime +
          selected[changedUUID].startTime);
      selected[changedUUID].trim.startTime += targetElementTrimStartTime;

      this.timeline[this.targetId].trim.endTime =
        selected[changedUUID].trim.startTime;
    } else if (
      elementUtils.getElementType(this.timeline[this.targetId].filetype) ==
      "static"
    ) {
      let targetElementStartTime = curserLeft - selected[changedUUID].startTime;
      console.log(
        curserLeft,
        selected[changedUUID].startTime,
        selected[changedUUID].duration,
        timelineRange,
        timelineCursor,
      );

      selected[changedUUID].startTime += targetElementStartTime;
      selected[changedUUID].duration =
        selected[changedUUID].duration - targetElementStartTime;

      let originElementDuration =
        this.timeline[this.targetId].duration - selected[changedUUID].duration;

      this.timeline[this.targetId].duration = originElementDuration;
    }

    this.copyedTimelineData = selected;
  }

  drawCursor() {
    const ctx = this.canvas.getContext("2d");
    const height = document.querySelector("element-timeline").offsetHeight;

    const now =
      this.millisecondsToPx(this.timelineCursor) - this.timelineScroll;

    ctx.fillStyle = "#dbdaf0";
    ctx.beginPath();
    ctx.rect(now, 0, 2, height);
    ctx.fill();
  }

  drawEndTimeline() {
    const projectDuration = document.querySelector("#projectDuration").value;
    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;

    const ctx = this.canvas.getContext("2d");
    const height = document.querySelector("element-timeline").offsetHeight;

    const end =
      ((projectDuration * 1000) / 5) * timeMagnification - this.timelineScroll;

    ctx.fillStyle = "#ff173e";
    ctx.beginPath();
    ctx.rect(end, 0, 2, height);
    ctx.fill();
  }

  drawCanvas() {
    let index = 1;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;
      this.canvas.style.width = `${window.innerWidth}px`;

      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height =
        document.querySelector("element-timeline").offsetHeight * dpr;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.scale(dpr, dpr);

      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          const width = this.millisecondsToPx(
            this.timeline[elementId].duration,
          );
          const height = 30;
          const top = index * height * 1.2 - this.canvasVerticalScroll;
          const left =
            this.millisecondsToPx(this.timeline[elementId].startTime) -
            this.timelineScroll;

          const filetype = this.timeline[elementId].filetype;

          let elementType = elementUtils.getElementType(filetype);

          ctx.lineWidth = 0;

          if (elementType == "static") {
            if (this.targetId == elementId) {
              ctx.fillStyle = this.timelineColor[elementId];
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 3;
            } else {
              ctx.fillStyle = this.timelineColor[elementId];
              ctx.strokeStyle = this.timelineColor[elementId];
              ctx.lineWidth = 0;
            }

            ctx.beginPath();
            ctx.rect(left, top, width, height);
            ctx.fill();
            ctx.stroke();
          } else if (elementType == "dynamic") {
            const startTime = this.millisecondsToPx(
              this.timeline[elementId].trim.startTime,
            );
            const endTime = this.millisecondsToPx(
              this.timeline[elementId].trim.endTime,
            );
            const duration = this.millisecondsToPx(
              this.timeline[elementId].duration,
            );

            if (this.targetId == elementId) {
              ctx.fillStyle = this.timelineColor[elementId];
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 3;
            } else {
              ctx.fillStyle = this.timelineColor[elementId];
              ctx.strokeStyle = this.timelineColor[elementId];

              ctx.lineWidth = 0;
            }

            ctx.beginPath();
            ctx.rect(left, top, width, height);
            ctx.fill();
            ctx.stroke();

            const darkenRate = 0.8;

            ctx.lineWidth = 0;
            ctx.fillStyle = darkenColor(
              this.timelineColor[elementId],
              darkenRate,
            );
            ctx.beginPath();
            ctx.rect(left, top, startTime, height);
            ctx.fill();

            ctx.fillStyle = darkenColor(
              this.timelineColor[elementId],
              darkenRate,
            );
            ctx.beginPath();
            ctx.rect(left + endTime, top, duration - endTime, height);
            ctx.fill();
          }

          index += 1;
        }
      }

      this.drawEndTimeline();
      this.drawCursor();
    }
  }

  private guide({
    element,
    filetype,
    elementBarPosition,
    targetId,
    targetElementType,
  }) {
    let startX =
      filetype == "static"
        ? this.millisecondsToPx(element.startTime)
        : this.millisecondsToPx(element.startTime + element.trim.startTime);
    let endX =
      filetype == "static"
        ? this.millisecondsToPx(element.startTime + element.duration)
        : this.millisecondsToPx(element.startTime + element.trim.endTime);
    let checkRange = 10;

    if (
      elementBarPosition.startX > startX - checkRange &&
      elementBarPosition.startX < startX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? startX
          : startX -
            this.millisecondsToPx(this.timeline[targetId].trim.startTime);
      this.style.left = `${px}px`;
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
    }

    if (
      elementBarPosition.startX > endX - checkRange &&
      elementBarPosition.startX < endX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? endX
          : endX -
            this.millisecondsToPx(this.timeline[targetId].trim.startTime);
      this.style.left = `${px}px`;
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
    }

    if (
      elementBarPosition.endX > startX - checkRange &&
      elementBarPosition.endX < startX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? startX - this.millisecondsToPx(this.timeline[targetId].duration)
          : startX -
            this.millisecondsToPx(this.timeline[targetId].trim.endTime);
      this.style.left = `${px}px`;
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
    }

    if (
      elementBarPosition.endX > endX - checkRange &&
      elementBarPosition.endX < endX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? endX - this.millisecondsToPx(this.timeline[targetId].duration)
          : endX - this.millisecondsToPx(this.timeline[targetId].trim.endTime);
      this.style.left = `${px}px`;
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
    }
  }

  private magnet({ targetId, px }: { targetId: string; px: number }) {
    let targetElementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    let startX =
      targetElementType == "static"
        ? this.millisecondsToPx(this.timeline[targetId].startTime)
        : this.millisecondsToPx(
            this.timeline[targetId].startTime +
              this.timeline[targetId].trim.startTime,
          );
    let endX =
      targetElementType == "static"
        ? this.millisecondsToPx(
            this.timeline[targetId].startTime +
              this.timeline[targetId].duration,
          )
        : this.millisecondsToPx(
            this.timeline[targetId].startTime +
              this.timeline[targetId].trim.endTime,
          );

    let elementBarPosition = {
      startX: startX,
      endX: endX,
    };

    for (const timelineKey in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, timelineKey)) {
        if (timelineKey == targetId) {
          continue;
        }

        const element = this.timeline[timelineKey];
        const elementType = elementUtils.getElementType(element.filetype);
        this.guide({
          element: element,
          filetype: elementType,
          elementBarPosition: elementBarPosition,
          targetElementType: targetElementType,
          targetId: targetId,
        });
      }
    }

    this.timelineState.patchTimeline(this.timeline);
  }

  updateTargetPosition({ targetId, dx }: { targetId: string; dx: number }) {
    this.timeline[targetId].startTime =
      this.targetStartTime + this.pxToMilliseconds(dx);
  }

  updateTargetStartStretch({ targetId, dx }: { targetId: string; dx: number }) {
    let elementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    const minDuration = 10;

    if (elementType == "static") {
      if (this.targetDuration - this.pxToMilliseconds(dx) <= minDuration) {
        return false;
      }

      this.timeline[targetId].startTime =
        this.targetStartTime + this.pxToMilliseconds(dx);
      this.timeline[targetId].duration =
        this.targetDuration - this.pxToMilliseconds(dx);
    }

    if (elementType == "dynamic") {
      if (this.targetTrim.startTime + this.pxToMilliseconds(dx) > 0) {
        this.timeline[targetId].trim.startTime =
          this.targetTrim.startTime + this.pxToMilliseconds(dx);
      }
    }
  }

  updateTargetEndStretch({ targetId, dx }: { targetId: string; dx: number }) {
    let elementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    const minDuration = 10;

    if (elementType == "static") {
      if (this.targetDuration + this.pxToMilliseconds(dx) <= minDuration) {
        return false;
      }

      this.timeline[targetId].duration =
        this.targetDuration + this.pxToMilliseconds(dx);
    }

    if (elementType == "dynamic") {
      if (
        this.targetTrim.endTime + this.pxToMilliseconds(dx) <
        this.targetDuration
      ) {
        this.timeline[targetId].trim.endTime =
          this.targetTrim.endTime + this.pxToMilliseconds(dx);
      }
    }
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
          this.timeline[elementId].duration,
        );
        const defaultHeight = 30;
        const startY = index * defaultHeight * 1.2 - this.canvasVerticalScroll;
        const startX =
          this.millisecondsToPx(this.timeline[elementId].startTime) -
          this.timelineScroll;

        const endX = startX + defaultWidth;
        const endY = startY + defaultHeight;
        const stretchArea = 10;

        if (
          x > startX - stretchArea &&
          x < endX + stretchArea &&
          y > startY &&
          y < endY
        ) {
          targetId = elementId;
          let elementType = elementUtils.getElementType(
            this.timeline[elementId].filetype,
          );

          if (elementType == "static") {
            if (x > startX - stretchArea && x < startX + stretchArea) {
              return { targetId: targetId, cursorType: "stretchStart" };
            } else if (x > endX - stretchArea && x < endX + stretchArea) {
              return { targetId: targetId, cursorType: "stretchEnd" };
            } else {
              return { targetId: targetId, cursorType: "move" };
            }
          } else if (elementType == "dynamic") {
            const trimStartTime = this.millisecondsToPx(
              this.timeline[elementId].trim.startTime,
            );
            const trimEndTime = this.millisecondsToPx(
              this.timeline[elementId].trim.endTime,
            );
            if (
              x > startX + trimStartTime - stretchArea &&
              x < startX + trimStartTime + stretchArea
            ) {
              return { targetId: targetId, cursorType: "stretchStart" };
            } else if (
              x > trimEndTime + startX - stretchArea &&
              x < trimEndTime + startX + stretchArea
            ) {
              return { targetId: targetId, cursorType: "stretchEnd" };
            } else {
              return { targetId: targetId, cursorType: "move" };
            }
          }
        }

        index += 1;
      }
    }

    return { targetId: "", cursorType: "none" };
  }

  public openAnimationPanel(targetId: string) {
    this.isOpenAnimationPanelId.push(targetId);

    let timelineOptionOffcanvas = new bootstrap.Offcanvas(
      document.getElementById("option_bottom"),
    );
    let timelineOption = document.querySelector("#timelineOptionBody");
    let targetElementId = document.querySelector(
      "#timelineOptionTargetElement",
    );

    timelineOption.innerHTML = `<keyframe-editor element-id="${targetId}" animation-type="${"position"}"></keyframe-editor>`;
    timelineOption.classList.remove("d-none");
    targetElementId.value = targetId;
    timelineOptionOffcanvas.show();
  }

  public closeAnimationPanel(targetId: string) {
    this.isOpenAnimationPanelId = this.isOpenAnimationPanelId.filter(
      (item) => !item.includes(targetId),
    );

    const animationPanel: any = this.querySelector(
      `animation-panel[element-id='${targetId}']`,
    );

    animationPanel.hide();
  }

  animationPanelDropdownTemplate() {
    // NOTE: 영상 애니메이션은 아직 지원 안함

    if (
      this.targetMediaType == "dynamic" ||
      this.timeline[this.targetId].filetype == "text"
    ) {
      return "";
    }

    let isShowPanel = this.isShowAnimationPanel();
    let itemName =
      isShowPanel == true ? "애니메이션 패널 닫기" : "애니메이션 패널 열기";
    let itemOnclickEvent =
      isShowPanel == true
        ? `document.querySelector('element-timeline-canvas').closeAnimationPanel('${this.targetId}')`
        : `document.querySelector('element-timeline-canvas').openAnimationPanel('${this.targetId}')`;

    let template = `<menu-dropdown-item onclick=${itemOnclickEvent} item-name="${itemName}"></menu-dropdown-item>`;
    return template;
  }

  isShowAnimationPanel() {
    const index = this.isOpenAnimationPanelId.findIndex((item) => {
      return item == this.targetId;
    });

    return index != -1;
  }

  showMenuDropdown({ x, y }) {
    // ${this.animationPanelDropdownTemplate()}
    document.querySelector("#menuRightClick").innerHTML = `
        <menu-dropdown-body top="${y}" left="${x}">
          
          <menu-dropdown-item onclick="document.querySelector('element-timeline-canvas').removeSeletedElements()" item-name="삭제"> </menu-dropdown-item>
        </menu-dropdown-body>`;
  }

  whenRightClick(e) {
    const isRightClick = e.which == 3 || e.button == 2;

    if (!isRightClick) {
      return 0;
    }

    this.showMenuDropdown({
      x: e.clientX,
      y: e.clientY,
    });
    //document.querySelector('element-timeline').removeSeletedElements()
  }

  public removeSeletedElements() {
    this.timelineState.removeTimeline(this.targetId);
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;

    if (this.canvasVerticalScroll + e.deltaY > 0) {
      this.canvasVerticalScroll += e.deltaY;
      this.timelineOptions.canvasVerticalScroll += e.deltaY;
      this.drawCanvas();
    }

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

      this.magnet({ targetId: this.targetId, px: dx });
    }
  }

  _handleMouseDown(e) {
    try {
      const x = e.offsetX;
      const y = e.offsetY;

      const target = this.findTarget({ x: x, y: y });
      this.targetId = target.targetId;
      this.cursorType = target.cursorType;

      this.firstClickPosition.x = e.offsetX;
      this.firstClickPosition.y = e.offsetY;

      this.targetStartTime = this.timeline[this.targetId].startTime;
      this.targetDuration = this.timeline[this.targetId].duration;

      let elementType = elementUtils.getElementType(
        this.timeline[this.targetId].filetype,
      );

      if (elementType == "dynamic") {
        this.targetTrim.startTime = this.timeline[this.targetId].trim.startTime;
        this.targetTrim.endTime = this.timeline[this.targetId].trim.endTime;
      }

      this.drawCanvas();

      this.isDrag = true;
    } catch (error) {
      this.drawCanvas();

      this.isDrag = true;
    }
  }

  _handleMouseUp(e) {
    this.isDrag = false;
    this.whenRightClick(e);
  }

  _handleKeydown(event) {
    if (event.keyCode == 8) {
      // backspace
      // event.preventDefault();
      this.timelineState.removeTimeline(this.targetId);
    }

    if (event.ctrlKey && event.keyCode == 86) {
      //CTL v
      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          this.timeline[elementId] = { ...this.copyedTimelineData[elementId] };
          this.timelineState.patchTimeline(this.timeline);
        }
      }
    }

    if (event.ctrlKey && event.keyCode == 67) {
      //CTL c
      console.log("SS");
      this.copySeletedElement();
    }

    if (event.ctrlKey && event.keyCode == 88) {
      //CTL x

      this.copySeletedElement();
      this.timelineState.removeTimeline(this.targetId);
    }

    if (event.ctrlKey && event.keyCode == 68) {
      //CTL d
      this.splitSeletedElement();

      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          this.timeline[elementId] = { ...this.copyedTimelineData[elementId] };
          this.timelineState.patchTimeline(this.timeline);
        }
      }
    }
  }

  renderAnimationPanel() {
    //this.isOpenAnimationPanelId
    return html``;
  }

  renderCanvas() {
    return html`
      <canvas
        id="elementTimelineCanvasRef"
        style="width: 1122px;left: ${this.resize.timelineVertical
          .leftOption}px;position: absolute;"
        @mousewheel=${this._handleMouseWheel}
        @mousemove=${this._handleMouseMove}
        @mousedown=${this._handleMouseDown}
        @mouseup=${this._handleMouseUp}
      ></canvas>
    `;
  }

  protected render(): unknown {
    if (document.querySelector("#elementTimelineCanvasRef")) {
      this.timelineState.setCanvasWidth(
        document.querySelector("#elementTimelineCanvasRef").clientWidth,
      );
    }

    return html` ${this.renderCanvas()}`;
  }
}
