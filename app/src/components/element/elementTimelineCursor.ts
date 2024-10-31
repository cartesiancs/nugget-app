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

    this.addEventListener("mousedown", this.handleMousedown.bind(this));
    document.addEventListener("mouseup", this.handleMouseup.bind(this));
  }

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineScroll = this.timelineState.scroll;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineScroll = state.scroll;
    });

    return this;
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
}
