import { v4 as uuidv4 } from "uuid";
import { elementUtils } from "../../utils/element.js";
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("element-timeline-cursor")
export class ElementTimelineCursor extends LitElement {
  elementTimelineRuler: any;
  constructor() {
    super();

    this.elementTimelineRuler;

    window.addEventListener("DOMContentLoaded", () => {
      this.elementTimelineRuler = document.querySelector(
        "element-timeline-ruler"
      );
    });

    this.addEventListener("mousedown", this.handleMousedown);
    document.addEventListener("mouseup", this.handleMouseup.bind(this));
  }

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineScroll = this.timelineState.scroll;

  @property()
  timelineCursor = this.timelineState.cursor;

  createRenderRoot() {
    // useTimelineStore.subscribe((state) => {
    //   this.timelineScroll = state.scroll;
    //   this.timelineCursor = state.cursor;
    // });

    return this;
  }

  render() {
    this.style.display = "none";
    this.classList.add("timeline-bar");
    this.setAttribute("id", "timeline_bar");
    const left = parseInt(this.style.left.split("px")[0]);
    this.style.left = `${left}px`;
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
}
