import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("option-group")
export class OptionGroup extends LitElement {
  constructor() {
    super();
  }

  render() {
    //this.hideAllOptions()
  }

  showOption({ filetype, elementId }) {
    try {
      this.hideAllOptions();
      const fileTypeOption: any = this.querySelector(`option-${filetype}`);
      fileTypeOption.show();
      fileTypeOption.setElementId({
        elementId: elementId,
      });
    } catch (error) {}
  }

  hideAllOptions() {
    for (const key in this.children) {
      if (Object.hasOwnProperty.call(this.children, key)) {
        const element: any = this.children[key];
        console.log(element, this.children);
        element.hide();
      }
    }
  }

  connectedCallback() {
    this.render();
  }
}
