class OptionGroup extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    //this.hideAllOptions()
  }

  showOption({ filetype, elementId }) {
    this.hideAllOptions();
    const fileTypeOption: any = this.querySelector(`option-${filetype}`);
    fileTypeOption.show();
    fileTypeOption.setElementId({
      elementId: elementId,
    });
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

export { OptionGroup };
