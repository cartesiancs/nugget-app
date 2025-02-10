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
            this.drawOutline(ctx, elementId, x, y, w, h, rotation);
          }

          if (fileType == "video") {
            this.drawVideo(ctx, elementId, w, h, x, y, startTime);
            this.drawOutline(ctx, elementId, x, y, w, h, rotation);
          }

          if (fileType == "text") {
            this.drawText(ctx, elementId, w, h, x, y);
            this.drawOutline(ctx, elementId, x, y, w, h, rotation);
          }

          if (fileType == "shape") {
            this.drawShape(elementId);
            this.drawOutline(ctx, elementId, x, y, w, h, rotation);
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
    let compare = 1;
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
            source = this.applyChromaKey(
              ctx,
              video,
              videoElement,
              w,
              h,
              scaleX,
              scaleY,
              scaleW,
              scaleH,
            );
          }

          if (filter.name == "blur") {
            source = this.applyBlur(
              ctx,
              video,
              videoElement,
              w,
              h,
              scaleX,
              scaleY,
              scaleW,
              scaleH,
            );
          }

          if (filter.name == "radialblur") {
            source = this.applyRadialBlur(
              ctx,
              video,
              videoElement,
              w,
              h,
              scaleX,
              scaleY,
              scaleW,
              scaleH,
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
        let index = Math.round(this.timelineCursor / 16);
        let indexToMs = index * 20;
        let startTime = Number(this.timeline[elementId].startTime);
        let indexPoint = Math.round((indexToMs - startTime) / 20);

        try {
          if (indexPoint < 0) {
            return false;
          }

          const ax = this.findNearestY(
            videoElement.animation["scale"].ax,
            this.timelineCursor - videoElement.startTime,
          ) as any;

          scaleW = w * ax;
          scaleH = h * ax;
          compare = scaleW - w;

          scaleX = x - compare / 2;
          scaleY = y - compare / 2;
        } catch (error) {}
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

            ctx.drawImage(
              source,
              ax - compare / 2,
              ay - compare / 2,
              scaleW,
              scaleH,
            );

            return false;
          } catch (error) {}
        }
      }

      ctx.drawImage(source, scaleX, scaleY, scaleW, scaleH);
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
    let compare = 1;
    const rotation = this.timeline[elementId].rotation * (Math.PI / 180);

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
          compare = scaleW - w;

          scaleX = x - compare / 2;
          scaleY = y - compare / 2;
        }
      }

      let animationType = "position";

      if (imageElement.animation[animationType].isActivate == true) {
        if (this.isMove && this.activeElementId == elementId) {
          ctx.drawImage(img.object, x, y, w, h);
        } else {
          const result = this.getAnimatePosition(elementId) as any;
          if (result != false) {
            ctx.drawImage(
              img.object,
              result.ax - compare / 2,
              result.ay - compare / 2,
              scaleW,
              scaleH,
            );
            this.drawOutline(
              ctx,
              elementId,
              result.ax - compare / 2,
              result.ay - compare / 2,
              scaleW,
              scaleH,
              rotation,
            );

            return false;
          }
        }
      }

      const centerX = x + scaleW / 2;
      const centerY = y + scaleH / 2;

      ctx.translate(centerX, centerY); // 중심 이동
      ctx.rotate(rotation); // 회전 적용

      // 원래 위치를 유지하기 위해 중심 기준으로 이동
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

      ctx.rotate(-rotation); // 회전 적용
      ctx.translate(-centerX, -centerY); // 중심 이동
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

  drawGif(ctx, elementId, w, h, x, y) {
    const imageElement = this.timeline[elementId] as any;

    if (
      this.gifFrames.findIndex((item) => {
        return item.key == elementId;
      }) != -1
    ) {
      const imageIndex = this.gifFrames.findIndex((item) => {
        return item.key == elementId;
      });
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

      ctx.drawImage(this.gifTempCanvas, x, y, w, h);
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

    try {
      if (this.isEditText) {
        return false;
      }

      ctx.globalAlpha = 1;

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
          ) as any;

          // scaleW = w * ax;
          // scaleH = h * ax;
          // compare = scaleW - w;

          // tx = x - compare / 2;
          // ty = y - compare / 2;

          fontSize = this.timeline[elementId].fontsize * (ax / 10);
        } catch (error) {}
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

      ctx.globalAlpha = 1;
    } catch (error) {}
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

  getAnimateScale(elementId) {
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
        ) as any;

        return ax;
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

  applyChromaKey(
    ctx,
    video,
    videoElement,
    w,
    h,
    scaleX,
    scaleY,
    scaleW,
    scaleH,
  ) {
    if (!video.glCanvas || this.isChangeFilter) {
      video.glCanvas = document.createElement("canvas");
      video.glCanvas.width = w;
      video.glCanvas.height = h;
      video.gl = video.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        alpha: true,
      });
      if (!video.gl) {
        console.error("WebGL을 지원하지 않습니다.");
        ctx.drawImage(video.object, scaleX, scaleY, scaleW, scaleH);
        return;
      }
      const gl = video.gl;

      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;
      const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_video;
        uniform vec3 u_keyColor;
        uniform float u_threshold;
        varying vec2 v_texCoord;
        void main() {
          vec4 color = texture2D(u_video, v_texCoord);
          float diff = distance(color.rgb, u_keyColor);
          if(diff < u_threshold) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else {
            gl_FragColor = color;
          }
        }
      `;

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("R:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      video.glProgram = program;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(a_texCoord);
      gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

      const videoTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      video.glTexture = videoTexture;

      const u_keyColor = gl.getUniformLocation(program, "u_keyColor");
      const u_threshold = gl.getUniformLocation(program, "u_threshold");
      let keyColor = [0.0, 1.0, 0.0]; // Green
      if (videoElement.filter.list && videoElement.filter.list.length > 0) {
        const targetRgb = videoElement.filter.list[0].value;
        const parsedRgb = this.parseRGBString(targetRgb);
        keyColor = [parsedRgb.r / 255, parsedRgb.g / 255, parsedRgb.b / 255];
      }

      console.log(keyColor);
      gl.uniform3fv(u_keyColor, keyColor);
      gl.uniform1f(u_threshold, 0.5);

      const u_video = gl.getUniformLocation(program, "u_video");
      gl.uniform1i(u_video, 0);

      this.isChangeFilter = false;
    }

    const gl = video.gl;
    const glCanvas = video.glCanvas;
    gl.bindTexture(gl.TEXTURE_2D, video.glTexture);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video.object,
      );
    } catch (e) {}
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return glCanvas;
  }

  applyBlur(ctx, video, videoElement, w, h, scaleX, scaleY, scaleW, scaleH) {
    if (!video.glCanvas || this.isChangeFilter) {
      video.glCanvas = document.createElement("canvas");
      video.glCanvas.width = w;
      video.glCanvas.height = h;
      video.gl = video.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        alpha: true,
      });
      if (!video.gl) {
        console.error("WebGL을 지원하지 않습니다.");
        ctx.drawImage(video.object, scaleX, scaleY, scaleW, scaleH);
        return;
      }
      const gl = video.gl;

      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        uniform sampler2D u_video;
        uniform vec2 u_texelSize; 
        uniform float u_blurFactor; 
        varying vec2 v_texCoord;
        void main() {
          vec4 sum = vec4(0.0);
          for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
              vec2 offset = vec2(float(i), float(j)) * u_texelSize * u_blurFactor;
              sum += texture2D(u_video, v_texCoord + offset);
            }
          }
          gl_FragColor = sum / 9.0;
        }
      `;

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("셰이더 링크 에러:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      video.glProgram = program;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(a_texCoord);
      gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

      const videoTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      video.glTexture = videoTexture;

      const u_texelSize = gl.getUniformLocation(program, "u_texelSize");
      gl.uniform2fv(u_texelSize, [1.0 / w, 1.0 / h]);

      const blurFactor = this.parseBlurString(
        videoElement.filter.list[0].value,
      );
      const u_blurFactor = gl.getUniformLocation(program, "u_blurFactor");
      gl.uniform1f(u_blurFactor, blurFactor.f);

      const u_video = gl.getUniformLocation(program, "u_video");
      gl.uniform1i(u_video, 0);

      this.isChangeFilter = false;
    }

    const gl = video.gl;
    const glCanvas = video.glCanvas;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, video.glTexture);
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video.object,
      );
    } catch (e) {
      console.error("텍스처 업데이트 오류:", e);
    }
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return glCanvas;
  }

  applyRadialBlur(
    ctx,
    video,
    videoElement,
    w,
    h,
    scaleX,
    scaleY,
    scaleW,
    scaleH,
  ) {
    if (!video.glCanvas || this.isChangeFilter) {
      video.glCanvas = document.createElement("canvas");
      video.glCanvas.width = w;
      video.glCanvas.height = h;
      video.gl = video.glCanvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        alpha: true,
      });
      if (!video.gl) {
        ctx.drawImage(video.object, scaleX, scaleY, scaleW, scaleH);
        return;
      }
      const gl = video.gl;

      const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

      const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_video;
      uniform float u_power;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;
      
      const int samples = 66;
      
      // 2D 회전 행렬 생성 함수
      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }
      
      // texture2D 호출을 감싸는 함수
      vec4 sample(vec2 uv) {
        return texture2D(u_video, uv);
      }
      
      // 2번 코드의 frag 함수 (u_power 값에 따라 효과 강도 조절)
      vec4 frag(vec2 uv) {
        float rotateDir = sin(length(uv - u_mouse) / (0.005 + u_power * 5.0));
        rotateDir = smoothstep(-0.3, 0.3, rotateDir) - 0.5;
        vec2 shiftDir = (uv - u_mouse) * vec2(-1.0, -1.0);
        vec4 color = vec4(0.0);
        for (int i = 0; i < samples; i++) {
          uv += float(i) / float(samples) * shiftDir * 0.01;
          uv -= u_mouse;
          uv *= rotate2d(rotateDir * u_power * float(i));
          uv += u_mouse;
          color += sample(uv) / float(samples + i);
        }
        return color * 1.5;
      }
      
      void main() {
        gl_FragColor = frag(v_texCoord);
      }
    `;

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource,
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource,
      );
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("셰이더 링크 에러:", gl.getProgramInfoLog(program));
        return;
      }
      gl.useProgram(program);
      video.glProgram = program;

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const a_position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      const texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const a_texCoord = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(a_texCoord);
      gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

      const videoTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, videoTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      video.glTexture = videoTexture;

      const u_video = gl.getUniformLocation(program, "u_video");
      gl.uniform1i(u_video, 0);

      const blurFactor = this.parseBlurString(
        videoElement.filter.list[0].value,
      );
      const u_power = gl.getUniformLocation(program, "u_power");
      gl.uniform1f(u_power, blurFactor.f);

      const u_mouse = gl.getUniformLocation(program, "u_mouse");
      gl.uniform2fv(u_mouse, [0.5, 0.5]);
    }

    const gl = video.gl;
    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video.object,
      );
    } catch (e) {
      console.error("텍스처 업데이트 오류:", e);
    }
    gl.viewport(0, 0, video.glCanvas.width, video.glCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return video.glCanvas;
  }

  setChangeFilter() {
    this.isChangeFilter = true;
    this.drawCanvas(this.canvas);
  }

  parseRGBString(str) {
    const parts = str.split(":");

    let r = 0,
      g = 0,
      b = 0;

    parts.forEach((item) => {
      const [key, value] = item.split("=");
      const numValue = parseInt(value, 10);

      switch (key) {
        case "r":
          r = numValue;
          break;
        case "g":
          g = numValue;
          break;
        case "b":
          b = numValue;
          break;
        default:
          break;
      }
    });

    return { r, g, b };
  }

  parseBlurString(str) {
    const parts = str.split(":");

    let f = 0;

    parts.forEach((item) => {
      const [key, value] = item.split("=");
      const numValue = parseInt(value, 10);

      switch (key) {
        case "f":
          f = numValue;
          break;
        default:
          break;
      }
    });

    return { f };
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

  drawShape(elementId) {
    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

    const target = this.timeline[elementId];

    ctx.beginPath();

    const ratio = target.oWidth / target.width;

    for (let index = 0; index < target.shape.length; index++) {
      const element = target.shape[index];
      const x = element[0] / ratio + target.location.x;
      const y = element[1] / ratio + target.location.y;

      ctx.fillStyle = target.option.fillColor;
      if (this.nowShapeId == elementId) {
        ctx.arc(x, y, 8, 0, 5 * Math.PI);
      }

      ctx.lineTo(x, y);
    }

    ctx.closePath();

    ctx.fill();
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

      console.log(mx, my);

      const r = this.calculateRotation(p2, p1);
      this.timeline[this.activeElementId].rotation = r;
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
