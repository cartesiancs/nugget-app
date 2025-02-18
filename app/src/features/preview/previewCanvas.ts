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
import { KeyframeController } from "../../controllers/keyframe";
import { parseGIF, decompressFrames, ParsedFrame } from "gifuct-js";
import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element";
import { millisecondsToPx } from "../../utils/time";
import { glFilter } from "./glFilter";

type ImageTempType = {
  elementId: string;
  object: any;
};

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("셰이더 컴파일 에러:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

@customElement("preview-canvas")
export class PreviewCanvas extends LitElement {
  previewRatio: number;
  isMove: boolean;
  activeElementId: string;
  mouseOrigin: { x: number; y: number };
  elementOrigin: { x: number; y: number; w: number; h: number };
  moveType:
    | "none"
    | "position"
    | "rotation"
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
    | "nwse-resize"
    | "crosshair";
  isStretch: boolean;
  isEditText: boolean;
  gifTempCanvas: HTMLCanvasElement;
  gifCanvas: { frameImageData: any; tempCtx: any };
  gifFrames: { key: string; frames: ParsedFrame[] }[];
  nowShapeId: string;
  loadedVideos: any[];
  isChangeFilter: boolean;
  isRotation: boolean;
  constructor() {
    super();

    this.previewRatio = 1920 / 1920;
    this.isMove = false;
    this.isStretch = false;
    this.isEditText = false;
    this.isRotation = false;

    this.moveType = "none";
    this.cursorType = "default";

    this.activeElementId = "";
    this.mouseOrigin = { x: 0, y: 0 };
    this.elementOrigin = { x: 0, y: 0, w: 0, h: 0 };

    this.gifTempCanvas = document.createElement("canvas");

    this.gifCanvas = {
      frameImageData: null,
      tempCtx: this.gifTempCanvas.getContext("2d") as any,
    };

    this.gifFrames = [];

    this.loadedVideos = [];

    this.nowShapeId = "";

    this.isChangeFilter = true;
  }

  @query("#elementPreviewCanvasRef") canvas!: HTMLCanvasElement;

  handleClickCanvas() {
    //document.querySelector("element-control").handleClickPreview();
  }

  private keyframeControl = new KeyframeController(this);

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
  timelineControl = this.timelineState.control;

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
      this.timelineControl = state.control;

      // this.setTimelineColor();
      this.setPreviewRatio();
      this.drawCanvas(this.canvas);
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.canvasMaxHeight =
        document.querySelector("#split_col_2").clientHeight;

      this.setPreviewRatio();
      this.drawCanvas(this.canvas);
    });

    renderOptionStore.subscribe((state) => {
      this.renderOption = state.options;
      this.canvasMaxHeight =
        document.querySelector("#split_col_2").clientHeight;
      this.setPreviewRatio();
      this.drawCanvas(this.canvas);
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

  zeroIfNegative(num) {
    if (num > 0) {
      return num;
    } else {
      return 0;
    }
  }

  findNearestY(pairs, a): number | null {
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

  drawTextStroke(ctx, elementId, text, x, y, fontSize) {
    if (this.timeline[elementId].options.outline.enable) {
      ctx.font = `${
        this.timeline[elementId].options.isItalic ? "italic" : ""
      } ${
        this.timeline[elementId].options.isBold ? "bold" : ""
      } ${fontSize}px ${this.timeline[elementId].fontname}`;

      ctx.lineWidth = parseInt(this.timeline[elementId].options.outline.size);
      ctx.strokeStyle = this.timeline[elementId].options.outline.color;
      ctx.strokeText(text, x, y);
    }
  }

  drawTextBackground(ctx, elementId, x, y, w, h) {
    if (this.timeline[elementId].background.enable) {
      const backgroundPadding = 12;
      let backgroundX = x;
      let backgroundW = w;
      if (this.timeline[elementId].options.align == "left") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = this.timeline[elementId].background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = this.timeline[elementId].background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      } else if (this.timeline[elementId].options.align == "center") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x + w / 2 - wordWidth / 2 - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = this.timeline[elementId].background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundX = x + w / 2 - wordWidth / 2 - backgroundPadding;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = this.timeline[elementId].background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      } else if (this.timeline[elementId].options.align == "right") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = y;
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;

            backgroundX = x + w - wordWidth - backgroundPadding;
            backgroundW = wordWidth + backgroundPadding;

            ctx.fillStyle = this.timeline[elementId].background.color;
            ctx.fillRect(backgroundX, textY, backgroundW, h);

            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const wordWidth = ctx.measureText(line).width;
        backgroundX = x + w - wordWidth - backgroundPadding;
        backgroundW = wordWidth + backgroundPadding;

        ctx.fillStyle = this.timeline[elementId].background.color;
        ctx.fillRect(backgroundX, textY, backgroundW, h);
      }
    }
  }

  drawCanvas(canvas) {
    let index = 1;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = this.renderOption.previewSize.w;
      canvas.height = this.renderOption.previewSize.h;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = this.renderOption.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sortedTimeline = Object.fromEntries(
        Object.entries(this.timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      for (const elementId in sortedTimeline) {
        if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
          const x = this.timeline[elementId].location?.x as number;
          const y = this.timeline[elementId].location?.y as number;
          const w = this.timeline[elementId].width as number;
          const h = this.timeline[elementId].height as number;
          const rotation = this.timeline[elementId].rotation as number;

          const fileType = this.timeline[elementId].filetype;
          let additionalStartTime = 0;

          if (fileType == "text") {
            if (this.timeline[elementId].parentKey != "standalone") {
              const parentStartTime =
                this.timeline[this.timeline[elementId].parentKey].startTime;
              additionalStartTime = parentStartTime;
            }
          }

          const startTime =
            (this.timeline[elementId].startTime as number) +
            additionalStartTime;
          const duration = this.timeline[elementId].duration as number;

          const elementType = elementUtils.getElementType(fileType);

          if (elementType == "static") {
            if (
              !(
                this.timelineCursor >= startTime &&
                this.timelineCursor < startTime + duration
              )
            ) {
              continue;
            }
          } else {
            if (
              !(
                this.timelineCursor >= startTime &&
                this.timelineCursor <
                  startTime + duration / this.timeline[elementId].speed
              )
            ) {
              continue;
            }
          }

          if (fileType == "image") {
            this.drawImage(ctx, elementId, w, h, x, y);
          }

          if (fileType == "gif") {
            this.drawGif(ctx, elementId, w, h, x, y);
          }

          if (fileType == "video") {
            this.drawVideo(ctx, elementId, w, h, x, y, startTime);
          }

          if (fileType == "text") {
            this.drawText(ctx, elementId, w, h, x, y);
          }

          if (fileType == "shape") {
            this.drawShape(ctx, elementId);
          }

          if (this.activeElementId == elementId) {
            if (this.isMove) {
              const checkAlign = this.isAlign({ x: x, y: y, w: w, h: h });
              if (checkAlign) {
                this.drawAlign(ctx, checkAlign.direction);
              }
            }
          }
        }
      }
    }
  }

  drawOutline(ctx, elementId, x, y, w, h, a) {
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
      ctx.rect(x + w - padding, y + h - padding, padding * 2, padding * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.rect(x - padding, y + h - padding, padding * 2, padding * 2);
      ctx.fill();

      //draw control rotation

      ctx.beginPath();
      ctx.arc(x + w / 2, y - 50, 15, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  drawVideo(ctx, elementId, w, h, x, y, startTime) {
    const videoElement = this.timeline[elementId] as any;
    let scaleW = w;
    let scaleH = h;
    let scaleX = x;
    let scaleY = y;
    let compareW = 1;
    let compareH = 1;

    if (
      !(
        this.timelineCursor >=
          startTime + this.timeline[elementId].trim.startTime &&
        this.timelineCursor < startTime + this.timeline[elementId].trim.endTime
      )
    ) {
      if (
        this.loadedVideos.findIndex((item) => {
          return item.elementId == elementId;
        }) != -1
      ) {
        const videoIndex = this.loadedVideos.findIndex((item) => {
          return item.elementId == elementId;
        });

        const video = this.loadedVideos[videoIndex];

        video.object.muted = true;
      }

      return false;
    }

    if (
      this.loadedVideos.findIndex((item) => {
        return item.elementId == elementId;
      }) != -1
    ) {
      const videoIndex = this.loadedVideos.findIndex((item) => {
        return item.elementId == elementId;
      });

      const video = this.loadedVideos[videoIndex];
      let rotation = this.timeline[elementId].rotation * (Math.PI / 180);
      ctx.globalAlpha = videoElement.opacity / 100;

      video.object.muted = false;

      let source = video.object;

      if (
        this.timeline[elementId].filter.enable &&
        this.timeline[elementId].filter.list.length > 0
      ) {
        for (
          let index = 0;
          index < this.timeline[elementId].filter.list.length;
          index++
        ) {
          const filter = this.timeline[elementId].filter.list[index];
          if (filter.name == "chromakey") {
            source = glFilter.applyChromaKey(
              ctx,
              video,
              videoElement,
              w,
              h,
              scaleX,
              scaleY,
              scaleW,
              scaleH,
              this.isChangeFilter,
            );
          }

          if (filter.name == "blur") {
            source = glFilter.applyBlur(
              ctx,
              video,
              videoElement,
              w,
              h,
              scaleX,
              scaleY,
              scaleW,
              scaleH,
              this.isChangeFilter,
            );
          }

          if (filter.name == "radialblur") {
            source = glFilter.applyRadialBlur(
              ctx,
              video,
              videoElement,
              w,
              h,
              scaleX,
              scaleY,
              scaleW,
              scaleH,
              this.isChangeFilter,
            );
          }
        }
      }

      if (videoElement.animation["opacity"].isActivate == true) {
        let index = Math.round(this.timelineCursor / 16);
        let indexToMs = index * 20;
        let startTime = Number(this.timeline[elementId].startTime);
        let indexPoint = Math.round((indexToMs - startTime) / 20);

        try {
          if (indexPoint < 0) {
            return false;
          }

          const ax = this.findNearestY(
            videoElement.animation["opacity"].ax,
            this.timelineCursor - videoElement.startTime,
          ) as any;

          ctx.globalAlpha = this.zeroIfNegative(ax / 100);
        } catch (error) {}
      }

      if (videoElement.animation["scale"].isActivate == true) {
        const ax = this.getAnimateScale(elementId);
        if (ax != false) {
          scaleW = w * ax;
          scaleH = h * ax;
          compareW = scaleW - w;
          compareH = scaleH - h;

          scaleX = x - compareW / 2;
          scaleY = y - compareH / 2;
        }
      }

      let animationType = "position";

      if (videoElement.animation[animationType].isActivate == true) {
        if (this.isMove && this.activeElementId == elementId) {
          ctx.drawImage(video.object, x, y, w, h);
        } else {
          let index = Math.round(this.timelineCursor / 16);
          let indexToMs = index * 20;
          let startTime = Number(this.timeline[elementId].startTime);
          let indexPoint = Math.round((indexToMs - startTime) / 20);

          try {
            if (indexPoint < 0) {
              return false;
            }

            const ax = this.findNearestY(
              videoElement.animation[animationType].ax,
              this.timelineCursor - videoElement.startTime,
            ) as any;

            const ay = this.findNearestY(
              videoElement.animation[animationType].ay,
              this.timelineCursor - videoElement.startTime,
            ) as any;

            x = ax - compareW / 2;
            y = ay - compareH / 2;

            const centerX = x + scaleW / 2;
            const centerY = y + scaleH / 2;

            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);

            ctx.drawImage(source, -scaleW / 2, -scaleH / 2, scaleW, scaleH);
            this.drawOutline(
              ctx,
              elementId,
              -scaleW / 2,
              -scaleH / 2,
              scaleW,
              scaleH,
              rotation,
            );

            ctx.rotate(-rotation);
            ctx.translate(-centerX, -centerY);
            ctx.globalAlpha = 1;

            return false;
          } catch (error) {}
        }
      }

      if (this.timeline[elementId].animation["rotation"].isActivate == true) {
        const ax = this.getAnimateRotation(elementId) as any;
        if (ax != false) {
          rotation = ax.ax;
        }
      }

      const centerX = scaleX + scaleW / 2;
      const centerY = scaleY + scaleH / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      ctx.drawImage(source, -scaleW / 2, -scaleH / 2, scaleW, scaleH);
      this.drawOutline(
        ctx,
        elementId,
        -scaleW / 2,
        -scaleH / 2,
        scaleW,
        scaleH,
        rotation,
      );

      ctx.rotate(-rotation);
      ctx.translate(-centerX, -centerY);
    } else {
      const video = document.createElement("video");
      video.playbackRate = this.timeline[elementId].speed;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      this.loadedVideos.push({
        elementId: elementId,
        path: this.timeline[elementId].localpath,
        canvas: canvas,
        object: video,
        isPlay: false,
      });
      video.src = this.timeline[elementId].localpath;

      ctx.drawImage(video, x, y, w, h);

      video.addEventListener("loadeddata", () => {
        video.currentTime = 0;
        ctx.drawImage(video, x, y, w, h);
      });
    }

    ctx.globalAlpha = 1;
  }

  drawImage(ctx, elementId, w, h, x, y) {
    const imageElement = this.timeline[elementId] as any;
    let scaleW = w;
    let scaleH = h;
    let scaleX = x;
    let scaleY = y;
    let compareW = 1;
    let compareH = 1;
    let rotation = this.timeline[elementId].rotation * (Math.PI / 180);

    if (
      this.loadedObjects.findIndex((item: ImageTempType) => {
        return item.elementId == elementId;
      }) != -1
    ) {
      const img = this.loadedObjects.filter((item) => {
        return item.elementId == elementId;
      })[0];

      ctx.globalAlpha = imageElement.opacity / 100;
      if (imageElement.animation["opacity"].isActivate == true) {
        let index = Math.round(this.timelineCursor / 16);
        let indexToMs = index * 20;
        let startTime = Number(this.timeline[elementId].startTime);
        let indexPoint = Math.round((indexToMs - startTime) / 20);

        try {
          if (indexPoint < 0) {
            return false;
          }

          const ax = this.findNearestY(
            imageElement.animation["opacity"].ax,
            this.timelineCursor - imageElement.startTime,
          ) as any;

          ctx.globalAlpha = this.zeroIfNegative(ax / 100);
        } catch (error) {}
      }

      if (imageElement.animation["scale"].isActivate == true) {
        const ax = this.getAnimateScale(elementId);
        if (ax != false) {
          scaleW = w * ax;
          scaleH = h * ax;
          compareW = scaleW - w;
          compareH = scaleH - h;

          scaleX = x - compareW / 2;
          scaleY = y - compareH / 2;
        }
      }

      if (this.timeline[elementId].animation["rotation"].isActivate == true) {
        const ax = this.getAnimateRotation(elementId) as any;
        if (ax != false) {
          rotation = ax.ax;
        }
      }

      let animationType = "position";

      if (imageElement.animation[animationType].isActivate == true) {
        if (this.isMove && this.activeElementId == elementId) {
          ctx.drawImage(img.object, x, y, w, h);
        } else {
          const result = this.getAnimatePosition(elementId) as any;
          if (result != false) {
            scaleX = result.ax - compareW / 2;
            scaleY = result.ay - compareH / 2;

            const centerX = scaleX + scaleW / 2;
            const centerY = scaleY + scaleH / 2;

            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);

            ctx.drawImage(img.object, -scaleW / 2, -scaleH / 2, scaleW, scaleH);
            this.drawOutline(
              ctx,
              elementId,
              -scaleW / 2,
              -scaleH / 2,
              scaleW,
              scaleH,
              rotation,
            );

            ctx.rotate(-rotation);
            ctx.translate(-centerX, -centerY);
            ctx.globalAlpha = 1;

            return false;
          }
        }
      }

      const centerX = scaleX + scaleW / 2;
      const centerY = scaleY + scaleH / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      ctx.drawImage(img.object, -scaleW / 2, -scaleH / 2, scaleW, scaleH);
      this.drawOutline(
        ctx,
        elementId,
        -scaleW / 2,
        -scaleH / 2,
        scaleW,
        scaleH,
        rotation,
      );

      ctx.rotate(-rotation);
      ctx.translate(-centerX, -centerY);
    } else {
      let img = new Image();
      img.onload = () => {
        this.loadedObjects.push({
          elementId: elementId,
          object: img,
        });

        ctx.globalAlpha = imageElement.opacity / 100;
        ctx.drawImage(img, x, y, w, h);
        this.drawOutline(ctx, elementId, x, y, w, h, rotation);
      };
      img.src = imageElement.localpath;
    }

    ctx.globalAlpha = 1;
  }

  public preloadImage(elementId) {
    let img = new Image();

    img.onload = () => {
      if (
        this.loadedObjects.findIndex((item: ImageTempType) => {
          return item.elementId == elementId;
        }) != -1
      ) {
        const index = this.loadedObjects.findIndex((item: ImageTempType) => {
          return item.elementId == elementId;
        });

        this.loadedObjects[index].object = img;
      } else {
        this.loadedObjects.push({
          elementId: elementId,
          object: img,
        });
      }

      this.drawCanvas(this.canvas);
    };

    img.src = this.timeline[elementId].localpath;
  }

  drawGif(ctx, elementId, w, h, x, y) {
    const imageElement = this.timeline[elementId] as any;
    const rotation = this.timeline[elementId].rotation * (Math.PI / 180);

    if (
      this.gifFrames.findIndex((item) => {
        return item.key == elementId;
      }) != -1
    ) {
      const imageIndex = this.gifFrames.findIndex((item) => {
        return item.key == elementId;
      });
      ctx.globalAlpha = this.timeline[elementId].opacity / 100;

      const delay = this.gifFrames[imageIndex].frames[0].delay;

      const index =
        Math.round(this.timelineCursor / delay) %
        this.gifFrames[imageIndex].frames.length;
      const firstFrame = this.gifFrames[imageIndex].frames[index];

      let dims = firstFrame.dims;

      if (
        !this.gifCanvas.frameImageData ||
        dims.width != this.gifCanvas.frameImageData.width ||
        dims.height != this.gifCanvas.frameImageData.height
      ) {
        this.gifTempCanvas.width = dims.width;
        this.gifTempCanvas.height = dims.height;
        this.gifCanvas.frameImageData = this.gifCanvas.tempCtx.createImageData(
          dims.width,
          dims.height,
        );
      }

      this.gifCanvas.frameImageData.data.set(firstFrame.patch);

      this.gifCanvas.tempCtx.putImageData(this.gifCanvas.frameImageData, 0, 0);

      const centerX = x + w / 2;
      const centerY = y + h / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      ctx.drawImage(this.gifTempCanvas, -w / 2, -h / 2, w, h);
      this.drawOutline(ctx, elementId, -w / 2, -h / 2, w, h, rotation);

      ctx.rotate(-rotation);
      ctx.translate(-centerX, -centerY);
      ctx.globalAlpha = 1;
    } else {
      fetch(imageElement.localpath)
        .then((resp) => resp.arrayBuffer())
        .then((buff) => {
          let gif = parseGIF(buff);
          let frames = decompressFrames(gif, true);

          const firstFrame = frames[0];

          let dims = firstFrame.dims;

          if (
            !this.gifCanvas.frameImageData ||
            dims.width != this.gifCanvas.frameImageData.width ||
            dims.height != this.gifCanvas.frameImageData.height
          ) {
            this.gifTempCanvas.width = dims.width;
            this.gifTempCanvas.height = dims.height;
            this.gifCanvas.frameImageData =
              this.gifCanvas.tempCtx.createImageData(dims.width, dims.height);
          }

          this.gifCanvas.frameImageData.data.set(firstFrame.patch);

          this.gifCanvas.tempCtx.putImageData(
            this.gifCanvas.frameImageData,
            0,
            0,
          );

          ctx.drawImage(this.gifTempCanvas, x, y, w, h);

          this.gifFrames.push({
            key: elementId,
            frames: frames,
          });
        });
    }
  }

  drawText(ctx, elementId, w, h, x, y) {
    let scaleW = w;
    let scaleH = h;
    let tx = x;
    let ty = y;
    let fontSize = this.timeline[elementId].fontsize;
    let compare = 1;
    let rotation = this.timeline[elementId].rotation * (Math.PI / 180);

    try {
      if (this.isEditText) {
        return false;
      }

      ctx.globalAlpha = this.timeline[elementId].opacity / 100;

      if (this.timeline[elementId].animation["opacity"].isActivate == true) {
        let index = Math.round(this.timelineCursor / 16);
        let indexToMs = index * 20;
        let startTime = Number(this.timeline[elementId].startTime);
        let indexPoint = Math.round((indexToMs - startTime) / 20);

        try {
          if (indexPoint < 0) {
            return false;
          }

          const ax = this.findNearestY(
            this.timeline[elementId].animation["opacity"].ax,
            this.timelineCursor - this.timeline[elementId].startTime,
          ) as any;

          ctx.globalAlpha = this.zeroIfNegative(ax / 100);
        } catch (error) {}
      }

      if (this.timeline[elementId].animation["scale"].isActivate == true) {
        const ax = this.getAnimateScale(elementId);
        if (ax != false) {
          fontSize = this.timeline[elementId].fontsize * (ax / 10);
        }
      }

      ctx.fillStyle = this.timeline[elementId].textcolor as string;
      ctx.lineWidth = 0;
      ctx.letterSpacing = `${this.timeline[elementId].letterSpacing}px`;

      ctx.font = `${
        this.timeline[elementId].options.isItalic ? "italic" : ""
      } ${
        this.timeline[elementId].options.isBold ? "bold" : ""
      } ${fontSize}px ${this.timeline[elementId].fontname}`;

      let animationType = "position";

      if (
        this.timeline[elementId].animation[animationType].isActivate == true
      ) {
        let index = Math.round(this.timelineCursor / 16);
        let indexToMs = index * 20;
        let startTime = Number(this.timeline[elementId].startTime);
        let indexPoint = Math.round((indexToMs - startTime) / 20);

        try {
          if (indexPoint < 0) {
            return false;
          }

          const ax = this.findNearestY(
            this.timeline[elementId].animation[animationType].ax,
            this.timelineCursor - this.timeline[elementId].startTime,
          ) as any;

          const ay = this.findNearestY(
            this.timeline[elementId].animation[animationType].ay,
            this.timelineCursor - this.timeline[elementId].startTime,
          ) as any;

          tx = ax;
          ty = ay;
        } catch (error) {}
      }

      if (this.timeline[elementId].animation["rotation"].isActivate == true) {
        const ax = this.getAnimateRotation(elementId) as any;
        if (ax != false) {
          rotation = ax.ax;
        }
      }

      const centerX = tx + scaleW / 2;
      const centerY = ty + scaleH / 2;

      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      tx = -scaleW / 2;
      ty = -scaleH / 2;

      this.drawOutline(
        ctx,
        elementId,
        -scaleW / 2,
        -scaleH / 2,
        scaleW,
        scaleH,
        rotation,
      );

      this.drawTextBackground(ctx, elementId, tx, ty, scaleW, scaleH);

      ctx.fillStyle = this.timeline[elementId].textcolor as string;

      if (this.timeline[elementId].options.align == "left") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = ty + (this.timeline[elementId].fontsize || 0);
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            this.drawTextStroke(ctx, elementId, line, tx, textY, fontSize);
            ctx.fillText(line, tx, textY);
            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        this.drawTextStroke(ctx, elementId, line, tx, textY, fontSize);
        ctx.fillText(line, tx, textY);
      } else if (this.timeline[elementId].options.align == "center") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = ty + (this.timeline[elementId].fontsize || 0);
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;
            this.drawTextStroke(
              ctx,
              elementId,
              line,
              tx + w / 2 - wordWidth / 2,
              textY,
              fontSize,
            );
            ctx.fillText(line, tx + w / 2 - wordWidth / 2, textY);
            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const lastWordWidth = ctx.measureText(line).width;

        this.drawTextStroke(
          ctx,
          elementId,
          line,
          tx + w / 2 - lastWordWidth / 2,
          textY,
          fontSize,
        );
        ctx.fillText(line, tx + w / 2 - lastWordWidth / 2, textY);
      } else if (this.timeline[elementId].options.align == "right") {
        const textSplited = this.timeline[elementId].text.split(" ");
        let line = "";
        let textY = ty + (this.timeline[elementId].fontsize || 0);
        let lineHeight = h;

        for (let index = 0; index < textSplited.length; index++) {
          const testLine = line + textSplited[index] + " ";
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth < w) {
            line = testLine;
          } else {
            const wordWidth = ctx.measureText(line).width;
            this.drawTextStroke(
              ctx,
              elementId,
              line,
              tx + w - wordWidth,
              textY,
              fontSize,
            );
            ctx.fillText(line, tx + w - wordWidth, textY);
            line = textSplited[index] + " ";
            textY += lineHeight;
          }
        }

        const lastWordWidth = ctx.measureText(line).width;

        this.drawTextStroke(
          ctx,
          elementId,
          line,
          tx + w - lastWordWidth,
          textY,
          fontSize,
        );
        ctx.fillText(line, tx + w - lastWordWidth, textY);
      }

      ctx.rotate(-rotation);
      ctx.translate(-centerX, -centerY);

      ctx.globalAlpha = 1;
    } catch (error) {}
  }

  drawShape(ctx, elementId) {
    const target = this.timeline[elementId];

    let scaleW = target.width;
    let scaleH = target.height;
    let scaleX = target.location.x;
    let scaleY = target.location.y;
    let rotation = this.timeline[elementId].rotation * (Math.PI / 180);

    ctx.globalAlpha = target.opacity / 100;
    if (target.animation["opacity"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        if (indexPoint < 0) {
          return false;
        }

        const ax = this.findNearestY(
          target.animation["opacity"].ax,
          this.timelineCursor - target.startTime,
        ) as any;

        ctx.globalAlpha = this.zeroIfNegative(ax / 100);
      } catch (error) {}
    }

    const centerX = scaleX + scaleW / 2;
    const centerY = scaleY + scaleH / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    ctx.beginPath();

    const ratio = target.oWidth / target.width;

    for (let index = 0; index < target.shape.length; index++) {
      const element = target.shape[index];
      const x = element[0] / ratio + target.location.x;
      const y = element[1] / ratio + target.location.y;

      ctx.fillStyle = target.option.fillColor;
      if (this.nowShapeId == elementId) {
        ctx.arc(x - centerX, y - centerY, 8, 0, 5 * Math.PI);
      }

      ctx.lineTo(x - centerX, y - centerY);
    }

    ctx.closePath();

    ctx.fill();

    // this.drawOutline(ctx, elementId, scaleX, scaleY, scaleW, scaleH, rotation);

    this.drawOutline(
      ctx,
      elementId,
      -scaleW / 2,
      -scaleH / 2,
      scaleW,
      scaleH,
      rotation,
    );

    ctx.rotate(-rotation);
    ctx.translate(-centerX, -centerY);

    ctx.globalAlpha = 1;
  }

  drawKeyframePath(ctx, elementId) {
    const imageElement = this.timeline[elementId] as any;
    const fileType = this.timeline[elementId].filetype;
    const animationType = "position";
    if (fileType != "image") return false;
    if (imageElement.animation[animationType].isActivate != true) return false;

    try {
      const xa = imageElement.animation[animationType].x;
      const ya = imageElement.animation[animationType].y;
      // ctx.strokeStyle = "#403af0";
      // ctx.beginPath();

      // ctx.stroke();

      // for (let index = 0; index < xa.length; index++) {
      //   const element = xa[index];
      //   ctx.lineTo(x, );

      // }
    } catch (error) {}
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

  getAnimateScale(elementId): number | any {
    if (this.timeline[elementId].animation["scale"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        if (indexPoint < 0) {
          return false;
        }

        const ax = this.findNearestY(
          this.timeline[elementId].animation["scale"].ax,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as number;

        return ax / 10;
      } catch (error) {
        return 1;
      }
    }
  }

  getAnimatePosition(elementId) {
    if (this.timeline[elementId].animation["position"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        if (indexPoint < 0) {
          return false;
        }

        const ax = this.findNearestY(
          this.timeline[elementId].animation["position"].ax,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        const ay = this.findNearestY(
          this.timeline[elementId].animation["position"].ay,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        return {
          ax: ax,
          ay: ay,
        };
      } catch (error) {
        return false;
      }
    }
  }

  getAnimateRotation(elementId) {
    if (this.timeline[elementId].animation["rotation"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        if (indexPoint < 0) {
          return false;
        }

        const ax = this.findNearestY(
          this.timeline[elementId].animation["rotation"].ax,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        return {
          ax: ax * (Math.PI / 180),
        };
      } catch (error) {
        return false;
      }
    }
  }

  setChangeFilter() {
    this.isChangeFilter = true;
    this.drawCanvas(this.canvas);
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

  collisionCheck({ x, y, w, h, mx, my, padding, rotation = 0 }) {
    const cx = x + w / 2;
    const cy = y + h / 2;

    const dx = mx - cx;
    const dy = my - cy;

    const cos = Math.cos(rotation * (Math.PI / 180));
    const sin = Math.sin(rotation * (Math.PI / 180));
    const localMouseX = dx * cos + dy * sin + cx;
    const localMouseY = -dx * sin + dy * cos + cy;

    if (
      localMouseX > x + padding / 2 &&
      localMouseX < x + w - padding / 2 &&
      localMouseY > y + padding / 2 &&
      localMouseY < y + h - padding / 2
    ) {
      return { type: "position" };
    } else if (
      localMouseX > x + w / 2 - 25 &&
      localMouseX < x + w / 2 + 25 &&
      localMouseY > y - 75 &&
      localMouseY < y
    ) {
      return { type: "rotation" };
    } else if (
      localMouseX > x + w &&
      localMouseX < x + w + padding &&
      localMouseY > y + padding &&
      localMouseY < y + h - padding
    ) {
      return { type: "stretchE" };
    } else if (
      localMouseX > x - padding &&
      localMouseX < x &&
      localMouseY > y + padding &&
      localMouseY < y + h - padding
    ) {
      return { type: "stretchW" };
    } else if (
      localMouseX > x + padding &&
      localMouseX < x + w - padding &&
      localMouseY > y - padding &&
      localMouseY < y
    ) {
      return { type: "stretchN" };
    } else if (
      localMouseX > x + padding &&
      localMouseX < x + w - padding &&
      localMouseY > y + h &&
      localMouseY < y + h + padding
    ) {
      return { type: "stretchS" };
    } else if (
      localMouseX > x - padding &&
      localMouseX < x + padding &&
      localMouseY > y - padding &&
      localMouseY < y + padding
    ) {
      return { type: "stretchNW" };
    } else if (
      localMouseX > x - padding &&
      localMouseX < x + padding &&
      localMouseY > y + h - padding &&
      localMouseY < y + h + padding
    ) {
      return { type: "stretchSW" };
    } else if (
      localMouseX > x + w - padding &&
      localMouseX < x + w + padding &&
      localMouseY > y - padding &&
      localMouseY < y + padding
    ) {
      return { type: "stretchNE" };
    } else if (
      localMouseX > x + w - padding &&
      localMouseX < x + w + padding &&
      localMouseY > y + h - padding &&
      localMouseY < y + h + padding
    ) {
      return { type: "stretchSE" };
    } else {
      return { type: "none" };
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

  addAnimationPoint(x, y) {
    const fileType = this.timeline[this.activeElementId].filetype;
    const startTime = this.timeline[this.activeElementId].startTime;

    const animationType = "position";
    if (!["image", "video", "text"].includes(fileType)) return false;

    if (
      this.timeline[this.activeElementId].animation["position"].isActivate !=
      true
    ) {
      return false;
    }

    try {
      this.keyframeControl.addPoint({
        x: this.timelineCursor - startTime,
        y: x,
        line: 0,
        elementId: this.activeElementId,
        animationType: "position",
      });

      this.keyframeControl.addPoint({
        x: this.timelineCursor - startTime,
        y: y,
        line: 1,
        elementId: this.activeElementId,
        animationType: "position",
      });
    } catch (error) {
      console.log(error, "AAARR");
    }
  }

  public stopPlay() {
    for (let index = 0; index < this.loadedVideos.length; index++) {
      try {
        const element = this.loadedVideos[index];
        element.isPlay = false;
        element.object.pause();
        element.object.currentTime =
          (-(this.timeline[element.elementId].startTime - this.timelineCursor) *
            this.timeline[element.elementId].speed) /
          1000;

        this.drawCanvas(this.canvas);
      } catch (error) {}
    }
  }

  public startPlay() {
    for (let index = 0; index < this.loadedVideos.length; index++) {
      try {
        const element = this.loadedVideos[index];
        element.isPlay = true;
        element.object.currentTime =
          (-(this.timeline[element.elementId].startTime - this.timelineCursor) *
            this.timeline[element.elementId].speed) /
          1000;

        element.object.playbackRate = this.timeline[element.elementId].speed;
        element.object.muted = true;
        console.log(this.timeline[element.elementId].speed);

        element.object.play();
      } catch (error) {}
    }
  }

  createShape(x, y) {
    const elementId = uuidv4();

    const width = this.renderOption.previewSize.w;
    const height = this.renderOption.previewSize.h;

    this.timeline[elementId] = {
      key: elementId,
      priority: 1,
      blob: "",
      startTime: 0,
      duration: 1000,
      opacity: 100,
      location: { x: 0, y: 0 },
      trim: { startTime: 0, endTime: 1000 },
      rotation: 0,
      width: width,
      height: height,
      oWidth: width,
      oHeight: height,
      ratio: width / height,
      filetype: "shape",
      localpath: "SHAPE",
      shape: [[x, y]],
      option: {
        fillColor: "#ffffff",
      },
      animation: {
        position: {
          isActivate: false,
          x: [],
          y: [],
          ax: [[], []],
          ay: [[], []],
        },
        opacity: {
          isActivate: false,
          x: [],
          ax: [[], []],
        },
        scale: {
          isActivate: false,
          x: [],
          ax: [[], []],
        },
        rotation: {
          isActivate: false,
          x: [],
          ax: [[], []],
        },
      },
    };

    this.timelineState.patchTimeline(this.timeline);
    return elementId;
  }

  addShapePoint(x, y) {
    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    if (this.nowShapeId == "") {
      const createdElementId = this.createShape(x, y);
      this.nowShapeId = createdElementId;

      return false;
    }

    this.timeline[this.nowShapeId].shape.push([x, y]);
    this.timelineState.patchTimeline(this.timeline);
  }

  calculateRotation(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    let degrees = Math.atan2(dy, dx) * (180 / Math.PI);

    degrees -= 90;
    if (degrees < 0) degrees += 360;

    return degrees;
  }

  _handleMouseDown(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 20;
    let isMoveTemp = false;
    let isStretchTemp = false;
    let isRotationTemp = false;
    let activeElementTemp = "";
    let isClicked = false;

    const clearTempStatus = () => {
      isMoveTemp = false;
      isStretchTemp = false;
      isClicked = false;
      isRotationTemp = false;
    };

    if (this.timelineControl.cursorType == "shape") {
      this.addShapePoint(mx, my);
      return false;
    }

    this.nowShapeId = "";

    const sortedTimeline = Object.fromEntries(
      Object.entries(this.timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );

    for (const elementId in sortedTimeline) {
      if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
        const x = this.timeline[elementId].location?.x as number;
        const y = this.timeline[elementId].location?.y as number;
        const w = this.timeline[elementId].width as number;
        const h = this.timeline[elementId].height as number;
        const rotation = this.timeline[elementId].rotation as number;

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
        }

        const collide = this.collisionCheck({
          x: x,
          y: y,
          w: w,
          h: h,
          my: my,
          mx: mx,
          padding: padding,
          rotation: rotation,
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
          clearTempStatus();
          isMoveTemp = true;
          isStretchTemp = false;
          isClicked = true;
          this.showSideOption(elementId);
        } else if (collide.type == "rotation") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isRotationTemp = true;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "crosshair";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchW") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "ew-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchE") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "ew-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchN") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "ns-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchS") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "ns-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchNW") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "nwse-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchSE") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "nwse-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchNE") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "nesw-resize";
          this.showSideOption(elementId);
        } else if (collide.type == "stretchSW") {
          activeElementTemp = elementId;
          this.mouseOrigin = {
            x: mx,
            y: my,
          };
          this.elementOrigin = { x: x, y: y, w: w, h: h };
          clearTempStatus();
          isStretchTemp = true;
          isMoveTemp = false;
          isClicked = true;
          this.moveType = collide.type;
          this.cursorType = "nesw-resize";
          this.showSideOption(elementId);
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
      this.isRotation = isRotationTemp;
    }

    if (isClicked == false) {
      this.activeElementId = "";
    }

    this.drawCanvas(this.canvas);
  }

  _handleMouseMove(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 20;

    let isCollide = false;

    if (this.timelineControl.cursorType == "shape") {
      this.cursorType = "crosshair";
      this.updateCursor();
      return false;
    }

    const sortedTimeline = Object.fromEntries(
      Object.entries(this.timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );

    if (!this.isMove || !this.isStretch) {
      for (const elementId in sortedTimeline) {
        if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
          let x = this.timeline[elementId].location?.x;
          let y = this.timeline[elementId].location?.y;

          const w = this.timeline[elementId].width;
          const h = this.timeline[elementId].height;
          const fileType = this.timeline[elementId].filetype;
          const startTime = this.timeline[elementId].startTime as number;
          const duration = this.timeline[elementId].duration as number;
          const rotation = this.timeline[elementId].rotation as number;

          const animationType = "position";

          if (
            fileType == "image" &&
            this.timeline[elementId].animation[animationType].isActivate == true
          ) {
            let index = Math.round(this.timelineCursor / 16);
            let indexToMs = index * 20;
            let startTime = Number(this.timeline[elementId].startTime);
            let indexPoint = Math.round((indexToMs - startTime) / 20);

            if (indexPoint < 0) {
              return false;
            }

            x = this.findNearestY(
              this.timeline[elementId].animation[animationType].ax,
              this.timelineCursor - this.timeline[elementId].startTime,
            ) as any;

            y = this.findNearestY(
              this.timeline[elementId].animation[animationType].ay,
              this.timelineCursor - this.timeline[elementId].startTime,
            ) as any;
          }

          if (
            !(
              this.timelineCursor >= startTime &&
              this.timelineCursor < startTime + duration
            )
          ) {
            continue;
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
          }

          const collide = this.collisionCheck({
            x: x,
            y: y,
            w: w,
            h: h,
            my: my,
            mx: mx,
            padding: padding,
            rotation: rotation,
          });

          if (collide.type == "position") {
            //this.activeElementId = elementId;
            this.cursorType = "grabbing";
            isCollide = true;
          } else if (collide.type == "rotation") {
            this.cursorType = "crosshair";
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

    if (this.isRotation) {
      const dx = mx - this.mouseOrigin.x;
      const dy = my - this.mouseOrigin.y;

      const p1 = {
        x: this.elementOrigin.x + this.elementOrigin.w / 2,
        y: this.elementOrigin.y + this.elementOrigin.h / 2,
      };
      const p2 = {
        x: mx,
        y: my,
      };

      const r = this.calculateRotation(p2, p1);
      this.timeline[this.activeElementId].rotation = r;
    }

    if (this.isStretch) {
      const minSize = 10;
      const dx = mx - this.mouseOrigin.x;
      const dy = my - this.mouseOrigin.y;

      const rotation = this.timeline[this.activeElementId].rotation || 0;
      const cosTheta = Math.cos(rotation);
      const sinTheta = Math.sin(rotation);
      const localDx = dx * cosTheta + dy * sinTheta;
      const localDy = -dx * sinTheta + dy * cosTheta;

      const location = this.timeline[this.activeElementId].location;
      const filetype = this.timeline[this.activeElementId].filetype;

      const moveE = () => {
        if (this.elementOrigin.w + localDx <= minSize) return false;
        const width = this.elementOrigin.w + localDx;
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
        if (this.elementOrigin.w - localDx <= minSize) return false;
        const width = this.elementOrigin.w - localDx;
        const ratio = this.timeline[this.activeElementId].ratio;

        this.timeline[this.activeElementId].width = width;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x + localDx;

        if (filetype == "text") {
          return false;
        }
        this.timeline[this.activeElementId].height = width / ratio;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y - (width / ratio - this.elementOrigin.h) / 2;
      };

      const moveN = () => {
        if (this.elementOrigin.h - localDy <= minSize) return false;
        const height = this.elementOrigin.h - localDy;
        const ratio = this.timeline[this.activeElementId].ratio;

        this.timeline[this.activeElementId].height = height;
        this.timeline[this.activeElementId].location.y =
          this.elementOrigin.y + localDy;

        if (filetype == "text") {
          return false;
        }
        this.timeline[this.activeElementId].width = height * ratio;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x - (height * ratio - this.elementOrigin.w) / 2;
      };

      const moveS = () => {
        if (this.elementOrigin.h + localDy <= minSize) return false;
        const height = this.elementOrigin.h + localDy;
        const ratio = this.timeline[this.activeElementId].ratio;
        this.timeline[this.activeElementId].height = height;

        if (filetype == "text") {
          return false;
        }
        this.timeline[this.activeElementId].width = height * ratio;
        this.timeline[this.activeElementId].location.x =
          this.elementOrigin.x - (height * ratio - this.elementOrigin.w) / 2;
      };

      const moveNW = () => {
        if (filetype == "text") {
          moveN();
          moveW();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: 1,
            a1: this.elementOrigin.x,
            b1: this.elementOrigin.y,
            a2: this.elementOrigin.x + localDx,
            b2: this.elementOrigin.y + localDy,
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
      };

      const moveSW = () => {
        if (filetype == "text") {
          moveS();
          moveW();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: -1,
            a1: this.elementOrigin.x,
            b1: this.elementOrigin.h,
            a2: this.elementOrigin.x + localDx,
            b2: this.elementOrigin.h + localDy,
          });

          this.timeline[this.activeElementId].height = intr.y;
          this.timeline[this.activeElementId].width = intr.y * ratio;
          this.timeline[this.activeElementId].location.x =
            this.elementOrigin.x - (intr.y * ratio - this.elementOrigin.w);
        }
      };

      const moveSE = () => {
        if (filetype == "text") {
          moveS();
          moveE();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: 1,
            a1: this.elementOrigin.w,
            b1: this.elementOrigin.h,
            a2: this.elementOrigin.w + localDx,
            b2: this.elementOrigin.h + localDy,
          });

          this.timeline[this.activeElementId].height = intr.y;
          this.timeline[this.activeElementId].width = intr.y * ratio;
        }
      };

      const moveNE = () => {
        if (filetype == "text") {
          moveN();
          moveE();
        } else {
          const ratio = this.timeline[this.activeElementId].ratio;
          const intr = this.getIntersection({
            m: -1,
            a1: this.elementOrigin.w,
            b1: this.elementOrigin.y,
            a2: this.elementOrigin.w + localDx,
            b2: this.elementOrigin.y + localDy,
          });

          this.timeline[this.activeElementId].width = intr.x;
          this.timeline[this.activeElementId].height = intr.x / ratio;
          this.timeline[this.activeElementId].location.y =
            this.elementOrigin.y - (intr.x / ratio - this.elementOrigin.h);
        }
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
        moveNW();
      } else if (this.moveType == "stretchSW") {
        moveSW();
      } else if (this.moveType == "stretchSE") {
        moveSE();
      } else if (this.moveType == "stretchNE") {
        moveNE();
      }

      this.timelineState.patchTimeline(this.timeline);
    }
  }

  _handleMouseUp(e) {
    try {
      this.addAnimationPoint(
        this.timeline[this.activeElementId].location.x,
        this.timeline[this.activeElementId].location.y,
      );
      this.isMove = false;
      this.isStretch = false;
      this.isRotation = false;

      this.drawCanvas(this.canvas);
    } catch (error) {}
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
        const rotation = this.timeline[elementId].rotation as number;
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
          rotation: rotation,
        });

        if (collide.type == "position") {
          this.activeElementId = elementId;

          this.elementOrigin = { x: x, y: y, w: w, h: h };
          this.isEditText = true;
          this.drawCanvas(this.canvas);
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
