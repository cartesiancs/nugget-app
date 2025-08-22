import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import {
  IControlPanelStore,
  controlPanelStore,
} from "../../states/controlPanelStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { v4 as uuidv4 } from "uuid";

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

  // UI Store for showing/hiding timeline
  @property()
  uiState: IUIStore = uiStore.getInitialState();

  // Keep track of active view; stays on "timeline" visually
  @property()
  viewMode: "timeline" | "sandbox" = "timeline";

  @property()
  timeline: any = this.timelineState.timeline;

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.control = state.control;
      this.timeline = state.timeline;
    });

    controlPanelStore.subscribe((state) => {
      this.activePanel = state.active;
      this.nowActivePanel = state.nowActive;
    });

    uiStore.subscribe((state) => {
      this.uiState = state;
    });

    return this;
  }

  /** Handle external close events from overlay to switch back to timeline */
  connectedCallback() {
    super.connectedCallback();
  }

  createShape(shape) {
    const elementId = uuidv4();

    const width = 100;
    const height = 100;

    this.timeline[elementId] = {
      key: elementId,
      priority: 1,
      blob: "",
      startTime: 0,
      duration: 1000,
      opacity: 100,
      location: { x: 0, y: 0 },
      trim: { startTime: 0, endTime: 1000 },
      rotation: 0,
      width: width,
      height: height,
      oWidth: width,
      oHeight: height,
      ratio: width / height,
      filetype: "shape",
      localpath: "SHAPE",
      shape: shape,
      option: {
        fillColor: "#ffffff",
      },
      animation: {
        position: {
          isActivate: false,
          x: [],
          y: [],
          ax: [[], []],
          ay: [[], []],
        },
        opacity: {
          isActivate: false,
          x: [],
          ax: [[], []],
        },
        scale: {
          isActivate: false,
          x: [],
          ax: [[], []],
        },
        rotation: {
          isActivate: false,
          x: [],
          ax: [[], []],
        },
      },
      timelineOptions: {
        color: "rgb(59, 143, 179)",
      },
    };

    this.timelineState.patchTimeline(this.timeline);
    return elementId;
  }

  createSquare() {
    const shape = [
      [0, 0],
      [0, 100],
      [100, 100],
      [100, 0],
    ];

    return this.createShape(shape);
  }

  createTriangle() {
    const shape = [
      [50, 0],
      [0, 100],
      [100, 100],
    ];

    return this.createShape(shape);
  }

  createCircle() {
    const shape: number[][] = [];
    const centerX = 50;
    const centerY = 50;
    const radius = 50;
    const numSegments = 50;

    for (let i = 0; i < numSegments; i++) {
      const angle = (2 * Math.PI * i) / numSegments;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      shape.push([x, y]);
    }

    return this.createShape(shape);
  }

  _handleClickButton(type) {
    this.timelineState.setCursorType(type);
  }

  /**
   * Toggle view between sandbox and timeline
   */
  _handleClickViewMode(mode: "timeline" | "sandbox") {
    if (mode === "sandbox") {
      console.log("PreviewTopBar: open FlowWidget overlay");
      window.dispatchEvent(new CustomEvent("flowWidget:open"));
      // Dispatch event to hide timeline UI elements
      window.dispatchEvent(new CustomEvent("sandbox:opened"));
      // Remain in timeline view; do not change layout
      return;
    }

    // Close overlay explicitly when timeline clicked
    this.viewMode = "timeline";
    window.dispatchEvent(new CustomEvent("flowWidget:close"));
    // Dispatch event to show timeline UI elements
    window.dispatchEvent(new CustomEvent("sandbox:closed"));
  }

  render() {
    return html`
      <style>
        .top-toggle-bar {
          display: flex;
          flex-direction: row;
          margin-top: 0;
          gap: 0.5rem;
          height: 2rem;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .buttons-container {
          display: flex;
          gap: 0.5rem;
          background: #18191CB2;
          border-radius: 0.5rem;
          backdrop-filter: blur(10px);
        }

        .preview-top-button {
          font-size: 12px;
          font-weight: bolder;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .btn-active {
          background: #b761ff26;
          color: #b761ff;
        }

        .timeline-button {
          color: #b761ff !important;
        }

        .timeline-button svg path {
          stroke: #b761ff;
        }
      </style>

      <div class="top-toggle-bar">
        <div class="buttons-container">
          <button
            @click=${() => this._handleClickViewMode("sandbox")}
            class="btn btn-xxs btn-default text-light preview-top-button m-0"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.16987 15H7.5C4.73858 15 2.5 12.7614 2.5 10C2.5 7.23857 4.73858 5 7.5 5L12.375 5M9.16987 15C9.16987 14.8909 9.13344 14.7819 9.06057 14.692C8.5218 14.0271 7.90283 13.4307 7.21742 12.9167M9.16987 15C9.16987 15.1091 9.13344 15.2181 9.06057 15.308C8.5218 15.9729 7.90283 16.5693 7.21742 17.0833M12.375 5C12.375 6.44975 13.5502 7.625 15 7.625C16.4497 7.625 17.625 6.44975 17.625 5C17.625 3.55025 16.4497 2.375 15 2.375C13.5502 2.375 12.375 3.55025 12.375 5ZM15 17.5C14.2234 17.5 13.8351 17.5 13.5289 17.3731C13.1205 17.204 12.796 16.8795 12.6269 16.4711C12.5 16.1649 12.5 15.7766 12.5 15C12.5 14.2234 12.5 13.8351 12.6269 13.5289C12.796 13.1205 13.1205 12.796 13.5289 12.6269C13.8351 12.5 14.2234 12.5 15 12.5C15.7766 12.5 16.1649 12.5 16.4711 12.6269C16.8795 12.796 17.204 13.1205 17.3731 13.5289C17.5 13.8351 17.5 14.2234 17.5 15C17.5 15.7766 17.5 16.1649 17.3731 16.4711C17.204 16.8795 16.8795 17.204 16.4711 17.3731C16.1649 17.5 15.7766 17.5 15 17.5Z"
                stroke="white"
                stroke-opacity="0.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Sandbox
          </button>

          <button
            @click=${() => this._handleClickViewMode("timeline")}
            class="btn btn-xxs ${this.viewMode == "timeline"
              ? "btn-active"
              : "btn-default"} text-light preview-top-button timeline-button m-0"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.33328 9.99998H8.33328M3.33328 15H8.33328M3.33328 4.99998H16.6666M11.6666 12.5H16.6666"
                stroke="#B761FF"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            Timeline
          </button>
        </div>
      </div>
    `;
  }
}
