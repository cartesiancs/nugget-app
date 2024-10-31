import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("element-timeline")
export class ElementTimeline extends LitElement {
  elementControl: any;
  timelineHashTable: {};
  copyedTimelineData: {};
  editGuideBreakPoint: any[];

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
    });

    return this;
  }

  constructor() {
    super();

    //this.directory = ''
    this.elementControl;

    this.addEventListener("mousedown", this.handleMousedown.bind(this));
    this.addEventListener("scroll", this.handleScroll.bind(this));

    document.addEventListener("keydown", this.handleKeydown.bind(this));

    window.addEventListener("DOMContentLoaded", () => {
      this.elementControl = document.querySelector("element-control");
    });

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

  replaceTimelineBarHeight(height) {
    let timelineBar: any = this.querySelector(".timeline-bar");
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
    // this.querySelector("div[ref='elementLayer']").insertAdjacentHTML(
    //   "afterbegin",
    //   templateBar
    // );
  }

  templateElementBar(elementId) {
    let width = this.timeline[elementId].duration;
    let filetype = this.timeline[elementId].filetype;

    let elementSplitedFilepath = this.timeline[elementId].localpath.split("/");
    let elementFilepath =
      elementSplitedFilepath[elementSplitedFilepath.length - 1];

    let elementType = elementUtils.getElementType(filetype);

    if (elementType == "static") {
      return html`
        <element-bar
          element-id="${elementId}"
          element-type="static"
        ></element-bar>

        <animation-panel element-id="${elementId}">
          <animation-panel-item
            animation-type="position"
            element-id="${elementId}"
          ></animation-panel-item>
        </animation-panel>
      `;
    } else if (elementType == "dynamic") {
      return html`<element-bar
        element-id="${elementId}"
        element-type="dynamic"
      ></element-bar>`;
    } else {
      return html`<div></div>`;
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
    const animationPanel: any = this.querySelector(
      `animation-panel[element-id='${elementId}']`
    );
    animationPanel.show();
  }

  hideAnimationPanel(elementId) {
    const animationPanel: any = this.querySelector(
      `animation-panel[element-id='${elementId}']`
    );

    animationPanel.hide();
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
    const scrollDom: any = this.querySelector("element-timeline-scroll");
    this.fixRulerOnTop();
    this.scrollKeyframeEditor();
    scrollDom.setScrollThumbLeft({
      px: this.scrollLeft,
    });
  }

  render() {
    this.classList.add(
      "col-12",
      "cursor-default",
      "h-100",
      "line",
      "bg-darker"
    );

    return html`
      <element-timeline-cursor></element-timeline-cursor>
      <element-timeline-scroll></element-timeline-scroll>

      <element-timeline-canvas></element-timeline-canvas>
    `;
  }
}

@customElement("element-timeline-range")
export class ElementTimelineRange extends LitElement {
  value: number;

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineRange = this.timelineState.range;

  constructor() {
    super();

    this.value = 0.9;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    this.style.padding = "0px";
    return html`<input
      ref="range"
      type="range"
      class="form-range"
      min="0"
      max="6"
      step="0.02"
      id="timelineRange"
      value="0.5"
      @change=${this.updateRange}
      @input=${this.updateRange}
    />`;
  }

  updateValue() {
    let inputRange: any = this.querySelector("input[ref='range']");
    let newValue = parseFloat(
      (
        (parseFloat(inputRange.value) * parseFloat(inputRange.value)) /
        10
      ).toFixed(3)
    );
    if (newValue <= 0) {
      return 0;
    }
    this.value = parseFloat(
      ((inputRange.value * inputRange.value) / 10).toFixed(3)
    );

    this.timelineState.setRange(this.value);
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
}

@customElement("element-timeline-end")
export class ElementTimelineEnd extends LitElement {
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

@customElement("element-timeline-scroll")
export class ElementTimelineScroll extends LitElement {
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
    let inputRange: any = this.querySelector("input[ref='range']");
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
    const rangeDom: any = this.querySelector("input[ref='range']");

    let per = (px / timelineWidth) * 100;
    rangeDom.value = per;
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
