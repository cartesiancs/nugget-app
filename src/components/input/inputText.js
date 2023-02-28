
class InputText extends HTMLElement { 
    constructor() {
        super();


        this.value = ''
        this.elementId = this.getAttribute('element-id')
        this.timeline = document.querySelector("element-timeline").timeline;
        this.parentInputBox = document.querySelector(`element-control-asset[element-id="${this.elementId}"]`)

    }

    render() {
        let template = this.template()
        this.innerHTML = template

        this.style.textAlign = 'center' 
        this.style.display = 'flex' 
        this.style.justifyContent = 'center'
        this.style.height = '100%'
        this.style.width = '100%'
        this.style.position = 'absolute'
        this.style.top = '0px'
        this.style.color = '#ffffff'

        this.querySelector("span").style.height = `100%`
        this.querySelector("span").style.outline = 'none'

        this.querySelector("span").setAttribute("contenteditable", true)

        this.setWidthInner()
    }

    template() {
        return `<span>텍스트</span>`;
    }

    setWidth() {
        //let target = document.querySelector(`element-control-asset[element-id="${this.elementId}"]`)
        this.parentInputBox.style.width = `${this.offsetWidth}px`


    }

    setWidthInner() {
        let resizedInput = this.parentInputBox.convertRelativeToAbsoluteSize({ w: this.querySelector("span").offsetWidth })
        this.timeline[this.elementId].widthInner = resizedInput.w
    }

    updateText({ event }) {
        let value = event.currentTarget.textContent
        this.value = value
        this.timeline[this.elementId].text = value
    }

    handleInput(event) {
        this.updateText({ event: event })

        this.setWidth()
        this.setWidthInner()
    }

    connectedCallback() {
        this.render();
        this.querySelector("span").addEventListener("input", this.handleInput.bind(this))
    }
}

  
export { InputText }
