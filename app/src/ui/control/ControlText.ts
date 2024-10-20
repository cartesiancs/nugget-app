import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITestStore, testStore } from "../../states/testStore";

@customElement("control-ui-text")
export class ControlText extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html` <div class="row px-2">
      <div
        class="col-4 d-flex flex-column bd-highlight overflow-hidden mt-1 asset"
        onclick="elementControlComponent.addText()"
      >
        <span class="material-symbols-outlined icon-lg align-self-center">
          text_fields
        </span>
        <b class="align-self-center text-ellipsis text-light text-center"
          >텍스트</b
        >
      </div>
    </div>`;
  }
}
