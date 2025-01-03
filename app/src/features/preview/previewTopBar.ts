import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("preview-top-bar")
export class PreviewTopBar extends LitElement {
  constructor() {
    super();
  }

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  control = this.timelineState.control;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.control = state.control;
    });

    return this;
  }

  _handleClickButton(type) {
    this.timelineState.setCursorType(type);
  }

  render() {
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
      </style>

      <div class="timeline-cursor-buttons bg-darker">
        <div></div>
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
        </div>
      </div>
    `;
  }
}
