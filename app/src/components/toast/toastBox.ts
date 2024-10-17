class ToastBox extends HTMLElement {
  body: any;
  connectedCallback() {
    this.body = document.querySelector("#toast");
    if (this.body == null) {
      let createElement = document.createElement("div");
      createElement.setAttribute("id", "toast");
      createElement.classList.add(
        "toast-container",
        "position-fixed",
        "bottom-0",
        "start-50",
        "translate-middle-x"
      );

      document
        .querySelector("body")
        .insertAdjacentElement("beforeend", createElement);
      this.body = document.querySelector("#toast");
    }
  }

  showToast({ message, delay }) {
    const element = document.createElement("toast-item");
    element.setAttribute("toast-message", message);
    element.setAttribute("toast-delay", delay);

    this.body.insertAdjacentElement("beforeend", element);
  }
}

export { ToastBox };
