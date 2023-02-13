
class OptionImage extends HTMLElement { 
    constructor() {
        super();

        this.elementId = ''

    }

    render() {
        let template = this.template()
        this.innerHTML = template
        this.hide()

    }

    template() {
        return `
        <label class="form-label text-light">위치</label>
        <div class="d-flex flex-row bd-highlight mb-2">
        <input aria-event="location-x" type="number" class="form-control bg-default text-light me-1" value="52" >
        <input aria-event="location-y" type="number" class="form-control bg-default text-light" value="52" >

        </div>`;
    }

    hide() {
        this.classList.add("d-none")

    }


    show() {
        this.classList.remove("d-none")

    }

    setElementId({ elementId }) {
        this.elementId = elementId
    }



    connectedCallback() {
        this.render();

    }
}

  
export { OptionImage }
