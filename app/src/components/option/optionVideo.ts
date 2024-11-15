import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("option-video")
export class OptionVideo extends LitElement {
  elementId: string;
  constructor() {
    super();

    this.elementId = "";
    this.hide();
  }

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

  render() {
    return html` <label class="form-label text-light">위치</label>
      <div class="d-flex flex-row bd-highlight mb-2">
        <input
          aria-event="location-x"
          type="number"
          class="form-control bg-default text-light me-1"
          value="0"
          @change=${this.handleLocation}
        />
        <input
          aria-event="location-y"
          type="number"
          class="form-control bg-default text-light"
          value="0"
          @change=${this.handleLocation}
        />
      </div>`;
  }

  hide() {
    this.classList.add("d-none");
  }

  show() {
    this.classList.remove("d-none");
  }

  setElementId({ elementId }) {
    this.elementId = elementId;
    this.updateValue();
  }

  updateValue() {
    const xDom: any = this.querySelector("input[aria-event='location-x'");
    const yDom: any = this.querySelector("input[aria-event='location-y'");
    xDom.value = this.timeline[this.elementId].location.x;
    yDom.value = this.timeline[this.elementId].location.y;
  }

  handleLocation() {
    const targetElement = document.querySelector(
      `element-control-asset[element-id='${this.elementId}']`
    );
    const xDom: any = this.querySelector("input[aria-event='location-x'");
    const yDom: any = this.querySelector("input[aria-event='location-y'");

    let x = xDom.value;
    let y = yDom.value;

    let convertLocation = targetElement.convertAbsoluteToRelativeSize({
      x: x,
      y: y,
    });

    targetElement.changeLocation({
      x: convertLocation.x,
      y: convertLocation.y,
    });
  }
}
