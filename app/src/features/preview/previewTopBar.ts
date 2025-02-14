import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import {
  IControlPanelStore,
  controlPanelStore,
} from "../../states/controlPanelStore";

@customElement("preview-top-bar")
export class PreviewTopBar extends LitElement {
  constructor() {
    super();
  }

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  control = this.timelineState.control;

  @property()
  controlPanel: IControlPanelStore = controlPanelStore.getInitialState();

  @property()
  activePanel = this.controlPanel.active;

  @property()
  nowActivePanel = this.controlPanel.nowActive;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.control = state.control;
    });

    controlPanelStore.subscribe((state) => {
      this.activePanel = state.active;
      this.nowActivePanel = state.nowActive;
    });

    return this;
  }

  _handleClickButton(type) {
    this.timelineState.setCursorType(type);
  }

  _handleClickPanelButton(panel) {
    this.controlPanel.setActivePanel(panel);
    console.log("A", panel);
  }

  _handleClickRemovePanelButton(panel) {
    const filter = this.activePanel.filter((item) => {
      return item != panel;
    }) as any;
    this.controlPanel.updatePanel(filter);
    this.controlPanel.setActivePanel("");

    console.log("A", panel);
  }

  render() {
    const activePanelMap = this.activePanel.map((item) => {
      return html` <button
        @click=${() => this._handleClickPanelButton(item)}
        class="btn btn-xxs ${this.nowActivePanel == item
          ? "btn-active"
          : "btn-default"} text-light preview-top-button m-0"
      >
        ${item}
        <span
          class="material-symbols-outlined icon-xs"
          @click=${() => this._handleClickRemovePanelButton(item)}
        >
          close
        </span>
      </button>`;
    });

    return html`
      <style>
        .timeline-cursor-buttons {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          height: 2rem;
          border-bottom: 0.05rem #3a3f44 solid;
          align-items: center;
          justify-content: space-between;
        }

        .timeline-cursor-button {
          border: none;
        }

        .preview-top-button {
          font-size: 12px;
          font-weight: bolder;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
      </style>

      <div class="timeline-cursor-buttons bg-darker">
        <div class="d-flex col gap-2 justify-content-start p-1">
          <button
            @click=${() => this._handleClickPanelButton("")}
            class="btn btn-xxs ${this.nowActivePanel == ""
              ? "btn-active"
              : "btn-default"} text-light preview-top-button m-0"
          >
            preview
          </button>

          ${activePanelMap}
        </div>
        <div class="d-flex col gap-2 justify-content-end p-1">
          <button
            @click=${() => this._handleClickButton("pointer")}
            class="btn btn-xxs ${this.control.cursorType == "pointer"
              ? "btn-primary"
              : "btn-default"} text-light m-0"
          >
            <span class="material-symbols-outlined icon-xs"> near_me </span>
          </button>
          <button
            @click=${() => this._handleClickButton("text")}
            class="btn btn-xxs ${this.control.cursorType == "text"
              ? "btn-primary"
              : "btn-default"} text-light m-0"
          >
            <span class="material-symbols-outlined icon-xs"> text_fields </span>
          </button>

          <div class="btn-group">
            <button
              class="btn btn-xxs btn-default dropdown-toggle text-light m-0"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span class="material-symbols-outlined icon-xs"> add </span>
            </button>

            <ul class="dropdown-menu">
              <li>
                <!-- <a class="dropdown-item dropdown-item-sm" href="#">
                  <span class="material-symbols-outlined icon-xs">
                    change_history
                  </span>
                  Polygon</a
                > -->
                <a
                  class="dropdown-item dropdown-item-sm ${this.control
                    .cursorType == "shape"
                    ? "bg-primary"
                    : ""}"
                  @click=${() => this._handleClickButton("shape")}
                >
                  <span class="material-symbols-outlined icon-xs"> edit </span>
                  Pen Tool</a
                >
              </li>
            </ul>
          </div>

          <button
            @click=${() => this._handleClickButton("lockKeyboard")}
            class="btn btn-xxs ${this.control.cursorType == "lockKeyboard"
              ? "btn-primary"
              : "btn-default"} text-light m-0"
          >
            <span class="material-symbols-outlined icon-xs"> lock </span>
          </button>
        </div>
      </div>
    `;
  }
}
