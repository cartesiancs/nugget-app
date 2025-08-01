import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { consume } from "@lit/context";
import { timelineContext } from "../../context/timelineContext";

// Inline SVG as data URL for reliable loading
const videoIconUrl = "data:image/svg+xml;base64," + btoa(`<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="44" height="44" rx="12" fill="#E9E8EB" fill-opacity="0.05"/>
<path d="M26.1676 23.6114C26.1831 24.0835 26.3983 24.5279 26.7613 24.8328L27.5947 25.5328C28.679 26.4436 30.3333 25.6728 30.3333 24.2566V19.7433C30.3333 18.3271 28.679 17.5563 27.5947 18.4671L26.7613 19.1671C26.4 19.4706 26.185 19.9124 26.1678 20.3821M26.1676 23.6114L26.1667 24.5C26.1667 26.3409 24.6743 27.8333 22.8333 27.8333H17C15.1591 27.8333 13.6667 26.3409 13.6667 24.5V19.5C13.6667 17.659 15.1591 16.1666 17 16.1666H22.8333C24.6743 16.1666 26.1667 17.659 26.1667 19.5L26.1678 20.3821M26.1676 23.6114L26.1678 20.3821" stroke="#E9E8EB" stroke-opacity="0.5" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`);

@customElement("element-timeline-left-option")
export class ElementTimelineLeftOption extends LitElement {
  @query("#elementTimelineLeftOptionRef") canvas!: HTMLCanvasElement;

  // store mirrors
  @property({ attribute: false }) timelineState: ITimelineStore =
    useTimelineStore.getInitialState();
  @property({ attribute: false }) uiState: IUIStore = uiStore.getInitialState();
  @property({ attribute: false }) timeline: any = this.timelineState.timeline;
  @property({ attribute: false }) resize = this.uiState.resize;

  @consume({ context: timelineContext })
  @property({ attribute: false })
  public timelineOptions: any = { canvasVerticalScroll: 0 };

  private iconImg: HTMLImageElement | null = null;
  private iconLoaded = false;

  createRenderRoot() {
    useTimelineStore.subscribe((s) => {
      this.timeline = s.timeline;
      this.requestUpdate();
    });
    uiStore.subscribe((s) => {
      this.resize = s.resize;
      this.requestUpdate();
    });
    return this.shadowRoot || this.attachShadow({ mode: 'open' });
  }

  firstUpdated() {
    this.prepareIcon();
    this.drawCanvas();
  }
  
  updated() {
    this.drawCanvas();
  }

  private prepareIcon() {
    if (this.iconImg) return;
    this.iconImg = new Image();
    this.iconImg.src = videoIconUrl;
    this.iconImg.onload = () => {
      this.iconLoaded = true;
      this.drawCanvas();
    };
  }

  private drawCanvas() {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const ROW_H = 30;
    const ROW_SPACING = ROW_H * 1.2;
    
    // Calculate the maximum track number more safely
    const timelineValues = Object.values(this.timeline || {});
    const maxTrack = timelineValues.length > 0 
      ? Math.max(...timelineValues.map((el: any) => (el.track ?? 0) + 1))
      : 1;
    
    const rows = Math.max(maxTrack, 1);

    const dpr = window.devicePixelRatio;
    const width = this.resize.timelineVertical.leftOption;
    const height = rows * ROW_SPACING;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height + 12}px`; // Increase height by 20px
    this.canvas.style.marginTop = '20px'; // Increased top margin from 10px to 20px
    this.canvas.width = width * dpr;
    this.canvas.height = (height + 20) * dpr; // Increase canvas height to match style
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Only draw icon once, aligned to first row.
    if (this.iconLoaded && this.iconImg) {
      const ICON_SIZE = 50; // Increased from 40 to 50
      const MARGIN_TOP = 15; // Increased top margin
      const ix = (width - ICON_SIZE) / 2;
      const iy = MARGIN_TOP + (ROW_H - ICON_SIZE) / 2; // Center in first row with top margin
      ctx.drawImage(this.iconImg, ix, iy, ICON_SIZE, ICON_SIZE);
    }
  }

  render() {
    return html`<canvas id="elementTimelineLeftOptionRef"></canvas>`;
  }
}
