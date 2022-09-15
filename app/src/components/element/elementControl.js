import { v4 as uuidv4 } from 'uuid';

class ElementControl extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        //this.setAttribute("id", 'control')
        let inner = document.createElement('div')
        inner.classList.add("control-inner")

        this.classList.add('control')
        this.appendChild(inner)

        this.inner = this.querySelector("div")
        

    }

    addImage(blob, path) {
        const elementId = this.generateUUID()
        const elementTimeline = document.querySelector("element-timeline")

        let img = document.createElement('img');

        img.src = blob
        img.onload = () => {
            let division = 10
            var width = img.width/division
            var height = img.height/division

            elementTimeline.timeline[elementId] = {
                blob: blob,
                startTime: 0,
                duration: 1000,
                location: {x: 0, y: 0},
                width: width,
                height: height,
                localpath: path,
                filetype: 'image'

            }

            this.showImage(elementId)
            elementTimeline.addElementBar(elementId)

        }
    }


    addVideo(blob, path) {
        let video = document.createElement('video')
        const elementId = this.generateUUID()
        const elementTimeline = document.querySelector("element-timeline")


        video.src = blob
        video.preload = 'metadata'

        video.onloadedmetadata = function() {
            let division = 10

            let width = video.videoWidth/division
            let height = video.videoHeight/division
            let duration = video.duration*200

            elementTimeline.timeline[elementId] = {
                blob: blob,
                startTime: 0,
                duration: duration,
                location: {x: 0, y: 0},
                trim: {startTime: 0, endTime: duration},
                width: width,
                height: height,
                localpath: path,
                filetype: 'video'
            }

            
            elementPreview.show.video(elementId)
            elementTimeline.addElementBar(elementId)

        }
    }

    addText() {
        const elementId = this.generateUUID()
        const elementTimeline = document.querySelector("element-timeline")


        elementTimeline.timeline[elementId] = {
            startTime: 0,
            duration: 1000,
            text: "텍스트",
            location: {x: 0, y: 0},
            localpath: '/TESTELEMENT',
            filetype: 'text'
        }

        elementPreview.show.text(elementId)
        elementTimeline.addElementBar(elementId)
    }


    showImage(elementId) {
        const elementTimeline = document.querySelector("element-timeline")
        let blob = elementTimeline.timeline[elementId].blob

        if (document.getElementById(`element-${elementId}`) == null) {
            this.inner.insertAdjacentHTML("beforeend", `<element-control-image element-id="${elementId}"></element-control-image>
            `)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }
    }

    generateUUID () {
        let uuid = uuidv4()
        return uuid
    }
}


class ElementControlImage extends HTMLElement { 
    constructor() {
        super();

        this.timeline = document.querySelector("element-timeline").timeline
        this.elementId = this.getAttribute('element-id')

        this.isDrag = false
        this.isResize = false

        this.initialPosition = {x: 0, y: 0, w: 0, h: 0}
        this.resizeDirection = 'n'
        this.resizeEventHandler
    }

    render(){
        const template = this.template();
        this.classList.add("element-drag")
        this.setAttribute("id", `element-${this.elementId}`)
        this.setAttribute("style", `width: ${this.timeline[this.elementId].width}px; height: ${this.timeline[this.elementId].height}px; top: 0px; left: 0px;`)
        // onmousedown="nugget.element.control.event.drag.onmousedown(this)" onclick="nugget.element.control.event.click.activateOutline('${elementId}')"

        this.innerHTML = template;
    }

    template() {
        return `
        <img src="${this.timeline[this.elementId].blob}" alt="" class="element-image" draggable="false">
        <div class="resize-n" onmousedown="this.parentNode.resizeMousedown('n')"></div>
        <div class="resize-s" onmousedown="this.parentNode.resizeMousedown('s')"></div>
        <div class="resize-w" onmousedown="this.parentNode.resizeMousedown('w')"></div>
        <div class="resize-e" onmousedown="this.parentNode.resizeMousedown('e')"></div>`
    }

    drag(e) {
        if (this.isDrag) {
            let x = e.clientX - this.initialPosition.x
            let y = e.clientY - this.initialPosition.y

            let checkTagName = ['img', 'video', 'input']
            let existTagName = ''
            for (let tagname = 0; tagname < checkTagName.length; tagname++) {
                if (this.querySelector(checkTagName[tagname])) {
                    existTagName = checkTagName[tagname]
                }
            }
    
    
            this.style.top = `${y}px`
            this.style.left = `${x}px`
            //target.style.transform = `translate(${x}px, ${y}px)`
            this.timeline[this.elementId].location.x = x 
            this.timeline[this.elementId].location.y = y
        }

    }

    dragMousedown(e) {
        this.addEventListener('mousemove', this.drag);

        if (!this.isResize) {
            this.isDrag = true
            this.initialPosition.x = e.pageX - Number(this.style.left.replace(/[^0-9]/g, ""))
            this.initialPosition.y = e.pageY - Number(this.style.top.replace(/[^0-9]/g, ""))
        }


    }

    dragMouseup() {
        this.removeEventListener('mousemove', this.drag);

        this.isDrag = false
    }

    resize(e) {
        this.isDrag = false

        const videoBox = document.querySelector("#video");
        const rect = videoBox.getBoundingClientRect();

        let x = e.pageX - rect.left - this.initialPosition.x
        let y = e.pageY - rect.top - this.initialPosition.y

        switch (this.resizeDirection) {
            case 'n':
                this.style.top = `${this.initialPosition.y+y}px`
                this.style.height = `${this.initialPosition.h-y}px`
                break;

            case 's':
                this.style.top = `${this.initialPosition.y}px`
                this.style.height = `${y}px`
                break;

            case 'w':
                this.style.left = `${this.initialPosition.x+x}px`
                this.style.width = `${this.initialPosition.w-x}px`
                break;

            case 'e':
                this.style.left = `${this.initialPosition.x}px`
                this.style.width = `${x}px`
                break;
        
            default:
                break;
        }

        this.timeline[this.elementId].location.y = Number(this.style.top.split('px')[0])
        this.timeline[this.elementId].location.x = Number(this.style.left.split('px')[0])
        this.timeline[this.elementId].width = Number(this.style.width.split('px')[0])
        this.timeline[this.elementId].height = Number(this.style.height.split('px')[0])
    }

    resizeMousedown(direction) {
        this.isDrag = false


        this.isResize = true
        this.resizeDirection = direction

        this.initialPosition.w = Number(this.style.width.split('px')[0])
        this.initialPosition.h = Number(this.style.height.split('px')[0])
        this.initialPosition.x = Number(this.style.left.split('px')[0])
        this.initialPosition.y = Number(this.style.top.split('px')[0])

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


}

export { ElementControl, ElementControlImage }