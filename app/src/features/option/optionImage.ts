import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { LocaleController } from "../../controllers/locale";
import { KeyframeController } from "../../controllers/keyframe";

@customElement("option-image")
export class OptionImage extends LitElement {
  elementId: string;
  private lc = new LocaleController(this);
  private keyframeControl = new KeyframeController(this);

  @property()
  timelineState: any = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  @property()
  timelineCursor = this.timelineState.cursor;

  @property()
  isShow = false;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineCursor = state.cursor;
      if (this.isExistElement(this.elementId) && this.isShow) {
        this.updateValue();
      }
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
      <div class="d-flex flex-row gap-2 bd-highlight mb-2">
        <number-input
          aria-event="location-x"
          @onChange=${this.handleLocation}
          value="0"
        ></number-input>
        <number-input
          aria-event="location-y"
          @onChange=${this.handleLocation}
          value="0"
        ></number-input>
      </div>

      <label class="form-label text-light">Size</label>
      <div class="d-flex flex-row gap-2 bd-highlight mb-2">
        <number-input
          aria-event="width"
          @onChange=${this.handleSize}
          value="10"
        ></number-input>
        <number-input
          aria-event="height"
          @onChange=${this.handleSize}
          value="10"
        ></number-input>
      </div>

      <label class="form-label text-light"
        >${this.lc.t("setting.opacity")}</label
      >
      <div class="d-flex flex-row bd-highlight mb-2">
        <number-input
          aria-event="opacity"
          @onChange=${this.handleOpacity}
          value="100"
          max="100"
        ></number-input>
      </div>

      <label class="form-label text-light">Rotation</label>
      <div class="d-flex flex-row bd-highlight mb-2">
        <number-input
          aria-event="rotation"
          @onChange=${this.handleRotation}
          value="0"
        ></number-input>
      </div>
    `;
  }

  hide() {
    this.classList.add("d-none");
    this.isShow = true;
  }

  show() {
    this.classList.remove("d-none");
    this.isShow = true;
  }

  public setElementId({ elementId }) {
    this.elementId = elementId;
    this.updateValue();
  }

  isExistElement(elementId) {
    return this.timeline.hasOwnProperty(elementId);
  }

  updateValue() {
    const xDom: any = this.querySelector(
      "number-input[aria-event='location-x'",
    );
    const yDom: any = this.querySelector(
      "number-input[aria-event='location-y'",
    );
    const opacity: any = this.querySelector(
      "number-input[aria-event='opacity'",
    );
    const rotation: any = this.querySelector(
      "number-input[aria-event='rotation'",
    );
    const width: any = this.querySelector("number-input[aria-event='width'");
    const height: any = this.querySelector("number-input[aria-event='height'");

    xDom.value = this.timeline[this.elementId].location?.x;
    yDom.value = this.timeline[this.elementId].location?.y;
    opacity.value = this.timeline[this.elementId].opacity;
    rotation.value = this.timeline[this.elementId].rotation;
    width.value = this.timeline[this.elementId].width;
    height.value = this.timeline[this.elementId].height;
  }

  addAnimationPoint(x, line: number) {
    const fileType = this.timeline[this.elementId].filetype as any;
    const startTime = this.timeline[this.elementId].startTime as any;

    const animationType = "position";
    if (!["image", "video", "text"].includes(fileType)) return false;

    if (
      this.timeline[this.elementId].animation["position"].isActivate != true
    ) {
      return false;
    }

    try {
      this.keyframeControl.addPoint({
        x: this.timelineCursor - startTime,
        y: x,
        line: line,
        elementId: this.elementId,
        animationType: "position",
      });
    } catch (error) {
      console.log(error, "AAARR");
    }
  }

  handleLocation() {
    const xDom: any = this.querySelector(
      "number-input[aria-event='location-x'",
    );
    const yDom: any = this.querySelector(
      "number-input[aria-event='location-y'",
    );

    let x = parseFloat(parseFloat(xDom.value).toFixed(2));
    let y = parseFloat(parseFloat(yDom.value).toFixed(2));

    this.addAnimationPoint(x, 0);
    this.addAnimationPoint(y, 1);

    this.timeline[this.elementId].location = {
      x: x,
      y: y,
    };

    this.timelineState.patchTimeline(this.timeline);
  }

  handleOpacity() {
    const opacity: any = this.querySelector(
      "number-input[aria-event='opacity'",
    );

    this.timeline[this.elementId].opacity = parseInt(opacity.value);

    this.timelineState.patchTimeline(this.timeline);
  }

  handleRotation() {
    const rotation = this.querySelector(
      "number-input[aria-event='rotation'",
    ) as any;

    this.timeline[this.elementId].rotation = parseInt(rotation.value);

    this.timelineState.patchTimeline(this.timeline);
  }

  handleSize() {
    const width: any = this.querySelector("number-input[aria-event='width'");
    const height: any = this.querySelector("number-input[aria-event='height'");

    this.timeline[this.elementId].width = parseFloat(width.value);
    this.timeline[this.elementId].height = parseFloat(height.value);

    this.timelineState.patchTimeline(this.timeline);
  }
}
