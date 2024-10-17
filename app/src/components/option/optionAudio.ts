class OptionAudio extends HTMLElement {
  elementId: any;
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
        <label class="form-label text-light">오디오</label>
        <div class="d-flex flex-row bd-highlight mb-2">


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
    const elementTimeline: any = document.querySelector("element-timeline");
    const timeline = elementTimeline.timeline;
  }

  connectedCallback() {
    this.render();
  }
}

export { OptionAudio };
