class ElementBarStatic extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        this.timeline = document.querySelector("element-timeline").timeline
        this.elementId = this.getAttribute('element-id')

        
        this.width = this.timeline[this.elementId].duration
        this.isDrag = false
        this.isResize = false
        this.resizeLocation = 'left'
        this.initialDuration = 1000

        this.initialPosition = {x: 0, y: 0}

        let splitedFilepath = this.timeline[this.elementId].localpath.split('/')
        this.filepath = splitedFilepath[splitedFilepath.length-1]

        this.resizeEventHandler;

    }

    render(){
        const template = this.template();
        const backgroundColor = this.getRandomColor()

        this.classList.add("element-bar", 'd-block')
        this.setAttribute("style", `width: ${this.width}px; left: 0px; background-color: ${backgroundColor};`)
        this.setAttribute("value", this.elementId)

        this.innerHTML = template;

    }

    template() {

        return `
        ${this.filepath}
        <div class="element-bar-resize-left position-absolute" onmousedown="this.parentNode.resizeMousedown(this, 'left')"></div>
        <div class="element-bar-resize-right position-absolute" onmousedown="this.parentNode.resizeMousedown(this, 'right')"></div>
        `
    }


    getRandomColor() {
        let color = "#" + Math.round(Math.random() * 0xffffff).toString(16) + '51'
        return color
    }



    drag(e) {
        if (this.isDrag) {
            let x = e.pageX - this.initialPosition.x
            let y = e.pageY - this.initialPosition.y
    
            this.style.left = `${x}px`
            this.timeline[this.elementId].startTime = x
        }

    }

    dragMousedown(e) {
        this.addEventListener('mousemove', this.drag);
        console.log("DRG")

        this.isDrag = true
        this.initialPosition.x = e.pageX - Number(this.style.left.replace(/[^0-9]/g, ""))
        this.initialPosition.y = e.pageY
    }

    dragMouseup() {
        this.removeEventListener('mousemove', this.drag);

        this.isDrag = false
    }


    resize(e) {
        this.isDrag = false

        let x = e.pageX - this.initialPosition.x
        let y = e.pageY - this.initialPosition.y

        let duration = this.initialDuration 
        let timelineScrollLeft = document.querySelector("element-timeline").scrollLeft

        if (this.resizeLocation == 'left') {
            this.style.left = `${x}px`
            this.style.width = `${duration-x}px`
            this.timeline[this.elementId].startTime = x
            this.timeline[this.elementId].duration = Number(this.style.width.split('px')[0])
        } else {
            //this.style.left = `${this.initialPosition.x}px`
            this.style.width = `${timelineScrollLeft+e.pageX-Number(this.style.left.split('px')[0])}px`
            this.timeline[this.elementId].startTime = this.initialPosition.x
            this.timeline[this.elementId].duration = Number(this.style.width.split('px')[0])
        }
    }

    resizeMousedown(e, location) {

        this.isResize = true
        this.resizeLocation = location
        this.isDrag = false

        this.initialPosition.x = location == 'left' ? 
            e.pageX - Number(this.style.left.replace(/[^0-9]/g, "")) : 
            Number(this.style.left.replace(/[^0-9]/g, ""))
        this.initialPosition.y = e.pageY

        this.initialDuration = this.timeline[this.elementId].duration + Number(this.style.left.replace(/[^0-9]/g, ""))

        this.resizeEventHandler = this.resize.bind(this)
        document.addEventListener('mousemove', this.resizeEventHandler);

    }

    resizeMouseup() {
        document.removeEventListener('mousemove', this.resizeEventHandler);

        this.isResize = false
    }


    connectedCallback() {
        this.render();

        this.addEventListener('mousedown', this.dragMousedown.bind(this));
        this.addEventListener('mouseup', this.dragMouseup.bind(this));
        document.addEventListener('mouseup', this.resizeMouseup.bind(this));

    }

    disconnectedCallback(){
        this.removeEventListener('mousedown', this.dragMousedown);
        this.removeEventListener('mouseup', this.dragMouseup);

    }
}

export { ElementBarStatic }