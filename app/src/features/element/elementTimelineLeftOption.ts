import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { ITimelineStore, useTimelineStore } from "../../states/timelineStore";
import { IUIStore, uiStore } from "../../states/uiStore";
import { consume } from "@lit/context";
import { timelineContext } from "../../context/timelineContext";
import { elementUtils } from "../../utils/element";

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
  timeline: any = this.timelineState.timeline;

  @property()
  isAbleResize: boolean = false;

  @consume({ context: timelineContext })
  @property({ attribute: false })
  public timelineOptions: any = {
    canvasVerticalScroll: 0,
    panelOptions: [],
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

          if (
            elementUtils.getElementType(this.timeline[elementId].filetype) ==
            "static"
          ) {
            const isActive = this.isActiveAnimationPanel(elementId);
            if (isActive) {
              ctx.fillStyle = "#62a88f";
            } else {
              ctx.fillStyle = "#37485c";
            }

            if (this.timeline[elementId].filetype == "image") {
              ctx.beginPath();
              ctx.rect(
                this.resize.timelineVertical.leftOption - height,
                top,
                height,
                height,
              );
              ctx.fill();
            }

            if (isActive) {
              index += 1;
              const panelTop =
                index * height * 1.2 -
                this.timelineOptions.canvasVerticalScroll;
              ctx.fillStyle = "#62a88f";

              ctx.beginPath();
              ctx.rect(
                0,
                panelTop,
                this.resize.timelineVertical.leftOption,
                height,
              );
              ctx.fill();

              const fontSize = 14;
              ctx.fillStyle = "#ffffff";
              ctx.lineWidth = 0;
              ctx.font = `${fontSize}px "Noto Sans"`;
              this.wrapText(
                ctx,
                "Position",
                4,
                panelTop + fontSize + 4,
                this.resize.timelineVertical.leftOption,
              );
            }
          }

          index += 1;
        }
      }
    }
  }

  private drawRequestTimelineCanvas() {
    document.querySelector("element-timeline-canvas").drawCanvas();
  }

  deactivateAnimationPanel(elementId) {
    const panelOptions = this.timelineOptions.panelOptions.filter((item) => {
      return item.elementId != elementId;
    });

    this.timelineOptions.panelOptions = panelOptions;
    this.drawRequestTimelineCanvas();
  }

  activateAnimationPanel(elementId) {
    this.timelineOptions.panelOptions.push({
      elementId: elementId,
      activeAnimation: true,
    });

    this.drawRequestTimelineCanvas();
  }

  isActiveAnimationPanel(elementId) {
    return (
      this.timelineOptions.panelOptions.findIndex((item) => {
        return item.elementId == elementId;
      }) != -1
    );
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

  _handleMouseClickCanvas(e) {
    const x = e.offsetX;
    const y = e.offsetY;
    let index = 1;

    for (const elementId in this.timeline) {
      if (Object.prototype.hasOwnProperty.call(this.timeline, elementId)) {
        const height = 30;
        const top =
          index * height * 1.2 - this.timelineOptions.canvasVerticalScroll;

        if (
          x > this.resize.timelineVertical.leftOption - height &&
          x < this.resize.timelineVertical.leftOption &&
          y > top &&
          y < top + height
        ) {
          const isImage =
            elementUtils.getElementType(this.timeline[elementId].filetype) ==
            "static";

          if (!isImage) {
            index += 1;
            continue;
          }

          if (this.timeline[elementId].filetype != "image") {
            index += 1;
            continue;
          }

          const isActive = this.isActiveAnimationPanel(elementId);

          if (isActive) {
            this.deactivateAnimationPanel(elementId);
          } else {
            this.activateAnimationPanel(elementId);
          }

          this.drawCanvas();
        }

        const isActive = this.isActiveAnimationPanel(elementId);

        if (isActive) {
          index += 1;
        }

        index += 1;
      }
    }
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
        @mousedown=${this._handleMouseClickCanvas}
      ></canvas>
      <div
        class="split-col-bar"
        style="left: ${this.resize.timelineVertical.leftOption}px;"
        @mousedown=${this._handleClickResizePanel}
      ></div>
    `;
  }
}
