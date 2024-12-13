import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("option-audio")
export class OptionAudio extends LitElement {
  elementId: any;
  constructor() {
    super();

    this.hide();
    this.elementId = "";
  }

  render() {
    return html` <label class="form-label text-light">오디오</label>
      <div class="d-flex flex-row bd-highlight mb-2"></div>`;
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
}
