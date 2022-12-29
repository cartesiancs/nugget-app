
class AnimationPanel extends HTMLElement { 
    constructor() {
        super();
        this.elementId = this.getAttribute('element-id')

        this.isShow = false

    }

    render(){
        const innerElements = this.innerHTML
        const template = this.template();

        this.innerHTML = template;
        this.hide()
        this.style.display = "inline-block"
        this.classList.add("position-relative", "w-100")
        this.querySelector("div").innerHTML = innerElements
    }

    show() {
        this.classList.remove("d-none")
        this.isShow = true
    }

    hide() {
        this.classList.add("d-none")
        this.isShow = false
    }

    template() {
        return `<div class="bg-dark">  </div>`
    }


    connectedCallback() {
        this.render();


    }

    disconnectedCallback(){

    }
}


class AnimationPanelItem extends HTMLElement { 
    constructor() {
        super();

        this.animationType = this.getAttribute('animation-type')
    }

    render(){
        if (this.checkAnimationType() == false) {
            return 0
        }
        
        const template = this.template();
        this.innerHTML = template;
    }

    template() {
        return ` <b>panel item</b> `
    }

    checkAnimationType() {
        let availableAnimationType = ["position", "opacity"] // scale, rotation
        return availableAnimationType.includes(this.animationType)
    }


    connectedCallback() {
        this.render();


    }

    disconnectedCallback(){

    }
}

export { AnimationPanel, AnimationPanelItem }