import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LocaleController } from "../../controllers/locale";

@customElement("control-ui-filter")
export class ControlText extends LitElement {
  private lc = new LocaleController(this);

  createRenderRoot() {
    return this;
  }

  render() {
    return html` <div class="row px-2">
      <div
        class="accordion text-light"
        style="margin: 0px; padding: 0px;"
        id="accordionExample"
      >
        <div class="accordion-item">
          <h2 class="accordion-header" id="OverlayAccordion">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOne"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              Overlay Filter
            </button>
          </h2>
          <div
            id="collapseOne"
            class="accordion-collapse collapse show"
            aria-labelledby="OverlayAccordion"
            data-bs-parent="#accordionExample"
          >
            <div class="accordion-body">...</div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header" id="TransitionAccordion">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseTransition"
              aria-expanded="true"
              aria-controls="collapseTransition"
            >
              Transition Filter
            </button>
          </h2>
          <div
            id="collapseTransition"
            class="accordion-collapse collapse"
            aria-labelledby="TransitionAccordion"
            data-bs-parent="#accordionExample"
          >
            <div class="accordion-body">...</div>
          </div>
        </div>
      </div>
    </div>`;
  }
}
