import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("control-ui-extension")
export class ControlExtension extends LitElement {
  createRenderRoot() {
    return this;
  }

  extTest() {
    window.electronAPI.req.dialog.openDirectory().then((result) => {
      const projectFolder = document.querySelector("#projectFolder").value;

      projectFolder.value = result || "/";
      const dir = String(projectFolder.value);

      window.electronAPI.req.extension.openDir(dir);
    });
  }

  ext() {
    window.electronAPI.req.dialog.openFile().then((result) => {
      window.electronAPI.req.extension.openFile(result);
    });
  }

  render() {
    return html` <button
        class="btn btn-sm btn-default text-light mt-1"
        @click=${this.extTest}
      >
        Load Ext Folder (dev)
        <span class="material-symbols-outlined icon-xs"> developer_mode </span>
      </button>

      <button class="btn btn-sm btn-default text-light mt-1" @click=${this.ext}>
        Load Ext
      </button>
      <br />

      <div id="extension_webview" class="mt-2">
        <!-- <webview src="https://nugget.studio/"></webview> -->
      </div>`;
  }
}
