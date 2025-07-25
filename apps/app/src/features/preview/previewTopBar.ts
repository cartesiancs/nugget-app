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

  // Keep default timeline height to restore when switching back from sandbox
  @property()
  defaultTimelineHeight: number = this.uiState.resize.vertical.bottom;

  // Current view mode – "timeline" (default) or "sandbox"
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

  /** Ensure component sets initial state */
  connectedCallback() {
    super.connectedCallback();

    // Listen for FlowWidget close events so Timeline view is restored automatically
    window.addEventListener("flowWidget:closed", () => {
      this._handleClickViewMode("timeline");
    });

    // Listen for FlowWidget open events (e.g., from its own floating button)
    window.addEventListener("flowWidget:opened", () => {
      this._handleClickViewMode("sandbox");
    });
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
    this.viewMode = mode;

    console.log("PreviewTopBar: switching to", mode);
    if (mode === "sandbox") {
      // Hide timeline area
      uiStore.getState().updateVertical(0);

      // Ask FlowWidget to open inside the same window
      console.log("Dispatching flowWidget:open");
      window.dispatchEvent(new CustomEvent("flowWidget:open"));
    } else {
      // Restore timeline area height
      const height = this.defaultTimelineHeight > 0 ? this.defaultTimelineHeight : 40;
      uiStore.getState().updateVertical(height);

      // Ask FlowWidget to close
      console.log("Dispatching flowWidget:close");
      window.dispatchEvent(new CustomEvent("flowWidget:close"));
    }
  }

  render() {
    return html`
      <style>
        .top-toggle-bar {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          height: 2rem;
          align-items: center;
          justify-content: center;
        }

        .preview-top-button {
          font-size: 12px;
          font-weight: bolder;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Active button color */
        .btn-active {
          background-color: #B761FF !important;
          color: #fff !important;
        }
      </style>

      <div class="top-toggle-bar" style="padding-top:2.5rem;">
        <button
          @click=${() => this._handleClickViewMode("sandbox")}
          class="btn btn-xxs ${this.viewMode == "sandbox" ? "btn-active" : "btn-default"} text-light preview-top-button m-0"
        >
          Sandbox
        </button>

        <button
          @click=${() => this._handleClickViewMode("timeline")}
          class="btn btn-xxs ${this.viewMode == "timeline" ? "btn-active" : "btn-default"} text-light preview-top-button m-0"
        >
          Timeline
        </button>
      </div>
    `;
  }
}
