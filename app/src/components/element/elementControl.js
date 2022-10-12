import { v4 as uuidv4 } from 'uuid';

class ElementControl extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        //this.setAttribute("id", 'control')

        this.scroller = undefined
        this.resizeTimeout = undefined;
        this.isResizeStart = false;
        this.previousPreviewSize = {
            w: 1920,
            h: 1080
        }

        this.isPaused = true
        this.isPlay = {
            
        }

        this.progress = 0
        this.activeElementId = ''
        this.previewRatio = 1920/1080

        this.resizeEvent()
        

    }


    async resizeEvent() {
        console.log('resize')
        this.resizePreview()



        let gapFromPreviousRatio = {
            w: 2-(this.previousPreviewSize.w / Number(preview.style.width.split('px')[0])),
            h: 2-(this.previousPreviewSize.h / Number(preview.style.height.split('px')[0]))
        }

        this.matchAllElementsSizeToPreview(gapFromPreviousRatio)
        this.previousPreviewSize.w = Number(preview.style.width.split('px')[0])
        this.previousPreviewSize.h = Number(preview.style.height.split('px')[0])


    }

    resizePreview() {
        let innerWidth = document.getElementById("split_col_2").offsetWidth
        let innerHeight = document.getElementById("split_col_2").offsetHeight


        let width = innerWidth*0.95;
        let height = (width*9)/16

        preview.width = width
        preview.height = height
        preview.style.width = `${width}px`
        preview.style.height = `${height}px`
        video.style.width = `${width}px`
        video.style.height = `${height}px`

        this.previewRatio = 1920/width

    }

    matchAllElementsSizeToPreview(gapFromPreviousRatio) {
        const timeline = document.querySelector("element-timeline").timeline

        for (const elementId in timeline) {
            if (Object.hasOwnProperty.call(timeline, elementId)) {
                let targetElement = document.querySelector(`#element-${elementId}`)

                let elementHeight = Number(targetElement.style.height.split("px")[0])*gapFromPreviousRatio.h
                let elementWidth = Number(targetElement.style.width.split("px")[0])*gapFromPreviousRatio.w
                let elementTop = Number(targetElement.style.top.split("px")[0])*gapFromPreviousRatio.h
                let elementLeft = Number(targetElement.style.left.split("px")[0])*gapFromPreviousRatio.w

                if (timeline[elementId].filetype != 'text') {
                    targetElement.resizeStyle({
                        x: elementLeft,
                        y: elementTop,
                        w: elementWidth,
                        h: elementHeight
                    })
                }


                
            }
        }
    
    }

    addImage(blob, path) {
        const elementId = this.generateUUID()
        const elementTimeline = document.querySelector("element-timeline")
        const img = document.createElement('img');

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
        const elementId = this.generateUUID()
        const elementTimeline = document.querySelector("element-timeline")
        const video = document.createElement('video')


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
            textcolor: "#ffffff",
            fontsize: 20,
            location: {x: 0, y: 0},
            localpath: '/TEXTELEMENT',
            filetype: 'text'
        }

        this.showText(elementId)
        elementTimeline.addElementBar(elementId)
    }


    addAudio(blob, path) {
        const elementId = this.generateUUID()
        const elementTimeline = document.querySelector("element-timeline")
        const audio = document.createElement('audio')

        audio.src = blob

        audio.onloadedmetadata = () => {
            let duration = audio.duration*200

            elementTimeline.timeline[elementId] = {
                blob: blob,
                startTime: 0,
                duration: duration,
                location: {x: 0, y: 0}, // NOT USING
                trim: {startTime: 0, endTime: duration},
                localpath: path,
                filetype: 'audio'
            }

            
            this.showAudio(elementId)
            elementTimeline.addElementBar(elementId)

        }

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
                

                if (this.isPaused) {
                    video.pause()
                    this.isPlay[elementId] = false
                } else {
                    if (!this.isPlay[elementId]) {
                        video.currentTime = secondsOfRelativeTime
                        video.play()
                    }
                    this.isPlay[elementId] = true
                }

            }

            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }
    }

    showAudio(elementId) {
        const elementTimeline = document.querySelector("element-timeline")

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="audio"></element-control-asset>`)

            let audio = document.getElementById(`element-${elementId}`).querySelector("audio")
            let secondsOfRelativeTime = (elementTimeline.timeline[elementId].startTime - this.progress) / 200

            audio.currentTime = secondsOfRelativeTime

        } else {
            let audio = document.getElementById(`element-${elementId}`).querySelector("audio")
            let secondsOfRelativeTime = -(elementTimeline.timeline[elementId].startTime - this.progress) / 200

            if (!!(audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2)) {
                if (this.isPaused) {
                    console.log('paused')

                }
                console.log('isPlaying')
            } else {
                audio.currentTime = secondsOfRelativeTime

                if (this.isPaused) {
                    audio.pause()
                } else {
                    audio.play()
                }
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
        elementTimeline.timeline[elementId].text = inputValue
    }

    changeTextColor(event) {
        const elementTimeline = document.querySelector("element-timeline")
        let elementId = document.querySelector(`#optionTargetElement`).value
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input')
        inputTarget.style.color = event.value
        elementTimeline.timeline[elementId].textcolor = event.value
    }

    changeTextSize(event) {
        console.log(event)
        const elementTimeline = document.querySelector("element-timeline")
        let elementId = document.querySelector(`#optionTargetElement`).value
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input')
        inputTarget.style.fontSize = `${event.value}px`
        elementTimeline.timeline[elementId].fontsize = Number(event.value)
    }

    progressToTime() {
        let ms = this.progress * 5
        let time = new Date(ms).toISOString().slice(11, 22)
        return time
    }

    generateUUID () {
        let uuid = uuidv4()
        return uuid
    }


    showTime() {
        const showTime = document.querySelector("#time") 
        showTime.innerHTML = this.progressToTime()

    }
    

    hideElement (elementId) {
        const timeline = document.querySelector("element-timeline").timeline

        if (timeline[elementId].filetype == 'video') {
            this.pauseVideo(elementId)
        } else if (timeline[elementId].filetype == 'audio') {
            this.pauseAudio(elementId)
        }
        document.querySelector(`#element-${elementId}`).classList.add('d-none')
    }

    appearAllElementInTime() {
        const timeline = document.querySelector("element-timeline").timeline

        for(let elementId in timeline) {
            let filetype = timeline[elementId].filetype
            let checkFiletype = timeline[elementId].startTime > this.progress || 
            timeline[elementId].startTime + timeline[elementId].duration < this.progress

            if (filetype == 'video' || filetype == 'audio') {
                checkFiletype = timeline[elementId].startTime + timeline[elementId].trim.startTime > this.progress || 
                timeline[elementId].startTime + timeline[elementId].trim.endTime < this.progress
            }

            if (checkFiletype) {
                this.hideElement(elementId)
            } else {
                if (filetype == 'image') {
                    this.showImage(elementId)
                } else if (filetype == 'video') {
                    this.showVideo(elementId)
                } else if (filetype == 'text') {
                    this.showText(elementId)
                } else if (filetype == 'audio') {
                    this.showAudio(elementId)
                }
            }
        }
    }

    play() {
        const timelineBar = document.querySelector("element-timeline-bar")

        let toggle = document.querySelector("#playToggle")
        toggle.setAttribute('onclick', `elementControlComponent.stop()`)
        toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> stop_circle </span>`

        this.scroller = setInterval(() => {
            //split_inner_bottom.scrollBy(4, 0);
            let nowTimelineProgress = Number(timelineBar.style.left.split('px')[0]) + 4
            this.progress = nowTimelineProgress

            //timelineBar.style.left = `${nowTimelineProgress}px`
            timelineBar.move(nowTimelineProgress)
            this.showTime()

            if ((this.innerWidth + this.offsetWidth) >= this.offsetWidth) {
                this.stop();
            }

            this.appearAllElementInTime()



        }, 20);
        this.isPaused = false;
        
    }

    stop() {
        clearInterval(this.scroller);
        const toggle = document.querySelector("#playToggle")
        const timeline = document.querySelector("element-timeline").timeline

        this.isPaused = true;
        for (const elementId in timeline) {
            if (Object.hasOwnProperty.call(timeline, elementId)) {
                this.isPlay[elementId] = false
            }
        }
        


        toggle.setAttribute('onclick', `elementControlComponent.play()`)
        toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> play_circle </span>`

        this.showTime()
        this.pauseAllDynamicElements()
    }

    pauseVideo (elementId) {
        const elementTimeline = document.querySelector("element-timeline")
        let secondsOfRelativeTime = -(elementTimeline.timeline[elementId].startTime - this.progress) / 200
        let video = document.getElementById(`element-${elementId}`).querySelector("video")
        video.currentTime = secondsOfRelativeTime
        video.pause()
    }

    pauseAudio (elementId) {
        let audio = document.getElementById(`element-${elementId}`).querySelector("audio")
        audio.pause()
    }

    pauseAllDynamicElements () {
        const timeline = document.querySelector("element-timeline").timeline
        let key;

        for(key in timeline) {
            let filetype = timeline[key].filetype

            if (filetype == 'video') {
                this.pauseVideo(key)
            } else if (filetype == 'audio') {
                this.pauseAudio(key)
            }
        }
    }


    reset () {
        const timelineBar = document.querySelector("element-timeline-bar")

        this.progress = 0
        this.isPaused = true;

        this.showTime()
        this.appearAllElementInTime()
        timelineBar.move(0)
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
            template = this.templateText() + this.templateResize('horizon')
        } else if (this.elementFiletype == 'audio') {
            template = this.templateAudio()
        }


        this.classList.add("element-drag")
        this.setAttribute("id", `element-${this.elementId}`)
        this.setAttribute("style", `width: ${this.timeline[this.elementId].width}px; top: ${this.timeline[this.elementId].location.y}px; left: ${this.timeline[this.elementId].location.x}px;`)
        
        if (this.elementFiletype !== 'text') {
            this.setAttribute("style", `width: ${this.timeline[this.elementId].width}px; top: ${this.timeline[this.elementId].location.y}px; left: ${this.timeline[this.elementId].location.x}px; height: ${this.timeline[this.elementId].height}px;`)
        }
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

    templateAudio() {
        return `
        <audio src="${this.timeline[this.elementId].blob}" class="d-none" draggable="false"></video>`
    }

    templateText() {
        
        return `<input type="text" class="asset-transparent element-text" draggable="false" style="color: rgb(255, 255, 255); font-size: 20px;" onkeyup="document.querySelector('element-control').changeText('${this.elementId}')" value="${this.timeline[this.elementId].text}">`

    }

    templateResize(type = 'full') {
        // full horizon vertical
        let resize = {
            n: `<div class="resize-n" onmousedown="this.parentNode.resizeMousedown('n')"></div>`,
            s: `<div class="resize-s" onmousedown="this.parentNode.resizeMousedown('s')"></div>`,
            w: `<div class="resize-w" onmousedown="this.parentNode.resizeMousedown('w')"></div>`,
            e: `<div class="resize-e" onmousedown="this.parentNode.resizeMousedown('e')"></div>`,
            ne: `<div class="resize-ne" onmousedown="this.parentNode.resizeMousedown('ne')"></div>`,
            nw: `<div class="resize-nw" onmousedown="this.parentNode.resizeMousedown('nw')"></div>`,
            se: `<div class="resize-se" onmousedown="this.parentNode.resizeMousedown('se')"></div>`,
            sw: `<div class="resize-sw" onmousedown="this.parentNode.resizeMousedown('sw')"></div>`
        }
        if (type == 'full') {
            return `
            ${resize.n}
            ${resize.s}
            ${resize.w}
            ${resize.e}
            ${resize.ne}
            ${resize.nw}
            ${resize.se}
            ${resize.sw}
            `
        } else if (type == 'vertical') {
            return `
            ${resize.n}
            ${resize.s}
            `
        } else if (type == 'horizon') {
            return `
            ${resize.w}
            ${resize.e}
            `
        }

    }

    pxToInteger(px = '0px') {
        return Number(px.split('px')[0])
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
    
            if (x > window.innerWidth) {
                document.removeEventListener('mousemove', this.dragdownEventHandler);
            } else {
                this.style.top = `${y}px`
                this.style.left = `${x}px`

                this.timeline[this.elementId].location.x = x 
                this.timeline[this.elementId].location.y = y
            }
        }
    }

    dragMousedown(e) {
        if (!this.isResize) {
            this.isDrag = true
            this.initialPosition.x = e.pageX - this.pxToInteger(this.style.left)
            this.initialPosition.y = e.pageY - this.pxToInteger(this.style.top)
            this.dragdownEventHandler = this.drag.bind(this)
            document.addEventListener('mousemove', this.dragdownEventHandler);
        }
    }

    dragMouseup() {
        document.removeEventListener('mousemove', this.dragdownEventHandler)
        this.isDrag = false
    }

    getGcd(a,b) {
        if (b == 0) {
            return a
        }
        return this.getGcd(b, a%b)
    }


    resize(e) {
        this.isDrag = false

        const videoBox = document.querySelector("#video");
        const rect = videoBox.getBoundingClientRect();

        let x = e.pageX - rect.left - this.initialPosition.x
        let y = e.pageY - rect.top - this.initialPosition.y
        let w = this.initialPosition.w
        let h = this.initialPosition.h

        let aspectRatio = w/h

        switch (this.resizeDirection) {
            case 'n':
                this.resizeStyle({
                    y: this.initialPosition.y+y,
                    h: this.initialPosition.h-y
                })
                // this.style.top = `${this.initialPosition.y+y}px`
                // this.style.height = `${this.initialPosition.h-y}px`
                break;

            case 's':
                this.resizeStyle({
                    y: this.initialPosition.y,
                    h: y
                })
                // this.style.top = `${}px`
                // this.style.height = `${y}px`
                break;

            case 'w':
                this.resizeStyle({
                    x: this.initialPosition.x+x,
                    w: this.initialPosition.w-x
                })
                // this.style.left = `${}px`
                // this.style.width = `${this.initialPosition.w-x}px`
                break;

            case 'e':
                this.resizeStyle({
                    x: this.initialPosition.x,
                    w: x
                })
                // this.style.left = `${this.initialPosition.x}px`
                // this.style.width = `${x}px`
                break;

            case 'ne':
                this.resizeStyle({
                    y: this.initialPosition.y+y,
                    h: this.initialPosition.h-y,
                    w: x
                })
                // this.style.top = `${this.initialPosition.y+y}px`
                // //this.style.height = `${this.initialPosition.h-y}px`
                // //this.style.width = `${aspectRatio*(this.initialPosition.h-y)}px`
                // this.style.height = `${this.initialPosition.h-y}px`
                // this.style.width = `${x}px`

                break;

            case 'nw':
                this.resizeStyle({
                    x: this.initialPosition.x+x,
                    y: this.initialPosition.y+y,
                    h: this.initialPosition.h-y,
                    w: this.initialPosition.w-x
                })
                // this.style.top = `${this.initialPosition.y+y}px`
                // this.style.height = `${this.initialPosition.h-y}px`
                // this.style.left = `${this.initialPosition.x+x}px`
                // this.style.width = `${this.initialPosition.w-x}px`
                break;

            case 'sw':
                this.resizeStyle({
                    x: this.initialPosition.x+x,
                    h: y,
                    w: this.initialPosition.w-x
                })
                // this.style.height = `${y}px`
                // this.style.left = `${this.initialPosition.x+x}px`
                // this.style.width = `${this.initialPosition.w-x}px`
                break;

            case 'se':
                this.resizeStyle({
                    x: this.initialPosition.x,
                    y: this.initialPosition.y,
                    h: y,
                    w: x
                })
                // this.style.top = `${this.initialPosition.y}px`
                // this.style.height = `${y}px`
                // this.style.left = `${this.initialPosition.x}px`
                // this.style.width = `${x}px`
                break;
        
            default:
                break;
        }

        this.timeline[this.elementId].location.y = Number(this.style.top.split('px')[0])
        this.timeline[this.elementId].location.x = Number(this.style.left.split('px')[0])
        this.timeline[this.elementId].width = Number(this.style.width.split('px')[0])
        this.timeline[this.elementId].height = Number(this.style.height.split('px')[0])
    }

    resizeStyle({x, y, w, h}) {
        this.style.left = !x == false ? `${x}px` : this.style.left
        this.style.top = !y == false ? `${y}px` : this.style.top
        this.style.width = !w == false ? `${w}px` : this.style.width
        this.style.height = !h == false ? `${h}px` : this.style.height
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

    activateOutline () {
        const elementControl = document.querySelector("element-control")
        this.deactivateAllOutline()
        elementControl.activeElementId = this.elementId
        this.classList.add("element-outline")
    
    }

    deactivateAllOutline () {
        const elementControl = document.querySelector("element-control")
        const elementTimeline = document.querySelector("element-timeline")

        for (const elementId in elementTimeline.timeline) {
            if (Object.hasOwnProperty.call(elementTimeline.timeline, elementId)) {
                document.querySelector(`#element-${elementId}`).classList.remove("element-outline")
            }
        }
        elementControl.activeElementId = ''

    }


    dblClick() {
        let optionOffcanvas = new bootstrap.Offcanvas(document.getElementById('option_top'))
        let offcanvasOptionListsId = ['option_text']

        for (let index = 0; index < offcanvasOptionListsId.length; index++) {
            const element = offcanvasOptionListsId[index];
            document.querySelector(`#${element}`).classList.add("d-none")
        }

        if (this.elementFiletype == 'text') {
            document.querySelector(`#option_text`).classList.remove("d-none")
            document.querySelector(`#optionTargetElement`).value = this.elementId
            optionOffcanvas.show()
        }

    }


    connectedCallback() {
        this.render();

        this.addEventListener('mousedown', this.dragMousedown.bind(this));
        document.addEventListener('mouseup', this.dragMouseup.bind(this));
        this.addEventListener('mousedown', this.activateOutline.bind(this));
        this.addEventListener('dblclick', this.dblClick.bind(this));

        document.addEventListener('mouseup', this.resizeMouseup.bind(this));

    }


}

export { ElementControl, ElementControlAsset }