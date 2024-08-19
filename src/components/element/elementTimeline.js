import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";

class ElementTimeline extends HTMLElement {
  constructor() {
    super();

    //this.directory = ''
    this.elementControl;

    window.addEventListener("DOMContentLoaded", () => {
      this.elementControl = document.querySelector("element-control");
    });

    this.timeline = {};

    this.timelineHashTable = {};
    this.appendCheckpointInHashTable();
    this.copyedTimelineData = {};

    // NOTE: edit guide == 정렬 가이드, 모든 엘리먼트의 시작점과 끝 점을 담은 배열입니다.
    this.editGuideBreakPoint = [];
  }

  generateHash(text) {
    let hash = 0,
      i,
      chr;
    if (text.length === 0) return hash;
    for (i = 0; i < text.length; i++) {
      chr = text.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return hash;
  }

  getTime() {
    return Date.now();
  }

  appendCheckpointInHashTable() {
    // NOTE: 해시 테이블에 변경점 입력
    let hashString = JSON.stringify(this.timeline);
    let hash = this.generateHash(hashString);
    let nowTimestamp = this.getTime();
    this.timelineHashTable[nowTimestamp] = hash;
  }

  isTimelineChange() {
    let nowHashString = JSON.stringify(this.timeline);
    let nowTimelineHash = this.generateHash(nowHashString);
    let timelineHashLength = Object.keys(this.timelineHashTable).length;
    let firstKeyInTimelineHashTable = Object.keys(this.timelineHashTable)[
      timelineHashLength - 1
    ];
    let prevTimelineHash = this.timelineHashTable[firstKeyInTimelineHashTable];
    return nowTimelineHash != prevTimelineHash;
  }

  render() {
    const template = this.template();
    this.classList.add(
      "col-12",
      "cursor-default",
      "h-100",
      "line",
      "bg-darker"
    );
    this.innerHTML = template;
  }

  template() {
    return `
        <element-timeline-cursor></element-timeline-cursor>
        <element-timeline-end></element-timeline-end>
        <element-timeline-scroll></element-timeline-scroll>

        
        <div ref="elementLayer" style="margin-top: 24px;"></div>

        `;
  }

  replaceTimelineBarHeight(height) {
    let timelineBar = this.querySelector(".timeline-bar");
    timelineBar.style.height = `${height}px`;
  }

  getTimelineScrollHeight() {
    return this.scrollHeight;
  }

  async patchTimeline(timeline) {
    this.timeline = timeline;
    this.elementControl.timeline = timeline;

    for (const elementId in timeline) {
      if (Object.hasOwnProperty.call(timeline, elementId)) {
        const element = timeline[elementId];
        await this.patchElementInTimeline({
          elementId: elementId,
          element: element,
        });
      }
    }
  }

  async patchElementInTimeline({ elementId, element }) {
    if (element.filetype == "image") {
      let blobUrl = await this.getBlobUrl(`file://${element.localpath}`);
      this.timeline[elementId].blob = String(blobUrl);
      this.elementControl.showImage(elementId);
    } else if (element.filetype == "video") {
      let blobUrl = await this.getBlobUrl(`file://${element.localpath}`);
      this.timeline[elementId].blob = String(blobUrl);
      this.elementControl.showVideo(elementId);
    } else if (element.filetype == "text") {
      document.querySelector("select-font").applyFontStyle({
        fontName: element.fontname,
        fontPath: element.fontpath,
        fontType: element.fonttype,
      });

      this.elementControl.showText(elementId);
    } else if (element.filetype == "audio") {
      let blobUrl = await this.getBlobUrl(`file://${element.localpath}`);
      this.timeline[elementId].blob = String(blobUrl);
      this.elementControl.showAudio(elementId);
    }
    this.addElementBar(elementId);
  }

  resetTimelineData() {
    this.timeline = {};
    this.removeAllTimelineBars();
    this.elementControl.removeAllElementAsset();
  }

  removeAllTimelineBars() {
    const bars = this.querySelectorAll("element-bar");
    bars.forEach((element) => {
      element.remove();
    });
  }

  async getBlobUrl(url) {
    try {
      const response = await fetch(url);
      const data = await response.blob();
      return URL.createObjectURL(data);
    } catch (error) {
      let notfoundImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsSAAALEgHS3X78AAAAM0lEQVQ4jWNkYGD4z4AEUDgMDAyMBASYGCgEowaMGjA4DGD8/x8j+dPXBSzka/1PHRcAAFzYCBvm7NkTAAAAAElFTkSuQmCC`;

      console.error(error);
      const response = await fetch(notfoundImage);
      const data = await response.blob();
      return URL.createObjectURL(data);
    }
  }

  addElementBar(elementId) {
    const templateBar = this.templateElementBar(elementId);
    this.querySelector("div[ref='elementLayer']").insertAdjacentHTML(
      "afterbegin",
      templateBar
    );
  }

  templateElementBar(elementId) {
    let width = this.timeline[elementId].duration;
    let filetype = this.timeline[elementId].filetype;

    let elementSplitedFilepath = this.timeline[elementId].localpath.split("/");
    let elementFilepath =
      elementSplitedFilepath[elementSplitedFilepath.length - 1];

    let elementType = elementUtils.getElementType(filetype);

    if (elementType == "static") {
      return `
            <element-bar element-id="${elementId}" element-type="static"></element-bar> 

            <animation-panel element-id="${elementId}"> 
                <animation-panel-item animation-type="position" element-id="${elementId}"></animation-panel-item> 

            </animation-panel> 
            `;
    } else if (elementType == "dynamic") {
      return `<element-bar element-id="${elementId}" element-type="dynamic"></element-bar>`;
    } else {
      return `none`;
    }
  }

  togglePlayer() {
    if (this.elementControl.isPaused == true) {
      this.elementControl.play();
    } else {
      this.elementControl.stop();
    }
  }

  removeAnimationPanelById(elementId) {
    let target = this.querySelector(
      `animation-panel[element-id="${elementId}"]`
    );
    if (!target) {
      return 0;
    }

    target.remove();
  }

  removeElementInTimelineData(elementId) {
    delete this.timeline[elementId];
  }

  removeElementById(elementId) {
    this.querySelector(`element-bar[element-id="${elementId}"]`).remove();
  }

  removeSeletedElements() {
    this.elementControl.selectElementsId.forEach((elementId) => {
      this.removeElementById(elementId);
      this.removeElementInTimelineData(elementId);
      this.removeAnimationPanelById(elementId);
      this.elementControl.removeElementById(elementId);
    });
    this.elementControl.selectElementsId = [];
  }

  copySeletedElement() {
    let selected = {};

    this.elementControl.selectElementsId.forEach((elementId) => {
      let changedUUID = uuidv4();
      selected[changedUUID] = this.timeline[elementId];
    });

    this.copyedTimelineData = selected;
  }

  splitSeletedElement() {
    let selected = {};
    const timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    const timelineCursor = Number(
      document
        .querySelector("element-timeline-cursor")
        .style.left.split("px")[0]
    );
    const timeMagnification = timelineRange / 4;
    const convertMs = (timelineCursor * 5) / timeMagnification;
    let curserLeft = Number(convertMs.toFixed(0));

    this.elementControl.selectElementsId.forEach((elementId) => {
      let changedUUID = uuidv4();
      let targetElementBar = document.querySelector(
        `element-bar[element-id='${elementId}']`
      );
      selected[changedUUID] = _.cloneDeep(this.timeline[elementId]);

      if (
        elementUtils.getElementType(this.timeline[elementId].filetype) ==
        "dynamic"
      ) {
        let targetElementTrimStartTime =
          curserLeft -
          (selected[changedUUID].trim.startTime +
            selected[changedUUID].startTime);
        selected[changedUUID].trim.startTime += targetElementTrimStartTime;

        targetElementBar.setTrimEnd(
          targetElementBar.millisecondsToPx(
            selected[changedUUID].trim.startTime
          )
        );
        this.timeline[elementId].trim.endTime =
          selected[changedUUID].trim.startTime;
      } else if (
        elementUtils.getElementType(this.timeline[elementId].filetype) ==
        "static"
      ) {
        let targetElementStartTime =
          curserLeft - selected[changedUUID].startTime;

        selected[changedUUID].startTime += targetElementStartTime;
        selected[changedUUID].duration =
          selected[changedUUID].duration - targetElementStartTime;

        let originElementDuration =
          this.timeline[elementId].duration - selected[changedUUID].duration;

        targetElementBar.setWidth(
          targetElementBar.millisecondsToPx(originElementDuration)
        );
        this.timeline[elementId].duration = originElementDuration;
      }
    });

    this.copyedTimelineData = selected;
  }

  pasteElement({ elementId, element }) {
    this.timeline[elementId] = _.cloneDeep(element);
  }

  showAnimationPanel(elementId) {
    this.querySelector(`animation-panel[element-id='${elementId}']`).show();
  }

  hideAnimationPanel(elementId) {
    this.querySelector(`animation-panel[element-id='${elementId}']`).hide();
  }

  showKeyframeEditor(elementId, animationType) {
    let timelineOptionOffcanvas = new bootstrap.Offcanvas(
      document.getElementById("option_bottom")
    );
    let timelineOption = document.querySelector("#timelineOptionBody");
    let targetElementId = document.querySelector(
      "#timelineOptionTargetElement"
    );

    timelineOption.innerHTML = `<keyframe-editor element-id="${elementId}" animation-type="${animationType}"></keyframe-editor>`;
    timelineOption.classList.remove("d-none");
    targetElementId.value = elementId;
    timelineOptionOffcanvas.show();
  }

  deactivateSeletedBar() {
    this.elementControl.selectElementsId.forEach((elementId) => {
      let targetElement = document.querySelector(
        `element-bar[element-id='${elementId}']`
      );
      targetElement.unselectThisElement();
    });
  }

  fixRulerOnTop() {
    const scrollTop = this.scrollTop;
    const elementTimelineRuler = document.querySelector(
      "element-timeline-ruler"
    );
    const elementTimelineCursor = document.querySelector(
      "element-timeline-cursor"
    );

    elementTimelineRuler.setTopPosition(scrollTop);
    elementTimelineCursor.style.top = `${scrollTop}px`;
  }

  scrollKeyframeEditor() {
    let isExistKeyframeEditor = !!document.querySelector("keyframe-editor");
    if (isExistKeyframeEditor == false) {
      return 0;
    }

    document
      .querySelector("keyframe-editor")
      .scrollTo(this.scrollLeft, this.scrollTop);
  }

  handleKeydown(event) {
    console.log("event keycode > ", event.keyCode);
    if (this.elementControl.existActiveElement == true) {
      return 0;
    }

    if (event.keyCode == 32) {
      // Space
      event.preventDefault();
      this.togglePlayer();
    }

    if (event.keyCode == 8) {
      // backspace
      event.preventDefault();
      this.removeSeletedElements();
    }

    if (event.ctrlKey && event.keyCode == 86) {
      //CTL v
      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          this.pasteElement({
            elementId: elementId,
            element: this.copyedTimelineData[elementId],
          });

          this.patchElementInTimeline({
            elementId: elementId,
            element: this.copyedTimelineData[elementId],
          });
        }
      }
    }

    if (event.ctrlKey && event.keyCode == 67) {
      //CTL c
      this.copySeletedElement();
    }

    if (event.ctrlKey && event.keyCode == 88) {
      //CTL x

      this.copySeletedElement();
      this.removeSeletedElements();
    }

    if (event.ctrlKey && event.keyCode == 68) {
      //CTL d

      this.splitSeletedElement();

      for (const elementId in this.copyedTimelineData) {
        if (Object.hasOwnProperty.call(this.copyedTimelineData, elementId)) {
          this.pasteElement({
            elementId: elementId,
            element: this.copyedTimelineData[elementId],
          });

          this.patchElementInTimeline({
            elementId: elementId,
            element: this.copyedTimelineData[elementId],
          });
        }
      }
    }
  }

  handleMousedown() {
    this.elementControl.deactivateAllOutline();
    this.deactivateSeletedBar();
  }

  handleScroll() {
    this.fixRulerOnTop();
    this.scrollKeyframeEditor();
    this.querySelector("element-timeline-scroll").setScrollThumbLeft({
      px: this.scrollLeft,
    });
  }

  connectedCallback() {
    this.render();
    this.addEventListener("mousedown", this.handleMousedown.bind(this));
    this.addEventListener("scroll", this.handleScroll.bind(this));

    document.addEventListener("keydown", this.handleKeydown.bind(this));
  }
}

class ElementTimelineCursor extends HTMLElement {
  constructor() {
    super();

    this.elementTimelineRuler;

    window.addEventListener("DOMContentLoaded", () => {
      this.elementTimelineRuler = document.querySelector(
        "element-timeline-ruler"
      );
    });
  }

  render() {
    this.classList.add("timeline-bar");
    this.setAttribute("id", "timeline_bar");
    this.style.left = `0px`;
    this.style.top = `0px`;
  }

  move(px) {
    this.style.left = `${px}px`;
  }

  handleMousedown(e) {
    this.elementTimelineRuler.moveTime(e);
    this.elementTimelineRuler.mousemoveEventHandler =
      this.elementTimelineRuler.handleMousemove.bind(this.elementTimelineRuler);
    document.addEventListener(
      "mousemove",
      this.elementTimelineRuler.mousemoveEventHandler
    );
  }

  handleMouseup(e) {
    document.removeEventListener(
      "mousemove",
      this.elementTimelineRuler.mousemoveEventHandler
    );
  }

  connectedCallback() {
    this.render();
    this.addEventListener("mousedown", this.handleMousedown.bind(this));
    document.addEventListener("mouseup", this.handleMouseup.bind(this));
  }
}

class ElementTimelineRuler extends HTMLElement {
  constructor() {
    super();
    this.mousemoveEventHandler = undefined;
    this.mouseTimeout = undefined;
    this.rulerType = "sec";
    this.timeMagnification = 1;
  }

  render() {
    this.innerHTML = "";
    const template = this.template();
    // this.classList.remove("ruler-sec", "ruler-min")
    // this.classList.add("timeline-ruler", `ruler`)

    this.classList.add("ps-0", "overflow-hidden", "position-absolute");

    this.style.top = "40px";

    this.innerHTML = template;
    this.drawRuler();
    // this.addTickNumber(10)
  }

  template() {
    //     return `<ul class="ruler-x">
    //     <li></li><li></li><li></li><li></li><li></li> <!-- repeat -->
    //   </ul>`
    const width = document.querySelector("element-timeline").clientWidth;
    const height = 30;

    return `<canvas ref="canvas" width="${width}" height="${height}"></canvas>`;
  }

  drawRuler() {
    const fullWidth = document.querySelector("element-timeline").clientWidth;
    const fullWeight = 30;

    const canvas = this.querySelector("canvas[ref='canvas']");
    const ctx = canvas.getContext("2d");
    canvas.width = fullWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let range = 1;
    let unitSplit = 1;
    let unit = "s";

    if (this.timeMagnification >= 0.5) {
      range = 1;
      unitSplit = 1;
      unit = "s";
    } else if (this.timeMagnification < 0.5 && this.timeMagnification >= 0.1) {
      range = 5;
      unitSplit = 1;
      unit = "s";
    } else if (this.timeMagnification < 0.1 && this.timeMagnification >= 0.01) {
      range = 60;
      unitSplit = 60;
      unit = "m";
    } else if (
      this.imeMagnification < 0.01 &&
      this.timeMagnification >= 0.001
    ) {
      range = 60 * 5;
      unitSplit = 60;
      unit = "m";
    } else {
      range = 60 * 60;
      unitSplit = 60 * 60;
      unit = "h";
    }

    let startPoint =
      -document.querySelector("element-timeline").scrollLeft %
      (180 * this.timeMagnification * range); //18 * 10 * 3
    let startNumber = Math.floor(
      document.querySelector("element-timeline").scrollLeft /
        (180 * this.timeMagnification * range)
    );

    let term = 18 * this.timeMagnification;
    let maxCount = Number(fullWidth / term) + term;

    for (let count = 0; count < maxCount; count++) {
      if (count % range > 0) {
        continue;
      }

      let point = term * count + startPoint;

      let startX = point;
      let startY = 15;
      let endX = point;
      let endY = 20;

      ctx.beginPath();

      if (count % (10 * range) == 0) {
        startY = 10;
        ctx.strokeStyle = "#e3e3e3";
        ctx.font = "12px serif";
        ctx.strokeText(
          `${(Number(count / 10) + startNumber * range) / unitSplit}${unit}`,
          startX - term / 2,
          10
        );
      } else {
        ctx.strokeStyle = "#e3e3e3";
      }
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ctx.beginPath()
    // ctx.moveTo(0, 20)
    // ctx.lineTo(fullWidth, 20)
    // ctx.strokeStyle = '#e3e3e3'
    // ctx.lineWidth = 1
    // ctx.stroke()
  }

  addTickNumber(licount) {
    // let addedli = '<li></li>'.repeat(licount)
    // this.querySelector("ul").innerHTML = addedli
  }

  updateRulerSpace(timeMagnification) {
    console.log("w", timeMagnification);
    this.timeMagnification = timeMagnification * 1.1111111111;
    this.drawRuler();
    // this.style.removeProperty(`--ruler2-space`)
    // this.style.removeProperty(`--ruler1-space`)
    // // this.style.removeProperty(`--ruler2-min-space`)
    // // this.style.removeProperty(`--ruler1-min-space`)

    // let spaceRuler2 = 50 * timeMagnification
    // let spaceRuler1 = 5 * timeMagnification
    // let spaceIncrese = 1

    // console.log(timeMagnification, this.rulerType[0])

    // if (timeMagnification >= 0.5) {
    //     this.render()
    //     this.rulerType = 'sec'
    //     spaceIncrese = 1
    // } else if (timeMagnification < 0.5 && timeMagnification >= 0.1) {
    //     this.render()
    //     this.rulerType = 'sec5'
    //     spaceRuler2 = 250 * timeMagnification
    //     spaceRuler1 = 25 * timeMagnification
    //     spaceIncrese = 5

    // } else if (timeMagnification < 0.1 && timeMagnification >= 0.01) {
    //     this.render()
    //     this.rulerType = 'min'
    //     spaceRuler2 = 3000 * timeMagnification
    //     spaceRuler1 = 300 * timeMagnification
    //     spaceIncrese = 1

    // } else if (timeMagnification < 0.01 && timeMagnification >= 0.001)  {
    //     this.render()
    //     this.rulerType = 'min5'
    //     spaceRuler2 = 3000 * 5 * timeMagnification
    //     spaceRuler1 = 300 * 5 * timeMagnification
    //     spaceIncrese = 5

    // } else  {
    //     this.render()
    //     this.rulerType = 'hour'
    //     spaceRuler2 = 3000 * 60 * timeMagnification
    //     spaceRuler1 = 300 * 60 * timeMagnification
    //     spaceIncrese = 1

    // }

    // this.style.setProperty(`--ruler1-space`, spaceRuler1); // NOTE: 기본값 5
    // this.style.setProperty(`--ruler2-space`, spaceRuler2); // NOTE: 기본값 50
    // this.style.setProperty(`--ruler3-space`, spaceIncrese); // NOTE: 기본값 5
    // this.style.setProperty(`--ruler3-space-minus`, -spaceIncrese); // NOTE: 기본값 5

    // this.querySelector(".ruler-x").style.setProperty(`--ruler-standard-unit`, `'${this.rulerType[0]}'`); // NOTE: 기본값 5
  }

  updateRulerLength(e) {
    console.log("s");
    // let duration = Number(e.value) * 200
    // this.changeWidth(duration)
    // this.addTickNumber(Number(e.value))
    this.updateTimelineEnd();
  }

  updateTimelineEnd() {
    const elementTimelineEnd = document.querySelector("element-timeline-end");
    const projectDuration = document.querySelector("#projectDuration").value;

    const timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    const timeMagnification = timelineRange / 4;

    elementTimelineEnd.setEndTimeline({
      px: ((projectDuration * 1000) / 5) * timeMagnification,
    });
  }

  changeWidth(px) {
    this.style.width = `${px}px`;
  }

  setTopPosition(px) {
    //this.style.top = `${px}px`
  }

  moveTime(e) {
    const elementTimelineBar = document.querySelector(
      "element-timeline-cursor"
    );
    const elementTimeline = document.querySelector("element-timeline");
    const elementControl = document.querySelector("element-control");

    elementControl.progress = e.pageX + elementTimeline.scrollLeft;
    elementControl.progressTime = elementControl.getTimeFromProgress();

    elementControl.stop();
    elementControl.showTime();
    elementControl.appearAllElementInTime();

    elementTimelineBar.move(e.pageX + elementTimeline.scrollLeft);
  }

  handleMousemove(e) {
    const elementTimelineBar = document.querySelector(
      "element-timeline-cursor"
    );
    const elementTimeline = document.querySelector("element-timeline");
    const elementControl = document.querySelector("element-control");

    elementTimelineBar.move(e.pageX + elementTimeline.scrollLeft);
    elementControl.showTime();

    clearTimeout(this.mouseTimeout);

    this.mouseTimeout = setTimeout(() => {
      clearInterval(this.resizeInterval);
      this.moveTime(e);
    }, 100);
  }

  handleMousedown(e) {
    e.stopPropagation();
    this.moveTime(e);
    this.mousemoveEventHandler = this.handleMousemove.bind(this);
    document.addEventListener("mousemove", this.mousemoveEventHandler);
  }

  handleMouseup(e) {
    document.removeEventListener("mousemove", this.mousemoveEventHandler);
  }

  connectedCallback() {
    this.render();
    this.addEventListener("mousedown", this.handleMousedown.bind(this));
    document.addEventListener("mouseup", this.handleMouseup.bind(this));
    document
      .querySelector("element-timeline")
      .addEventListener("scroll", this.drawRuler.bind(this));
  }
}

class ElementTimelineRange extends HTMLElement {
  constructor() {
    super();

    this.value = 0.9;
  }

  render() {
    const template = this.template();
    this.innerHTML = template;
    this.updateValue();
  }

  template() {
    return `<input ref="range" type="range" class="form-range" min="0" max="6" step="0.02" id="timelineRange" value="6">`;
  }

  updateValue() {
    let inputRange = this.querySelector("input[ref='range']");
    let newValue = ((inputRange.value * inputRange.value) / 10).toFixed(3);
    if (newValue <= 0) {
      return 0;
    }
    this.value = ((inputRange.value * inputRange.value) / 10).toFixed(3);
  }

  updateRange() {
    this.updateValue();
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.changeTimelineRange();

    this.updateTimelineScrollToCenter();
  }

  updateTimelineScrollToCenter() {
    const elementTimelineComponent = document.querySelector("element-timeline");
    const elementTimelineCursor = document.querySelector(
      "element-timeline-cursor"
    );
    let cursorLeft = Number(elementTimelineCursor.style.left.split("px")[0]);
    let timelineWidth = Number(elementTimelineComponent.clientWidth);

    elementTimelineComponent.scrollLeft = cursorLeft - timelineWidth / 2;
  }

  connectedCallback() {
    this.render();
    this.querySelector("input[ref='range']").addEventListener(
      "input",
      this.updateRange.bind(this)
    );
    this.querySelector("input[ref='range']").addEventListener(
      "change",
      this.updateRange.bind(this)
    );
  }
}

class ElementTimelineEnd extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const template = this.template();
    this.innerHTML = template;
  }

  /* 재생 초(max time) 설정 */
  setEndTimeline({ px }) {
    console.log(px);
    this.style.left = `${px}px`;
  }

  template() {
    return ``;
  }

  connectedCallback() {
    this.render();
  }
}

class ElementTimelineScroll extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    const template = this.template();
    this.innerHTML = template;

    this.classList.add("w-100", "fixed-bottom");
  }

  scrollTimeline({ per }) {
    const elementTimeline = document.querySelector("element-timeline");
    const timelineWidth = elementTimeline.scrollWidth;
    const timelineWidthPerStep = timelineWidth / 100;
    const nowWidth = per * timelineWidthPerStep;
    console.log(nowWidth);

    elementTimeline.scrollLeft = nowWidth;
  }

  updateValue() {
    let inputRange = this.querySelector("input[ref='range']");
    console.log(inputRange.value);
    this.scrollTimeline({
      per: inputRange.value,
    });
  }

  updateRange() {
    this.updateValue();
  }

  setScrollThumbLeft({ px }) {
    const elementTimeline = document.querySelector("element-timeline");
    const timelineWidth = elementTimeline.scrollWidth;

    let per = (px / timelineWidth) * 100;
    this.querySelector("input[ref='range']").value = per;
  }

  template() {
    return `<input ref="range" type="range" class="form fixed-bottom w-100" min="0" max="100" step="0.01" value="0">`;
  }

  connectedCallback() {
    this.render();
    this.querySelector("input[ref='range']").addEventListener(
      "input",
      this.updateRange.bind(this)
    );
    this.querySelector("input[ref='range']").addEventListener(
      "change",
      this.updateRange.bind(this)
    );
  }
}

export {
  ElementTimeline,
  ElementTimelineCursor,
  ElementTimelineRuler,
  ElementTimelineRange,
  ElementTimelineEnd,
  ElementTimelineScroll,
};
