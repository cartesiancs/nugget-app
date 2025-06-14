import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { IUIStore, uiStore } from "./states/uiStore";
import "./features/demo/warningDemoEnv";
import "./features/gpt/chatSidebar";

@customElement("app-root")
export class App extends LitElement {
  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  topBarTitle = this.uiState.topBarTitle;

  freeze = false;
  error = "";

  createRenderRoot() {
    uiStore.subscribe((state) => {
      this.resize = state.resize;
      this.topBarTitle = state.topBarTitle;
      this.freeze = state.thinking;
      this.error = state.bigError;
      this.requestUpdate();
    });

    return this;
  }

  _handleClick() {
    this.uiState.updateVertical(this.resize.vertical.bottom + 2);
  }

  _dismissError() {
    this.error = "";
    // Optionally, also clear from uiStore if that's where error is set
    uiStore.getState().unsetBigError();
    this.requestUpdate();
  }

  render() {
    return html`
      <style>
        .ghost-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(
            0,
            0,
            0,
            0.5
          ); /* Semi-transparent background */
          backdrop-filter: blur(5px); /* Blur effect */
          z-index: 9999; /* High z-index to be on top */
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 2em;
        }

        .spinner {
          border: 8px solid #f3f3f3; /* Light grey */
          border-top: 8px solid #3498db; /* Blue */
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .error-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.95);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #fff;
          font-size: 1.5em;
        }
        .error-dismiss-btn {
          margin-top: 2em;
          padding: 0.5em 2em;
          font-size: 1em;
          background: #e74c3c;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>
      ${this.error
        ? html`
            <div class="error-overlay">
              <div>${this.error}</div>
              <button class="error-dismiss-btn" @click="${this._dismissError}">Dismiss</button>
            </div>
          `
        : ""}
      ${this.freeze && !this.error
        ? html`<div class="ghost-overlay"><div class="spinner"></div></div>`
        : ""}
      <asset-upload-drop></asset-upload-drop>
      <tutorial-group>
        <tutorial-popover
          tutorial-idx="1"
          tutorial-title="test"
          tutorial-message="fsdf"
          target-element-id="split_col_1"
        ></tutorial-popover>
      </tutorial-group>

      <div class="top-bar">
        <b>${this.topBarTitle}</b>
      </div>

      <body class="h-100 bg-dark">
        <div id="app"></div>

        <div class="d-flex col justify-content-start">
          <div
            style="height: 97vh;padding-left: var(--bs-gutter-x,.75rem);width: calc(100% - ${this
              .resize.chatSidebar}px);"
          >
            <control-ui
              id="split_top"
              class="row align-items-start"
              style="height: ${this.resize.vertical.top}%;"
            ></control-ui>
            <timeline-ui
              id="split_bottom"
              class="row position-relative split-top align-items-end bg-darker line-top"
              style="height: ${this.resize.vertical.bottom}%;"
            ></timeline-ui>
          </div>

          <chat-sidebar width="${this.resize.chatSidebar}px"></chat-sidebar>
        </div>

        <offcanvas-list-ui></offcanvas-list-ui>
        <modal-list-ui></modal-list-ui>
        <toast-list-ui></toast-list-ui>

        <div id="menuRightClick"></div>
        <style id="fontStyles" ref="fontStyles"></style>

        <toast-box></toast-box>

        <warning-demo></warning-demo>
      </body>
    `;
  }
}
