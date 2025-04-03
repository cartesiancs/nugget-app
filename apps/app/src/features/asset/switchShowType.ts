import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { AssetController } from "../../controllers/asset";
import { getLocationEnv } from "../../functions/getLocationEnv";
import { consume, provide } from "@lit/context";
import { assetContext } from "./context/assetContext";

@customElement("switch-showtype")
export class SwitchShowType extends LitElement {
  constructor() {
    super();
  }

  @consume({ context: assetContext })
  @property({ attribute: false })
  public assetOptions = {
    showType: "grid",
  };

  createRenderRoot() {
    return this;
  }

  render() {
    return html` <button
        ref="arrowup"
        class="btn btn-transparent btn-sm ${this.assetOptions.showType == "list"
          ? ""
          : "d-none"}"
        @click=${this._handleClickSwitchShowType}
      >
        <span class="material-symbols-outlined icon-sm"> view_list </span>
      </button>
      <button
        ref="arrowup"
        class="btn btn-transparent btn-sm ${this.assetOptions.showType == "grid"
          ? ""
          : "d-none"}"
        @click=${this._handleClickSwitchShowType}
      >
        <span class="material-symbols-outlined icon-sm"> grid_view </span>
      </button>`;
  }

  _handleClickSwitchShowType() {
    if (this.assetOptions.showType == "grid") {
      this.assetOptions.showType = "list";
    } else if (this.assetOptions.showType == "list") {
      this.assetOptions.showType = "grid";
    }

    this.requestUpdate();
  }
}
