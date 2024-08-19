class OptionGroup extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    //this.hideAllOptions()
  }

  showOption({ filetype, elementId }) {
    this.hideAllOptions();
    this.querySelector(`option-${filetype}`).show();
    this.querySelector(`option-${filetype}`).setElementId({
      elementId: elementId,
    });
  }

  hideAllOptions() {
    for (const key in this.children) {
      if (Object.hasOwnProperty.call(this.children, key)) {
        const element = this.children[key];
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
