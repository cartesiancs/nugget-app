import { v4 as uuidv4 } from 'uuid';

class ElementControl extends HTMLElement { 
    constructor() {
        super();

        this.elementTimeline;
        this.timeline;
        this.timelineBar;

        window.addEventListener('DOMContentLoaded', () => {
            this.elementTimeline = document.querySelector("element-timeline");
            this.timeline = document.querySelector("element-timeline").timeline;
            this.timelineBar = document.querySelector("element-timeline-bar");
        });

        this.scroller = undefined
        this.resizeTimeout = undefined;
        this.resizeInterval = undefined;

        this.isResizeStart = false;
        this.previousPreviewSize = {
            w: 1920,
            h: 1080
        }

        this.isPaused = true
        this.isPlay = {}

        
        this.activeElementId = ''
        this.selectElementsId = []

        this.existActiveElement = false

        this.progress = 0
        this.progressTime = 0
        this.previewRatio = 1920/1920

        this.resizeEvent()
    
    }


    async resizeEvent() {
        this.resizePreview()
        clearTimeout(this.resizeTimeout)

        if (this.isResizeStart == false) {
            this.isResizeStart = true
            this.resizeInterval = setInterval(() => {
        
                this.matchAllElementsSizeToPreview()


            }, 50);
        }

        this.resizeTimeout = setTimeout(() => {
            clearInterval(this.resizeInterval)
            this.isResizeStart = false
        }, 300);

    }

    resizePreview() {
        let innerWidth = document.getElementById("split_col_2").offsetWidth
        let splitTopHeight = document.getElementById("split_top").offsetHeight
        let splitBottomHeight = document.getElementById("split_bottom").offsetHeight
        let videoBoxHeight = document.getElementById("videobox").offsetHeight
        let videoHeight = document.getElementById("video").offsetHeight

        let elementTimelineHeight = document.querySelector("element-timeline").offsetHeight

        let horizontalResizeWidth = Math.round(innerWidth*0.95);
        let horizontalResizeHeight = Math.round((horizontalResizeWidth*9)/16);

        let verticalResizeHeight = (window.innerHeight - (splitBottomHeight + 20) - (videoBoxHeight - videoHeight))*0.92
        let verticalResizeWidth = verticalResizeHeight * (16 / 9)

        let width = horizontalResizeWidth > verticalResizeWidth ? verticalResizeWidth : horizontalResizeWidth
        let height = horizontalResizeHeight > verticalResizeHeight ? verticalResizeHeight : horizontalResizeHeight


        preview.width = width
        preview.height = height
        preview.style.width = `${width}px`
        preview.style.height = `${height}px`
        video.style.width = `${width}px`
        video.style.height = `${height}px`

        this.previewRatio = 1920/width

    }

    matchAllElementsSizeToPreview(gapFromPreviousRatio) {

        for (const elementId in this.timeline) {
            if (Object.hasOwnProperty.call(this.timeline, elementId)) {
                let targetElement = document.querySelector(`#element-${elementId}`)

                let elementHeight = Number(this.timeline[elementId].height) / this.previewRatio
                let elementWidth = Number(this.timeline[elementId].width) / this.previewRatio
                let elementTop = Number(this.timeline[elementId].location.y) / this.previewRatio
                let elementLeft = Number(this.timeline[elementId].location.x) / this.previewRatio
                console.log(this.previewRatio)

                if (this.timeline[elementId].filetype != 'text') {
                    targetElement.resizeStyle({
                        x: elementLeft,
                        y: elementTop,
                        w: elementWidth,
                        h: elementHeight
                    })
                } else if (this.timeline[elementId].filetype == 'text') {
                    let elementTextSize = Number(this.timeline[elementId].fontsize) / this.previewRatio

                    targetElement.resizeStyle({
                        x: elementLeft,
                        y: elementTop
                    })

                    targetElement.resizeFont({
                        px: elementTextSize
                    })
                }   
            }
        }
    }

    removeElementById(elementId) {
        this.querySelector(`element-control-asset[element-id="${elementId}"]`).remove()
        this.timeline = document.querySelector("element-timeline").timeline;

    }

    removeAllElementAsset() {
        const assetLists = this.querySelectorAll("element-control-asset")
        assetLists.forEach(element => {
            element.remove()
        });
        this.timeline = document.querySelector("element-timeline").timeline;
    }

    fitElementSizeOnPreview(width, height) {
        let preview = {
            w: Number(document.querySelector("#video").style.width.split("px")[0]),
            h: Number(document.querySelector("#video").style.height.split("px")[0])
        }

        let originRatio = width/height
        let resizeHeight = height < preview.h ? height : preview.h
        let resizeWidth = resizeHeight * originRatio

        return {
            width: resizeWidth,
            height: resizeHeight
        }
    }

    addImage(blob, path) {
        const elementId = this.generateUUID()
        const img = document.createElement('img');

        img.src = blob
        img.onload = () => {

            let resize = this.fitElementSizeOnPreview(img.width, img.height)
            let width = resize.width
            let height = resize.height // /division

            this.timeline[elementId] = {
                blob: blob,
                startTime: 0,
                duration: 1000,
                location: {x: 0, y: 0},
                width: width,
                height: height,
                localpath: path,
                filetype: 'image',
                animation: {
                    isActivate: false,
                    allpoints: []
                }

            }

            this.showImage(elementId)
            this.elementTimeline.addElementBar(elementId)

        }
    }


    addVideo(blob, path) {
        const elementId = this.generateUUID()
        const video = document.createElement('video')




        video.src = blob
        video.preload = 'metadata'

        video.onloadedmetadata = () => {

            let width = video.videoWidth
            let height = video.videoHeight
            let duration = video.duration * 1000

            ffmpeg.ffprobe(path, (err, metadata) => {
                let isExist = false
                metadata.streams.forEach(element => {
                    if (element.codec_type == "audio") {
                        isExist = true
                    }
                });

                console.log(isExist, "AUDIO")

                this.timeline[elementId] = {
                    blob: blob,
                    startTime: 0,
                    duration: duration,
                    location: {x: 0, y: 0},
                    trim: {startTime: 0, endTime: duration},
                    width: width,
                    height: height,
                    localpath: path,
                    isExistAudio: isExist,
                    filetype: 'video'
                }
    
                
                this.showVideo(elementId)
                this.elementTimeline.addElementBar(elementId)
            })
    



        }
    }

    addText() {
        const elementId = this.generateUUID()

        this.timeline[elementId] = {
            startTime: 0,
            duration: 1000,
            text: "텍스트",
            textcolor: "#ffffff",
            fontsize: 52,
            location: {x: 0, y: 0},
            localpath: '/TEXTELEMENT',
            filetype: 'text',
            animation: {
                isActivate: false,
                allpoints: []
            }
        }

        this.showText(elementId)
        this.elementTimeline.addElementBar(elementId)
    }


    addAudio(blob, path) {
        const elementId = this.generateUUID()
        const audio = document.createElement('audio')

        audio.src = blob

        audio.onloadedmetadata = () => {
            let duration = audio.duration*1000

            this.timeline[elementId] = {
                blob: blob,
                startTime: 0,
                duration: duration,
                location: {x: 0, y: 0}, // NOT USING
                trim: {startTime: 0, endTime: duration},
                localpath: path,
                filetype: 'audio'
            }

            
            this.showAudio(elementId)
            this.elementTimeline.addElementBar(elementId)

        }

    }

    showAnimation(elementId) {

        let index = document.querySelector("element-control").progress

        document.querySelector(`#element-${elementId}`).style.left = `${this.timeline[elementId].animation.allpoints[index].y}px`

    }


    showImage(elementId) {

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="image"></element-control-asset>`)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }

        if (this.timeline[elementId].animation.isActivate == true && 
            this.timeline[elementId].animation.allpoints.length > document.querySelector("element-control").progress) {
            this.showAnimation(elementId)
        }
    }

    showVideo(elementId) {

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="video"></element-control-asset>`)

            let video = document.getElementById(`element-${elementId}`).querySelector("video")
            let secondsOfRelativeTime = (this.timeline[elementId].startTime - this.progressTime) / 1000

            video.currentTime = secondsOfRelativeTime

        } else {
            let video = document.getElementById(`element-${elementId}`).querySelector("video")
            let secondsOfRelativeTime = -(this.timeline[elementId].startTime - this.progressTime) / 1000


            if (!!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)) {
                if (this.isPaused) {
                    console.log('paused')

                }
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

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="audio"></element-control-asset>`)

            let audio = document.getElementById(`element-${elementId}`).querySelector("audio")
            let secondsOfRelativeTime = (this.timeline[elementId].startTime - this.progressTime) / 1000

            audio.currentTime = secondsOfRelativeTime

        } else {
            let audio = document.getElementById(`element-${elementId}`).querySelector("audio")
            let secondsOfRelativeTime = -(this.timeline[elementId].startTime - this.progressTime) / 1000

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
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="text"></element-control-asset>`)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }

        if (this.timeline[elementId].animation.isActivate == true && 
            this.timeline[elementId].animation.allpoints.length > document.querySelector("element-control").progress) {
            this.showAnimation(elementId)
        }
    }

    changeText(elementId) {
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input')
        let inputValue = inputTarget.value
        this.timeline[elementId].text = inputValue
    }

    changeTextColor(event) {
        let elementId = document.querySelector(`#optionTargetElement`).value
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input')
        inputTarget.style.color = event.value
        this.timeline[elementId].textcolor = event.value
    }

    changeTextSize(event) {
        let elementId = document.querySelector(`#optionTargetElement`).value
        let elementBody = document.querySelector(`#element-${elementId}`)
        let textSize = Number(event.value) / this.previewRatio
        elementBody.style.fontSize = `${textSize}px`
        this.timeline[elementId].fontsize = Number(event.value)
    }

    changeTimelineRange() {
        const timelineRuler = document.querySelector("element-timeline-editor")
        const timelineBar = document.querySelector("element-timeline-bar")
        const timelineRange =  Number(document.querySelector("#timelineRange").value)
        const timeMagnification = timelineRange / 4
        
        timelineRuler.updateRulerSpace(timeMagnification)
        timelineBar.move(this.progressTime / 5 * timeMagnification)
        this.adjustAllElementBarWidth(timeMagnification)
    }

    getTimeFromProgress() {
        let timelineRange =  Number(document.querySelector("#timelineRange").value)
        let timeMagnification = timelineRange / 4

        let relativeMilliseconds = this.progress * 5
        let absoluteMilliseconds = relativeMilliseconds / timeMagnification
        return absoluteMilliseconds
    }

    getTimeFromTimelineBar() {
        let timelineBarProgress =  Number(document.querySelector("element-timeline-bar").style.left.split("px")[0])
        let timelineRange =  Number(document.querySelector("#timelineRange").value)
        let timeMagnification = timelineRange / 4

        let milliseconds = (timelineBarProgress * 5) / timeMagnification
        return milliseconds
    }

    adjustAllElementBarWidth(ratio) {
        const allElementBar = document.querySelectorAll("element-bar")
        allElementBar.forEach(element => {
            let elementId = element.getAttribute("element-id")
            let originalWidth = element.millisecondsToPx(this.timeline[elementId].duration) 
            let originalLeft = element.millisecondsToPx(this.timeline[elementId].startTime)
            let changedWidth = originalWidth
            let changedLeft = originalLeft

            element.setWidth(changedWidth)
            element.setLeft(changedLeft)

            if (element.elementBarType == 'dynamic') {
                let trimStart = element.millisecondsToPx(this.timeline[elementId].trim.startTime) 
                let trimEnd = element.millisecondsToPx(this.timeline[elementId].duration - this.timeline[elementId].trim.endTime) 

                element.setTrimStart(trimStart)
                element.setTrimEnd(trimEnd)
            }
        });
        console.log(allElementBar)
    }

    getMillisecondsToISOTime(milliseconds) {
        let time = new Date(milliseconds).toISOString().slice(11, 22)
        return time
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
        const milliseconds = this.getTimeFromTimelineBar()
        const ISOTime = this.getMillisecondsToISOTime(milliseconds)
        
        showTime.innerHTML = ISOTime
    }
    

    hideElement (elementId) {
        if (this.timeline[elementId].filetype == 'video') {
            this.pauseVideo(elementId)
        } else if (this.timeline[elementId].filetype == 'audio') {
            this.pauseAudio(elementId)
        }
        document.querySelector(`#element-${elementId}`).classList.add('d-none')
    }

    appearAllElementInTime() {
        for(let elementId in this.timeline) {
            let filetype = this.timeline[elementId].filetype
            let checkFiletype = this.timeline[elementId].startTime > this.progressTime || 
            this.timeline[elementId].startTime + this.timeline[elementId].duration < this.progressTime

            if (filetype == 'video' || filetype == 'audio') {
                checkFiletype = this.timeline[elementId].startTime + this.timeline[elementId].trim.startTime > this.progressTime || 
                this.timeline[elementId].startTime + this.timeline[elementId].trim.endTime < this.progressTime
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
        let toggle = document.querySelector("#playToggle")
        toggle.setAttribute('onclick', `elementControlComponent.stop()`)
        toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> stop_circle </span>`

        this.scroller = setInterval(() => {
            //split_inner_bottom.scrollBy(4, 0);
            let nowTimelineRange = Number(document.querySelector("#timelineRange").value)
            let nowTimelineProgress = Number(this.timelineBar.style.left.split('px')[0]) + nowTimelineRange
            this.progress = nowTimelineProgress
            this.progressTime = this.getTimeFromProgress()

            this.timelineBar.move(nowTimelineProgress)
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

        this.isPaused = true;
        for (const elementId in this.timeline) {
            if (Object.hasOwnProperty.call(this.timeline, elementId)) {
                this.isPlay[elementId] = false
            }
        }

        toggle.setAttribute('onclick', `elementControlComponent.play()`)
        toggle.innerHTML = `<span class="material-symbols-outlined icon-white icon-md"> play_circle </span>`

        this.showTime()
        this.pauseAllDynamicElements()
    }

    pauseVideo (elementId) {
        let secondsOfRelativeTime = -(this.timeline[elementId].startTime - this.progressTime) / 1000
        let video = document.getElementById(`element-${elementId}`).querySelector("video")
        video.currentTime = secondsOfRelativeTime
        video.pause()
    }

    pauseAudio (elementId) {
        let audio = document.getElementById(`element-${elementId}`).querySelector("audio")
        audio.pause()
    }

    pauseAllDynamicElements () {
        let key;

        for(key in this.timeline) {
            let filetype = this.timeline[key].filetype

            if (filetype == 'video') {
                this.pauseVideo(key)
            } else if (filetype == 'audio') {
                this.pauseAudio(key)
            }
        }
    }

    deactivateAllOutline() {

        for (const elementId in this.timeline) {
            if (Object.hasOwnProperty.call(this.timeline, elementId)) {
                document.querySelector(`#element-${elementId}`).classList.remove("element-outline")
            }
        }
        this.activeElementId = ''
        this.existActiveElement = false
    }

    reset () {
        this.progress = 0
        this.progressTime = 0
        this.isPaused = true;

        this.showTime()
        this.appearAllElementInTime()
        this.timelineBar.move(0)
    }

    clickPreview() {
        this.deactivateAllOutline()
    }

    connectedCallback() {
        preview.addEventListener('click', this.clickPreview.bind(this));

    }
}


class ElementControlAsset extends HTMLElement { 
    constructor() {
        super();

        this.timeline = document.querySelector("element-timeline").timeline
        this.elementControl = document.querySelector("element-control")

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

        let resizeElement = this.convertAbsoluteToRelativeSize({
            x: this.timeline[this.elementId].location.x,
            y: this.timeline[this.elementId].location.y,
            w: this.timeline[this.elementId].width,
            h: this.timeline[this.elementId].height
        })



        this.classList.add("element-drag")
        this.setAttribute("id", `element-${this.elementId}`)
        
        if (this.elementFiletype !== 'text') {
            this.setAttribute("style", `width: ${resizeElement.w}px; top: ${resizeElement.y}px; left: ${resizeElement.x}px; height: ${resizeElement.h}px;`)
        } else if (this.elementFiletype == 'text') {
            let resizeRatio = this.elementControl.previewRatio
            let resizeText = this.timeline[this.elementId].fontsize / resizeRatio

            this.setAttribute("style", `width: ${resizeElement.w}px; top: ${resizeElement.y}px; left: ${resizeElement.x}px; font-size: ${resizeText}px;`)
        }

        

        this.innerHTML = template;
    }

    convertAbsoluteToRelativeSize({x,y,w,h}) { 
        let resizeRatio = this.elementControl.previewRatio
        return {
            x: x/resizeRatio,
            y: y/resizeRatio,
            w: w/resizeRatio,
            h: h/resizeRatio,
        }
    }

    convertRelativeToAbsoluteSize({x,y,w,h}) { 
        let resizeRatio = this.elementControl.previewRatio
        return {
            x: x*resizeRatio,
            y: y*resizeRatio,
            w: w*resizeRatio,
            h: h*resizeRatio,
        }
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
        let resizeRatio = this.elementControl.previewRatio

        return `<input type="text" class="asset-transparent element-text" draggable="false" style="color: rgb(255, 255, 255); " onkeyup="document.querySelector('element-control').changeText('${this.elementId}')" value="${this.timeline[this.elementId].text}">`

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

                let convertLocation = this.convertRelativeToAbsoluteSize({x: x, y: y})

                this.timeline[this.elementId].location.x = convertLocation.x 
                this.timeline[this.elementId].location.y = convertLocation.y
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
        let resizeRatio = this.elementControl.previewRatio

        this.timeline[this.elementId].location.y = Math.round(Number(this.style.top.split('px')[0]) * resizeRatio)
        this.timeline[this.elementId].location.x = Math.round(Number(this.style.left.split('px')[0]) * resizeRatio)
        this.timeline[this.elementId].width = Math.round(Number(this.style.width.split('px')[0]) * resizeRatio)
        this.timeline[this.elementId].height = Math.round(Number(this.style.height.split('px')[0]) * resizeRatio)
    }

    resizeStyle({x, y, w, h}) {
        this.style.left = !x == false ? `${x}px` : this.style.left
        this.style.top = !y == false ? `${y}px` : this.style.top
        this.style.width = !w == false ? `${w}px` : this.style.width
        this.style.height = !h == false ? `${h}px` : this.style.height
    }

    resizeFont({px}) {
        if (!this.querySelector("input")) {
            return 0
        }

        this.style.fontSize = `${px}px`
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

    activateOutline() {
        this.elementControl.deactivateAllOutline()
        this.elementControl.activeElementId = this.elementId
        this.elementControl.existActiveElement = true
        this.classList.add("element-outline")
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