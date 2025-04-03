import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("menu-dropdown-body")
export class MenuDropdownBody extends LitElement {
  x: any;
  y: any;
  constructor() {
    super();
    this.x = this.getAttribute("top");
    this.y = this.getAttribute("left");
  }

  render() {
    const innerElements = this.innerHTML;
    const template = this.template();

    this.innerHTML = template;
    this.style.display = "inline-block";
    const ul = this.querySelector("ul") as any;
    ul.innerHTML = innerElements;
  }

  template() {
    return `
        <ul class="dropdown-menu show position-absolute " style="top: ${this.x}px; left: ${this.y}px; z-index: 6000;">

        </ul>`;
  }

  mousedown() {
    setTimeout(() => {
      this.remove();
    }, 200);
  }

  connectedCallback() {
    this.render();

    document.addEventListener("click", this.mousedown.bind(this));
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.mousedown.bind(this));
  }
}

@customElement("menu-dropdown-item")
export class MenuDropdownItem extends LitElement {
  name: string;
  constructor() {
    super();

    this.name = this.getAttribute("item-name") || "untitle";
  }

  render() {
    const template = this.template();
    this.innerHTML = template;
  }

  template() {
    return `<li><a class="dropdown-item dropdown-item-sm">${this.name}</a></li>`;
  }

  connectedCallback() {
    this.render();
  }
}
