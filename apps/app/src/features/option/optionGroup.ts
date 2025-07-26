import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";

// Ensure option components are registered even if only referenced in markup
import "./optionText";
import "./optionImage";
import "./optionVideo";
import "./optionAudio";
import "./optionShape";

@customElement("option-group")
export class OptionGroup extends LitElement {
  constructor() {
    super();
  }

  // Render into light DOM so that <option-text> and other child elements
  // placed inside <option-group> are part of the same DOM tree.  This lets
  // `this.querySelector("option-text")` and similar calls work correctly.
  createRenderRoot() {
    return this;
  }

  render() {
    // Preserve any light-DOM children (option-text, option-image, …)
    // so they aren’t removed during Lit updates.
    return html`<slot></slot>`;
  }

  showOption({ filetype, elementId }: { filetype: string; elementId: string }) {
    console.log("[OptionGroup] showOption", filetype, elementId);
    this.hideAllOptions();

    const fileTypeOption: any = this.querySelector(`option-${filetype}`);
    if (!fileTypeOption) {
      console.warn("[OptionGroup] option component not found", filetype);
      return;
    }
    if (typeof fileTypeOption.show === "function") fileTypeOption.show();
    if (typeof fileTypeOption.setElementId === "function") {
      fileTypeOption.setElementId({ elementId });
    }

    // If the element is not yet upgraded (show undefined), wait for custom
    // element definition then retry once.
    if (typeof fileTypeOption.show !== "function") {
      customElements.whenDefined(`option-${filetype}`).then(() => {
        const upgraded: any = this.querySelector(`option-${filetype}`);
        if (upgraded?.show) {
          upgraded.show();
          upgraded.setElementId?.({ elementId });
        }
      });
    }
  }

  // NOTE: only same filetypes
  showOptions({
    filetype,
    elementIds,
  }: {
    filetype: string;
    elementIds: string[];
  }) {
    if (filetype != "text") {
      return false;
    }

    console.log("ERRRRRRR");

    try {
      this.hideAllOptions();
      const fileTypeOption: any = this.querySelector(`option-${filetype}`);
      fileTypeOption.show();
      fileTypeOption.setElementIds({
        elementIds: elementIds,
      });
    } catch (error) {}
  }

  hideAllOptions() {
    Array.from(this.children).forEach((el: any) => {
      if (typeof el.hide === "function") {
        el.hide();
      }
    });
  }

  connectedCallback() {
    this.render();
  }
}
