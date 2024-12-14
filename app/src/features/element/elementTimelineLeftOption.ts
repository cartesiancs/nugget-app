import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { consume } from "@lit/context";
import { timelineContext } from "../../context/timelineContext";

@customElement("element-timeline-left-option")
export class ElementTimelineLeftOption extends LitElement {
  @query("#elementTimelineLeftOptionRef") canvas!: HTMLCanvasElement;

  @property()
  uiState: IUIStore = uiStore.getInitialState();

  @property()
  resize = this.uiState.resize;

  @property()
  timelineState: ITimelineStore = useTimelineStore.getInitialState();

  @property()
  timeline = this.timelineState.timeline;

  @property()
  isAbleResize: boolean = false;

  @consume({ context: timelineContext })
  @property({ attribute: false })
  public timelineOptions = {
    canvasVerticalScroll: 0,
  };

  createRenderRoot() {
    useTimelineStore.subscribe((state) => {
      this.timeline = state.timeline;

      this.drawCanvas();
    });

    uiStore.subscribe((state) => {
      this.resize = state.resize;
    });

    window.addEventListener("mouseup", this._handleMouseUp.bind(this));
    window.addEventListener("mousemove", this._handleMouseMove.bind(this));

    return this;
  }

  private wrapText(ctx, text, x, y, maxWidth) {
    let ellipsis = "...";
    let truncatedText = text;

    if (ctx.measureText(text).width > maxWidth) {
      while (ctx.measureText(truncatedText + ellipsis).width > maxWidth) {
        truncatedText = truncatedText.slice(0, -1);
      }
      truncatedText += ellipsis;
    }

    const fontSize = 14;
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 0;
    ctx.font = `${fontSize}px "Noto Sans"`;
    ctx.fillText(truncatedText, x, y);
  }

  drawCanvas() {
    let index = 1;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      const dpr = window.devicePixelRatio;
      this.canvas.style.width = `${this.resize.timelineVertical.leftOption}px`;

      this.canvas.width = this.resize.timelineVertical.leftOption * dpr;
      this.canvas.height =
        document.querySelector("element-timeline").offsetHeight * dpr;

      ctx.clearRect(
        0,
        0,
        this.resize.timelineVertical.leftOption,
        this.canvas.height,
      );
      ctx.scale(dpr, dpr);

      for (const elementId in this.timeline) {
        if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
          const height = 30;
          const top =
            index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;

          ctx.lineWidth = 0;
          ctx.fillStyle = "#292c2e";

          ctx.beginPath();
          ctx.rect(0, top, this.resize.timelineVertical.leftOption, height);
          ctx.fill();

          let splitedFilepath = this.timeline[elementId].localpath.split("/");
          let text = splitedFilepath[splitedFilepath.length - 1];

          if (this.resize.timelineVertical.leftOption > 50) {
            const fontSize = 14;
            ctx.fillStyle = "#ffffff";
            ctx.lineWidth = 0;
            ctx.font = `${fontSize}px "Noto Sans"`;
            this.wrapText(
              ctx,
              text,
              4,
              top + fontSize + 4,
              this.resize.timelineVertical.leftOption,
            );
          }

          index += 1;
        }
      }
    }
  }

  _handleMouseMove(e) {
    const elementControlComponent = document.querySelector("element-control");

    if (this.isAbleResize) {
      const windowWidth = window.innerWidth;
      const nowX = e.clientX;
      const resizeX = nowX;

      if (resizeX <= 20) {
        this.uiState.updateTimelineVertical(20);
        elementControlComponent.resizeEvent();
        return false;
      }

      this.uiState.updateTimelineVertical(resizeX);
      elementControlComponent.resizeEvent();
    }
  }

  _handleMouseUp() {
    this.isAbleResize = false;
  }

  _handleClickResizePanel() {
    this.isAbleResize = true;

    console.log("a");
  }

  protected render(): unknown {
    return html`
      <canvas
        id="elementTimelineLeftOptionRef"
        style="width: ${this.resize.timelineVertical
          .leftOption}px;position: absolute; height: 100%;"
        class="tab-content"
      ></canvas>
      <div
        class="split-col-bar"
        style="left: ${this.resize.timelineVertical.leftOption}px;"
        @mousedown=${this._handleClickResizePanel}
      ></div>
    `;
  }
}
