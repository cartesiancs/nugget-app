
class OptionVideo extends HTMLElement { 
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
        <input aria-event="location-x" type="number" class="form-control bg-default text-light me-1" value="0" >
        <input aria-event="location-y" type="number" class="form-control bg-default text-light" value="0" >

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
        this.updateValue()
    }

    updateValue() {
        const timeline = document.querySelector("element-timeline").timeline
        this.querySelector("input[aria-event='location-x'").value = timeline[this.elementId].location.x
        this.querySelector("input[aria-event='location-y'").value = timeline[this.elementId].location.y

    }

    handleLocation() {
        const targetElement = document.querySelector(`element-control-asset[element-id='${this.elementId}']`)

        let x =  this.querySelector("input[aria-event='location-x'").value
        let y =  this.querySelector("input[aria-event='location-y'").value

        let convertLocation = targetElement.convertAbsoluteToRelativeSize({ x: x, y: y })

        targetElement.changeLocation({ x: convertLocation.x, y: convertLocation.y })
    }


    connectedCallback() {
        this.render();
        this.querySelector("input[aria-event='location-x'").addEventListener("change", this.handleLocation.bind(this))
        this.querySelector("input[aria-event='location-y'").addEventListener("change", this.handleLocation.bind(this))

    }
}

  
export { OptionVideo }
