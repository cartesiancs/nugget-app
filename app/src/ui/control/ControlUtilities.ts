import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LocaleController } from "../../controllers/locale";

@customElement("control-ui-util")
export class ControlText extends LitElement {
  private lc = new LocaleController(this);

  createRenderRoot() {
    return this;
  }

  render() {
    return html` <div class="row px-2">
      <p class="text-secondary">Utilities</p>

      <span>화면 녹화 및 웹캠 레코드</span>
    </div>`;
  }
}
