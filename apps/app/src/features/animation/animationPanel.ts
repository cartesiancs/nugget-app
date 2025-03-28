import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("animation-panel")
export class AnimationPanel extends LitElement {
  elementId: string;
  isShow: boolean;
  constructor() {
    super();
    this.elementId = this.getAttribute("element-id") || "";

    this.isShow = false;
  }

  render() {
    const innerElements = this.innerHTML;
    const template = this.template();
    const div: any = this.querySelector("div");

    this.innerHTML = template;
    this.hide();
    this.style.display = "inline-block";
    this.classList.add("position-relative", "w-100", "bg-dark");
    div.innerHTML = innerElements;
  }

  updateItem() {
    const div: any = this.querySelector("div");

    const innerElements = div.innerHTML;
    this.clearItem();

    const template = this.template();

    this.innerHTML = template;
    div.innerHTML = innerElements;
  }

  move(left) {
    this.style.left = `${left}px`;
  }

  clearItem() {
    this.innerHTML = "";
  }

  show() {
    this.classList.remove("d-none");
    this.isShow = true;
    this.updateItem();
  }

  hide() {
    this.classList.add("d-none");
    this.isShow = false;
  }

  template() {
    return `<div class="bg-dark">  </div>`;
  }
}

@customElement("animation-panel-item")
export class AnimationPanelItem extends HTMLElement {
  animationType: string;
  elementId: string;
  timeline: any;
  constructor() {
    super();

    this.animationType = this.getAttribute("animation-type") || "";
    this.elementId = this.getAttribute("element-id") || "";

    this.timeline = document.querySelector("element-timeline").timeline;
  }

  render() {
    if (this.checkAnimationType() == false) {
      return 0;
    }

    // if (this.timeline[this.elementId].animation.isActivate == false) {
    //     return 0
    // }

    this.style.width = `100%`;
    this.style.height = `1.5rem`;
    this.style.display = `inline-block`;

    this.classList.add("position-relative", "d-flex", "align-items-center");

    this.clearPoints();
    this.insertPointFromTimeline();
  }

  // NOTE: 포인트 타입 지정안되어이ㅛ음
  insertPointFromTimeline() {
    const timelineRange = Number(
      document.querySelector("element-timeline-range").value,
    );
    const timeMagnification = timelineRange / 4;

    let points =
      this.timeline[this.elementId].animation[this.animationType].points[0];

    for (let index = 0; index < points.length; index++) {
      let x = points[index][0] * timeMagnification;
      this.addPoint(x);
    }
  }

  clearPoints() {
    this.innerHTML = "";
  }

  addPoint(left) {
    this.insertAdjacentHTML(
      "beforeend",
      `<div class="text-light position-absolute keyframe-diamond" style="left: ${left}px;">panel item </div>`,
    );
  }

  checkAnimationType() {
    let availableAnimationType = ["position", "opacity"]; // scale, rotation
    return availableAnimationType.includes(this.animationType);
  }

  showMenuDropdown({ x, y }) {
    document.querySelector(
      "#menuRightClick",
    ).innerHTML = `<menu-dropdown-body top="${y}" left="${x}">
            <menu-dropdown-item onclick="document.querySelector('element-timeline').showKeyframeEditor('${this.elementId}', '${this.animationType}')" item-name="키프레임 편집"></menu-dropdown-item>
        </menu-dropdown-body>`;
  }

  handleMouseup(e) {
    this.rightclick(e);
  }

  rightclick(e) {
    const isRightClick = e.which == 3 || e.button == 2;

    if (!isRightClick) {
      return 0;
    }

    this.showMenuDropdown({
      x: e.clientX,
      y: e.clientY,
    });
  }

  connectedCallback() {
    this.render();
    this.addEventListener("mouseup", this.handleMouseup.bind(this));
  }

  disconnectedCallback() {
    this.removeEventListener("mouseup", this.handleMouseup);
  }
}
