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
import { IKeyframeStore, keyframeStore } from "../../states/keyframeStore";
import {
  IRenderOptionStore,
  renderOptionStore,
} from "../../states/renderOptionStore";

interface ObjectClassType {
  [elementId: string]: number;
}

interface ObjectClassTrimType {
  [elementId: string]: {
    startTime: number;
    endTime: number;
  };
}

@customElement("element-timeline-canvas")
export class elementTimelineCanvas extends LitElement {
  targetId: string[];
  isDrag: boolean;
  firstClickPosition: { x: number; y: number };
  targetLastPosition: { x: number; y: number } | undefined;
  targetStartTime: ObjectClassType;
  targetDuration: ObjectClassType;
  targetMediaType: "static" | "dynamic" | undefined;
  cursorType: "none" | "move" | "moveNotGuide" | "stretchStart" | "stretchEnd";
  cursorNow: number;
  targetTrim: ObjectClassTrimType;
  timelineColor: {};
  canvasVerticalScroll: number;
  copyedTimelineData: {};
  isGuide: boolean;
  targetIdDuringRightClick: any;
  retryCount: number;
  isLoadingAssets: boolean;
  elementCache: Map<string, HTMLVideoElement | HTMLImageElement>;
  playbackInterval: number | null;

  constructor() {
    super();

    this.targetId = [];
    this.targetIdDuringRightClick = [];
    this.targetStartTime = {};
    this.targetDuration = {};
    this.targetTrim = {};

    this.isDrag = false;
    this.isGuide = false;
    this.firstClickPosition = { x: 0, y: 0 };
    this.cursorType = "none";
    this.cursorNow = 0;
    this.timelineColor = {};
    this.canvasVerticalScroll = 0;
    this.copyedTimelineData = {};
    this.retryCount = 0;
    this.isLoadingAssets = false;
    this.elementCache = new Map();
    this.playbackInterval = null;

    window.addEventListener("resize", this.drawCanvas);
    window.addEventListener("keydown", this._handleKeydown.bind(this));
    document.addEventListener(
      "mousedown",
      this._handleDocumentClick.bind(this),
    );
  }

  firstUpdated() {
    // Force initial draw and asset loading
    setTimeout(() => {
      this.drawCanvas();
    }, 100);

    // Listen for timeline play state changes to ensure frames stay visible during playback
    useTimelineStore.subscribe((state) => {
      if (state.control.isPlay) {
        // Timeline is playing - start continuous redraw to keep frames visible
        if (!this.playbackInterval) {
          this.playbackInterval = window.setInterval(() => {
            this.drawCanvas();
          }, 100); // Redraw every 100ms during playback
        }
      } else {
        // Timeline stopped - stop continuous redraw
        if (this.playbackInterval) {
          clearInterval(this.playbackInterval);
          this.playbackInterval = null;
          // Final redraw when stopping
          this.drawCanvas();
        }
      }
    });
  }

  @query("#elementTimelineCanvasRef") canvas!: HTMLCanvasElement;

  @property({ attribute: false })
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property({ attribute: false })
  timeline: any = this.timelineState.timeline;

  @property({ attribute: false })
  timelineRange = this.timelineState.range;

  @property({ attribute: false })
  timelineScroll = this.timelineState.scroll;

  @property({ attribute: false })
  timelineCursor = this.timelineState.cursor;

  @property({ attribute: false })
  timelineHistory = this.timelineState.history;

  @property({ attribute: false })
  control = this.timelineState.control;

  @property({ attribute: false })
  isOpenAnimationPanelId: string[] = [];

  @property({ attribute: false })
  keyframeState: IKeyframeStore = keyframeStore.getInitialState();

  @property({ attribute: false })
  target = this.keyframeState.target;

  @property({ attribute: false })
  uiState: IUIStore = uiStore.getInitialState();

  @property({ attribute: false })
  resize = this.uiState.resize;

  @property({ attribute: false })
  renderOptionStore: IRenderOptionStore = renderOptionStore.getInitialState();

  @property({ attribute: false })
  renderOption = this.renderOptionStore.options;

  @consume({ context: timelineContext })
  @property({ attribute: false })
  public timelineOptions: any = {
    canvasVerticalScroll: 0,
    panelOptions: [],
  };

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineCursor = state.cursor;
      this.timelineScroll = state.scroll;
      this.timelineHistory = state.history;
      this.control = state.control;

      this.setTimelineColor();
      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.drawCanvas();
    });

    keyframeStore.subscribe((state) => {
      this.target = state.target;
    });

    renderOptionStore.subscribe((state) => {
      this.renderOption = state.options;
    });

    return this;
  }

  _handleDocumentClick(e) {
    if (e.target.id != "elementTimelineCanvasRef") {
      this.targetId = [];
      this.drawCanvas();
    }
  }

  setTimelineColor() {
    for (const key in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        if (!this.timelineColor.hasOwnProperty(key)) {
          // this.timelineColor[key] = this.getRandomColor();
          this.timelineColor[key] = this.timeline[key].timelineOptions.color;
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
      const copy: any = [];
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
    if (this.targetId.length == 1) {
      let selected = {};

      let changedUUID = uuidv4();

      selected[changedUUID] = this.deepCopy(this.timeline[this.targetId[0]]);

      this.copyedTimelineData = selected;
    }
  }

  private splitSeletedElement() {
    if (this.targetId.length != 1) {
      return false;
    }

    let selected = {};
    const timelineRange = this.timelineRange;
    const timelineCursor = this.timelineCursor;
    const timeMagnification = timelineRange / 4;
    const convertMs = (timelineCursor * 5) / timeMagnification;
    let curserLeft = this.timelineCursor;

    let changedUUID = uuidv4();
    selected[changedUUID] = this.deepCopy(this.timeline[this.targetId[0]]);

    if (
      elementUtils.getElementType(this.timeline[this.targetId[0]].filetype) ==
      "dynamic"
    ) {
      let targetElementTrimStartTime =
        curserLeft -
        (selected[changedUUID].trim.startTime +
          selected[changedUUID].startTime);
      selected[changedUUID].trim.startTime += targetElementTrimStartTime;

      this.timeline[this.targetId[0]].trim.endTime =
        selected[changedUUID].trim.startTime;
    } else if (
      elementUtils.getElementType(this.timeline[this.targetId[0]].filetype) ==
      "static"
    ) {
      let targetElementStartTime = curserLeft - selected[changedUUID].startTime;

      selected[changedUUID].startTime += targetElementStartTime;
      selected[changedUUID].duration =
        selected[changedUUID].duration - targetElementStartTime;

      let originElementDuration =
        this.timeline[this.targetId[0]].duration -
        selected[changedUUID].duration;

      this.timeline[this.targetId[0]].duration = originElementDuration;
    }

    this.copyedTimelineData = selected;
  }

  drawCursor() {
    const ctx: any = this.canvas.getContext("2d");
    const height = document.querySelector("element-timeline").offsetHeight;

    const now =
      this.millisecondsToPx(this.timelineCursor) - this.timelineScroll;

    ctx.fillStyle = "#dbdaf0";
    ctx.beginPath();
    ctx.rect(now, 0, 2, height);
    ctx.fill();
  }

  drawEndTimeline() {
    const projectDuration = this.renderOption.duration;

    const timelineRange = this.timelineRange;
    const timeMagnification = timelineRange / 4;

    const ctx: any = this.canvas.getContext("2d");
    const height = document.querySelector("element-timeline").offsetHeight;

    const end =
      ((projectDuration * 1000) / 5) * timeMagnification - this.timelineScroll;

    ctx.fillStyle = "#ff173e";
    ctx.beginPath();
    ctx.rect(end, 0, 2, height);
    ctx.fill();
  }

  drawActive(ctx, elementId, left, top, width, height) {
    const activeHeight = 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.rect(left, top + height - activeHeight, width, activeHeight);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(left, top, width, activeHeight);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(left, top, activeHeight, height);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(left + width - activeHeight, top, activeHeight, height);
    ctx.fill();
    ctx.fillStyle = this.timelineColor[elementId];
    ctx.strokeStyle = this.timelineColor[elementId];
    ctx.lineWidth = 0;
  }

  drawCanvas() {
    let index = 1;

    // Safety check: ensure canvas exists before proceeding
    if (!this.canvas) {
      console.warn("Canvas not ready, skipping draw");
      return;
    }

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;
      this.canvas.style.width = `${window.innerWidth}px`;

      this.canvas.width = window.innerWidth * dpr;

      // Calculate proper height to ensure first row is visible
      const trackHeight = 60;
      const numTracks = Math.max(Object.keys(this.timeline).length, 3); // At least 3 tracks
      const timelineHeight = numTracks * trackHeight + 20; // Add extra padding
      const containerHeight = document.querySelector("element-timeline")?.offsetHeight || timelineHeight;

      this.canvas.height = Math.max(timelineHeight, containerHeight) * dpr;
      this.canvas.style.height = `${Math.max(timelineHeight, containerHeight)}px`;

      ctx.clearRect(
        0,
        0,
        window.innerWidth,
        this.canvas.height,
      );
      ctx.scale(dpr, dpr);

      // Draw track grid
      this.drawTrackGrid(ctx);

      const sortedTimeline = Object.fromEntries(
        Object.entries(this.timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      // Load assets for thumbnail generation
      this.loadAssetsForThumbnails(sortedTimeline);

      for (const elementId in sortedTimeline) {
        if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
          const height = 60; // Increased height for better visibility
          const trackIndex = this.timeline[elementId].trackIndex || 0;
          const top = trackIndex * height + 20 - this.canvasVerticalScroll; // Increased padding to 20px
          const left =
            this.millisecondsToPx(this.timeline[elementId].startTime) -
            this.timelineScroll;

          const filetype = this.timeline[elementId].filetype;

          let elementType = elementUtils.getElementType(filetype);

          ctx.lineWidth = 0;

          if (elementType == "static") {
            const width = this.millisecondsToPx(
              this.timeline[elementId].duration,
            );

            let additionalLeft = 0;

            if (filetype == "text") {
              if (this.timeline[elementId].parentKey != "standalone") {
                const parentStartTime =
                  this.timeline[this.timeline[elementId].parentKey].startTime;
                additionalLeft = this.millisecondsToPx(parentStartTime);
              }
            }

            const finalLeft = left + additionalLeft;

            ctx.strokeStyle = this.timelineColor[elementId];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(finalLeft, top, width, height);
            ctx.stroke();

            // Draw first frame thumbnail for images
            if (filetype === "image") {
              this.drawFirstFrameThumbnail(ctx, elementId, finalLeft, top, width, height);
            }

            if (this.targetId.includes(elementId)) {
              this.drawActive(ctx, elementId, finalLeft, top, width, height);
            }
          } else if (elementType == "dynamic") {
            // For video clips, use the trimmed duration for width calculation
            const trimmedDuration = this.timeline[elementId].trim.endTime - this.timeline[elementId].trim.startTime;
            const width = this.millisecondsToPx(trimmedDuration);

            ctx.strokeStyle = this.timelineColor[elementId];
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.rect(left, top, width, height);
            ctx.stroke();

            // Draw first frame thumbnail for videos
            if (filetype === "video") {
              this.drawFirstFrameThumbnail(ctx, elementId, left, top, width, height);
            }

            if (this.targetId.includes(elementId)) {
              this.drawActive(ctx, elementId, left, top, width, height);
            }
          }

          const isActive = this.isActiveAnimationPanel(elementId);

          if (isActive) {
            index += 1;

            const panelTop =
              index * height * 1.2 -
              this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.position.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.position.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            for (
              let indexY = 0;
              indexY < this.timeline[elementId].animation.position.y.length;
              indexY++
            ) {
              const element =
                this.timeline[elementId].animation.position.y[indexY];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            index += 1;

            const panelOpacityTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelOpacityTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.opacity.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.opacity.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelOpacityTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            for (
              let indexY = 0;
              indexY < this.timeline[elementId].animation.opacity.y.length;
              indexY++
            ) {
              const element =
                this.timeline[elementId].animation.opacity.y[indexY];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelOpacityTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            index += 1;

            const panelScaleTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelScaleTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.scale.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.scale.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelScaleTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            for (
              let indexY = 0;
              indexY < this.timeline[elementId].animation.scale.y.length;
              indexY++
            ) {
              const element =
                this.timeline[elementId].animation.scale.y[indexY];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelScaleTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            index += 1;

            const panelRotationTop =
              index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;
            ctx.fillStyle = "#24252b";

            ctx.beginPath();
            ctx.rect(0, panelRotationTop, this.canvas.width, height);
            ctx.fill();

            for (
              let indexX = 0;
              indexX < this.timeline[elementId].animation.rotation.x.length;
              indexX++
            ) {
              const element =
                this.timeline[elementId].animation.rotation.x[indexX];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelRotationTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            for (
              let indexY = 0;
              indexY < this.timeline[elementId].animation.rotation.y.length;
              indexY++
            ) {
              const element =
                this.timeline[elementId].animation.rotation.y[indexY];

              const p =
                this.millisecondsToPx(
                  this.timeline[elementId].startTime + element.p[0],
                ) - this.timelineScroll;

              ctx.fillStyle = "#ffffff";
              ctx.beginPath();
              ctx.arc(p, panelRotationTop + height / 2, 4, 0, 2 * Math.PI);
              ctx.fill();
            }
          }

          index += 1;
        }
      }

      this.drawCursor();
      this.drawEndTimeline();
    }
  }

  private loadAssetsForThumbnails(timeline: any) {
    try {
      const assetStore = (window as any).loadedAssetStore;
      if (assetStore && !this.isLoadingAssets) {
        this.isLoadingAssets = true;

        // Load assets for all elements to ensure thumbnails are available
        assetStore.getState().loadEntireTimeline(timeline);

        // Force immediate loading for visible elements
        const visibleElements = Object.entries(timeline).filter(([elementId, element]: [string, any]) => {
          return element.filetype === "video" || element.filetype === "image";
        });

        const loadPromises = visibleElements.map(([elementId, element]: [string, any]) => {
          if (element.filetype === "video") {
            // Force video loading if not already loaded
            if (!assetStore.getState().getElementVideo(elementId)) {
              return assetStore.getState().loadElementVideo(elementId, element);
            }
          } else if (element.filetype === "image") {
            // Force image loading if not already loaded
            if (!assetStore.getState().getImage(element.localpath)) {
              return assetStore.getState().loadImage(element.localpath);
            }
          }
          return Promise.resolve();
        });

        // Wait for all assets to load, then redraw once
        Promise.all(loadPromises).then(() => {
          setTimeout(() => {
            this.isLoadingAssets = false;
            this.drawCanvas();
          }, 200);
        }).catch(() => {
          this.isLoadingAssets = false;
        });
      }
    } catch (error) {
      console.warn("Failed to load assets for thumbnails:", error);
      this.isLoadingAssets = false;
    }
  }

  private drawTrackGrid(ctx: CanvasRenderingContext2D) {
    const trackHeight = 60;
    const numTracks = Math.ceil(this.canvas.height / trackHeight) + 1;

    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;

    for (let i = 0; i <= numTracks; i++) {
      const y = i * trackHeight + 20 - this.canvasVerticalScroll; // Match the 20px padding
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  private drawFirstFrameThumbnail(ctx: CanvasRenderingContext2D, elementId: string, left: number, top: number, width: number, height: number) {
    const element = this.timeline[elementId];

    // Draw purple border around the entire clip
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 3;
    ctx.strokeRect(left, top, width, height);

    // Try to draw the actual first frame if available
    this.drawActualFrame(ctx, elementId, left, top, width, height);

    // Add file type indicator in the top-left corner
    ctx.fillStyle = "#8b5cf6";
    ctx.font = "bold 10px Arial";
    ctx.fillText(element.filetype.toUpperCase(), left + 5, top + 15);
  }

  private calculateCoverDimensions(elementWidth: number, elementHeight: number, targetWidth: number, targetHeight: number) {
    const elementAspect = elementWidth / elementHeight;
    const targetAspect = targetWidth / targetHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (elementAspect > targetAspect) {
      // Element is wider than target - scale to cover height, crop width
      drawHeight = targetHeight;
      drawWidth = targetHeight * elementAspect;
      offsetX = (targetWidth - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Element is taller than target - scale to cover width, crop height
      drawWidth = targetWidth;
      drawHeight = targetWidth / elementAspect;
      offsetX = 0;
      offsetY = (targetHeight - drawHeight) / 2;
    }

    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  private drawActualFrame(ctx: CanvasRenderingContext2D, elementId: string, left: number, top: number, width: number, height: number) {
    const element = this.timeline[elementId];

    try {
      // HACK: Direct approach - create elements directly and draw them
      if (element.filetype === "video") {
        // Try the asset store first
        const videoMeta = (window as any).loadedAssetStore?.getState()?.getElementVideo(elementId);
        if (videoMeta && videoMeta.canvas) {
          console.log("Drawing video frame from cache for:", elementId);
          this.drawTiledFrame(ctx, videoMeta.canvas, left, top, width, height);
          return;
        } else if (videoMeta && videoMeta.object && videoMeta.object.readyState >= 2) {
          console.log("Drawing video frame directly for:", elementId);
          this.drawTiledFrame(ctx, videoMeta.object, left, top, width, height);
          return;
        }

        // HACK: Use cached video element or create new one
        let video = this.elementCache.get(elementId) as HTMLVideoElement;
        if (!video) {
          video = document.createElement('video');
          video.muted = true;
          video.crossOrigin = 'anonymous';
          video.style.display = 'none';
          video.loop = false;
          video.playsInline = true;

          // Use blob URL if available, otherwise use localpath
          if (element.blob) {
            video.src = element.blob;
          } else {
            video.src = element.localpath;
          }

          this.elementCache.set(elementId, video);
        }

        // Try to draw immediately if video is ready
        if (video.readyState >= 2) {
          try {
            video.currentTime = 0.1; // Skip to 0.1s to avoid black frame
            this.drawTiledFrame(ctx, video, left, top, width, height);
            console.log("HACK: Drew video frame directly for:", elementId);
            return;
          } catch (e) {
            console.warn("HACK: Failed to draw video frame:", e);
          }
        }

        // Try to draw when video loads
        video.addEventListener('loadeddata', () => {
          try {
            video.currentTime = 0.1;
            setTimeout(() => {
              try {
                this.drawTiledFrame(ctx, video, left, top, width, height);
                console.log("HACK: Drew video frame after load for:", elementId);
                // Force canvas redraw
                this.drawCanvas();
              } catch (e) {
                console.warn("HACK: Failed to draw video frame after load:", e);
              }
            }, 100);
          } catch (e) {
            console.warn("HACK: Failed to set video time:", e);
          }
        }, { once: true });

        // Fallback: try to draw after a delay
        setTimeout(() => {
          try {
            if (video.readyState >= 2) {
              this.drawTiledFrame(ctx, video, left, top, width, height);
              console.log("HACK: Drew video frame after delay for:", elementId);
              this.drawCanvas();
            }
          } catch (e) {
            console.warn("HACK: Failed to draw video frame after delay:", e);
          }
        }, 1000);

      } else if (element.filetype === "image") {
        // Try the asset store first
        const img = (window as any).loadedAssetStore?.getState()?.getImage(element.localpath);
        if (img && img.complete) {
          console.log("Drawing image frame for:", elementId);
          this.drawTiledFrame(ctx, img, left, top, width, height);
          return;
        }

        // HACK: Use cached image element or create new one
        let image = this.elementCache.get(elementId) as HTMLImageElement;
        if (!image) {
          image = new Image();
          image.crossOrigin = 'anonymous';

          // Use blob URL if available, otherwise use localpath
          if (element.blob) {
            image.src = element.blob;
          } else {
            image.src = element.localpath;
          }

          this.elementCache.set(elementId, image);
        }

        // Try to draw immediately if image is ready
        if (image.complete) {
          try {
            this.drawTiledFrame(ctx, image, left, top, width, height);
            console.log("HACK: Drew image frame directly for:", elementId);
            return;
          } catch (e) {
            console.warn("HACK: Failed to draw image frame:", e);
          }
        }

        // Try to draw when image loads
        image.onload = () => {
          try {
            this.drawTiledFrame(ctx, image, left, top, width, height);
            console.log("HACK: Drew image frame after load for:", elementId);
            // Force canvas redraw
            this.drawCanvas();
          } catch (e) {
            console.warn("HACK: Failed to draw image frame:", e);
          }
        };

        image.onerror = () => {
          console.warn("HACK: Failed to load image:", element.localpath);
        };
      }
    } catch (error) {
      console.warn("Failed to draw frame for element:", elementId, error);
    }

    // Fallback: Draw a placeholder with file type
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(left + 2, top + 2, width - 4, height - 4);

    // Add a play icon for videos in the center
    if (element.filetype === "video") {
      ctx.fillStyle = "#8b5cf6";
      ctx.beginPath();
      ctx.moveTo(left + width / 2 - 8, top + height / 2 - 8);
      ctx.lineTo(left + width / 2 - 8, top + height / 2 + 8);
      ctx.lineTo(left + width / 2 + 8, top + height / 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawTiledFrame(ctx: CanvasRenderingContext2D, source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, left: number, top: number, width: number, height: number) {
    // Get source dimensions
    let sourceWidth, sourceHeight;
    if (source instanceof HTMLVideoElement) {
      sourceWidth = source.videoWidth;
      sourceHeight = source.videoHeight;
    } else if (source instanceof HTMLImageElement) {
      sourceWidth = source.naturalWidth;
      sourceHeight = source.naturalHeight;
    } else {
      sourceWidth = source.width;
      sourceHeight = source.height;
    }

    // Calculate frame size to maintain aspect ratio
    const frameAspect = sourceWidth / sourceHeight;
    const targetAspect = (width - 4) / (height - 4);

    let frameWidth, frameHeight;
    if (frameAspect > targetAspect) {
      // Frame is wider - fit to height
      frameHeight = height - 4;
      frameWidth = frameHeight * frameAspect;
    } else {
      // Frame is taller - fit to width
      frameWidth = width - 4;
      frameHeight = frameWidth / frameAspect;
    }

    // Set up clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(left + 2, top + 2, width - 4, height - 4);
    ctx.clip();

    // Calculate how many frames we need to tile
    const numFrames = Math.ceil((width - 4) / frameWidth) + 1;

    // Draw frames side by side
    for (let i = 0; i < numFrames; i++) {
      const x = left + 2 + (i * frameWidth);
      ctx.drawImage(source, x, top + 2, frameWidth, frameHeight);
    }

    ctx.restore();
  }

  deactivateAnimationPanel(elementId) {
    const panelOptions = this.timelineOptions.panelOptions.filter((item) => {
      return item.elementId != elementId;
    });

    this.timelineOptions.panelOptions = panelOptions;
  }

  activateAnimationPanel(elementId) {
    this.timelineOptions.panelOptions.push({
      elementId: elementId,
      activeAnimation: true,
    });
  }

  isActiveAnimationPanel(elementId) {
    return (
      this.timelineOptions.panelOptions.findIndex((item) => {
        return item.elementId == elementId;
      }) != -1
    );
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

    let isGuide = false;

    if (
      elementBarPosition.startX > startX - checkRange &&
      elementBarPosition.startX < startX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? startX
          : startX -
            this.millisecondsToPx(this.timeline[targetId].trim.startTime);
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
      isGuide = true;
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
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);

      isGuide = true;
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
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
      isGuide = true;
    }

    if (
      elementBarPosition.endX > endX - checkRange &&
      elementBarPosition.endX < endX + checkRange
    ) {
      let px =
        targetElementType == "static"
          ? endX - this.millisecondsToPx(this.timeline[targetId].duration)
          : endX - this.millisecondsToPx(this.timeline[targetId].trim.endTime);
      this.timeline[targetId].startTime = this.pxToMilliseconds(px);
      isGuide = true;
    }

    this.isGuide = isGuide;
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
  }

  updateTargetPosition({ targetId, dx }: { targetId: string; dx: number }) {
    this.timeline[targetId].startTime =
      this.targetStartTime[targetId] + this.pxToMilliseconds(dx);
  }

  updateTargetStartStretch({ targetId, dx }: { targetId: string; dx: number }) {
    let elementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    const minDuration = 10;

    if (elementType == "static") {
      if (
        this.targetDuration[targetId] - this.pxToMilliseconds(dx) <=
        minDuration
      ) {
        return false;
      }

      this.timeline[targetId].startTime =
        this.targetStartTime[targetId] + this.pxToMilliseconds(dx);
      this.timeline[targetId].duration =
        this.targetDuration[targetId] - this.pxToMilliseconds(dx);
    }

    if (elementType == "dynamic") {
      if (this.targetTrim[targetId].startTime + this.pxToMilliseconds(dx) > 0) {
        this.timeline[targetId].startTime = this.targetStartTime[targetId];
        this.timeline[targetId].trim.startTime =
          this.targetTrim[targetId].startTime + this.pxToMilliseconds(dx);
      }
    }
  }

  updateTargetEndStretch({ targetId, dx }: { targetId: string; dx: number }) {
    let elementType = elementUtils.getElementType(
      this.timeline[targetId].filetype,
    );

    const minDuration = 10;

    if (elementType == "static") {
      if (
        this.targetDuration[targetId] + this.pxToMilliseconds(dx) <=
        minDuration
      ) {
        return false;
      }

      this.timeline[targetId].startTime = this.targetStartTime[targetId];
      this.timeline[targetId].duration =
        this.targetDuration[targetId] + this.pxToMilliseconds(dx);
    }

    if (elementType == "dynamic") {
      if (
        this.targetTrim[targetId].endTime + this.pxToMilliseconds(dx) <
        this.targetDuration[targetId] / this.timeline[targetId].speed
      ) {
        this.timeline[targetId].startTime = this.targetStartTime[targetId];
        this.timeline[targetId].trim.endTime =
          this.targetTrim[targetId].endTime + this.pxToMilliseconds(dx);
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

    const sortedTimeline = Object.fromEntries(
      Object.entries(this.timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );

    for (const elementId in sortedTimeline) {
      if (Object.prototype.hasOwnProperty.call(sortedTimeline, elementId)) {
        let defaultWidth = this.millisecondsToPx(
          this.timeline[elementId].duration,
        );

        // For video clips, use trimmed duration for width calculation
        if (this.timeline[elementId].filetype === "video") {
          const trimmedDuration = this.timeline[elementId].trim.endTime - this.timeline[elementId].trim.startTime;
          defaultWidth = this.millisecondsToPx(trimmedDuration);
        }

        let additionalLeft = 0;

        if (this.timeline[elementId].filetype == "text") {
          if (this.timeline[elementId].parentKey != "standalone") {
            const parentStartTime =
              this.timeline[this.timeline[elementId].parentKey].startTime;
            additionalLeft = this.millisecondsToPx(parentStartTime);
          }
        }

        const height = 60;
        const trackIndex = this.timeline[elementId].trackIndex || 0;
        const startY = trackIndex * height + 20 - this.canvasVerticalScroll; // Match the 20px padding
        const startX =
          this.millisecondsToPx(this.timeline[elementId].startTime) -
          this.timelineScroll +
          additionalLeft;

        const endX = startX + defaultWidth;
        const endY = startY + height;
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

        const isActive = this.isActiveAnimationPanel(elementId);

        if (isActive) {
          index += 4;
        }

        index += 1;
      }
    }

    return { targetId: "", cursorType: "none" };
  }

  public openAnimationPanel(targetId: string, animationType) {
    this.isOpenAnimationPanelId.push(targetId);

    let timelineOptionOffcanvas = new bootstrap.Offcanvas(
      document.getElementById("option_bottom"),
    );
    let targetElementId = document.querySelector(
      "#timelineOptionTargetElement",
    );

    this.keyframeState.update({
      elementId: targetId,
      animationType: animationType,
      isShow: true,
    });

    targetElementId.value = targetId;
    timelineOptionOffcanvas.show();
  }

  public closeAnimationPanel(targetId: string) {
    this.isOpenAnimationPanelId = this.isOpenAnimationPanelId.filter(
      (item) => !item.includes(targetId),
    );
  }

  animationPanelDropdownTemplate() {
    if (this.targetId.length != 1) {
      return "";
    }

    if (
      elementUtils.getElementType(this.timeline[this.targetId[0]].filetype) ==
        "dynamic" ||
      this.timeline[this.targetId[0]].filetype == "text"
    ) {
      return "";
    }

    let isShowPanel = this.isShowAnimationPanel();
    let itemName = isShowPanel == true ? "close animation" : "open animation";
    let itemOnclickEvent =
      isShowPanel == true
        ? `document.querySelector('element-timeline-canvas').closeAnimationPanel('${this.targetId}')`
        : `document.querySelector('element-timeline-canvas').openAnimationPanel('${this.targetId}')`;

    let template = `<menu-dropdown-item onclick=${itemOnclickEvent} item-name="${itemName}"></menu-dropdown-item>`;
    return template;
  }

  isShowAnimationPanel() {
    const index = this.isOpenAnimationPanelId.findIndex((item) => {
      return this.targetId.includes(item);
    });

    return index != -1;
  }

  showMenuDropdown({ x, y }) {
    document.querySelector("#menuRightClick").innerHTML = `
        <menu-dropdown-body top="${y}" left="${x}">
        ${this.animationPanelDropdownTemplate()}
          <menu-dropdown-item onclick="document.querySelector('element-timeline-canvas').removeSeletedElements()" item-name="remove"> </menu-dropdown-item>
        </menu-dropdown-body>`;
  }

  showSideOption(elementId: string) {
    const optionGroup = document.querySelector("option-group");
    const fileType = this.timeline[elementId].filetype;
    let isAllText = true;

    for (let index = 0; index < this.targetId.length; index++) {
      const element = this.targetId[index];
      const itrFileType = this.timeline[elementId].filetype;
      if (itrFileType != "text") {
        isAllText = false;
      }
    }

    console.log(fileType == "text", isAllText);

    if (fileType == "text" && isAllText) {
      optionGroup.showOptions({
        filetype: fileType,
        elementIds: this.targetId,
      });

      return false;
    }

    optionGroup.showOption({
      filetype: fileType,
      elementId: elementId,
    });
  }

  whenRightClick(e) {
    const isRightClick = e.which == 3 || e.button == 2;

    this.targetIdDuringRightClick = [...this.targetId];

    if (!isRightClick) {
      return 0;
    }

    this.showMenuDropdown({
      x: e.clientX,
      y: e.clientY,
    });
  }

  exchangePriority(targetId, next) {
    // next는 -1이거나, 1이거나
    const sortedTimeline = Object.fromEntries(
      Object.entries(this.timeline).sort(
        ([, valueA]: any, [, valueB]: any) => valueA.priority - valueB.priority,
      ),
    );

    const priorityArray = Object.entries(sortedTimeline).map(
      ([key, value]: any) => ({
        key: key,
        priority: value.priority,
      }),
    );

    let targetArrayIndex = -1;
    let index = 0;

    for (const key in sortedTimeline) {
      if (Object.prototype.hasOwnProperty.call(sortedTimeline, key)) {
        if (key == targetId) {
          targetArrayIndex = index;
        }
        index += 1;
      }
    }

    if (targetArrayIndex != -1) {
      this.timeline[targetId].priority =
        priorityArray[targetArrayIndex + next].priority;
      this.timeline[priorityArray[targetArrayIndex + next].key].priority =
        priorityArray[targetArrayIndex].priority;
    }

    this.timelineState.patchTimeline(this.timeline);
  }

  getNowPriority() {
    if (Object.keys(this.timeline).length == 0) {
      return 1;
    }

    let lastPriority: any = 1;

    for (const key in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        lastPriority =
          lastPriority < (element.priority as number)
            ? element.priority
            : lastPriority;
      }
    }

    return lastPriority + 1;
  }

  searchChildrenKey(searchKey) {
    let hasChild = false;

    for (const key in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        if (element.filetype == "text") {
          if (element.parentKey == searchKey) {
            hasChild = true;
          }
        }
      }
    }

    return hasChild;
  }

  public removeSeletedElements() {
    let isAbleRemove = true;

    for (const key in this.targetIdDuringRightClick) {
      if (
        Object.prototype.hasOwnProperty.call(this.targetIdDuringRightClick, key)
      ) {
        const element = this.targetIdDuringRightClick[key];
        const hasChild = this.searchChildrenKey(element);
        if (!hasChild) {
          this.timelineState.removeTimeline(element);
        }
      }
    }
  }

  _handleMouseWheel(e) {
    const newScroll = this.timelineScroll + e.deltaX;

    if (e.ctrlKey) {
      e.preventDefault();
      const dx = parseFloat(e.deltaY) * (this.timelineRange / 75);
      const x = this.timelineRange - dx;

      if (e.deltaY < 0) {
        if (x < 5) {
          this.timelineState.setRange(x);
        }
      } else {
        if (x > -8) {
          this.timelineState.setRange(x);
        }
      }
    } else {
      if (this.canvasVerticalScroll + e.deltaY > 0) {
        this.canvasVerticalScroll += e.deltaY;
        this.timelineOptions.canvasVerticalScroll += e.deltaY;
        this.drawCanvas();
      }

      if (newScroll >= 0) {
        this.timelineState.setScroll(newScroll);
      } else {
        this.timelineState.setScroll(0);
      }
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
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - this.firstClickPosition.x;
      const dy = y - this.firstClickPosition.y;

      for (let index = 0; index < this.targetId.length; index++) {
        const elementId = this.targetId[index];

        if (this.cursorType == "move") {
          this.updateTargetPosition({ targetId: elementId, dx });
        } else if (this.cursorType == "stretchStart") {
          this.updateTargetStartStretch({ targetId: elementId, dx });
        } else if (this.cursorType == "stretchEnd") {
          this.updateTargetEndStretch({ targetId: elementId, dx });
        }

        // Handle track changes for drag and drop
        if (this.cursorType == "move") {
          const trackHeight = 60;
          const newTrackIndex = Math.floor((y + this.canvasVerticalScroll - 20) / trackHeight); // Match the 20px padding
          const currentTrackIndex = this.timeline[elementId].trackIndex || 0;

          if (newTrackIndex >= 0 && newTrackIndex !== currentTrackIndex) {
            this.timeline[elementId].trackIndex = newTrackIndex;
            this.timelineState.patchTimeline(this.timeline);
          }
        }
      }

      this.drawCanvas();
    }
  }

  _handleMouseDown(e) {
    try {
      this.timelineState.setCursorType("pointer");

      const x = e.offsetX;
      const y = e.offsetY;

      const target = this.findTarget({ x: x, y: y });

      if (e.shiftKey && target.targetId != "") {
        this.targetId.push(target.targetId);
        this.cursorType = target.cursorType;
        if (target.cursorType == "move" && this.targetId.length > 1) {
          this.cursorType = "moveNotGuide";
        }
      } else if (this.targetId.includes(target.targetId)) {
        // 타겟 ID가 포함된 엘리먼트를 클릭했을때, 시프트 키 없이도 움직이도록.
        this.cursorType = target.cursorType;
        if (target.cursorType == "move" && this.targetId.length > 1) {
          this.cursorType = "moveNotGuide";
        }
      } else {
        if (target.targetId == "") {
          this.targetId = [];
          this.cursorType = target.cursorType;
        } else {
          this.targetId = [target.targetId];
          this.cursorType = target.cursorType;
        }
      }

      this.showSideOption(this.targetId[0]);

      this.targetId = [...new Set(this.targetId)];

      this.firstClickPosition.x = e.offsetX;
      this.firstClickPosition.y = e.offsetY;

      for (let index = 0; index < this.targetId.length; index++) {
        const elementId = this.targetId[index];
        this.targetStartTime[elementId] = this.timeline[elementId].startTime;
        this.targetDuration[elementId] = this.timeline[elementId].duration;

        let elementType = elementUtils.getElementType(
          this.timeline[elementId].filetype,
        );

        if (elementType == "dynamic") {
          this.targetTrim[elementId] = {
            startTime: this.timeline[elementId].trim.startTime,
            endTime: this.timeline[elementId].trim.endTime,
          };
          // this.targetTrim.startTime =
          //   this.timeline[this.targetId[0]].trim.startTime;
          // this.targetTrim.endTime = this.timeline[this.targetId[0]].trim.endTime;
        }
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
  }

  _handleKeydown(event) {
    console.log(event.keyCode);

    // arrowUp

    if (event.keyCode == 38) {
      console.log(this.targetId);
      console.log(this.timeline);
      this.exchangePriority(this.targetId, -1);
    }

    // arrowDown

    if (event.keyCode == 40) {
      console.log(this.targetId);
      this.exchangePriority(this.targetId, 1);
    }

    if (event.keyCode == 39) {
      if (this.control.cursorType != "pointer") {
        return false;
      }

      const elementControl = document.querySelector("element-control");

      elementControl.progress = this.timelineScroll + 1000 / 60;

      elementControl.stop();
      elementControl.appearAllElementInTime();
      this.timelineState.increaseCursor(1000 / 60);
    }

    // arrowBack
    if (event.keyCode == 37) {
      if (this.control.cursorType != "pointer") {
        return false;
      }
      const elementControl = document.querySelector("element-control");

      elementControl.progress = this.timelineScroll - 1000 / 60;

      elementControl.stop();
      elementControl.appearAllElementInTime();

      this.timelineState.decreaseCursor(1000 / 60);
    }

    if (event.keyCode == 49) {
      // 1
      console.log(this.timelineHistory, this.timeline);

      const sortd = Object.fromEntries(
        Object.entries(useTimelineStore.getState().timeline).sort(
          ([, valueA]: any, [, valueB]: any) =>
            valueA.priority - valueB.priority,
        ),
      );

      for (const key in sortd) {
        if (Object.prototype.hasOwnProperty.call(sortd, key)) {
          const element = sortd[key];
          console.log(key);
        }
      }
    }

    if (event.keyCode == 8) {
      // backspace
      // event.preventDefault();
      for (const key in this.targetId) {
        if (Object.prototype.hasOwnProperty.call(this.targetId, key)) {
          const element = this.targetId[key];
          const hasChild = this.searchChildrenKey(element);
          if (!hasChild) {
            this.timelineState.removeTimeline(element);
          }
        }
      }

      this.timelineState.checkPointTimeline();
    }

    if (!event.shiftKey && event.ctrlKey && event.keyCode == 90) {
      //CTL z
      console.log(this.timelineHistory.timelineHistory, "EE");
      if (
        this.timelineHistory.historyNow - 1 == -1 ||
        this.timelineHistory.timelineHistory.length <
          this.timelineHistory.historyNow
      ) {
        return;
      }
      this.timelineState.rollbackTimelineFromCheckPoint(-1);
    }

    if (event.shiftKey && event.ctrlKey && event.keyCode == 90) {
      //CTL z
      console.log(
        this.timelineHistory.timelineHistory.length,
        this.timelineHistory.historyNow,
      );
      if (
        this.timelineHistory.timelineHistory.length <=
        this.timelineHistory.historyNow + 1
      ) {
        return;
      }
      this.timelineState.rollbackTimelineFromCheckPoint(1);
    }

    if (event.ctrlKey && event.keyCode == 86) {
      //CTL v
      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          let tempCopyObject = this.copyedTimelineData[elementId];
          tempCopyObject.priority = this.getNowPriority();

          this.timeline[elementId] = { ...tempCopyObject };
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

      for (const key in this.targetId) {
        if (Object.prototype.hasOwnProperty.call(this.targetId, key)) {
          const element = this.targetId[key];
          const hasChild = this.searchChildrenKey(element);
          if (!hasChild) {
            this.timelineState.removeTimeline(element);
          }
        }
      }
    }

    if (event.ctrlKey && event.keyCode == 68) {
      //CTL d
      this.splitSeletedElement();

      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          let tempCopyObject = this.copyedTimelineData[elementId];
          tempCopyObject.priority = this.getNowPriority();

          this.timeline[elementId] = { ...tempCopyObject };
          this.timelineState.patchTimeline(this.timeline);
        }
      }
    }
  }

  _handleContextmenu(e) {
    this.whenRightClick(e);
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
        @contextmenu=${this._handleContextmenu}
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
