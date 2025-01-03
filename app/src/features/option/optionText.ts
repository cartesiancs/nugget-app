import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("option-text")
export class OptionText extends LitElement {
  elementId: string;
  fontList: any[];

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  constructor() {
    super();

    this.elementId = "";
    this.fontList = [];
    this.insertFontLists();
  }

  createRenderRoot() {
    return this;
  }

  render() {
    this.hide();

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

    return html` <div class="mb-2">
        <label class="form-label text-light">텍스트</label>
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
        <select
          @change=${this.handleChangeTextFont}
          ref="lists"
          id="fontSelect"
          class="form-select form-control bg-default text-light"
          aria-label="Default select example"
        >
          <option selected>Select</option>
          ${fontListTemplate}
        </select>
        <style ref="fontStyles"></style>
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
  }

  handleClickTextForm() {
    this.timelineState.setCursorType("text");
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
