class ElementBar extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        this.timeline = document.querySelector("element-timeline").timeline
        this.elementId = this.getAttribute('element-id')
        this.elementBarType = this.getAttribute('element-type') || 'static'

        
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
        let template;
        if (this.elementBarType == 'static') {
            template = this.templateStatic();
        } else {
            template = this.templateDynamic();

        }
        const backgroundColor = this.getRandomColor()

        this.classList.add("element-bar", 'd-block')
        this.setAttribute("style", `width: ${this.width}px; left: 0px; background-color: ${backgroundColor};`)
        this.setAttribute("value", this.elementId)

        this.innerHTML = template;

    }

    templateStatic() {

        return `
        ${this.filepath}
        <div class="element-bar-resize-left position-absolute" onmousedown="this.parentNode.resizeMousedown(this, 'left')"></div>
        <div class="element-bar-resize-right position-absolute" onmousedown="this.parentNode.resizeMousedown(this, 'right')"></div>
        `
    }

    templateDynamic() {

        return `
        ${this.filepath}
        <div class="element-bar-hiddenspace-left position-absolute">
            <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="this.parentNode.parentNode.resizeRangeMousedown(this, 'left')">
            </div>
        </div>
        <div class="element-bar-hiddenspace-right position-absolute">
            <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="this.parentNode.parentNode.resizeRangeMousedown(this, 'right')">
            </div>
        </div>
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


    resizeRange(e) {
        this.isDrag = false

        let x = e.pageX - this.initialPosition.x
        let y = e.pageY - this.initialPosition.y

        let duration = this.initialDuration 
        let originDuration = Number(this.style.width.split('px')[0])

        let resizeRangeTargetLeft = this.querySelector(".element-bar-hiddenspace-left")
        let resizeRangeTargetRight = this.querySelector(".element-bar-hiddenspace-right")
        let timelineElement = document.querySelector("element-timeline")

        let windowWidth = window.innerWidth
        let timelineBodyWidth = timelineElement.scrollWidth
        let targetLeft = Number(this.style.left.split('px')[0])
        let scrollLeft = timelineElement.scrollLeft
        let scrollRight = timelineBodyWidth-windowWidth-scrollLeft
        let marginLeftTargetToWidth = windowWidth-originDuration-targetLeft > 0 ? windowWidth-originDuration-targetLeft - 10 : 0


        if (this.resizeLocation == 'left') {
            resizeRangeTargetLeft.style.width = `${(x+scrollLeft)-5}px`
            this.timeline[this.elementId].trim.startTime = Number(resizeRangeTargetLeft.style.width.split('px')[0])
        } else {
            resizeRangeTargetRight.style.width = `${(scrollRight+window.innerWidth-x-this.initialPosition.x)-marginLeftTargetToWidth}px`
            this.timeline[this.elementId].trim.endTime = duration-Number(resizeRangeTargetRight.style.width.split('px')[0])
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

    resizeRangeMousedown(e, location) {
        this.isResize = true
        this.resizeLocation = location
        this.resizeRangeLeft = Number(this.querySelector(".element-bar-hiddenspace-left").style.width.split('px')[0])
        this.resizeRangeRight = Number(this.querySelector(".element-bar-hiddenspace-right").style.width.split('px')[0])

        this.isDrag = false
        this.initialPosition.x = Number(this.style.left.replace(/[^0-9]/g, ""))
        this.initialDuration = this.timeline[this.elementId].duration + Number(this.style.left.replace(/[^0-9]/g, ""))

        this.resizeEventHandler = this.resizeRange.bind(this)
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

export { ElementBar }