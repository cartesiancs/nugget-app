class Toast extends HTMLElement {
  message: string | undefined;
  delay: string | number | undefined;
  connectedCallback() {
    this.message = this.getAttribute("toast-message") || "";
    this.delay = this.getAttribute("toast-delay") || 1000;

    this.innerHTML = this.template();

    const toastElement = this.querySelector("div[ref='toast']");
    const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
    toast.show();
  }

  template() {
    return `<div ref="toast" class="toast fade" id="saveProject" role="alert" data-bs-animation="true" data-bs-autohide="true" data-bs-delay="${this.delay}" aria-live="assertive" aria-atomic="true" style="background-color: rgba(37, 38, 43, 0.73);">
        <div class="toast-body"> 
            <div class="text-center text-light">${this.message}</div> 
        </div>
    </div>`;
  }
}

export { Toast };
