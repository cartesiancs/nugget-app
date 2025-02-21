import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("ai-input")
export class AiInput extends LitElement {
  constructor() {
    super();
  }
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  createRenderRoot() {
    return this;
  }

  handleEnter(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.executeFunction(event.target.value);
    }
  }

  executeFunction(value) {
    console.log("Entered value:", value);
    window.electronAPI.req.ai
      .text("gpt-3.5-turbo-0125", value)
      .then((result) => {
        if (result.status == 1) {
          console.log(result.text.content);
        }
      });
  }

  handleClickInput() {
    this.timelineState.setCursorType("lockKeyboard");
  }

  render() {
    return html`
      <div class="input-group input-group-sm">
        <input
          type="text"
          class="form-control bg-default text-light bg-darker"
          placeholder="Ask me anything..."
          value=""
          @keydown="${this.handleEnter}"
          @click=${this.handleClickInput}
        />
      </div>
    `;
  }
}
