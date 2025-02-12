import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { LocaleController } from "../../controllers/locale";
import { VideoElementType } from "../../@types/timeline";
import { KeyframeController } from "../../controllers/keyframe";

@customElement("option-video")
export class OptionVideo extends LitElement {
  elementId: string;
  enableFilter: boolean;
  filterList: any[];
  constructor() {
    super();

    this.elementId = "";
    this.enableFilter = false;
    this.filterList = [];
    this.hide();
  }

  private lc = new LocaleController(this);
  private keyframeControl = new KeyframeController(this);

  @property()
  timelineState: any = useTimelineStore.getInitialState();

  @property()
  timelineCursor = this.timelineState.cursor;

  @property()
  timeline = this.timelineState.timeline;

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

  render() {
    const filterListRender: any = [];

    for (let index = 0; index < this.filterList.length; index++) {
      const element = this.filterList[index];
      filterListRender.push(html`<div class="d-flex col-12">
        <select
          @change=${(e) => this.handleChangeUpdateKey(e, index)}
          class="form-select bg-dark text-light form-select-sm"
          aria-label="select screen"
        >
          <option value="chromakey">Chroma Key</option>
          <option value="blur">Blur</option>
          <option value="radialblur">Radial Blur</option>
        </select>

        <input
          @change=${(e) => this.handleChangeUpdateBlur(e, index)}
          type="number"
          class="form-control bg-default text-light ${this.filterList[index]
            .name == "radialblur"
            ? ""
            : "d-none"}"
          value="5"
        />

        <input
          @change=${(e) => this.handleChangeUpdateBlur(e, index)}
          type="number"
          class="form-control bg-default text-light ${this.filterList[index]
            .name == "blur"
            ? ""
            : "d-none"}"
          value="5"
        />

        <input
          @change=${(e) => this.handleChangeUpdateColor(e, index)}
          type="color"
          class="form-control bg-default text-light ${this.filterList[index]
            .name == "chromakey"
            ? ""
            : "d-none"}"
          value="#000000"
        />
      </div>`);
    }

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

      <button
        type="button"
        class="btn btn-sm mb-2 ${this.enableFilter
          ? "btn-primary"
          : "btn-default"}  text-light"
        @click=${this.handleClickEnableFilter}
      >
        ${!this.enableFilter ? "Enable" : "Disable"} Filter
      </button>

      <div class="mb-4 ${this.enableFilter ? "" : "d-none"}">
        <label class="form-label text-light">Filter List</label>
        <div class="d-flex row gap-2">${filterListRender}</div>

        <button
          type="button"
          class="btn btn-sm mt-2 w-100 bg-dark text-light ${this.filterList
            .length >= 1
            ? "d-none"
            : ""}"
          @click=${this.handleClickAddFilter}
        >
          Add Filter
        </button>

        <button
          type="button"
          class="btn btn-sm mt-2 w-100 bg-dark text-light ${this.filterList
            .length == 1
            ? ""
            : "d-none"}"
          @click=${this.handleClickRemoveFilter}
        >
          Remove Filter
        </button>
      </div>

      <div class="mb-4">
        <label class="form-label text-light">Animate Preset</label>

        <button
          type="button"
          class="btn btn-sm mt-2 w-100 bg-dark text-light"
          @click=${() =>
            this.handleClickAddAnimatePreset(0, 0, 250, 100, "opacity")}
        >
          Fade In
        </button>

        <button
          type="button"
          class="btn btn-sm mt-2 w-100 bg-dark text-light"
          @click=${() =>
            this.handleClickAddAnimatePreset(0, 10, 250, 12, "scale")}
        >
          Zoom In
        </button>
      </div>

      <!-- <div class="mb-2">
        <label class="form-label text-light">Speed</label>
        <input
          @change=${this.updateSpeed}
          aria-event="speed"
          type="number"
          class="form-control bg-default text-light"
          value="1"
          min="0.5"
          max="2"
        />
      </div> -->
    `;
  }

  hide() {
    this.classList.add("d-none");
    this.isShow = false;
  }

  show() {
    this.classList.remove("d-none");
    this.isShow = true;
  }

  isExistElement(elementId) {
    return this.timeline.hasOwnProperty(elementId);
  }

  setElementId({ elementId }) {
    const state = useTimelineStore.getState();
    const timeline = state.timeline as any;

    this.elementId = elementId;
    this.enableFilter = timeline[this.elementId].filter.enable;
    this.filterList = timeline[this.elementId].filter.list;

    this.requestUpdate();
    this.updateValue();
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
          x: 0,
          y: 0,
        };
      }
    }
  }

  updateValue() {
    const xDom: any = this.querySelector(
      "number-input[aria-event='location-x'",
    );
    const yDom: any = this.querySelector(
      "number-input[aria-event='location-y'",
    );

    const position = this.getPosition();

    xDom.value = position.x;
    yDom.value = position.y;
  }

  updateSpeed() {
    const speed = this.querySelector("input[aria-event='speed'") as any;

    this.timelineState.updateTimeline(
      this.elementId,
      ["speed"],
      parseFloat(speed.value),
    );
  }

  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return { r, g, b };
  }

  handleChangeUpdateKey(e, index) {
    console.log(e.target.value);
    this.filterList[index].name = e.target.value;
    document.querySelector("preview-canvas").setChangeFilter();

    this.requestUpdate();
  }

  handleChangeUpdateBlur(e, index) {
    const value = parseFloat(e.target.value);
    const valueArray = [`f=${value}`];
    this.filterList[index].value = valueArray.join(":");
    document.querySelector("preview-canvas").setChangeFilter();

    this.requestUpdate();
  }

  handleChangeUpdateColor(e, index) {
    const rgb = this.hexToRgb(e.target.value);
    const valueArray = [`r=${rgb.r}`, `g=${rgb.g}`, `b=${rgb.b}`];
    this.filterList[index].value = valueArray.join(":");
    document.querySelector("preview-canvas").setChangeFilter();

    this.requestUpdate();
  }

  handleClickAddFilter() {
    const state = useTimelineStore.getState();
    const filterList = state.timeline[this.elementId].filter?.list;

    filterList?.push({
      name: "chromakey",
      value: "r=0:g=0:b=0",
    });

    this.timelineState.updateTimeline(
      this.elementId,
      ["filter", "list"],
      filterList,
    );

    this.filterList = filterList as any;

    document.querySelector("preview-canvas").setChangeFilter();

    this.requestUpdate();
  }

  handleClickRemoveFilter() {
    this.timelineState.updateTimeline(this.elementId, ["filter", "list"], []);

    this.filterList = [];

    document.querySelector("preview-canvas").setChangeFilter();

    this.requestUpdate();
  }

  handleClickAddAnimatePreset(ax, ay, bx, by, type) {
    const state = useTimelineStore.getState();
    let element = state.timeline[this.elementId] as any;

    element.animation[type].isActivate = true;

    this.keyframeControl.addPoint({
      x: ax,
      y: ay,
      line: 0,
      elementId: this.elementId,
      animationType: type,
    });

    this.keyframeControl.addPoint({
      x: bx,
      y: by,
      line: 0,
      elementId: this.elementId,
      animationType: type,
    });

    this.timeline[this.elementId] = element;
    this.timelineState.patchTimeline(this.timeline);

    this.requestUpdate();
  }

  handleClickEnableFilter() {
    const state = useTimelineStore.getState();
    const enableFilter = state.timeline[this.elementId].filter?.enable;

    this.enableFilter = !enableFilter;

    this.timelineState.updateTimeline(
      this.elementId,
      ["filter", "enable"],
      !enableFilter,
    );

    this.requestUpdate();
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
}
