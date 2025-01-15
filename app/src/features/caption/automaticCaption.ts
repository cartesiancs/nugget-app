import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

@customElement("automatic-caption")
export class AutomaticCaption extends LitElement {
  constructor() {
    super();
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        class="d-flex"
        style="flex-direction: column;
    padding: 1rem;     justify-content: center;
    align-items: center;
    gap: 1rem;"
      >
        <button class="btn btn-sm btn-default text-light mt-1">
          Load video
        </button>
      </div>
    `;
  }
}
