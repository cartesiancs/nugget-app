import { v4 as uuidv4 } from 'uuid';

class ElementControl extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        //this.setAttribute("id", 'control')

        this.scroller = undefined
        this.isPaused = true
        this.progress = 0
        

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

        video.onloadedmetadata = () => {
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

            
            this.showVideo(elementId)
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

        this.showText(elementId)
        elementTimeline.addElementBar(elementId)
    }


    showImage(elementId) {
        const elementTimeline = document.querySelector("element-timeline")
        let blob = elementTimeline.timeline[elementId].blob

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="image"></element-control-asset>
            `)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }
    }

    showVideo(elementId) {
        const elementTimeline = document.querySelector("element-timeline")

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="video"></element-control-asset>`)

            let video = document.getElementById(`element-${elementId}`).querySelector("video")
            let secondsOfRelativeTime = (elementTimeline.timeline[elementId].startTime - this.progress) / 200

            video.currentTime = secondsOfRelativeTime

        } else {
            let video = document.getElementById(`element-${elementId}`).querySelector("video")
            let secondsOfRelativeTime = -(elementTimeline.timeline[elementId].startTime - this.progress) / 200

            if (!!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)) {
                if (this.isPaused) {
                    console.log('paused')

                }
                console.log('isPlaying')
            } else {
                video.currentTime = secondsOfRelativeTime
                video.play()
            }

            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }
    }

    showText(elementId) {
        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="text"></element-control-asset>
            `)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }
    }

    changeText(elementId) {
        const elementTimeline = document.querySelector("element-timeline")
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input')
        let inputValue = inputTarget.value
    
        console.log(elementId, inputValue)
        elementTimeline.timeline[elementId].text = inputValue
    }



    generateUUID () {
        let uuid = uuidv4()
        return uuid
    }

    hideElement (elementId) {
        const timeline = document.querySelector("element-timeline").timeline

        if (timeline[elementId].filetype == 'video') {
            this.pauseVideo(elementId)
        }
        document.querySelector(`#element-${elementId}`).classList.add('d-none')
    }

    play() {
        const timeline = document.querySelector("element-timeline").timeline

        let toggle = document.querySelector("#playToggle")
        toggle.setAttribute('onclick', `elementControlComponent.stop()`)
        toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> stop_circle </span>`

        this.scroller = setInterval(() => {
            //split_inner_bottom.scrollBy(4, 0);
            let nowTimelineProgress = Number(timeline_bar.style.left.split('px')[0]) + 4
            timeline_bar.style.left = `${nowTimelineProgress}px`

            this.progress = nowTimelineProgress
            if ((this.innerWidth + this.offsetWidth) >= this.offsetWidth) {
                this.stop();
            }

            
            for(let elementId in timeline) {
                let blob = timeline[elementId].blob
                let filetype = timeline[elementId].filetype
                let condition = timeline[elementId].startTime > this.progress || 
                timeline[elementId].startTime + timeline[elementId].duration < this.progress
    
                if (filetype == 'video') {
                    condition = timeline[elementId].startTime + timeline[elementId].trim.startTime > this.progress || 
                    timeline[elementId].startTime + timeline[elementId].trim.endTime < this.progress
    
                }
    
                if (condition) {
                    this.hideElement(elementId)
                } else {
                    if (filetype == 'image') {
                        this.showImage(elementId)
                    } else if (filetype == 'video') {
                        this.showVideo(elementId)
                    } else if (filetype == 'text') {
                        this.showText(elementId)
                    }
                }
            }


        }, 20);
        this.isPaused = false;
    }

    stop() {
        clearInterval(this.scroller);
        this.isPaused = true;

        let toggle = document.querySelector("#playToggle")
        toggle.setAttribute('onclick', `elementControlComponent.play()`)
        toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> play_circle </span>`

        this.pauseAllVideo()
    }

    pauseVideo (elementId) {
        let video = document.getElementById(`element-${elementId}`).querySelector("video")
        video.pause()
    }

    pauseAllVideo () {
        const timeline = document.querySelector("element-timeline").timeline
        let key;

        for(key in timeline) {
            let filetype = timeline[key].filetype

            if (filetype == 'video') {
                let video = document.getElementById(`element-${key}`).querySelector("video")
                video.pause()
            }
        }
    }

    reset () {
        timeline_bar.style.left = `0px`
        this.progress = 0
        this.isPaused = true;

    }
}


class ElementControlAsset extends HTMLElement { 
    constructor() {
        super();

        this.timeline = document.querySelector("element-timeline").timeline
        this.elementId = this.getAttribute('element-id')
        this.elementFiletype = this.getAttribute('element-filetype') || 'image'

        this.isDrag = false
        this.isResize = false

        this.initialPosition = {x: 0, y: 0, w: 0, h: 0}
        this.resizeDirection = 'n'
        this.resizeEventHandler
        this.dragdownEventHandler
        this.dragupEventHandler

    }

    render(){
        let template
        if (this.elementFiletype == 'image') {
            template = this.templateImage() + this.templateResize()
        } else if (this.elementFiletype == 'video') {
            template = this.templateVideo() + this.templateResize()
        } else if (this.elementFiletype == 'text') {
            template = this.templateText() + this.templateResize()
        }


        this.classList.add("element-drag")
        this.setAttribute("id", `element-${this.elementId}`)
        this.setAttribute("style", `width: ${this.timeline[this.elementId].width}px; height: ${this.timeline[this.elementId].height}px; top: 0px; left: 0px;`)
        // onmousedown="nugget.element.control.event.drag.onmousedown(this)" onclick="nugget.element.control.event.click.activateOutline('${elementId}')"

        this.innerHTML = template;
    }

    templateImage() {
        return `
        <img src="${this.timeline[this.elementId].blob}" alt="" class="element-image" draggable="false">`
    }

    templateVideo() {
        return `
        <video src="${this.timeline[this.elementId].blob}" alt="" class="element-video" draggable="false"></video>`
    }

    templateText() {
        
        return `<input type="text" class="form-transparent element-text" draggable="false" onkeyup="document.querySelector('element-control').changeText('${this.elementId}')" value="텍스트">`

    }

    templateResize() {
        return `
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


        if (!this.isResize) {
            this.isDrag = true
            this.initialPosition.x = e.pageX - Number(this.style.left.replace(/[^0-9]/g, ""))
            this.initialPosition.y = e.pageY - Number(this.style.top.replace(/[^0-9]/g, ""))
            this.dragdownEventHandler = this.drag.bind(this)
            document.addEventListener('mousemove', this.dragdownEventHandler);
        }


    }

    dragMouseup() {
        document.removeEventListener('mousemove', this.dragdownEventHandler);
        //this.removeEventListener('mousemove', this.drag);


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

export { ElementControl, ElementControlAsset }