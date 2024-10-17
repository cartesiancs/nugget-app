class OptionImage extends HTMLElement {
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
    return `
        <label class="form-label text-light">위치</label>
        <div class="d-flex flex-row bd-highlight mb-2">
        <input aria-event="location-x" type="number" class="form-control bg-default text-light me-1" value="0" >
        <input aria-event="location-y" type="number" class="form-control bg-default text-light" value="0" >

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
    const timeline = document.querySelector("element-timeline").timeline;
    const xDom: any = this.querySelector("input[aria-event='location-x'");
    const yDom: any = this.querySelector("input[aria-event='location-y'");
    xDom.value = timeline[this.elementId].location.x;
    yDom.value = timeline[this.elementId].location.y;
  }

  handleLocation() {
    const elementControl = document.querySelector("element-control");
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

  connectedCallback() {
    this.render();
    this.querySelector("input[aria-event='location-x'").addEventListener(
      "change",
      this.handleLocation.bind(this)
    );
    this.querySelector("input[aria-event='location-y'").addEventListener(
      "change",
      this.handleLocation.bind(this)
    );
  }
}

export { OptionImage };
