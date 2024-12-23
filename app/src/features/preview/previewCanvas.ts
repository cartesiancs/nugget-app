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
  constructor() {
    super();

    this.previewRatio = 1920 / 1920;
    this.isMove = false;
    this.isStretch = false;
    this.moveType = "none";
    this.cursorType = "default";

    this.activeElementId = "";
    this.mouseOrigin = { x: 0, y: 0 };
    this.elementOrigin = { x: 0, y: 0, w: 0, h: 0 };
  }

  @query("#elementPreviewCanvasRef") canvas!: HTMLCanvasElement;

  handleClickCanvas() {
    document.querySelector("element-control").handleClickPreview();
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

          if (fileType == "image") {
            if (
              this.loadedObjects.findIndex((item) => {
                return item.elementId == elementId;
              }) != -1
            ) {
              const img = this.loadedObjects.filter((item) => {
                return item.elementId == elementId;
              })[0];
              ctx.drawImage(img.object, x, y, w, h);
            } else {
              let img = new Image();
              img.onload = () => {
                this.loadedObjects.push({
                  elementId: elementId,
                  object: img,
                });
                ctx.drawImage(img, x, y, w, h);
              };
              img.src = this.timeline[elementId].localpath;
            }
          }
        }
      }
    }
  }

  collisionCheck({ x, y, w, h, mx, my, padding }) {
    if (mx > x && mx < x + w && my > y && my < y + h) {
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
    } else {
      return {
        type: "none",
      };
    }
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
        } else {
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
          this.cursorType = "grabbing";
        } else if (collide.type == "stretchW") {
          this.cursorType = "ew-resize";
        } else if (collide.type == "stretchE") {
          this.cursorType = "ew-resize";
        } else if (collide.type == "stretchN") {
          this.cursorType = "ns-resize";
        } else if (collide.type == "stretchS") {
          this.cursorType = "ns-resize";
        } else {
          this.cursorType = "default";
        }
        this.updateCursor();
      }
    }

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

      if (this.moveType == "stretchE") {
        this.timeline[this.activeElementId].width = this.elementOrigin.w + dx;
      } else if (this.moveType == "stretchW") {
        this.timeline[this.activeElementId].width = this.elementOrigin.w - dx;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x + dx;
      } else if (this.moveType == "stretchN") {
        this.timeline[this.activeElementId].height = this.elementOrigin.h - dy;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y + dy;
      } else if (this.moveType == "stretchS") {
        this.timeline[this.activeElementId].height = this.elementOrigin.h + dy;
      }

      console.log(this.moveType);

      this.timelineState.patchTimeline(this.timeline);
    }
  }

  _handleMouseUp(e) {
    this.isMove = false;
    this.isStretch = false;
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
