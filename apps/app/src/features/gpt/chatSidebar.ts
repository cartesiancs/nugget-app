import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IChatLLMPanelStore, chatLLMStore } from "../../states/chatLLM";
import { IUIStore, uiStore } from "../../states/uiStore";
import "./aiInput";

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

  thinking;

  createRenderRoot() {
    chatLLMStore.subscribe((state) => {
      this.chatList = state.list;
    });

    uiStore.subscribe((state) => {
      console.log("chat update -> thinking", state.thinking);
      this.thinking = state.thinking;
      // re render
      this.requestUpdate();
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

      if (element.from == "user") {
        lists.push(html` <div class="d-flex justify-content-end w-100">
          <span
            style="background-color: #3B3B40; color: #DCDCDC; border-radius: 8px; padding: 10px 15px; box-shadow: none; max-width: 75%; text-align: left; white-space: normal; display: inline-block;"
            >${element.text}</span
          >
        </div>`);
      } else if (element.from == "agent") {
        lists.push(html` <div class="d-flex justify-content-start w-100">
          <span
            style="background-color: #2C2C30; color: #DCDCDC; border-radius: 8px; padding: 10px 15px; box-shadow: none; max-width: 75%; text-align: left; white-space: normal; display: inline-block;"
            >${element.text}</span
          >
        </div>`);
      }
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
        .chat-sidebar-container {
          min-width: ${this.width};
          width: ${this.width};
          z-index: 998;
          left: 0.75rem;
          position: relative;
          overflow-y: auto; /* Changed from scroll to auto for better scroll behavior */
          padding-bottom: 5rem; /* Ensure space for sticky input */
          display: flex; /* Added for flex layout */
          flex-direction: column; /* Stack children vertically */
          justify-content: space-between; /* Push input to bottom */
        }
        .chat-box-container {
          flex-grow: 1; /* Allow this to take available space */
          overflow-y: auto; /* Scroll only this part if content overflows */
        }
        .sticky-input {
          position: sticky;
          bottom: 0;
          background-color: var(--bs-darker); /* Match theme */
          padding: 0.5rem 0; /* Add some padding */
          border-top: 0.05rem #3a3f44 solid; /* Optional: add a top border */
        }
      </style>

      <div
        style=" min-width: ${this.width}; width: ${
      this.width
    }; z-index: 998; left: 0.75rem; position: relative;     
    padding-bottom: 0;" /* Removed padding-bottom here, handled by sticky-input container */
        class=" ${
          parseInt(this.width) <= 0 ? "d-none" : ""
        } h-100 bg-darker option-window chat-sidebar-container"
      >
        <div>
          <div class="chat-top" style="width: ${parseInt(this.width)}px;">
            <span
              @click=${this.panelClose}
              class="material-symbols-outlined timeline-bottom-question-icon icon-sm text-secondary"
              >right_panel_close</span
            >
          </div>
          <div class="w-100 d-flex row gap-3 p-1 chat-box-container">${lists}</div>
        </div>

        <div class="d-flex justify-content-center align-items-center">
          ${this.thinking
            ? html`<span class="material-symbols-outlined icon-md text-secondary"
                >sync</span
              >
                <span class="text-secondary">Thinking...</span>`
            : ""}
        </div>

        <div class="sticky-input w-100 p-2 mb-4 d-flex justify-content-center">
          <ai-input style="width: 90%;" .hideOpenButton=${true}></ai-input>
        </div>
      </div>
    `;
  }
}
