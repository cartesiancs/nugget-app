import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";

@customElement("timeline-ui")
export class Timeline extends LitElement {
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  @property()
  timelineRange = this.timelineState.range;

  @property()
  timelineScroll = this.timelineState.scroll;

  @property()
  timelineCursor = this.timelineState.cursor;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;
      this.timelineRange = state.range;
      this.timelineScroll = state.scroll;
      this.timelineCursor = state.cursor;
    });

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
            <b class="text-light ms-2"
              >${new Date(this.timelineCursor).toISOString().slice(11, 22)}</b
            >
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

        <div class="col-3 row d-flex align-items-center m-0 p-0">
          <element-timeline-range></element-timeline-range>
        </div>
      </div>

      <element-timeline-ruler></element-timeline-ruler>
      <element-timeline id="split_inner_bottom"></element-timeline>
    `;
  }
}
