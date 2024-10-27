import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("element-timeline-ruler")
export class ElementTimelineRuler extends LitElement {
  mousemoveEventHandler: any;
  mouseTimeout: any;
  rulerType: string;
  timeMagnification: number;
  imeMagnification: number;
  resizeInterval: string | number;
  width: any;
  height: number;
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

    this.classList.add("ps-0", "overflow-hidden", "position-absolute");

    this.style.top = "40px";

    this.innerHTML = template;
    this.drawRuler();
  }

  template() {
    this.width = document.querySelector("element-timeline").clientWidth;
    this.height = 30;

    return `<canvas ref="canvas" width="${this.width}" height="${this.height}" style="width: ${this.width}px; height: ${this.height}px;"></canvas>`;
  }

  drawRuler() {
    this.width = document.querySelector("element-timeline").clientWidth;

    const canvas: HTMLCanvasElement = this.querySelector(
      "canvas[ref='canvas']"
    );
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    canvas.style.width = `${this.width}px`;

    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

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
    let maxCount = Number(this.width / term) + term;

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
  }

  addTickNumber(licount) {
    // let addedli = '<li></li>'.repeat(licount)
    // this.querySelector("ul").innerHTML = addedli
  }

  updateRulerSpace(timeMagnification) {
    this.timeMagnification = timeMagnification * 1.1111111111;
    this.drawRuler();
  }

  updateRulerLength(e) {
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
