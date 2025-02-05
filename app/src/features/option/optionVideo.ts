import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { LocaleController } from "../../controllers/locale";

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
    const filterListRender: any = [];

    for (let index = 0; index < this.filterList.length; index++) {
      const element = this.filterList[index];
      filterListRender.push(html`<div class="d-flex col-12">
        <select
          class="form-select bg-dark text-light form-select-sm"
          aria-label="select screen"
        >
          <option value="chromakey">Chroma Key</option>
        </select>

        <input
          @change=${(e) => this.handleChangeUpdateColor(e, index)}
          type="color"
          class="form-control bg-default text-light"
          value="#000000"
        />
      </div>`);
    }

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

      <!-- <button
        type="button"
        class="btn btn-sm mb-2 ${this.enableFilter
        ? "btn-primary"
        : "btn-default"}  text-light"
        @click=${this.handleClickEnableFilter}
      >
        ${!this.enableFilter ? "Enable" : "Disable"} Filter
      </button>

      <div class="mb-2 ${this.enableFilter ? "" : "d-none"}">
        <label class="form-label text-light">Filter List</label>
        <div class="d-flex row gap-2">${filterListRender}</div>

        <button
          type="button"
          class="btn btn-sm mt-2 w-100 bg-dark text-light"
          @click=${this.handleClickAddFilter}
        >
          Add Filter
        </button>
      </div> -->

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
  }

  show() {
    this.classList.remove("d-none");
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

  updateValue() {
    const xDom: any = this.querySelector("input[aria-event='location-x'");
    const yDom: any = this.querySelector("input[aria-event='location-y'");
    xDom.value = this.timeline[this.elementId].location?.x;
    yDom.value = this.timeline[this.elementId].location?.y;
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

  handleChangeUpdateColor(e, index) {
    const rgb = this.hexToRgb(e.target.value);
    const valueArray = [`r=${rgb.r}`, `g=${rgb.g}`, `b=${rgb.b}`];
    this.filterList[index].value = valueArray.join(":");
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
}
