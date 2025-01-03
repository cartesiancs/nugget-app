import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { keyframeStore } from "../../states/keyframeStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import {
  IRenderOptionStore,
  renderOptionStore,
} from "../../states/renderOptionStore";
import { ImageElementType } from "../../@types/timeline";

type ImageTempType = {
  elementId: string;
  object: any;
};

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
  timeline: any = this.timelineState.timeline;

  @property()
  timelineRange = this.timelineState.range;

  @property()
  timelineScroll = this.timelineState.scroll;

  @property()
  timelineCursor = this.timelineState.cursor;

  @property()
  loadedObjects: ImageTempType[] = [];

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
      this.drawCanvas();
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

  findNearestY(pairs, a) {
    let closestY = null;
    let closestDiff = Infinity;

    for (const [x, y] of pairs) {
      const diff = Math.abs(x - a);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestY = y;
      }
    }

    return closestY;
  }

  drawCanvas() {
    let index = 1;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;

      this.canvas.width = this.renderOption.previewSize.w;
      this.canvas.height = this.renderOption.previewSize.h;

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          const x = this.timeline[elementId].location?.x as number;
          const y = this.timeline[elementId].location?.y as number;
          const w = this.timeline[elementId].width as number;
          const h = this.timeline[elementId].height as number;
          const fileType = this.timeline[elementId].filetype;
          const startTime = this.timeline[elementId].startTime as number;
          const duration = this.timeline[elementId].duration as number;

          if (
            !(
              this.timelineCursor >= startTime &&
              this.timelineCursor < startTime + duration
            )
          ) {
            continue;
          }

          if (fileType == "image") {
            const imageElement = this.timeline[elementId] as any;

            if (
              this.loadedObjects.findIndex((item: ImageTempType) => {
                return item.elementId == elementId;
              }) != -1
            ) {
              const img = this.loadedObjects.filter((item) => {
                return item.elementId == elementId;
              })[0];

              ctx.globalAlpha = imageElement.opacity / 100;
              let animationType = "position";

              if (imageElement.animation[animationType].isActivate == true) {
                let index = Math.round(this.timelineCursor / 16);
                let indexToMs = index * 20;
                let startTime = Number(this.timeline[elementId].startTime);
                let indexPoint = Math.round((indexToMs - startTime) / 20);

                try {
                  if (indexPoint < 0) {
                    return 0;
                  }

                  const ax = this.findNearestY(
                    imageElement.animation[animationType].ax,
                    this.timelineCursor - imageElement.startTime,
                  ) as any;

                  const ay: any = this.findNearestY(
                    imageElement.animation[animationType].ay,
                    this.timelineCursor - imageElement.startTime,
                  ) as any;

                  ctx.drawImage(img.object, ax, ay, w, h);

                  continue;
                } catch (error) {}
              }
              ctx.drawImage(img.object, x, y, w, h);
            } else {
              let img = new Image();
              img.onload = () => {
                this.loadedObjects.push({
                  elementId: elementId,
                  object: img,
                });

                ctx.globalAlpha = imageElement.opacity / 100;
                ctx.drawImage(img, x, y, w, h);
              };
              img.src = imageElement.localpath;
            }
          }

          if (fileType == "video") {
            if (
              !(
                this.timelineCursor >=
                  startTime + this.timeline[elementId].trim.startTime &&
                this.timelineCursor <
                  startTime + this.timeline[elementId].trim.endTime
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

              ctx.fillStyle = this.timeline[elementId].textcolor as string;
              ctx.lineWidth = 0;
              ctx.font = `${this.timeline[elementId].fontsize}px ${this.timeline[elementId].fontname}`;
              ctx.fillText(
                this.timeline[elementId].text as string,
                x,
                y + (this.timeline[elementId].fontsize || 0),
              );
            } catch (error) {}
          }

          if (this.activeElementId == elementId) {
            if (this.isMove) {
              const checkAlign = this.isAlign({ x: x, y: y, w: w, h: h });
              if (checkAlign) {
                this.drawAlign(ctx, checkAlign.direction);
              }
            }

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

  drawAlign(ctx, direction) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    if (direction.includes("top")) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.renderOption.previewSize.w, 0);
      ctx.stroke();
    }

    if (direction.includes("left")) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, this.renderOption.previewSize.h);
      ctx.stroke();
    }

    if (direction.includes("right")) {
      ctx.beginPath();
      ctx.moveTo(this.renderOption.previewSize.w, 0);
      ctx.lineTo(
        this.renderOption.previewSize.w,
        this.renderOption.previewSize.h,
      );
      ctx.stroke();
    }

    if (direction.includes("bottom")) {
      ctx.beginPath();
      ctx.moveTo(0, this.renderOption.previewSize.h);
      ctx.lineTo(
        this.renderOption.previewSize.w,
        this.renderOption.previewSize.h,
      );
      ctx.stroke();
    }

    if (direction.includes("horizontal")) {
      ctx.beginPath();
      ctx.moveTo(0, this.renderOption.previewSize.h / 2);
      ctx.lineTo(
        this.renderOption.previewSize.w,
        this.renderOption.previewSize.h / 2,
      );
      ctx.stroke();
    }
    if (direction.includes("vertical")) {
      ctx.beginPath();
      ctx.moveTo(this.renderOption.previewSize.w / 2, 0);
      ctx.lineTo(
        this.renderOption.previewSize.w / 2,
        this.renderOption.previewSize.h,
      );
      ctx.stroke();
    }
  }

  isAlign({ x, y, w, h }) {
    const padding = 20;
    let isChange = false;
    let direction: string[] = [];
    let nx = x;
    let ny = y;

    const cw = this.renderOption.previewSize.w;
    const ch = this.renderOption.previewSize.h;

    // top
    if (y < 0 + padding && y > 0 - padding) {
      ny = 0;
      direction.push("top");
      isChange = true;
    }

    if (x < 0 + padding && x > 0 - padding) {
      nx = 0;
      direction.push("left");
      isChange = true;
    }

    if (x + w < cw + padding && x + w > cw - padding) {
      nx = cw - w;
      direction.push("right");
      isChange = true;
    }

    if (y + h < ch + padding && y + h > ch - padding) {
      ny = ch - h;
      direction.push("bottom");
      isChange = true;
    }

    if (x + w / 2 < cw / 2 + padding && x + w / 2 > cw / 2 - padding) {
      nx = cw / 2 - w / 2;
      direction.push("vertical");
      isChange = true;
    }

    if (y + h / 2 < ch / 2 + padding && y + h / 2 > ch / 2 - padding) {
      ny = ch / 2 - h / 2;
      direction.push("horizontal");
      isChange = true;
    }

    if (isChange) {
      return {
        x: nx,
        y: ny,
        direction: direction,
      };
    } else {
      return undefined;
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

  getVectorMagnitude(x, y) {
    const magnitude = Math.sqrt(x * x + y * y);
    return x < 0 || y < 0 ? -magnitude : magnitude;
  }

  getIntersection({ m, a1, b1, a2, b2 }) {
    const m1 = m;
    const m2 = -m;
    const rx = (m1 * a1 - m2 * a2 + b2 - b1) / (m1 - m2);
    const ry = m1 * (rx - a1) + b1;

    return {
      x: rx,
      y: ry,
    };
  }

  _handleMouseDown(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 40;
    let isMoveTemp = false;
    let isStretchTemp = false;
    let activeElementTemp = "";

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const x = this.timeline[elementId].location?.x as number;
        const y = this.timeline[elementId].location?.y as number;
        const w = this.timeline[elementId].width as number;
        const h = this.timeline[elementId].height as number;
        const fileType = this.timeline[elementId].filetype;
        const startTime = this.timeline[elementId].startTime as number;
        const duration = this.timeline[elementId].duration as number;

        if (
          !(
            this.timelineCursor >= startTime &&
            this.timelineCursor < startTime + duration
          )
        ) {
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
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.moveType = "position";
          this.cursorType = "grabbing";
          isMoveTemp = true;
          isStretchTemp = false;
          this.showSideOption(elementId);
        } else if (collide.type == "stretchW") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "ew-resize";
        } else if (collide.type == "stretchE") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "ew-resize";
        } else if (collide.type == "stretchN") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "ns-resize";
        } else if (collide.type == "stretchS") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "ns-resize";
        } else if (collide.type == "stretchNW") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "nwse-resize";
        } else if (collide.type == "stretchSE") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "nwse-resize";
        } else if (collide.type == "stretchNE") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "nesw-resize";
        } else if (collide.type == "stretchSW") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          isStretchTemp = true;
          isMoveTemp = false;
          this.moveType = collide.type;
          this.cursorType = "nesw-resize";
        } else {
          this.isEditText = false;
          this.cursorType = "default";
        }
        this.updateCursor();
      }
    }

    if (activeElementTemp != "") {
      this.activeElementId = activeElementTemp;
      this.isMove = isMoveTemp;
      this.isStretch = isStretchTemp;
    }
  }

  _handleMouseMove(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 40;

    let isCollide = false;

    if (!this.isMove || !this.isStretch) {
      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          const x = this.timeline[elementId].location?.x;
          const y = this.timeline[elementId].location?.y;
          const w = this.timeline[elementId].width;
          const h = this.timeline[elementId].height;
          const fileType = this.timeline[elementId].filetype;
          const startTime = this.timeline[elementId].startTime as number;
          const duration = this.timeline[elementId].duration as number;

          if (
            !(
              this.timelineCursor >= startTime &&
              this.timelineCursor < startTime + duration
            )
          ) {
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
            //this.activeElementId = elementId;
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
    }

    if (!isCollide) {
      this.cursorType = "default";
    }
    this.updateCursor();

    if (this.isMove) {
      const dx = mx - this.mouseOrigin.x;
      const dy = my - this.mouseOrigin.y;
      const location = this.timeline[this.activeElementId].location as { x; y };
      location.x = this.elementOrigin.x + dx;
      location.y = this.elementOrigin.y + dy;

      const alignLocation = this.isAlign({
        x: this.elementOrigin.x + dx,
        y: this.elementOrigin.y + dy,
        w: this.elementOrigin.w,
        h: this.elementOrigin.h,
      });

      if (alignLocation) {
        location.x = alignLocation?.x;
        location.y = alignLocation?.y;
      }

      this.timelineState.patchTimeline(this.timeline);
    }

    if (this.isStretch) {
      const minSize = 10;
      const dx = mx - this.mouseOrigin.x;
      const dy = my - this.mouseOrigin.y;
      const location = this.timeline[this.activeElementId].location as { x; y };
      const filetype = this.timeline[this.activeElementId].filetype;

      const moveE = () => {
        if (this.elementOrigin.w + dx <= minSize) return false;
        const width = this.elementOrigin.w + dx;
        const ratio = this.timeline[this.activeElementId].ratio;
        this.timeline[this.activeElementId].width = width;

        if (filetype == "text") {
          return false;
        }

        this.timeline[this.activeElementId].height = width / ratio;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y - (width / ratio - this.elementOrigin.h) / 2;
      };

      const moveW = () => {
        if (this.elementOrigin.w - dx <= minSize) return false;
        const width = this.elementOrigin.w - dx;
        const ratio = this.timeline[this.activeElementId].ratio;

        this.timeline[this.activeElementId].width = this.elementOrigin.w - dx;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x + dx;

        if (filetype == "text") {
          return false;
        }

        this.timeline[this.activeElementId].height = width / ratio;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y - (width / ratio - this.elementOrigin.h) / 2;
      };

      const moveN = () => {
        if (this.elementOrigin.h - dy <= minSize) return false;
        const height = this.elementOrigin.h - dy;
        const ratio = this.timeline[this.activeElementId].ratio;

        this.timeline[this.activeElementId].height = height;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y + dy;

        if (filetype == "text") {
          return false;
        }

        this.timeline[this.activeElementId].width = height * ratio;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x - (height * ratio - this.elementOrigin.w) / 2;
      };

      const moveS = () => {
        if (this.elementOrigin.h + dy <= minSize) return false;
        const height = this.elementOrigin.h + dy;
        const ratio = this.timeline[this.activeElementId].ratio;
        this.timeline[this.activeElementId].height = height;

        if (filetype == "text") {
          return false;
        }

        this.timeline[this.activeElementId].width = height * ratio;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x - (height * ratio - this.elementOrigin.w) / 2;
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
        if (filetype == "text") {
          moveN();
          moveW();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: 1,
            a1: this.elementOrigin.x,
            b1: this.elementOrigin.y,
            a2: this.elementOrigin.x + dx,
            b2: this.elementOrigin.y + dy,
          });

          this.timeline[this.activeElementId].width =
            this.elementOrigin.w + (this.elementOrigin.x - intr.x);
          this.timeline[this.activeElementId].height =
            (this.elementOrigin.w + (this.elementOrigin.x - intr.x)) / ratio;
          this.timeline[this.activeElementId].location.y =
            this.elementOrigin.y +
            (this.elementOrigin.h - this.timeline[this.activeElementId].height);

          this.timeline[this.activeElementId].location.x = intr.x;
        }
      } else if (this.moveType == "stretchSW") {
        if (filetype == "text") {
          moveS();
          moveW();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: -1,
            a1: this.elementOrigin.x,
            b1: this.elementOrigin.h,
            a2: this.elementOrigin.x + dx,
            b2: this.elementOrigin.h + dy,
          });

          this.timeline[this.activeElementId].height = intr.y;
          this.timeline[this.activeElementId].width = intr.y * ratio;

          this.timeline[this.activeElementId].location.x =
            this.elementOrigin.x - (intr.y * ratio - this.elementOrigin.w);
        }
      } else if (this.moveType == "stretchSE") {
        if (filetype == "text") {
          moveS();
          moveE();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: 1,
            a1: this.elementOrigin.w,
            b1: this.elementOrigin.h,
            a2: this.elementOrigin.w + dx,
            b2: this.elementOrigin.h + dy,
          });

          this.timeline[this.activeElementId].height = intr.y;
          this.timeline[this.activeElementId].width = intr.y * ratio;
        }
      } else if (this.moveType == "stretchNE") {
        if (filetype == "text") {
          moveN();
          moveE();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: -1,
            a1: this.elementOrigin.w,
            b1: this.elementOrigin.y,
            a2: this.elementOrigin.w + dx,
            b2: this.elementOrigin.y + dy,
          });

          this.timeline[this.activeElementId].width = intr.x;
          this.timeline[this.activeElementId].height = intr.x / ratio;
          this.timeline[this.activeElementId].location.y =
            this.elementOrigin.y - (intr.x / ratio - this.elementOrigin.h);
        }
      }

      this.timelineState.patchTimeline(this.timeline);
    }
  }

  _handleMouseUp(e) {
    this.isMove = false;
    this.isStretch = false;
    this.drawCanvas();
  }

  _handleDblClick(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 40;

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const x = this.timeline[elementId].location?.x as number;
        const y = this.timeline[elementId].location?.y as number;
        const w = this.timeline[elementId].width as number;
        const h = this.timeline[elementId].height as number;
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
    this.style.margin = "10px";
    return html` <canvas
      id="elementPreviewCanvasRef"
      class="preview"
      style="width: 100%; max-height: calc(${this
        .canvasMaxHeight}px - 40px); cursor: ${this.cursorType};"
      width="1920"
      height="1080"
      onclick="${this.handleClickCanvas()}"
      @mousedown=${this._handleMouseDown}
      @mousemove=${this._handleMouseMove}
      @mouseup=${this._handleMouseUp}
    ></canvas>`;
  }
}
