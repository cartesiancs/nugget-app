class OptionText extends HTMLElement {
  elementId: string;
  constructor() {
    super();

    this.elementId = "";
  }

  render() {
    let template = this.template();
    this.innerHTML = template;
    this.hide();
  }

  template() {
    return `<div class="mb-2">
        <label class="form-label text-light">텍스트 색상 선택</label>
        <input aria-event="font-color" type="color" class="form-control bg-default form-control-color" value="#ffffff" title="Choose your color">
    </div>

    <div class="mb-2">
        <label class="form-label text-light">폰트 크기</label>
        <input aria-event="font-size" type="number" class="form-control bg-default text-light" value="52" >
    </div>

    <div class="mb-2">
        <label class="form-label text-light">폰트</label>
        <select-font></select-font>
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

  connectedCallback() {
    this.render();
    this.querySelector("input[aria-event='font-color'").addEventListener(
      "input",
      this.handleChangeTextColor.bind(this)
    );
    this.querySelector("input[aria-event='font-size'").addEventListener(
      "change",
      this.handleChangeTextSize.bind(this)
    );
    this.querySelector("select-font").addEventListener(
      "onChangeSelect",
      this.handleChangeTextFont.bind(this)
    );
  }
}

export { OptionText };
