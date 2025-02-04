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

    this.gifTempCanvas = document.createElement("canvas");

    this.gifCanvas = {
      frameImageData: null,
      tempCtx: this.gifTempCanvas.getContext("2d") as any,
    };

    this.gifFrames = [];

    this.loadedVideos = [];

    this.nowShapeId = "";
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

  drawTextStroke(ctx, elementId, text, x, y) {
    if (this.timeline[elementId].options.outline.enable) {
      ctx.font = `${
        this.timeline[elementId].options.isItalic ? "italic" : ""
      } ${this.timeline[elementId].options.isBold ? "bold" : ""} ${
        this.timeline[elementId].fontsize
      }px ${this.timeline[elementId].fontname}`;

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
            const imageElement = this.timeline[elementId] as any;
            let scaleW = w;
            let scaleH = h;
            let scaleX = x;
            let scaleY = y;
            let compare = 1;

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

                  ctx.globalAlpha = ax / 100;
                } catch (error) {}
              }

              if (imageElement.animation["scale"].isActivate == true) {
                let index = Math.round(this.timelineCursor / 16);
                let indexToMs = index * 20;
                let startTime = Number(this.timeline[elementId].startTime);
                let indexPoint = Math.round((indexToMs - startTime) / 20);

                try {
                  if (indexPoint < 0) {
                    return false;
                  }

                  const ax = this.findNearestY(
                    imageElement.animation["scale"].ax,
                    this.timelineCursor - imageElement.startTime,
                  ) as any;

                  scaleW = w * ax;
                  scaleH = h * ax;
                  compare = scaleW - w;

                  scaleX = x - compare / 2;
                  scaleY = y - compare / 2;
                } catch (error) {}
              }

              let animationType = "position";

              if (imageElement.animation[animationType].isActivate == true) {
                if (this.isMove && this.activeElementId == elementId) {
                  ctx.drawImage(img.object, x, y, w, h);
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
                      imageElement.animation[animationType].ax,
                      this.timelineCursor - imageElement.startTime,
                    ) as any;

                    const ay = this.findNearestY(
                      imageElement.animation[animationType].ay,
                      this.timelineCursor - imageElement.startTime,
                    ) as any;

                    ctx.drawImage(
                      img.object,
                      ax - compare / 2,
                      ay - compare / 2,
                      scaleW,
                      scaleH,
                    );

                    continue;
                  } catch (error) {}
                }
              }

              ctx.drawImage(img.object, scaleX, scaleY, scaleW, scaleH);
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

            ctx.globalAlpha = 1;
          }

          if (fileType == "gif") {
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
                this.gifCanvas.frameImageData =
                  this.gifCanvas.tempCtx.createImageData(
                    dims.width,
                    dims.height,
                  );
              }

              this.gifCanvas.frameImageData.data.set(firstFrame.patch);

              this.gifCanvas.tempCtx.putImageData(
                this.gifCanvas.frameImageData,
                0,
                0,
              );

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
                      this.gifCanvas.tempCtx.createImageData(
                        dims.width,
                        dims.height,
                      );
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

          if (fileType == "video") {
            const videoElement = this.timeline[elementId] as any;

            if (
              !(
                this.timelineCursor >=
                  startTime + this.timeline[elementId].trim.startTime &&
                this.timelineCursor <
                  startTime + this.timeline[elementId].trim.endTime
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

              continue;
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

              if (this.timeline[elementId].filter.enable) {
                const ctxCopy = video.canvas.getContext("2d");
                video.canvas.width = w;
                video.canvas.height = h;
                ctxCopy.drawImage(video.object, 0, 0, w, h);
                let frame = ctxCopy.getImageData(0, 0, w, h);
                let mainFrame = ctx.getImageData(x, y, w, h);
                let l = frame.data.length / 4;

                for (let i = 0; i < l; i++) {
                  let r = frame.data[i * 4 + 0];
                  let g = frame.data[i * 4 + 1];
                  let b = frame.data[i * 4 + 2];
                  if (this.timeline[elementId].filter.list.length > 0) {
                    const targetRgb =
                      this.timeline[elementId].filter.list[0].value;
                    const parsedRgb = this.parseRGBString(targetRgb);
                    const range = 30; // NOTE: Range 설정은 조만간 필요
                    if (
                      g > parsedRgb.g - range &&
                      g < parsedRgb.g + range &&
                      r > parsedRgb.r - range &&
                      r < parsedRgb.r + range &&
                      b > parsedRgb.b - range &&
                      b < parsedRgb.b + range
                    ) {
                      frame.data[i * 4 + 0] = mainFrame.data[i * 4 + 0];
                      frame.data[i * 4 + 1] = mainFrame.data[i * 4 + 1];
                      frame.data[i * 4 + 2] = mainFrame.data[i * 4 + 2];
                    }
                  }
                }

                // NOTE: 애니메이션 추가 필요

                ctx.putImageData(frame, x, y);
              } else {
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

                    ctx.globalAlpha = ax / 100;
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

                      ctx.drawImage(video.object, ax, ay, w, h);

                      continue;
                    } catch (error) {}
                  }
                }

                ctx.drawImage(video.object, x, y, w, h);
              }
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

          if (fileType == "text") {
            try {
              if (this.isEditText) {
                continue;
              }

              ctx.globalAlpha = 1;

              ctx.fillStyle = this.timeline[elementId].textcolor as string;
              ctx.lineWidth = 0;
              ctx.letterSpacing = `${this.timeline[elementId].letterSpacing}px`;

              ctx.font = `${
                this.timeline[elementId].options.isItalic ? "italic" : ""
              } ${this.timeline[elementId].options.isBold ? "bold" : ""} ${
                this.timeline[elementId].fontsize
              }px ${this.timeline[elementId].fontname}`;

              let tx = x;
              let ty = y;

              if (
                this.timeline[elementId].animation["opacity"].isActivate == true
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
                    this.timeline[elementId].animation["opacity"].ax,
                    this.timelineCursor - this.timeline[elementId].startTime,
                  ) as any;

                  ctx.globalAlpha = ax / 100;
                } catch (error) {}
              }

              let animationType = "position";

              if (
                this.timeline[elementId].animation[animationType].isActivate ==
                true
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

              this.drawTextBackground(ctx, elementId, tx, ty, w, h);

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
                    this.drawTextStroke(ctx, elementId, line, tx, textY);
                    ctx.fillText(line, tx, textY);
                    line = textSplited[index] + " ";
                    textY += lineHeight;
                  }
                }

                this.drawTextStroke(ctx, elementId, line, tx, textY);
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
                );
                ctx.fillText(line, x + w / 2 - lastWordWidth / 2, textY);
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
                );
                ctx.fillText(line, tx + w - lastWordWidth, textY);
              }

              ctx.globalAlpha = 1;
            } catch (error) {}
          }

          if (fileType == "shape") {
            this.drawShape(elementId);
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
      // 아직 생성된적 없다면
      const createdElementId = this.createShape(x, y);
      this.nowShapeId = createdElementId;

      return false;
    }

    this.timeline[this.nowShapeId].shape.push([x, y]);
    this.timelineState.patchTimeline(this.timeline);
  }

  _handleMouseDown(e) {
    const mx = e.offsetX * this.previewRatio;
    const my = e.offsetY * this.previewRatio;
    const padding = 20;
    let isMoveTemp = false;
    let isStretchTemp = false;
    let activeElementTemp = "";

    if (this.timelineControl.cursorType == "shape") {
      this.addShapePoint(mx, my);
      return false;
    }

    this.nowShapeId = "";

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
    const padding = 20;

    let isCollide = false;

    if (this.timelineControl.cursorType == "shape") {
      this.cursorType = "crosshair";
      this.updateCursor();
      return false;
    }

    if (!this.isMove || !this.isStretch) {
      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          let x = this.timeline[elementId].location?.x;
          let y = this.timeline[elementId].location?.y;

          const w = this.timeline[elementId].width;
          const h = this.timeline[elementId].height;
          const fileType = this.timeline[elementId].filetype;
          const startTime = this.timeline[elementId].startTime as number;
          const duration = this.timeline[elementId].duration as number;
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
    try {
      this.addAnimationPoint(
        this.timeline[this.activeElementId].location.x,
        this.timeline[this.activeElementId].location.y,
      );
      this.isMove = false;
      this.isStretch = false;
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
