class Tutorial extends HTMLElement {
  tutorialModal: any;
  constructor() {
    super();
  }

  render() {
    //this.hideAllOptions()

    this.innerHTML = this.template();

    this.tutorialModal = new bootstrap.Modal(
      document.querySelector("div[ref='tutorial']"),
      {
        keyboard: false,
      }
    );

    //this.tutorialModal.show()
  }

  template() {
    return `<div class="modal fade show" ref="tutorial" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bg-default">
                <div class="modal-body text-center text-light bg-default">
                    <h5 class="modal-title font-weight-lg">너겟 튜토리얼</h5>
                    <p class="font-weight-md"></p>
                    <div class="d-flex bd-highlight">
                    <div class="me-auto p-2 bd-highlight"><button type="button" class="d-flex align-items-center btn btn-sm btn-secondary"><span class="material-symbols-outlined">
                    arrow_back
                    </span></button></div>

                    <div class="p-2 bd-highlight"><button type="button" class="d-flex align-items-center btn btn-sm btn-primary"><span class="material-symbols-outlined">
                    navigate_next
                    </span></button></div>
                    </div>

                </div>
            </div>
        </div>
    </div>`;
  }

  connectedCallback() {
    this.render();
  }
}

export { Tutorial };
