import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { LocaleController } from "../../controllers/locale";

@customElement("option-image")
export class OptionImage extends LitElement {
  elementId: string;
  private lc = new LocaleController(this);

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

    this.elementId = "";
    this.hide();
  }

  render() {
    return html`
      <label class="form-label text-light"
        >${this.lc.t("setting.position")}</label
      >
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
      </div>

      <label class="form-label text-light"
        >${this.lc.t("setting.opacity")}</label
      >
      <div class="d-flex flex-row bd-highlight mb-2">
        <input
          aria-event="opacity"
          type="number"
          class="form-control bg-default text-light me-1"
          value="100"
          @change=${this.handleOpacity}
        />
      </div>
    `;
  }

  hide() {
    this.classList.add("d-none");
  }

  show() {
    this.classList.remove("d-none");
  }

  public setElementId({ elementId }) {
    this.elementId = elementId;
    this.updateValue();
  }

  updateValue() {
    const xDom: any = this.querySelector("input[aria-event='location-x'");
    const yDom: any = this.querySelector("input[aria-event='location-y'");
    const opacity: any = this.querySelector("input[aria-event='opacity'");

    xDom.value = this.timeline[this.elementId].location.x;
    yDom.value = this.timeline[this.elementId].location.y;
    opacity.value = this.timeline[this.elementId].opacity;
  }

  handleLocation() {
    const targetElement = document.querySelector(
      `element-control-asset[element-id='${this.elementId}']`,
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

  handleOpacity() {
    const opacity: any = this.querySelector("input[aria-event='opacity'");

    this.timeline[this.elementId].opacity = parseInt(opacity.value);

    this.timelineState.patchTimeline(this.timeline);
  }
}
