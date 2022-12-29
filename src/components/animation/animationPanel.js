
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
        this.classList.add("position-relative", "w-100", "bg-dark")
        this.querySelector("div").innerHTML = innerElements
    }

    updateItem() {
        const innerElements = this.querySelector("div").innerHTML
        this.clearItem()

        const template = this.template();

        this.innerHTML = template;
        this.querySelector("div").innerHTML = innerElements

    }

    clearItem() {
        this.innerHTML = ''

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
        this.elementId = this.getAttribute('element-id')

        this.timeline = document.querySelector("element-timeline").timeline


    }

    render(){
        if (this.checkAnimationType() == false) {
            return 0
        }

        // if (this.timeline[this.elementId].animation.isActivate == false) {
        //     return 0
        // }


        this.style.padding = `1rem`
        this.classList.add("position-relative")
        
        this.clearPoints()
        this.insertPointFromTimeline()
    }

    // NOTE: 포인트 타입 지정안되어이ㅛ음
    insertPointFromTimeline() {
        let points = this.timeline[this.elementId].animation.points

        for (let index = 0; index < points.length; index++) {
            let x = points[index][0];
            this.addPoint(x)
        }
    }

    clearPoints() {
        this.innerHTML = ''
    }

    addPoint(left) {
        this.insertAdjacentHTML("beforeend", `<div class="text-light position-absolute keyframe-diamond" style="left: ${left}px;">panel item </div>`)
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