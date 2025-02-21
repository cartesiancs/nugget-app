import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { chatLLMStore, IChatLLMPanelStore } from "../../states/chatLlm";

@customElement("ai-input")
export class AiInput extends LitElement {
  isEnter: boolean;
  constructor() {
    super();
    this.isEnter = false;
  }

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  chatLLMState: IChatLLMPanelStore = chatLLMStore.getInitialState();

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  createRenderRoot() {
    return this;
  }

  handleEnter(event) {
    if (event.key === "Enter") {
      if (!this.isEnter) {
        this.isEnter = true;
        event.preventDefault();
        this.executeFunction(event.target.value);
        document.querySelector("#chatLLMInput").value = "";

        this.uiState.setChatSidebar(250);
        setTimeout(() => {
          this.isEnter = false;
        }, 100);
      }
    }
  }

  executeFunction(value) {
    console.log("Entered value:", value);
    window.electronAPI.req.ai
      .text("gpt-3.5-turbo-0125", value)
      .then((result) => {
        if (result.status == 1) {
          this.chatLLMState.addList(result.text.content);
          console.log(result.text.content);
        }
      });
  }

  handleClickInput() {
    this.timelineState.setCursorType("lockKeyboard");
  }

  panelOpen() {
    this.uiState.setChatSidebar(250);
  }

  render() {
    return html`
      <div class="input-group input-group-sm d-flex align-items-center gap-2">
        <input
          type="text"
          class="form-control bg-default text-light bg-darker"
          placeholder="Ask me anything..."
          value=""
          id="chatLLMInput"
          @keydown="${this.handleEnter}"
          @click=${this.handleClickInput}
        />
        <span
          @click=${this.panelOpen}
          class="material-symbols-outlined timeline-bottom-question-icon icon-sm"
          >right_panel_open</span
        >
      </div>
    `;
  }
}
