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
<<<<<<< HEAD
=======

    try {
      (window as any).electronAPI?.res?.overlayRecord?.stop?.(() => {
        this._handleClickViewMode("timeline");
      });
    } catch (e) {
      /* ignore if bridge missing */
    }
>>>>>>> parent of ffa6c0f (Implement FlowWidget open/close event handling and enhance PreviewTopBar state management. The FlowWidget now listens for custom events to toggle visibility, while the PreviewTopBar automatically switches views based on FlowWidget events. Console logs added for better debugging.)
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
<<<<<<< HEAD
    if (mode === "sandbox") {
      console.log("PreviewTopBar: open FlowWidget overlay");
      window.dispatchEvent(new CustomEvent("flowWidget:open"));
      // Remain in timeline view; do not change layout
      return;
=======
    this.viewMode = mode;

    if (mode === "sandbox") {
      // Hide timeline area
      uiStore.getState().updateVertical(0);

      // Attempt to show the flow editor overlay via Electron.
      try {
        (window as any).electronAPI?.req?.overlayRecord?.show?.();
      } catch (e) {
        // Silently ignore if API is unavailable (e.g., in browser preview)
        console.warn("Electron overlay call failed", e);
      }
    } else {
      // Restore timeline area height
      const height = this.defaultTimelineHeight > 0 ? this.defaultTimelineHeight : 40;
      uiStore.getState().updateVertical(height);
>>>>>>> parent of ffa6c0f (Implement FlowWidget open/close event handling and enhance PreviewTopBar state management. The FlowWidget now listens for custom events to toggle visibility, while the PreviewTopBar automatically switches views based on FlowWidget events. Console logs added for better debugging.)
    }

    // Close overlay explicitly when timeline clicked
    this.viewMode = "timeline";
    window.dispatchEvent(new CustomEvent("flowWidget:close"));
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

      <div class="top-toggle-bar">
        <button
          @click=${() => this._handleClickViewMode("sandbox")}
          class="btn btn-xxs btn-default text-light preview-top-button m-0"
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
