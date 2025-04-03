import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("progress-bar")
export class ProgressBar extends LitElement {
  @property({ type: Number })
  percent = 0;

  createRenderRoot() {
    return this;
  }

  static styles = css`
    /* Bootstrap 5의 기본 스타일을 사용하므로, 추가 스타일이 필요한 경우 여기에 작성합니다. */
  `;

  render() {
    return html`
      <div class="progress bg-dark">
        <div
          class="progress-bar"
          role="progressbar"
          style="width: ${this.percent}%;"
          aria-valuenow="${this.percent}"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    `;
  }
}
