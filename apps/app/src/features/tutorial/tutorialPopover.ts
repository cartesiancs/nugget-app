class TutorialPopover extends HTMLElement {
  tutorialIdx: string;
  tutorialTitle: string;
  tutorialMessage: string;
  tutorialElementId: string;
  constructor() {
    super();

    this.tutorialIdx = this.getAttribute("tutorial-idx") || "";
    this.tutorialTitle = this.getAttribute("tutorial-title") || "";
    this.tutorialMessage = this.getAttribute("tutorial-message") || "";
    this.tutorialElementId = this.getAttribute("target-element-id") || "";
  }

  // tutorial-idx="1" tutorial-title="test" tutorial-message="fsdf" target-element-id="

  render() {
    //this.hideAllOptions()
    // const targetElement = document.querySelector(`#${this.tutorialElementId}`);
    // console.log(this.tutorialElementId, targetElement);
    // this.classList.add("tutorial-popover", "d-none");
    // this.style.position = "absolute";
    // this.style.top = `${targetElement.clientHeight / 2}px`;
    // this.style.left = `${targetElement.clientWidth}px`;
    // this.style.zIndex = 7000;
    // this.innerHTML = this.template();
  }

  template() {
    return `
        <div class="">
        ${this.tutorialTitle}: ${this.tutorialMessage}

        </div>`;
  }

  connectedCallback() {
    this.render();
  }
}

export { TutorialPopover };
