import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LocaleController } from "../../controllers/locale";

@customElement("control-ui-text")
export class ControlText extends LitElement {
  private lc = new LocaleController(this);
  localFontList: any[];
  fontTemplate: any[];

  constructor() {
    super();
    this.localFontList = [];
    this.fontTemplate = [];
    this.getLocalFontList();
  }

  createRenderRoot() {
    return this;
  }

  getLocalFontList() {
    window.electronAPI.req.font.getLocalFontLists().then((result: any) => {
      console.log(result);
      this.localFontList = [...result.fonts];

      for (let index = 0; index < result.fonts.length; index++) {
        const element = result.fonts[index];
        this.fontTemplate.push(html` <div
          class="col-4 d-flex flex-column bd-highlight overflow-hidden mt-1 asset"
          @click=${() => this._handleClickAddText(element.path, element.name)}
        >
          <span class="material-symbols-outlined icon-lg align-self-center">
            text_fields
          </span>
          <b class="align-self-center text-ellipsis text-light text-center"
            >${element.name}</b
          >
        </div>`);
      }
    });
  }

  _handleClickAddText(path, name) {
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.addCustomText({
      path: path,
      name: name,
    });
  }

  _handleClickAddFont() {
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.addText({});
  }

  render() {
    return html` <div class="row px-2">
      <div
        class="col-4 d-flex flex-column bd-highlight overflow-hidden mt-1 asset"
        @click=${this._handleClickAddFont}
      >
        <span class="material-symbols-outlined icon-lg align-self-center">
          text_fields
        </span>
        <b class="align-self-center text-ellipsis text-light text-center"
          >${this.lc.t("setting.text")}</b
        >
      </div>

      ${this.fontTemplate}
    </div>`;
  }
}
