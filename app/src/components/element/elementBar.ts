import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("element-bar")
export class ElementBar extends LitElement {
  elementControl: any;
  timeline: any;
  elementId: string;
  elementBarType: string;
  elementFileType: any;
  width: number;
  startTime: number;
  isDrag: boolean;
  isResize: boolean;
  resizeLocation: string;
  initialDuration: number;
  initialPosition: { x: number; y: number };
  filepath: any;
  resizeEventHandler: any;
  dragEventHandler: any;
  resizeRangeLeft: number;
  resizeRangeRight: number;
  constructor() {
    super();

    this.elementControl = document.querySelector("element-control");

    this.timeline = document.querySelector("element-timeline").timeline;

    this.elementId = this.getAttribute("element-id");
    this.elementBarType = this.getAttribute("element-type") || "static";
    this.elementFileType = this.timeline[this.elementId].filetype;

    this.width = this.millisecondsToPx(this.timeline[this.elementId].duration);
    this.startTime = this.millisecondsToPx(
      this.timeline[this.elementId].startTime
    );

    this.isDrag = false;
    this.isResize = false;
    this.resizeLocation = "left";
    this.initialDuration = 1000;

    this.initialPosition = { x: 0, y: 0 };

    let splitedFilepath = this.timeline[this.elementId].localpath.split("/");
    this.filepath = splitedFilepath[splitedFilepath.length - 1];

    this.resizeEventHandler;
    this.dragEventHandler;
  }

  render() {
    let template;
    if (this.elementBarType == "static") {
      template = this.templateStatic();
    } else {
      template = this.templateDynamic();
    }
    const backgroundColor = this.getRandomColor();

    this.classList.add(
      "element-bar",
      "d-block",
      "d-flex",
      "align-items-center"
    );
    this.setAttribute(
      "style",
      `width: ${this.width}px; left: ${this.startTime}px; background-color: ${backgroundColor};`
    );
    this.setAttribute("value", this.elementId);

    this.innerHTML = template;

    this.setTrimBar();
  }

  setTrimBar() {
    if (this.elementBarType == "dynamic") {
      let trimStart = this.millisecondsToPx(
        this.timeline[this.elementId].trim.startTime
      );
      let trimEnd = this.millisecondsToPx(
        this.timeline[this.elementId].trim.endTime
      );

      this.setTrimStart(trimStart);
      this.setTrimEnd(trimEnd);
      this.elementControl.changeTimelineRange();
    }
  }

  templateStatic() {
    return `
      ${this.templateTypeLogo({ type: this.timeline[this.elementId].filetype })}
      <span ref="name">${this.filepath}</span>

      <div
        class="element-bar-resize-left position-absolute"
        onmousedown="this.parentNode.resizeMousedown(this, 'left')"
      ></div>
      <div
        class="element-bar-resize-right position-absolute"
        onmousedown="this.parentNode.resizeMousedown(this, 'right')"
      ></div>
    `;
  }

  templateDynamic() {
    return `
        ${this.templateTypeLogo({
          type: this.timeline[this.elementId].filetype,
        })}
        <span ref="name">${this.filepath}</span>
        <div class="element-bar-hiddenspace-left position-absolute">
            <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="this.parentNode.parentNode.resizeRangeMousedown(this, 'left')">
            </div>
        </div>
        <div class="element-bar-hiddenspace-right position-absolute">
            <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="this.parentNode.parentNode.resizeRangeMousedown(this, 'right')">
            </div>
        </div>
        `;
  }

  templateTypeLogo({ type }) {
    let logos = {
      image: `<span class="material-symbols-outlined">image</span>`,
      video: `<span class="material-symbols-outlined">movie</span>`,
      audio: `<span class="material-symbols-outlined">music_note</span>`,
      text: `<span class="material-symbols-outlined">description</span>`,
    };

    return logos[type];
  }

  getRandomArbitrary(min, max) {
    return Math.round(Math.random() * (max - min) + min);
  }

  getRandomColor() {
    //let color = "#" + Math.round(Math.random() * 0xffffff).toString(16) + '51'
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

  animationPanelMove(left) {
    if (this.elementBarType == "dynamic") {
      return 0;
    }
    document
      .querySelector(`animation-panel[element-id="${this.elementId}"]`)
      .move(left);
  }

  drag(e) {
    if (this.isDrag) {
      let x = e.pageX - this.initialPosition.x;
      let y = e.pageY - this.initialPosition.y;

      this.style.left = `${x}px`;
      this.animationPanelMove(x);
      this.timeline[this.elementId].startTime = this.pxToMilliseconds(x);

      this.dragEditGuide();
    }
  }

  dragEditGuide() {
    let startX =
      this.elementBarType == "static"
        ? Number(this.style.left.split("px")[0])
        : Number(this.style.left.split("px")[0]) +
          this.millisecondsToPx(this.timeline[this.elementId].trim.startTime);
    let endX =
      this.elementBarType == "static"
        ? Number(this.style.left.split("px")[0]) +
          Number(this.style.width.split("px")[0])
        : Number(this.style.left.split("px")[0]) +
          this.millisecondsToPx(this.timeline[this.elementId].trim.endTime);

    let elementBarPosition = {
      startX: startX,
      endX: endX,
    };

    for (const elementId in this.timeline) {
      if (Object.hasOwnProperty.call(this.timeline, elementId)) {
        if (elementId == this.elementId) {
          continue;
        }

        const element = this.timeline[elementId];
        const elementType = elementUtils.getElementType(element.filetype);
        this.guide({
          element: element,
          filetype: elementType,
          elementBarPosition: elementBarPosition,
        });
      }
    }
  }

  // NOTE: element, filetype은 for문에서 돌아가는 기존 엘리먼트
  // NOTE: elementBarPosition은 this bar

  guide({ element, filetype, elementBarPosition }) {
    let startX =
      filetype == "static"
        ? this.millisecondsToPx(element.startTime)
        : this.millisecondsToPx(element.startTime + element.trim.startTime);
    let endX =
      filetype == "static"
        ? this.millisecondsToPx(element.startTime + element.duration)
        : this.millisecondsToPx(element.startTime + element.trim.endTime);
    let checkRange = 10;

    // if (elementBarPosition.startX > startX - checkRange && elementBarPosition.startX < startX + checkRange) {
    //     let px = this.elementBarType == 'static' ? startX : startX - this.millisecondsToPx(this.timeline[this.elementId].trim.startTime)
    //     this.style.left = `${px}px`
    //     this.timeline[this.elementId].startTime = this.pxToMilliseconds(px)
    // }

    if (
      elementBarPosition.startX > startX - checkRange &&
      elementBarPosition.startX < startX + checkRange
    ) {
      let px =
        this.elementBarType == "static"
          ? startX
          : startX -
            this.millisecondsToPx(this.timeline[this.elementId].trim.startTime);
      this.style.left = `${px}px`;
      this.timeline[this.elementId].startTime = this.pxToMilliseconds(px);
    }

    if (
      elementBarPosition.startX > endX - checkRange &&
      elementBarPosition.startX < endX + checkRange
    ) {
      let px =
        this.elementBarType == "static"
          ? endX
          : endX -
            this.millisecondsToPx(this.timeline[this.elementId].trim.startTime);
      this.style.left = `${px}px`;
      this.timeline[this.elementId].startTime = this.pxToMilliseconds(px);
    }

    if (
      elementBarPosition.endX > startX - checkRange &&
      elementBarPosition.endX < startX + checkRange
    ) {
      let px =
        this.elementBarType == "static"
          ? startX -
            this.millisecondsToPx(this.timeline[this.elementId].duration)
          : startX -
            this.millisecondsToPx(this.timeline[this.elementId].trim.endTime);
      this.style.left = `${px}px`;
      this.timeline[this.elementId].startTime = this.pxToMilliseconds(px);
    }

    if (
      elementBarPosition.endX > endX - checkRange &&
      elementBarPosition.endX < endX + checkRange
    ) {
      let px =
        this.elementBarType == "static"
          ? endX - this.millisecondsToPx(this.timeline[this.elementId].duration)
          : endX -
            this.millisecondsToPx(this.timeline[this.elementId].trim.endTime);
      this.style.left = `${px}px`;
      this.timeline[this.elementId].startTime = this.pxToMilliseconds(px);
    }
  }

  dragMousedown(e) {
    this.addEventListener("mousemove", this.drag);

    this.isDrag = true;
    this.initialPosition.x = e.pageX - Number(this.style.left.split("px")[0]);
    this.initialPosition.y = e.pageY;

    this.dragEventHandler = this.drag.bind(this);
    document.addEventListener("mousemove", this.dragEventHandler);
  }

  dragMouseup() {
    document.removeEventListener("mousemove", this.dragEventHandler);
    this.isDrag = false;
  }

  setWidth(width) {
    this.style.width = `${width}px`;
  }

  setLeft(left) {
    this.style.left = `${left}px`;
  }

  setTrimStart(px) {
    let resizeRangeTargetLeft: any = this.querySelector(
      ".element-bar-hiddenspace-left"
    );
    resizeRangeTargetLeft.style.width = `${px}px`;
  }

  setTrimEnd(px) {
    let duration = this.millisecondsToPx(
      this.timeline[this.elementId].duration
    );
    let startTrimWidth = this.millisecondsToPx(
      this.timeline[this.elementId].trim.startTime
    );
    if (duration - startTrimWidth < px) {
      return 0;
    }
    let resizeRangeTargetRight: any = this.querySelector(
      ".element-bar-hiddenspace-right"
    );
    resizeRangeTargetRight.style.width = `${px}px`;
  }

  millisecondsToPx(ms) {
    const timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    const timeMagnification = timelineRange / 4;
    const convertPixel = (ms / 5) * timeMagnification;
    return Number(convertPixel.toFixed(0));
  }

  pxToMilliseconds(px) {
    const timelineRange = Number(
      document.querySelector("element-timeline-range").value
    );
    const timeMagnification = timelineRange / 4;
    const convertMs = (px * 5) / timeMagnification;
    return Number(convertMs.toFixed(0));
  }

  resize(e) {
    this.unselectThisElement();
    this.isDrag = false;

    let x = e.pageX - this.initialPosition.x;
    let y = e.pageY - this.initialPosition.y;

    let duration = this.initialDuration;
    let timelineScrollLeft =
      document.querySelector("element-timeline").scrollLeft;

    if (this.resizeLocation == "left") {
      this.setLeft(x);
      this.setWidth(duration - x);
      this.timeline[this.elementId].startTime = this.pxToMilliseconds(x);
      this.timeline[this.elementId].duration = this.pxToMilliseconds(
        Number(this.style.width.split("px")[0])
      );
      this.animationPanelMove(x);
    } else {
      //this.style.left = `${x-duration}px`
      this.setWidth(
        timelineScrollLeft + e.pageX - Number(this.style.left.split("px")[0])
      );

      //this.timeline[this.elementId].startTime = this.initialPosition.x
      this.timeline[this.elementId].duration = this.pxToMilliseconds(
        Number(this.style.width.split("px")[0])
      );
    }
  }

  resizeRange(e) {
    this.isDrag = false;

    let x = e.pageX - this.initialPosition.x;

    let duration = this.initialDuration;
    let originDuration = Number(this.style.width.split("px")[0]);

    let resizeRangeTargetLeft: any = this.querySelector(
      ".element-bar-hiddenspace-left"
    );
    let resizeRangeTargetRight: any = this.querySelector(
      ".element-bar-hiddenspace-right"
    );
    let timelineElement = document.querySelector("element-timeline");

    let windowWidth = window.innerWidth;
    let timelineBodyWidth = timelineElement.scrollWidth;
    let targetWidth = Number(this.style.width.split("px")[0]);
    let targetLeft = Number(this.style.left.split("px")[0]);
    let targetRight =
      windowWidth - originDuration - targetLeft < 0
        ? timelineBodyWidth - (targetLeft + targetWidth)
        : 0;

    let scrollLeft = timelineElement.scrollLeft;
    let scrollRight = timelineBodyWidth - windowWidth - scrollLeft;
    let marginLeftTargetToWidth =
      windowWidth - originDuration - targetLeft > 0
        ? windowWidth - originDuration - targetLeft - 10
        : 0;

    if (this.resizeLocation == "left") {
      this.setTrimStart(this.initialPosition.x + x + scrollLeft - targetLeft);
      this.timeline[this.elementId].trim.startTime = this.pxToMilliseconds(
        Number(resizeRangeTargetLeft.style.width.split("px")[0])
      );
    } else {
      let px = targetLeft + targetWidth - e.pageX - scrollLeft; // (scrollRight+windowWidth-x-this.initialPosition.x)-marginLeftTargetToWidth-targetRight
      let resizeRangeTargetRight: any = this.querySelector(
        ".element-bar-hiddenspace-right"
      );
      resizeRangeTargetRight.style.width = `${px}px`;

      this.timeline[this.elementId].trim.endTime = Number(
        this.pxToMilliseconds(duration - px).toFixed(0)
      );
    }
  }

  resizeMousedown(e, location) {
    this.isResize = true;
    this.resizeLocation = location;
    this.isDrag = false;
    this.initialPosition.x =
      location == "left"
        ? Number(this.style.left.split("px")[0])
        : Number(this.style.left.split("px")[0]);
    this.initialPosition.y = e.pageY;
    this.initialDuration =
      this.millisecondsToPx(this.timeline[this.elementId].duration) +
      Number(this.style.left.split("px")[0]);

    this.resizeEventHandler = this.resize.bind(this);
    document.addEventListener("mousemove", this.resizeEventHandler);
  }

  resizeRangeMousedown(e, location) {
    const elementBarHideLeft: any = this.querySelector(
      ".element-bar-hiddenspace-left"
    );
    const elementBarHideRight: any = this.querySelector(
      ".element-bar-hiddenspace-right"
    );

    this.isResize = true;
    this.resizeLocation = location;
    this.resizeRangeLeft = Number(
      elementBarHideLeft.style.width.split("px")[0]
    );
    this.resizeRangeRight = Number(
      elementBarHideRight.style.width.split("px")[0]
    );

    this.isDrag = false;
    this.initialPosition.x = Number(this.style.left.split("px")[0]);
    this.initialDuration = this.millisecondsToPx(
      this.timeline[this.elementId].duration
    );

    this.resizeEventHandler = this.resizeRange.bind(this);
    document.addEventListener("mousemove", this.resizeEventHandler);
  }

  resizeMouseup() {
    document.removeEventListener("mousemove", this.resizeEventHandler);

    this.isResize = false;
  }

  changeOutlineColor(action = "add") {
    if (action == "add") {
      this.classList.add("border-inner-light");
    } else if (action == "remove") {
      this.classList.remove("border-inner-light");
    }
  }

  selectThisElement() {
    const elementControl = document.querySelector("element-control");
    if (elementControl.selectElementsId.includes(this.elementId)) {
      return 0;
    }
    elementControl.selectElementsId.push(this.elementId);
    this.changeOutlineColor("add");
  }

  unselectThisElement() {
    const elementControl = document.querySelector("element-control");
    elementControl.selectElementsId = elementControl.selectElementsId.filter(
      (item) => {
        return item !== this.elementId;
      }
    );

    this.changeOutlineColor("remove");
  }

  animationPanelDropdownTemplate() {
    // NOTE: 영상 애니메이션은 아직 지원 안함
    if (this.elementBarType == "dynamic" || this.elementFileType == "text") {
      return "";
    }
    let isShowPanel = this.isShowAnimationPanel();
    let itemName =
      isShowPanel == true ? "애니메이션 패널 닫기" : "애니메이션 패널 열기";
    let itemOnclickEvent =
      isShowPanel == true
        ? `document.querySelector("animation-panel[element-id='${this.elementId}']").hide()`
        : `document.querySelector("animation-panel[element-id='${this.elementId}']").show()`;

    let template = `<menu-dropdown-item onclick=${itemOnclickEvent} item-name="${itemName}"></menu-dropdown-item>`;
    return template;
  }

  isShowAnimationPanel() {
    return document.querySelector(
      `animation-panel[element-id='${this.elementId}']`
    ).isShow;
  }

  showMenuDropdown({ x, y }) {
    let animationPanel = this.animationPanelDropdownTemplate();
    document.querySelector("#menuRightClick").innerHTML = `
            <menu-dropdown-body top="${y}" left="${x}">
            ${animationPanel}

            <menu-dropdown-item onclick="document.querySelector('element-timeline').removeSeletedElements()" item-name="삭제"> </menu-dropdown-item>
        </menu-dropdown-body>`;
  }

  showSideOption() {
    const optionGroup = document.querySelector("option-group");
    optionGroup.showOption({
      filetype: this.elementFileType,
      elementId: this.elementId,
    });
  }

  rightclick(e) {
    const isRightClick = e.which == 3 || e.button == 2;

    if (!isRightClick) {
      return 0;
    }

    this.showMenuDropdown({
      x: e.clientX,
      y: e.clientY,
    });
    //document.querySelector('element-timeline').removeSeletedElements()
  }

  handleMousedown(e) {
    this.selectThisElement();
    this.dragMousedown(e);
    this.showSideOption();
  }

  handleMouseup(e) {
    this.rightclick(e);
    this.selectThisElement();
  }

  connectedCallback() {
    this.render();

    this.addEventListener("mousedown", this.handleMousedown.bind(this));
    this.addEventListener("mouseup", this.handleMouseup.bind(this));

    //this.addEventListener('mousedown', this.dragMousedown.bind(this));
    // this.addEventListener('mouseup', this.rightclick.bind(this));
    // this.addEventListener('mouseup', this.click.bind(this));

    document.addEventListener("mouseup", this.dragMouseup.bind(this));
    document.addEventListener("mouseup", this.resizeMouseup.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener("mousedown", this.handleMousedown);
    this.removeEventListener("mouseup", this.handleMouseup);

    document.removeEventListener("mouseup", this.dragMouseup);
    document.removeEventListener("mouseup", this.resizeMouseup);
  }
}
