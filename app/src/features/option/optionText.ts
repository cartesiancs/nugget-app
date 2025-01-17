import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("option-text")
export class OptionText extends LitElement {
  elementId: string;
  fontList: any[];

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();
  backgroundEnable: boolean;

  constructor() {
    super();

    this.elementId = "";
    this.fontList = [];
    this.backgroundEnable = false;
    this.insertFontLists();
    this.hide();
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const fontListTemplate: any = [];

    for (let index = 0; index < this.fontList.length; index++) {
      const font = this.fontList[index];

      fontListTemplate.push(html` <option
        value-index="${font.index}"
        value="${font.value}"
      >
        ${font.name}
      </option>`);
    }

    return html`
      <div class="mb-2">
        <label class="form-label text-light">Text</label>
        <input
          @click=${this.handleClickTextForm}
          @input=${this.handleChangeText}
          @change=${this.handleChangeText}
          aria-event="text"
          type="text"
          class="form-control bg-default text-light"
          value="TITLE"
        />
      </div>

      <div class="mb-2">
        <label class="form-label text-light">Color</label>
        <input
          @input=${this.handleChangeTextColor}
          aria-event="font-color"
          type="color"
          class="form-control bg-default form-control-color"
          value="#ffffff"
          title="Choose your color"
        />
      </div>

      <div class="mb-2">
        <label class="form-label text-light">Font Size</label>
        <input
          @change=${this.handleChangeTextSize}
          aria-event="font-size"
          type="number"
          class="form-control bg-default text-light"
          value="52"
        />
      </div>

      <div class="mb-2">
        <label class="form-label text-light">Letter Spacing</label>
        <input
          @change=${this.handleChangeLetterSpacing}
          aria-event="letter-spacing"
          type="number"
          class="form-control bg-default text-light"
          value="0"
        />
      </div>

      <div class="mb-2">
        <label class="form-label text-light">Font</label>
        <select
          @change=${this.handleChangeTextFont}
          ref="lists"
          id="fontSelect"
          class="form-select form-control bg-default text-light"
          aria-label="Default select example"
        >
          <option selected>pretendard</option>
          ${fontListTemplate}
        </select>
        <style ref="fontStyles"></style>
      </div>

      <div class="mb-2">
        <div class="btn-group" role="group" aria-label="Basic example">
          <button
            type="button"
            class="btn btn-sm btn-default text-light"
            @click=${this.handleClickEnableBold}
          >
            <span class="material-symbols-outlined icon-sm"> format_bold </span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-default text-light"
            @click=${this.handleClickEnableItalic}
          >
            <span class="material-symbols-outlined icon-sm">
              format_italic
            </span>
          </button>
        </div>
      </div>

      <div class="mb-2">
        <div class="btn-group" role="group" aria-label="Basic example">
          <button
            type="button"
            class="btn btn-sm btn-default text-light"
            @click=${() => this.handleClickAlign("left")}
          >
            <span class="material-symbols-outlined icon-sm">
              format_align_left
            </span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-default text-light"
            @click=${() => this.handleClickAlign("center")}
          >
            <span class="material-symbols-outlined icon-sm">
              format_align_center
            </span>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-default text-light"
            @click=${() => this.handleClickAlign("right")}
          >
            <span class="material-symbols-outlined icon-sm">
              format_align_right
            </span>
          </button>
        </div>
      </div>

      <div class="mb-2">
        <div class="gap-2 ">
          <button
            type="button"
            class="btn btn-sm ${this.backgroundEnable
              ? "btn-primary"
              : "btn-default"}  text-light"
            @click=${this.handleClickEnableBackground}
          >
            Background
          </button>
          <input
            @input=${this.handleChangeBackgroundColor}
            aria-event="background-color"
            type="color"
            class="form-control bg-default form-control-color"
            value="#000000"
            title="Choose your color"
          />
        </div>
      </div>
    `;
  }

  hide() {
    this.classList.add("d-none");
  }

  show() {
    this.classList.remove("d-none");
  }

  setElementId({ elementId }) {
    this.elementId = elementId;
    this.resetValue();
  }

  insertFontLists() {
    window.electronAPI.req.font.getLists().then((result) => {
      if (result.status == 0) {
        return 0;
      }

      for (let index = 0; index < result.fonts.length; index++) {
        const font = result.fonts[index];
        this.fontList.push({
          index: index + 1,
          value: font.path,
          name: font.name,
        });
        this.requestUpdate();
      }
    });
  }

  resetValue() {
    const timeline = document.querySelector("element-timeline").timeline;
    const fontColor: any = this.querySelector("input[aria-event='font-color'");
    const fontSize: any = this.querySelector("input[aria-event='font-size'");

    fontColor.value = timeline[this.elementId].textcolor;
    fontSize.value = timeline[this.elementId].fontsize;

    this.backgroundEnable = timeline[this.elementId].background.enable;
  }

  handleChangeBackgroundColor() {
    const backgroundColor: any = this.querySelector(
      "input[aria-event='background-color'",
    );
    const color = backgroundColor.value;
    this.timelineState.updateTimeline(
      this.elementId,
      ["background", "color"],
      color,
    );
  }

  handleClickEnableBackground() {
    const state = useTimelineStore.getState();
    const enableBackground = state.timeline[this.elementId].background?.enable;
    this.timelineState.updateTimeline(
      this.elementId,
      ["background", "enable"],
      !enableBackground,
    );

    this.backgroundEnable = !enableBackground;

    this.requestUpdate();
  }

  handleClickAlign(align) {
    this.timelineState.updateTimeline(
      this.elementId,
      ["options", "align"],
      align,
    );
  }

  handleClickEnableBold() {
    const state = useTimelineStore.getState();
    this.timelineState.updateTimeline(
      this.elementId,
      ["options", "isBold"],
      !state.timeline[this.elementId].options?.isBold,
    );
  }

  handleClickEnableItalic() {
    const state = useTimelineStore.getState();
    this.timelineState.updateTimeline(
      this.elementId,
      ["options", "isItalic"],
      !state.timeline[this.elementId].options?.isItalic,
    );
  }

  handleClickTextForm() {
    this.timelineState.setCursorType("text");
  }

  handleChangeLetterSpacing(e) {
    const letterSpacing: any = this.querySelector(
      "input[aria-event='letter-spacing'",
    );

    this.timelineState.updateTimeline(
      this.elementId,
      ["letterSpacing"],
      parseInt(letterSpacing.value),
    );
  }

  handleChangeTextColor() {
    const elementControl = document.querySelector("element-control");
    const fontColor: any = this.querySelector("input[aria-event='font-color'");
    const color = fontColor.value;
    elementControl.changeTextColor({ elementId: this.elementId, color: color });
  }

  handleChangeText(e) {
    // e.preventDefault();
    // e.stopPropagation();

    const elementControl = document.querySelector("element-control");
    const text: any = this.querySelector("input[aria-event='text'");

    const textValue = text.value;
    console.log(textValue);
    elementControl.changeTextValue({
      elementId: this.elementId,
      value: textValue,
    });
  }

  handleChangeTextSize() {
    const elementControl = document.querySelector("element-control");
    const fontSize: any = this.querySelector("input[aria-event='font-size'");

    const size = fontSize.value;
    elementControl.changeTextSize({ elementId: this.elementId, size: size });
  }

  handleChangeTextFont(e) {
    const selectFont: any = this.querySelector("select-font");
    const elementControl = document.querySelector("element-control");

    const selectElement = document.querySelector("#fontSelect");

    // 선택된 값 가져오기
    const selectedValue = selectElement.value;

    const value = selectedValue;

    const selectedText =
      selectElement.options[selectElement.selectedIndex].text;

    const type = value.split("/")[value.split("/").length - 1].split(".")[1];

    console.log(value, selectedText, type);

    elementControl.changeTextFont({
      elementId: this.elementId,
      fontPath: value,
      fontType: type,
      fontName: selectedText,
    });
  }
}
