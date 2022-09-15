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
            this.inner.insertAdjacentHTML("beforeend", `
            <div id="element-${elementId}" class="element-drag" style='width: ${elementTimeline.timeline[elementId].width}px; height: ${elementTimeline.timeline[elementId].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)" onclick="nugget.element.control.event.click.activateOutline('${elementId}')">
            <img src="${blob}" alt="" class="element-image" draggable="false">
            <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${elementId}', 'n')"></div>
            <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${elementId}', 's')"></div>
            <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${elementId}', 'w')"></div>
            <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${elementId}', 'e')"></div>
            </div>
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

export { ElementControl }