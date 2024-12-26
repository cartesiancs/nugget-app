import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { keyframeStore } from "../../states/keyframeStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import {
  IRenderOptionStore,
  renderOptionStore,
} from "../../states/renderOptionStore";

@customElement("preview-canvas")
export class PreviewCanvss extends LitElement {
  previewRatio: number;
  isMove: boolean;
  activeElementId: string;
  mouseOrigin: { x: number; y: number };
  elementOrigin: { x: number; y: number; w: number; h: number };
  moveType:
    | "none"
    | "position"
    | "stretchN"
    | "stretchW"
    | "stretchE"
    | "stretchS"
    | "stretchNE"
    | "stretchNW"
    | "stretchSW"
    | "stretchSE";
  cursorType:
    | "default"
    | "grabbing"
    | "ew-resize"
    | "ns-resize"
    | "nesw-resize"
    | "nwse-resize";
  isStretch: boolean;
  isEditText: boolean;
  constructor() {
    super();

    this.previewRatio = 1920 / 1920;
    this.isMove = false;
    this.isStretch = false;
    this.isEditText = false;
    this.moveType = "none";
    this.cursorType = "default";

    this.activeElementId = "";
    this.mouseOrigin = { x: 0, y: 0 };
    this.elementOrigin = { x: 0, y: 0, w: 0, h: 0 };
  }

  @query("#elementPreviewCanvasRef") canvas!: HTMLCanvasElement;

  handleClickCanvas() {
    //document.querySelector("element-control").handleClickPreview();
  }

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
  loadedObjects = [];

  @property()
  canvasMaxHeight = "100%";

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  renderOptionStore: IRenderOptionStore = renderOptionStore.getInitialState();

  @property()
  renderOption = this.renderOptionStore.options;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineCursor = state.cursor;
      this.timelineScroll = state.scroll;

      // this.setTimelineColor();
      this.setPreviewRatio();
      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.canvasMaxHeight =
        document.querySelector("#split_col_2").clientHeight;

      this.setPreviewRatio();
      this.drawCanvas();
    });

    renderOptionStore.subscribe((state) => {
      this.renderOption = state.options;
      this.setPreviewRatio();
    });

    return this;
  }

  setPreviewRatio() {
    const width = this.canvas.offsetWidth;

    this.previewRatio = this.renderOption.previewSize.w / width;

    const controlDom = document.querySelector("element-control");
    controlDom.previewRatio = this.previewRatio;
  }

  updateCursor() {
    this.canvas.style.cursor = this.cursorType;
  }

  drawCanvas() {
    let index = 1;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;

      this.canvas.width = 1920;
      this.canvas.height = 1080;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          const x = this.timeline[elementId].location.x;
          const y = this.timeline[elementId].location.y;
          const w = this.timeline[elementId].width;
          const h = this.timeline[elementId].height;
          const fileType = this.timeline[elementId].filetype;
          const startTime = this.timeline[elementId].startTime;
          const duration = this.timeline[elementId].duration;

          if (
            !(
              this.timelineCursor >= startTime &&
              this.timelineCursor < startTime + duration
            )
          ) {
            continue;
          }

          if (fileType == "image") {
            if (
              this.loadedObjects.findIndex((item) => {
                return item.elementId == elementId;
              }) != -1
            ) {
              const img = this.loadedObjects.filter((item) => {
                return item.elementId == elementId;
              })[0];

              ctx.globalAlpha = this.timeline[elementId].opacity / 100;
              ctx.drawImage(img.object, x, y, w, h);
            } else {
              let img = new Image();
              img.onload = () => {
                this.loadedObjects.push({
                  elementId: elementId,
                  object: img,
                });

                ctx.globalAlpha = this.timeline[elementId].opacity / 100;
                ctx.drawImage(img, x, y, w, h);
              };
              img.src = this.timeline[elementId].localpath;
            }
          }

          if (fileType == "video") {
            if (
              !(
                this.timelineCursor >=
                  startTime + this.timeline[elementId].trim.startTime &&
                this.timelineCursor < this.timeline[elementId].trim.endTime
              )
            ) {
              continue;
            }

            try {
              const video = document.querySelector(
                `element-control-asset[elementid='${elementId}'] > video`,
              );
              ctx.drawImage(video, x, y, w, h);
            } catch (error) {}
          }

          if (fileType == "text") {
            try {
              if (this.isEditText) {
                continue;
              }
              ctx.fillStyle = this.timeline[elementId].textcolor;
              ctx.lineWidth = 0;
              ctx.font = `${this.timeline[elementId].fontsize}px Arial`;
              ctx.fillText(
                this.timeline[elementId].text,
                this.timeline[elementId].location.x,
                this.timeline[elementId].location.y +
                  this.timeline[elementId].fontsize,
              );
            } catch (error) {}
          }

          if (this.activeElementId == elementId) {
            const padding = 10;
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#ffffff";
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#ffffff";

            ctx.beginPath();
            ctx.rect(x - padding, y - padding, padding * 2, padding * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.rect(x + w - padding, y - padding, padding * 2, padding * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.rect(
              x + w - padding,
              y + h - padding,
              padding * 2,
              padding * 2,
            );
            ctx.fill();

            ctx.beginPath();
            ctx.rect(x - padding, y + h - padding, padding * 2, padding * 2);
            ctx.fill();
          }
        }
      }
    }
  }

  collisionCheck({ x, y, w, h, mx, my, padding }) {
    if (
      mx > x + padding / 2 &&
      mx < x + w - padding / 2 &&
      my > y + padding / 2 &&
      my < y + h - padding / 2
    ) {
      return {
        type: "position",
      };
    } else if (
      mx > x + w &&
      mx < x + w + padding &&
      my > y + padding &&
      my < y + h - padding
    ) {
      return {
        type: "stretchE",
      };
    } else if (
      mx > x - padding &&
      mx < x &&
      my > y + padding &&
      my < y + h - padding
    ) {
      return {
        type: "stretchW",
      };
    } else if (
      mx > x + padding &&
      mx < x + w - padding &&
      my > y - padding &&
      my < y
    ) {
      return {
        type: "stretchN",
      };
    } else if (
      mx > x + padding &&
      mx < x + w - padding &&
      my > y + h &&
      my < y + h + padding
    ) {
      return {
        type: "stretchS",
      };
    } else if (
      mx > x - padding &&
      mx < x + padding &&
      my > y - padding &&
      my < y + padding
    ) {
      return {
        type: "stretchNW",
      };
    } else if (
      mx > x - padding &&
      mx < x + padding &&
      my > y + h - padding &&
      my < y + h + padding
    ) {
      return {
        type: "stretchSW",
      };
    } else if (
      mx > x + w - padding &&
      mx < x + w + padding &&
      my > y - padding &&
      my < y + padding
    ) {
      return {
        type: "stretchNE",
      };
    } else if (
      mx > x + w - padding &&
      mx < x + w + padding &&
      my > y + h - padding &&
      my < y + h + padding
    ) {
      return {
        type: "stretchSE",
      };
    } else {
      return {
        type: "none",
      };
    }
  }

  showSideOption(elementId) {
    const optionGroup = document.querySelector("option-group");
    const fileType = this.timeline[elementId].filetype;

    optionGroup.showOption({
      filetype: fileType,
      elementId: elementId,
    });
  }

  _handleMouseDown(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 40;

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const x = this.timeline[elementId].location.x;
        const y = this.timeline[elementId].location.y;
        const w = this.timeline[elementId].width;
        const h = this.timeline[elementId].height;
        const fileType = this.timeline[elementId].filetype;

        const collide = this.collisionCheck({
          x: x,
          y: y,
          w: w,
          h: h,
          my: my,
          mx: mx,
          padding: padding,
        });

        if (collide.type == "position") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.moveType = "position";
          this.cursorType = "grabbing";
          this.isMove = true;
          this.showSideOption(elementId);
        } else if (collide.type == "stretchW") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "ew-resize";
        } else if (collide.type == "stretchE") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "ew-resize";
        } else if (collide.type == "stretchN") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "ns-resize";
        } else if (collide.type == "stretchS") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "ns-resize";
        } else if (collide.type == "stretchNW") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "nwse-resize";
        } else if (collide.type == "stretchSE") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "nwse-resize";
        } else if (collide.type == "stretchNE") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "nesw-resize";
        } else if (collide.type == "stretchSW") {
          this.activeElementId = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isStretch = true;
          this.moveType = collide.type;
          this.cursorType = "nesw-resize";
        } else {
          this.isEditText = false;
          this.cursorType = "default";
        }
        this.updateCursor();
      }
    }
  }

  _handleMouseMove(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 40;

    let isCollide = false;

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const x = this.timeline[elementId].location.x;
        const y = this.timeline[elementId].location.y;
        const w = this.timeline[elementId].width;
        const h = this.timeline[elementId].height;
        const fileType = this.timeline[elementId].filetype;

        const collide = this.collisionCheck({
          x: x,
          y: y,
          w: w,
          h: h,
          my: my,
          mx: mx,
          padding: padding,
        });

        if (collide.type == "position") {
          this.activeElementId = elementId;
          this.cursorType = "grabbing";
          isCollide = true;
        } else if (collide.type == "stretchW") {
          this.cursorType = "ew-resize";
          isCollide = true;
        } else if (collide.type == "stretchE") {
          this.cursorType = "ew-resize";
          isCollide = true;
        } else if (collide.type == "stretchN") {
          this.cursorType = "ns-resize";
          isCollide = true;
        } else if (collide.type == "stretchS") {
          this.cursorType = "ns-resize";
          isCollide = true;
        } else if (collide.type == "stretchNW") {
          this.cursorType = "nwse-resize";
          isCollide = true;
        } else if (collide.type == "stretchSW") {
          this.cursorType = "nesw-resize";
          isCollide = true;
        } else if (collide.type == "stretchNE") {
          this.cursorType = "nesw-resize";
          isCollide = true;
        } else if (collide.type == "stretchSE") {
          this.cursorType = "nwse-resize";
          isCollide = true;
        }
      }
    }

    if (!isCollide) {
      this.cursorType = "default";
    }
    this.updateCursor();

    if (this.isMove) {
      const dx = mx - this.mouseOrigin.x;
      const dy = my - this.mouseOrigin.y;
      this.timeline[this.activeElementId].location.x =
        this.elementOrigin.x + dx;
      this.timeline[this.activeElementId].location.y =
        this.elementOrigin.y + dy;

      this.timelineState.patchTimeline(this.timeline);
    }

    if (this.isStretch) {
      const dx = mx - this.mouseOrigin.x;
      const dy = my - this.mouseOrigin.y;

      const moveE = () => {
        this.timeline[this.activeElementId].width = this.elementOrigin.w + dx;
      };

      const moveW = () => {
        this.timeline[this.activeElementId].width = this.elementOrigin.w - dx;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x + dx;
      };

      const moveN = () => {
        this.timeline[this.activeElementId].height = this.elementOrigin.h - dy;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y + dy;
      };

      const moveS = () => {
        this.timeline[this.activeElementId].height = this.elementOrigin.h + dy;
      };

      if (this.moveType == "stretchE") {
        moveE();
      } else if (this.moveType == "stretchW") {
        moveW();
      } else if (this.moveType == "stretchN") {
        moveN();
      } else if (this.moveType == "stretchS") {
        moveS();
      } else if (this.moveType == "stretchNW") {
        moveN();
        moveW();
      } else if (this.moveType == "stretchSW") {
        moveS();
        moveW();
      } else if (this.moveType == "stretchSE") {
        moveS();
        moveE();
      } else if (this.moveType == "stretchNE") {
        moveN();
        moveE();
      }

      this.timelineState.patchTimeline(this.timeline);
    }
  }

  _handleMouseUp(e) {
    this.isMove = false;
    this.isStretch = false;
  }

  _handleDblClick(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 40;

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const x = this.timeline[elementId].location.x;
        const y = this.timeline[elementId].location.y;
        const w = this.timeline[elementId].width;
        const h = this.timeline[elementId].height;
        const fileType = this.timeline[elementId].filetype;

        if (fileType != "text") {
          continue;
        }

        const collide = this.collisionCheck({
          x: x,
          y: y,
          w: w,
          h: h,
          my: my,
          mx: mx,
          padding: padding,
        });

        if (collide.type == "position") {
          this.activeElementId = elementId;

          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isEditText = true;
          this.drawCanvas();
        } else {
          this.cursorType = "default";
        }
        this.updateCursor();
      }
    }
  }

  protected render() {
    return html` <canvas
      id="elementPreviewCanvasRef"
      class="preview"
      style="width: 100%; max-height: calc(${this
        .canvasMaxHeight}px - 16px); cursor: ${this.cursorType};"
      onclick="${this.handleClickCanvas()}"
      @mousedown=${this._handleMouseDown}
      @mousemove=${this._handleMouseMove}
      @mouseup=${this._handleMouseUp}
    ></canvas>`;
  }
}
