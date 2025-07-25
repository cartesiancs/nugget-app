import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { IKeyframeStore, keyframeStore } from "../../states/keyframeStore";
import "../../features/element/elementTimelineScroll";
import "../../features/element/elementTimelineBottom";
import "../../features/gpt/aiInput";

@customElement("timeline-ui")
export class Timeline extends LitElement {
  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timelineCursor = this.timelineState.cursor;

  @property()
  isAbleResize: boolean = false;

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  keyframeState: IKeyframeStore = keyframeStore.getInitialState();

  @property()
  target = this.keyframeState.target;

  @property()
  isPlay: boolean = this.timelineState.control.isPlay;

  @property()
  control = this.timelineState.control;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timelineCursor = state.cursor;
      this.isPlay = state.control.isPlay;
      this.control = state.control;
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    keyframeStore.subscribe((state) => {
      this.target = state.target;
    });

    window.addEventListener("mouseup", this._handleMouseUp.bind(this));
    window.addEventListener("mousemove", this._handleMouseMove.bind(this));
    document.addEventListener("keydown", this._handleKeydown.bind(this));

    return this;
  }

  play() {
    if (this.control.cursorType != "pointer") {
      return false;
    }
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.play();

    this.timelineState.setPlay(true);
  }

  stop() {
    if (this.control.cursorType != "pointer") {
      return false;
    }

    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.stop();

    this.timelineState.setPlay(false);
  }

  _handleClickClosedKeyframe() {
    const keyframeEditor: HTMLElement | null =
      document.getElementById("option_bottom");
    if (keyframeEditor == null) return false;

    keyframeEditor.classList.remove("show");
    keyframeEditor.classList.add("hide");

    document
      .querySelector("element-timeline-canvas")
      .closeAnimationPanel(this.target.elementId);

    this.keyframeState.update({
      elementId: "",
      animationType: "position",
      isShow: false,
    });
  }

  _handleKeydown(event) {
    if (event.keyCode == 32) {
      //event.preventDefault();
      // Space
      if (this.isPlay) {
        this.stop();
      } else {
        this.play();
      }
    }
  }

  _handleMouseMove(e) {
    const elementControlComponent = document.querySelector("element-control");

    if (this.isAbleResize) {
      const topBarHeight = 60;

      const windowHeight = window.innerHeight + topBarHeight;
      const nowY = e.clientY;
      const resizeY = 100 - (nowY / windowHeight) * 103; // 103인 이유는 Vertical 전체가 windowHeight의 97%이기 떄문.
      if (resizeY <= 20) {
        this.uiState.updateVertical(20);
        elementControlComponent.resizeEvent();
        return false;
      }

      this.uiState.updateVertical(resizeY);
      elementControlComponent.resizeEvent();
    }
  }

  _handleMouseUp() {
    this.isAbleResize = false;
  }

  _handleClickResizeBar() {
    this.isAbleResize = true;
  }

  _handleClickPlay() {
    this.play();
  }

  _handleClickStop() {
    this.stop();
  }

  _handleClickReset() {
    const elementControlComponent = document.querySelector("element-control");
    elementControlComponent.reset();
    this.timelineState.setPlay(false);
  }

  togglePlayButton() {
    if (this.isPlay) {
      return html`<button
        id="playToggle"
        class="btn btn-xs2 btn-transparent"
        @click=${this._handleClickStop}
      >
        <span class="material-symbols-outlined icon-white icon-md">
          stop_circle
        </span>
      </button>`;
    } else {
      return html`<button
        id="playToggle"
        class="btn btn-xs2 btn-transparent"
        @click=${this._handleClickPlay}
      >
        <span class="material-symbols-outlined icon-white icon-md">
          play_circle
        </span>
      </button>`;
    }
  }

  // Smaller variant for compact control groups
  togglePlayButtonSmall() {
    if (this.isPlay) {
      return html`<button
        id="playToggleSmall"
        class="btn btn-xs2 btn-transparent"
        @click=${this._handleClickStop}
      >
        <span class="material-symbols-outlined icon-white icon-m">
          stop_circle
        </span>
      </button>`;
    } else {
      return html`<button
        id="playToggleSmall"
        class="btn btn-xs2 btn-transparent"
        @click=${this._handleClickPlay}
      >
        <span class="material-symbols-outlined icon-white icon-m">
          play_circle
        </span>
      </button>`;
    }
  }

  // Move the timeline cursor 10 seconds back
  _handleClickBackward10() {
    if (this.control.cursorType != "pointer") return;

    const newCursor = Math.max(0, this.timelineCursor - 10000); // 10 000 ms
    this.timelineState.setCursor(newCursor);
  }

  // Move the timeline cursor 10 seconds forward
  _handleClickForward10() {
    if (this.control.cursorType != "pointer") return;

    // Avoid negative ranges – the upper bound will naturally be limited by range logic elsewhere
    const newCursor = this.timelineCursor + 10000;
    this.timelineState.setCursor(newCursor);
  }

  // Change cursor tool type (pointer/text/lock etc.)
  _handleClickCursor(type: "pointer" | "text" | "shape" | "lockKeyboard") {
    // When the user selects the "text" tool from the top-bar we want to instantly
    // create a new text element – mirroring the behaviour of the left-hand
    // Control panel’s "Add Text" button. This prevents the UX issue where
    // clicking the icon appeared to do nothing.

    if (type === "text") {
      const elementControlComponent: any = document.querySelector("element-control");

      // Safeguard in case the component can’t be found or the method signature
      // changes in the future.
      if (elementControlComponent && typeof elementControlComponent.addText === "function") {
        // Use default parameters – identical to <control-ui-text> behaviour.
        const elementId = elementControlComponent.addText({});

        try {
          // Make the newly created element active & outlined so users know it’s ready to edit.
          elementControlComponent.deactivateAllOutline?.();
          elementControlComponent.activeElementId = elementId;
          elementControlComponent.existActiveElement = true;

          // Display the Option->Text panel pre-filled for this element.
          const optionGroup: any = document.querySelector("option-group");
          optionGroup?.showOption({ filetype: "text", elementId });
        } catch (_) {
          /* non-critical – fail silently */
        }
      }
    }

    this.timelineState.setCursorType(type);
  }

  keyframeOption() {
    if (this.target.isShow) {
      return html`
        <button
          type="button"
          class="btn btn-dark btn-xs"
          data-bs-dismiss="offcanvas"
          @click=${this._handleClickClosedKeyframe}
          aria-label="close"
          style="    white-space: nowrap;"
        >
          Close Keyframe
        </button>
      `;
    }

    return html``;
  }

  render() {
    return html`
      <div
        class="split-bottom-bar cursor-row-resize "
        @mousedown=${this._handleClickResizeBar}
      ></div>

      <!-- Top controls section -->
      <div style="height: 60px; margin-bottom: 0; padding: 0.5rem 1rem; display: flex; align-items: center;">
        <div class="row w-100">
          <div class="col-4">
            <div class="d-flex justify-content-start align-items-center gap-2">
              <button
                class="btn btn-xs2 btn-transparent ms-3 d-flex align-items-center"
                @click=${this._handleClickReset}
              >
                <span class="material-symbols-outlined icon-white icon-md">
                  replay_circle_filled
                </span>
              </button>
              <b class="text-light"
                >${new Date(this.timelineCursor).toISOString().slice(11, 22)}</b
              >

              <!-- Cursor tool capsule (pointer / text / lock) -->
              <div
                class="d-flex justify-content-center align-items-center gap-2 mt-1"
                style="background: rgba(255, 255, 255, 0.07); border-radius: 8px; padding: 0.25rem 0.8rem;"
              >
                <button
                  class="btn btn-xs2 btn-transparent d-flex align-items-center"
                  @click=${() => this._handleClickCursor("pointer")}
                >
                  <span class="material-symbols-outlined icon-white icon-sm ${this.control.cursorType == "pointer" ? "text-primary" : ""}">near_me</span>
                </button>

                <button
                  class="btn btn-xs2 btn-transparent d-flex align-items-center"
                  @click=${() => this._handleClickCursor("text")}
                >
                  <span class="material-symbols-outlined icon-white icon-sm ${this.control.cursorType == "text" ? "text-primary" : ""}">text_fields</span>
                </button>

                <button
                  class="btn btn-xs2 btn-transparent d-flex align-items-center"
                  @click=${() => this._handleClickCursor("lockKeyboard")}
                >
                  <span class="material-symbols-outlined icon-white icon-sm ${this.control.cursorType == "lockKeyboard" ? "text-primary" : ""}">lock</span>
                </button>
              </div>
            </div>
          </div>
          <div class="d-flex col col-5 justify-content-center">
            <div
              class="d-flex justify-content-center align-items-center gap-3"
              style="margin-bottom: 0.3rem; background: rgba(255, 255, 255, 0.07); border-radius: 10px; padding: 0.30rem 1rem; align-self: center;"
            >
              <button
                class="btn btn-xs2 btn-transparent d-flex align-items-center"
                @click=${this._handleClickBackward10}
              >
                <span class="material-symbols-outlined icon-white icon-m">replay_10</span>
              </button>

              ${this.togglePlayButtonSmall()}

              <button
                class="btn btn-xs2 btn-transparent d-flex align-items-center"
                @click=${this._handleClickForward10}
              >
                <span class="material-symbols-outlined icon-white icon-m">forward_10</span>
              </button>
            </div>
          </div>

          <div class="col-3 d-flex justify-content-end align-items-center">
            <element-timeline-range></element-timeline-range>
          </div>
        </div>
      </div>

      <!-- Separator line -->
      <div style="height: 1px; background-color: rgba(255, 255, 255, 0.2); margin: 0;"></div>

      <element-timeline-ruler></element-timeline-ruler>
      <element-timeline id="split_inner_bottom"></element-timeline>
      <element-timeline-bottom-scroll></element-timeline-bottom-scroll>
      <element-timeline-bottom></element-timeline-bottom>
    `;
  }
}
