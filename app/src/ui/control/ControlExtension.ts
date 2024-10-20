import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITestStore, testStore } from "../../states/testStore";

@customElement("control-ui-extension")
export class ControlExtension extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html` <button
        class="btn btn-sm btn-default text-light mt-1"
        onclick="ipc.extTest()"
      >
        익스텐션 폴더 불러오기
        <span class="material-symbols-outlined icon-xs"> developer_mode </span>
      </button>

      <button
        class="btn btn-sm btn-default text-light mt-1"
        onclick="ipc.ext()"
      >
        익스텐션 파일 불러오기
      </button>
      <br />

      <div id="extension_webview" class="mt-2">
        <!-- <webview src="https://nugget.studio/"></webview> -->
      </div>`;
  }
}
