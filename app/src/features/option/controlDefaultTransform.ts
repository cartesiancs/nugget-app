// position, rotation, opacity, scale, width, height
import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { LocaleController } from "../../controllers/locale";
import { KeyframeController } from "../../controllers/keyframe";
import "../filter/backgroundRemove";

@customElement("default-transform")
export class OptionImage extends LitElement {
  private lc = new LocaleController(this);
  private keyframeControl = new KeyframeController(this);

  @property()
  elementId;

  @property()
  timeline;

  @property()
  timelineCursor;

  @property()
  timelineState;

  @property()
  isShow;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      if (this.isExistElement(this.elementId) && this.isShow) {
        this.updateValue();
      }
    });

    return this;
  }

  constructor() {
    super();
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
    const opacityDom: any = this.querySelector(
      "number-input[aria-event='opacity'",
    );
    const rotationDom: any = this.querySelector(
      "number-input[aria-event='rotation'",
    );
    const width: any = this.querySelector("number-input[aria-event='width'");
    const height: any = this.querySelector("number-input[aria-event='height'");

    const position = this.getPosition();
    const opacity = this.getOpacity();
    const rotation = this.getRotation();

    xDom.value = position.x;
    yDom.value = position.y;
    opacityDom.value = opacity.x;
    rotationDom.value = rotation.x;
    width.value = this.timeline[this.elementId].width;
    height.value = this.timeline[this.elementId].height;
  }

  findNearestY(pairs, a): number | null {
    let closestY = null;
    let closestDiff = Infinity;

    for (const [x, y] of pairs) {
      const diff = Math.abs(x - a);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestY = y;
      }
    }

    return closestY;
  }

  getOpacity() {
    let animationType = "opacity";

    if (
      this.timeline[this.elementId].animation[animationType].isActivate == true
    ) {
      const result = this.getAnimateOpacity(this.elementId) as any;
      if (result != false) {
        return result;
      }
    } else {
      return {
        x: this.timeline[this.elementId].opacity,
      };
    }
  }

  getRotation() {
    let animationType = "rotation";

    if (
      this.timeline[this.elementId].animation[animationType].isActivate == true
    ) {
      const result = this.getAnimateRotation(this.elementId) as any;
      if (result != false) {
        return result;
      }
    } else {
      return {
        x: this.timeline[this.elementId].rotation,
      };
    }
  }

  getPosition() {
    let animationType = "position";

    if (
      this.timeline[this.elementId].animation[animationType].isActivate == true
    ) {
      const result = this.getAnimatePosition(this.elementId) as any;
      if (result != false) {
        return result;
      }
    } else {
      return {
        x: this.timeline[this.elementId].location?.x,
        y: this.timeline[this.elementId].location?.y,
      };
    }
  }

  getAnimatePosition(elementId) {
    if (this.timeline[elementId].animation["position"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        const ax = this.findNearestY(
          this.timeline[elementId].animation["position"].ax,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        const ay = this.findNearestY(
          this.timeline[elementId].animation["position"].ay,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        return {
          x: ax || this.timeline[this.elementId].location?.x,
          y: ay || this.timeline[this.elementId].location?.y,
        };
      } catch (error) {
        return {
          x: this.timeline[this.elementId].location?.x,
          y: this.timeline[this.elementId].location?.y,
        };
      }
    }
  }

  getAnimateOpacity(elementId) {
    if (this.timeline[elementId].animation["opacity"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        const ax = this.findNearestY(
          this.timeline[elementId].animation["opacity"].ax,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        return {
          x: ax || this.timeline[this.elementId].opacity,
        };
      } catch (error) {
        return {
          x: 0,
        };
      }
    }
  }

  getAnimateRotation(elementId) {
    if (this.timeline[elementId].animation["rotation"].isActivate == true) {
      let index = Math.round(this.timelineCursor / 16);
      let indexToMs = index * 20;
      let startTime = Number(this.timeline[elementId].startTime);
      let indexPoint = Math.round((indexToMs - startTime) / 20);

      try {
        const ax = this.findNearestY(
          this.timeline[elementId].animation["rotation"].ax,
          this.timelineCursor - this.timeline[elementId].startTime,
        ) as any;

        return {
          x: ax || this.timeline[this.elementId].rotation,
        };
      } catch (error) {
        return {
          x: 0,
        };
      }
    }
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

  addAnimationDot(x, line: number, animationType) {
    const fileType = this.timeline[this.elementId].filetype as any;
    const startTime = this.timeline[this.elementId].startTime as any;

    if (
      this.timeline[this.elementId].animation[animationType].isActivate != true
    ) {
      return false;
    }

    try {
      this.keyframeControl.addPoint({
        x: this.timelineCursor - startTime,
        y: x,
        line: line,
        elementId: this.elementId,
        animationType: animationType,
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

    this.addAnimationDot(parseInt(opacity.value), 0, "opacity");

    this.timeline[this.elementId].opacity = parseInt(opacity.value);

    this.timelineState.patchTimeline(this.timeline);
  }

  handleRotation() {
    const rotation = this.querySelector(
      "number-input[aria-event='rotation'",
    ) as any;

    this.addAnimationDot(parseInt(rotation.value), 0, "rotation");

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
