import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { v4 as uuidv4 } from "uuid";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("element-control")
export class ElementControl extends LitElement {
  elementTimeline: any;
  timelineCursor: any;
  scroller: any;
  resizeTimeout: any;
  resizeInterval: any;
  isResizeStart: boolean;
  previousPreviewSize: { w: number; h: number };
  isPaused: boolean;
  isPlay: {};
  activeElementId: string;
  selectElementsId: any[];
  existActiveElement: boolean;
  progress: number;
  progressTime: number;
  previewRatio: number;
  innerWidth: number;

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  // @property()
  // cursor = this.timelineState.cursor;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      // this.timelineCursor = state.cursor;
    });

    return this;
  }

  constructor() {
    super();

    this.elementTimeline;
    this.timelineCursor;

    window.addEventListener("DOMContentLoaded", () => {
      this.elementTimeline = document.querySelector("element-timeline");
      this.timelineCursor = document.querySelector("element-timeline-cursor");
      this.changeTimelineRange();
    });

    window.addEventListener("resize", () => {
      this.changeTimelineRange();
    });

    this.scroller = undefined;
    this.resizeTimeout = undefined;
    this.resizeInterval = undefined;

    this.isResizeStart = false;
    this.previousPreviewSize = {
      w: 1920,
      h: 1080,
    };

    this.isPaused = true;
    this.isPlay = {};

    this.activeElementId = "";
    this.selectElementsId = [];

    this.existActiveElement = false;

    this.progress = 0;
    this.progressTime = 0;
    this.previewRatio = 1920 / 1920;

    this.resizeEvent();
  }

  async resizeEvent() {
    this.resizePreview();
    clearTimeout(this.resizeTimeout);

    if (this.isResizeStart == false) {
      this.isResizeStart = true;
      this.resizeInterval = setInterval(() => {
        this.matchAllElementsSizeToPreview();
      }, 50);
    }

    this.resizeTimeout = setTimeout(() => {
      clearInterval(this.resizeInterval);
      this.isResizeStart = false;
    }, 300);
  }

  resizePreview() {
    try {
      let innerWidth = document.getElementById("split_col_2").offsetWidth;
      let splitTopHeight = document.getElementById("split_top").offsetHeight;
      let splitBottomHeight =
        document.getElementById("split_bottom").offsetHeight;
      let videoBoxHeight = document.getElementById("videobox").offsetHeight;
      let videoHeight = document.getElementById("video").offsetHeight;

      let elementTimelineHeight =
        document.querySelector("element-timeline").offsetHeight;

      let horizontalResizeWidth = Math.round(innerWidth * 0.95);
      let horizontalResizeHeight = Math.round((horizontalResizeWidth * 9) / 16);

      let verticalResizeHeight =
        (window.innerHeight -
          (splitBottomHeight + 20) -
          (videoBoxHeight - videoHeight)) *
        0.92;
      let verticalResizeWidth = verticalResizeHeight * (16 / 9);

      let width =
        horizontalResizeWidth > verticalResizeWidth
          ? verticalResizeWidth
          : horizontalResizeWidth;
      let height =
        horizontalResizeHeight > verticalResizeHeight
          ? verticalResizeHeight
          : horizontalResizeHeight;

      preview.setAttribute("width", String(width));
      preview.setAttribute("height", String(height));
      preview.style.width = `${width}px`;
      preview.style.height = `${height}px`;
      video.style.width = `${width}px`;
      video.style.height = `${height}px`;

      this.previewRatio = 1920 / width;
    } catch (error) {}
  }

  matchAllElementsSizeToPreview() {
    for (const elementId in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, elementId)) {
        let targetElement = document.querySelector(`#element-${elementId}`);

        let elementHeight =
          Number(this.timeline[elementId].height) / this.previewRatio;
        let elementWidth =
          Number(this.timeline[elementId].width) / this.previewRatio;
        let elementTop =
          Number(this.timeline[elementId].location.y) / this.previewRatio;
        let elementLeft =
          Number(this.timeline[elementId].location.x) / this.previewRatio;

        if (this.timeline[elementId].filetype != "text") {
          targetElement.resizeStyle({
            x: elementLeft,
            y: elementTop,
            w: elementWidth,
            h: elementHeight,
          });
        } else if (this.timeline[elementId].filetype == "text") {
          let elementTextSize =
            Number(this.timeline[elementId].fontsize) / this.previewRatio;

          targetElement.resizeStyle({
            x: elementLeft,
            y: elementTop,
            w: elementWidth,
            h: elementHeight,
          });

          targetElement.resizeFont({
            px: elementTextSize,
          });
        }
      }
    }
  }

  removeElementById(elementId) {
    this.querySelector(
      `element-control-asset[element-id="${elementId}"]`
    ).remove();
    this.timeline = document.querySelector("element-timeline").timeline;
  }

  removeAllElementAsset() {
    const assetLists = this.querySelectorAll("element-control-asset");
    assetLists.forEach((element) => {
      element.remove();
    });
    this.timeline = document.querySelector("element-timeline").timeline;
  }

  fitElementSizeOnPreview(width, height) {
    let preview = {
      w: Number(document.querySelector("#video").style.width.split("px")[0]),
      h: Number(document.querySelector("#video").style.height.split("px")[0]),
    };

    let originRatio = width / height;
    let resizeHeight = height < preview.h ? height : preview.h;
    let resizeWidth = resizeHeight * originRatio;

    return {
      width: resizeWidth,
      height: resizeHeight,
    };
  }

  getNowPriority() {
    if (Object.keys(this.timeline).length == 0) {
      return 1;
    }

    let lastPriority = 1;

    for (const key in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, key)) {
        const element = this.timeline[key];
        lastPriority =
          lastPriority < element.priority ? element.priority : lastPriority;
      }
    }

    return lastPriority + 1;
  }

  addImage(blob, path) {
    const elementId = this.generateUUID();
    const img = document.createElement("img");

    img.src = blob;
    img.onload = () => {
      let resize = this.fitElementSizeOnPreview(img.width, img.height);
      let width = resize.width;
      let height = resize.height; // /division

      this.timeline[elementId] = {
        priority: this.getNowPriority(),
        blob: blob,
        startTime: 0,
        duration: 1000,
        opacity: 100,
        location: { x: 0, y: 0 },
        rotation: 0,
        width: width,
        height: height,
        localpath: path,
        filetype: "image",
        animation: {
          position: {
            isActivate: false,
            points: [[], []],
            allpoints: [[], []],
          },
          opacity: {
            isActivate: false,
            points: [[]],
            allpoints: [[]],
          },
        },
      };

      this.timelineState.patchTimeline(this.timeline);
      this.showImage(elementId);
    };
  }

  addVideo(blob, path) {
    const elementId = this.generateUUID();
    const video = document.createElement("video");
    const toastMetadata = bootstrap.Toast.getInstance(
      document.getElementById("loadMetadataToast")
    );
    toastMetadata.show();

    video.src = blob;
    video.preload = "metadata";

    console.log("CBLOCK", blob);

    video.onloadedmetadata = () => {
      let width = video.videoWidth;
      let height = video.videoHeight;
      let duration = video.duration * 1000;

      window.electronAPI.req.ffmpeg.getMetadata(blob, path);

      window.electronAPI.res.ffmpeg.getMetadata((evt, blobdata, metadata) => {
        console.log(blobdata, metadata);

        if (blobdata != blob) {
          return 0;
        }

        let isExist = false;

        setTimeout(() => {
          toastMetadata.hide();
        }, 1000);

        metadata.streams.forEach((element) => {
          if (element.codec_type == "audio") {
            isExist = true;
          }
        });

        this.timeline[elementId] = {
          priority: this.getNowPriority(),
          blob: blob,
          startTime: 0,
          duration: duration,
          location: { x: 0, y: 0 },
          trim: { startTime: 0, endTime: duration },
          rotation: 0,
          width: width,
          height: height,
          localpath: path,
          isExistAudio: isExist,
          filetype: "video",
          codec: { video: "default", audio: "default" },
        };

        this.timelineState.patchTimeline(this.timeline);
        this.showVideo(elementId);
      });

      // ffmpeg.ffprobe(path, (err, metadata) => {

      // })
    };
  }

  addText() {
    const elementId = this.generateUUID();

    this.timeline[elementId] = {
      priority: this.getNowPriority(),
      startTime: 0,
      duration: 1000,
      text: "텍스트",
      textcolor: "#ffffff",
      fontsize: 52,
      fontpath: "default",
      fontname: "notosanskr",
      fontweight: "medium",
      fonttype: "otf",
      location: { x: 0, y: 0 },
      rotation: 0,
      localpath: "/TEXTELEMENT",
      filetype: "text",
      height: 52,
      width: 500,
      widthInner: 200,
      animation: {
        position: {
          isActivate: false,
          points: [[], []],
          allpoints: [[], []],
        },
        opacity: {
          isActivate: false,
          points: [[]],
          allpoints: [[]],
        },
      },
    };

    this.showText(elementId);
    this.elementTimeline.addElementBar(elementId);
  }

  addAudio(blob, path) {
    const elementId = this.generateUUID();
    const audio = document.createElement("audio");

    audio.src = blob;

    audio.onloadedmetadata = () => {
      let duration = audio.duration * 1000;

      this.timeline[elementId] = {
        priority: this.getNowPriority(),
        blob: blob,
        startTime: 0,
        duration: duration,
        location: { x: 0, y: 0 }, // NOT USING
        trim: { startTime: 0, endTime: duration },
        localpath: path,
        filetype: "audio",
      };

      this.showAudio(elementId);
      this.elementTimeline.addElementBar(elementId);
    };
  }

  showAnimation(elementId, animationType) {
    let index = Math.round(
      document.querySelector("element-control").progressTime / 20
    );
    let indexToMs = index * 20;
    let startTime = Number(this.timeline[elementId].startTime);
    let indexPoint = Math.round((indexToMs - startTime) / 20);

    try {
      if (indexPoint < 0) {
        return 0;
      }

      document.querySelector(`#element-${elementId}`).style.left = `${
        this.timeline[elementId].animation[animationType].allpoints[0][
          indexPoint
        ].y / this.previewRatio
      }px`;
      document.querySelector(`#element-${elementId}`).style.top = `${
        this.timeline[elementId].animation[animationType].allpoints[1][
          indexPoint
        ].y / this.previewRatio
      }px`;
    } catch (error) {}
  }

  showImage(elementId) {
    if (document.getElementById(`element-${elementId}`) == null) {
      this.insertAdjacentHTML(
        "beforeend",
        `<element-control-asset element-id="${elementId}" element-filetype="image"></element-control-asset>`
      );
    } else {
      document
        .querySelector(`#element-${elementId}`)
        .classList.remove("d-none");
    }

    let animationType = "position";
    if (this.timeline[elementId].animation[animationType].isActivate == true) {
      this.showAnimation(elementId, animationType);
    }
  }

  showVideo(elementId) {
    if (document.getElementById(`element-${elementId}`) == null) {
      this.insertAdjacentHTML(
        "beforeend",
        `<element-control-asset element-id="${elementId}" element-filetype="video"></element-control-asset>`
      );

      let video = document
        .getElementById(`element-${elementId}`)
        .querySelector("video");
      let secondsOfRelativeTime =
        (this.timeline[elementId].startTime - this.progressTime) / 1000;

      video.currentTime = secondsOfRelativeTime;
    } else {
      let video = document
        .getElementById(`element-${elementId}`)
        .querySelector("video");
      let secondsOfRelativeTime =
        -(this.timeline[elementId].startTime - this.progressTime) / 1000;

      if (
        !!(
          video.currentTime > 0 &&
          !video.paused &&
          !video.ended &&
          video.readyState > 2
        )
      ) {
        if (this.isPaused) {
          console.log("paused");
        }
      } else {
        if (this.isPaused) {
          video.pause();
          this.isPlay[elementId] = false;
        } else {
          if (!this.isPlay[elementId]) {
            video.currentTime = secondsOfRelativeTime;
            video.play();
          }
          this.isPlay[elementId] = true;
        }
      }

      document
        .querySelector(`#element-${elementId}`)
        .classList.remove("d-none");
    }
  }

  showAudio(elementId) {
    if (document.getElementById(`element-${elementId}`) == null) {
      this.insertAdjacentHTML(
        "beforeend",
        `<element-control-asset element-id="${elementId}" element-filetype="audio"></element-control-asset>`
      );

      let audio = document
        .getElementById(`element-${elementId}`)
        .querySelector("audio");
      let secondsOfRelativeTime =
        (this.timeline[elementId].startTime - this.progressTime) / 1000;

      audio.currentTime = secondsOfRelativeTime;
    } else {
      let audio = document
        .getElementById(`element-${elementId}`)
        .querySelector("audio");
      let secondsOfRelativeTime =
        -(this.timeline[elementId].startTime - this.progressTime) / 1000;

      if (
        !!(
          audio.currentTime > 0 &&
          !audio.paused &&
          !audio.ended &&
          audio.readyState > 2
        )
      ) {
        if (this.isPaused) {
          console.log("paused");
        }
        console.log("isPlaying");
      } else {
        audio.currentTime = secondsOfRelativeTime;

        if (this.isPaused) {
          audio.pause();
        } else {
          audio.play();
        }
      }

      document
        .querySelector(`#element-${elementId}`)
        .classList.remove("d-none");
    }
  }

  showText(elementId) {
    if (document.getElementById(`element-${elementId}`) == null) {
      this.insertAdjacentHTML(
        "beforeend",
        `<element-control-asset element-id="${elementId}" element-filetype="text"></element-control-asset>`
      );
    } else {
      document
        .querySelector(`#element-${elementId}`)
        .classList.remove("d-none");
    }

    if (
      this.timeline[elementId].animation.isActivate == true &&
      this.timeline[elementId].animation.allpoints.length >
        document.querySelector("element-control").progress
    ) {
      this.showAnimation(elementId, "position");
    }
  }

  changeText(elementId) {
    let elementBody = document.querySelector(`#element-${elementId}`);

    let inputTarget = elementBody.querySelector("input-text");
    let inputTargetSpan = inputTarget.querySelector("span");

    let inputValue = inputTarget.value;

    this.timeline[elementId].text = inputValue;

    elementBody.style.width = `${inputTarget.offsetWidth}px`;
  }

  changeTextColor({ elementId, color }) {
    let elementBody = document.querySelector(`#element-${elementId}`);
    let inputTarget = elementBody.querySelector("input-text");

    inputTarget.style.color = color;
    this.timeline[elementId].textcolor = color;
  }

  changeTextSize({ elementId, size }) {
    let elementBody = document.querySelector(`#element-${elementId}`);
    let inputTarget = elementBody.querySelector("input-text");

    inputTarget.setWidthInner();

    let textSize = Number(size) / this.previewRatio;
    elementBody.style.fontSize = `${textSize}px`;
    elementBody.style.height = `${textSize}px`;

    this.timeline[elementId].fontsize = Number(size);
    this.timeline[elementId].height = Number(size);
  }

  changeTextFont({ elementId, fontPath, fontType, fontName }) {
    let elementBody = document.querySelector(`#element-${elementId}`);
    let inputTarget = elementBody.querySelector("input-text");

    elementBody.style.fontFamily = fontName;

    this.timeline[elementId].fontpath = fontPath;
    this.timeline[elementId].fontname = fontName;
  }

  changeTimelineRange() {
    const cursorDom = document.querySelector("element-timeline-cursor");

    const timelineRuler = document.querySelector("element-timeline-ruler");
    const elementTimelineEnd = document.querySelector("element-timeline-end");

    const projectDuration = document.querySelector("#projectDuration").value;

    const timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    const timeMagnification = timelineRange / 4;

    if (timelineRange == 0) {
      return 0;
    }

    timelineRuler.updateRulerSpace(timeMagnification);
    cursorDom.style.left = `${(this.progressTime / 5) * timeMagnification}px`;
    this.adjustAllElementBarWidth(timeMagnification);
    this.updateAllAnimationPanel();

    elementTimelineEnd.setEndTimeline({
      px: ((projectDuration * 1000) / 5) * timeMagnification,
    });
  }

  updateAllAnimationPanel() {
    for (const elementId in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, elementId)) {
        const element = this.timeline[elementId];

        if (element.filetype != "image") {
          continue;
        }

        if (element.animation.position.isActivate == false) {
          continue;
        }

        let targetAnimationPanel = document.querySelector(
          `animation-panel[element-id="${elementId}"]`
        );
        let targetElementBar = document.querySelector(
          `element-bar[element-id="${elementId}"]`
        );

        let originalLeft = targetElementBar.millisecondsToPx(
          this.timeline[elementId].startTime
        );

        targetAnimationPanel.updateItem();
        targetElementBar.animationPanelMove(originalLeft);
      }
    }
  }

  getTimeFromProgress() {
    let timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    let timeMagnification = timelineRange / 4;

    let relativeMilliseconds = this.progress * 5;
    let absoluteMilliseconds = relativeMilliseconds / timeMagnification;
    return absoluteMilliseconds;
  }

  getTimeFromTimelineBar() {
    let timelineCursorProgress = Number(
      this.timelineCursor.style.left.split("px")[0]
    );
    let timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    let timeMagnification = timelineRange / 4;

    let milliseconds = (timelineCursorProgress * 5) / timeMagnification;
    return milliseconds;
  }

  adjustAllElementBarWidth(ratio) {
    const allElementBar = document.querySelectorAll("element-bar");
    allElementBar.forEach((element: any) => {
      let elementId = element.getAttribute("element-id");
      let originalWidth = element.millisecondsToPx(
        this.timeline[elementId].duration
      );
      let originalLeft = element.millisecondsToPx(
        this.timeline[elementId].startTime
      );
      let changedWidth = originalWidth;
      let changedLeft = originalLeft;

      element.setWidth(changedWidth);
      element.setLeft(changedLeft);

      if (element.elementBarType == "dynamic") {
        let trimStart = element.millisecondsToPx(
          this.timeline[elementId].trim.startTime
        );
        let trimEnd = element.millisecondsToPx(
          this.timeline[elementId].duration -
            this.timeline[elementId].trim.endTime
        );

        element.setTrimStart(trimStart);
        element.setTrimEnd(trimEnd);
      }
    });
  }

  getMillisecondsToISOTime(milliseconds) {
    let time = new Date(milliseconds).toISOString().slice(11, 22);
    return time;
  }

  progressToTime() {
    let ms = this.progress * 5;
    let time = new Date(ms).toISOString().slice(11, 22);
    return time;
  }

  generateUUID() {
    let uuid = uuidv4();
    return uuid;
  }

  showTime() {
    const showTime = document.querySelector("#time");
    const milliseconds = this.getTimeFromTimelineBar();
    const ISOTime = this.getMillisecondsToISOTime(milliseconds);

    showTime.innerHTML = ISOTime;
  }

  hideElement(elementId) {
    if (this.timeline[elementId].filetype == "video") {
      this.pauseVideo(elementId);
    } else if (this.timeline[elementId].filetype == "audio") {
      this.pauseAudio(elementId);
    }
    document.querySelector(`#element-${elementId}`).classList.add("d-none");
  }

  appearAllElementInTime() {
    for (let elementId in this.timeline) {
      let filetype = this.timeline[elementId].filetype;
      let checkFiletype =
        this.timeline[elementId].startTime > this.progressTime ||
        this.timeline[elementId].startTime + this.timeline[elementId].duration <
          this.progressTime;

      if (filetype == "video" || filetype == "audio") {
        checkFiletype =
          this.timeline[elementId].startTime +
            this.timeline[elementId].trim.startTime >
            this.progressTime ||
          this.timeline[elementId].startTime +
            this.timeline[elementId].trim.endTime <
            this.progressTime;
      }

      if (checkFiletype) {
        this.hideElement(elementId);
      } else {
        if (filetype == "image") {
          this.showImage(elementId);
        } else if (filetype == "video") {
          this.showVideo(elementId);
        } else if (filetype == "text") {
          this.showText(elementId);
        } else if (filetype == "audio") {
          this.showAudio(elementId);
        }
      }
    }
  }

  play() {
    let toggle = document.querySelector("#playToggle");
    toggle.setAttribute("onclick", `elementControlComponent.stop()`);
    toggle.innerHTML = `<span
      class="material-symbols-outlined icon-white icon-md"
    >
      stop_circle
    </span>`;

    this.scroller = setInterval(() => {
      let nowTimelineRange = Number(
        document.querySelector("element-timeline-range").value
      );
      let nowTimelineProgress =
        Number(this.timelineCursor.style.left.split("px")[0]) +
        nowTimelineRange;
      this.progress = nowTimelineProgress;
      this.progressTime = this.getTimeFromProgress();

      this.timelineCursor.move(nowTimelineProgress);
      this.showTime();

      if (this.innerWidth + this.offsetWidth >= this.offsetWidth) {
        this.stop();
      }

      this.appearAllElementInTime();
    }, 20);
    this.isPaused = false;
  }

  stop() {
    clearInterval(this.scroller);
    const toggle = document.querySelector("#playToggle");

    this.isPaused = true;
    for (const elementId in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, elementId)) {
        this.isPlay[elementId] = false;
      }
    }

    toggle.setAttribute("onclick", `elementControlComponent.play()`);
    toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> play_circle </span>`;

    this.showTime();
    this.pauseAllDynamicElements();
  }

  pauseVideo(elementId) {
    let secondsOfRelativeTime =
      -(this.timeline[elementId].startTime - this.progressTime) / 1000;
    let video = document
      .getElementById(`element-${elementId}`)
      .querySelector("video");
    video.currentTime = secondsOfRelativeTime;
    video.pause();
  }

  pauseAudio(elementId) {
    let audio = document
      .getElementById(`element-${elementId}`)
      .querySelector("audio");
    audio.pause();
  }

  pauseAllDynamicElements() {
    let key;

    for (key in this.timeline) {
      let filetype = this.timeline[key].filetype;

      if (filetype == "video") {
        this.pauseVideo(key);
      } else if (filetype == "audio") {
        this.pauseAudio(key);
      }
    }
  }

  deactivateAllOutline() {
    for (const elementId in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, elementId)) {
        document
          .querySelector(`#element-${elementId}`)
          .classList.remove("element-outline");
      }
    }
    this.activeElementId = "";
    this.existActiveElement = false;
  }

  reset() {
    this.progress = 0;
    this.progressTime = 0;
    this.stop();

    this.showTime();
    this.appearAllElementInTime();
    this.timelineCursor.move(0);
  }

  handleClickPreview() {
    this.deactivateAllOutline();
  }

  connectedCallback() {
    document
      .querySelector("#preview")
      .addEventListener("click", this.handleClickPreview.bind(this));
  }
}

@customElement("drag-alignment-guide")
export class DragAlignmentGuide extends LitElement {
  videoCanvas: any;
  allPositions: string[];
  constructor() {
    super();

    this.videoCanvas = document.querySelector("#video");
    this.allPositions = [
      "top",
      "bottom",
      "left",
      "right",
      "horizontal",
      "vertical",
    ];
  }

  addGuide() {
    for (let index = 0; index < this.allPositions.length; index++) {
      const position = this.allPositions[index];
      document
        .querySelector("#video")
        .insertAdjacentHTML(
          "beforeend",
          `<alignment-guide position="${position}" class="alignment-guide alignment-guide-${position}"></alignment-guide>`
        );
      this.hideGuide({ position: position });
    }
  }

  hideGuide({ position }) {
    let target = document
      .querySelector("#video")
      .querySelector(`alignment-guide[position='${position}']`);
    target.classList.add("d-none");
  }

  showGuide({ position }) {
    let target = document
      .querySelector("#video")
      .querySelector(`alignment-guide[position='${position}']`);
    target.classList.remove("d-none");
  }

  connectedCallback() {
    this.addGuide();
  }
}
