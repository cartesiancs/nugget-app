import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IChatLLMPanelStore, chatLLMStore } from "../../states/chatLLM";
import { IUIStore, uiStore } from "../../states/uiStore";

@customElement("chat-sidebar")
export class ChatSidebar extends LitElement {
  constructor() {
    super();
  }

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  chatLLMState: IChatLLMPanelStore = chatLLMStore.getInitialState();

  @property()
  chatList = this.chatLLMState.list;

  @property()
  width;

  createRenderRoot() {
    chatLLMStore.subscribe((state) => {
      this.chatList = state.list;
    });

    return this;
  }

  panelClose() {
    this.uiState.setChatSidebar(10);
  }

  render() {
    const lists: any = [];
    for (let index = 0; index < this.chatList.length; index++) {
      const element = this.chatList[index];
      lists.push(html`<span class="text-secondary">${element}</span>`);
    }

    return html`
      <style>
        .chat-top {
          border-bottom: 0.05rem #3a3f44 solid;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: start;
          padding-left: 0.5rem;
        }
      </style>

      <div
        style=" min-width: ${this.width}; width: ${this
          .width}; z-index: 998; left: 0.75rem; position: relative;     overflow: scroll;
    padding-bottom: 5rem;"
        class=" ${parseInt(this.width) <= 0
          ? "d-none"
          : ""} h-100 bg-darker option-window"
      >
        <div class="chat-top" style="width: ${parseInt(this.width)}px;">
          <span
            @click=${this.panelClose}
            class="material-symbols-outlined timeline-bottom-question-icon icon-sm text-secondary"
            >right_panel_close</span
          >
        </div>
        <div class="w-100 d-flex row gap-3 p-1 chat-box">${lists}</div>
      </div>
    `;
  }
}
