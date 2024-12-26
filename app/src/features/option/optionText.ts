import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("option-text")
export class OptionText extends LitElement {
  elementId: string;

  constructor() {
    super();

    this.elementId = "";
  }

  createRenderRoot() {
    return this;
  }

  render() {
    this.hide();

    return html` <div class="mb-2">
        <label class="form-label text-light">텍스트</label>
        <input
          @input=${this.handleChangeText}
          aria-event="text"
          type="text"
          class="form-control bg-default text-light"
          value="텍스트"
        />
      </div>

      <div class="mb-2">
        <label class="form-label text-light">텍스트 색상 선택</label>
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
        <label class="form-label text-light">폰트 크기</label>
        <input
          @change=${this.handleChangeTextSize}
          aria-event="font-size"
          type="number"
          class="form-control bg-default text-light"
          value="52"
        />
      </div>

      <div class="mb-2">
        <label class="form-label text-light">폰트</label>
        <select-font
          onChangeSelect=${this.handleChangeTextFont.bind(this)}
        ></select-font>
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
    this.resetValue();
  }

  resetValue() {
    const timeline = document.querySelector("element-timeline").timeline;
    const fontColor: any = this.querySelector("input[aria-event='font-color'");
    const fontSize: any = this.querySelector("input[aria-event='font-size'");

    fontColor.value = timeline[this.elementId].textcolor;
    fontSize.value = timeline[this.elementId].fontsize;
  }

  handleChangeTextColor() {
    const elementControl = document.querySelector("element-control");
    const fontColor: any = this.querySelector("input[aria-event='font-color'");
    const color = fontColor.value;
    elementControl.changeTextColor({ elementId: this.elementId, color: color });
  }

  handleChangeText() {
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

  handleChangeTextFont() {
    const selectFont: any = this.querySelector("select-font");
    const elementControl = document.querySelector("element-control");

    elementControl.changeTextFont({
      elementId: this.elementId,
      fontPath: selectFont.path,
      fontType: selectFont.type,
      fontName: selectFont.fontname,
    });
  }
}
