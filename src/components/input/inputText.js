
class InputText extends HTMLElement { 
    constructor() {
        super();


        this.value = ''
        this.elementId = this.getAttribute('element-id')
        this.initValue = this.getAttribute('init-value') || ''
        this.initColor = this.getAttribute('init-color') || '#ffffff'

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
        this.style.letterSpacing = '1px'
        //this.style.top = '0px'
        this.style.color = this.initColor

        this.querySelector("span").style.height = `100%`
        this.querySelector("span").style.outline = 'none'
        this.querySelector("span").style.lineHeight = 'initial'

        this.querySelector("span").setAttribute("contenteditable", true)

        this.setWidthInner()
    }

    template() {
        return `<span>${this.initValue}</span>`;
    }

    setWidth() {
        //let target = document.querySelector(`element-control-asset[element-id="${this.elementId}"]`)
        this.parentInputBox.style.width = `${this.offsetWidth}px`


    }

    setWidthInner() {
        let resizedInput = this.parentInputBox.convertRelativeToAbsoluteSize({ w: this.querySelector("span").offsetWidth })
        console.log(resizedInput)
        this.timeline[this.elementId].widthInner = resizedInput.w
    }

    updateText({ value }) {
        this.value = value
        this.timeline[this.elementId].text = value
        this.updateTextInElementBar()
    }

    updateTextInElementBar() {
        const targetElementBar = document.querySelector(`element-bar[element-id='${this.elementId}']`)
        targetElementBar.querySelector("span[ref='name']").innerHTML = this.value
    }

    handleInput(event) {
        let value = event.currentTarget.textContent

        this.updateText({ value: value })
        this.setWidth()
        this.setWidthInner()
    }

    connectedCallback() {
        this.render();
        this.querySelector("span").addEventListener("input", this.handleInput.bind(this))
    }
}

  
export { InputText }
