import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("timeline-ui")
export class Timeline extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div
        class="split-bottom-bar cursor-row-resize "
        onmousedown="startSplitBottom()"
      ></div>

      <div class="row mb-2">
        <div class="col-4">
          <div class="d-flex justify-content-start">
            <button
              id="playToggle"
              class="btn btn-xs btn-transparent"
              onclick="elementControlComponent.play()"
            >
              <span class="material-symbols-outlined icon-white icon-md">
                play_circle
              </span>
            </button>
            <button
              class="btn btn-xs btn-transparent ms-2"
              onclick="elementControlComponent.reset()"
            >
              <span class="material-symbols-outlined icon-white icon-md">
                replay_circle_filled
              </span>
            </button>
            <b id="time" class="text-light ms-2">00:00:00.00</b>
          </div>
        </div>
        <div class="col-5">
          <div id="keyframeEditorButtonGroup" class="d-none">
            <button
              type="button"
              class="btn btn-dark btn-sm"
              data-bs-dismiss="offcanvas"
              onclick="document.querySelector('keyframe-editor').hideKeyframeEditorButtonGroup()"
              aria-label="close"
            >
              키프레임 에디터 닫기
            </button>
            <div
              class="btn-group"
              role="group"
              id="timelineOptionLineEditor"
            ></div>
          </div>
        </div>

        <div class="col-3 row d-flex align-items-center">
          <element-timeline-range></element-timeline-range>
        </div>
      </div>

      <element-timeline-ruler></element-timeline-ruler>
      <element-timeline id="split_inner_bottom"></element-timeline>
    `;
  }
}
