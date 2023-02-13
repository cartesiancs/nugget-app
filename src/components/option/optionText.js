
class OptionText extends HTMLElement { 
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
        return `<div class="mb-2">
        <label class="form-label text-light">텍스트 색상 선택</label>
        <input aria-event="font-color" type="color" class="form-control bg-default form-control-color" value="#ffffff" title="Choose your color">
    </div>

    <div class="mb-2">
        <label class="form-label text-light">폰트 크기</label>
        <input aria-event="font-size" type="number" class="form-control bg-default text-light" value="52" >
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
        this.resetValue()
    }

    resetValue() {
        const timeline = document.querySelector("element-timeline").timeline
        this.querySelector("input[aria-event='font-color'").value = timeline[this.elementId].textcolor
        this.querySelector("input[aria-event='font-size'").value = timeline[this.elementId].fontsize


    }

    handleChangeTextColor() {
        const elementControl = document.querySelector("element-control")
        const color = this.querySelector("input[aria-event='font-color'").value
        elementControl.changeTextColor({ elementId: this.elementId ,color: color })
    }

    handleChangeTextSize() {
        const elementControl = document.querySelector("element-control")
        const size = this.querySelector("input[aria-event='font-size'").value
        elementControl.changeTextSize({ elementId: this.elementId, size: size })
    }

    connectedCallback() {
        this.render();
        this.querySelector("input[aria-event='font-color'").addEventListener("input", this.handleChangeTextColor.bind(this))
        this.querySelector("input[aria-event='font-size'").addEventListener("change", this.handleChangeTextSize.bind(this))

    }
}

  
export { OptionText }
