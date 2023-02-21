import { v4 as uuidv4 } from 'uuid';

class ElementControl extends HTMLElement { 
    constructor() {
        super();

        this.elementTimeline;
        this.timeline;
        this.timelineCursor;

        window.addEventListener('DOMContentLoaded', () => {
            this.elementTimeline = document.querySelector("element-timeline");
            this.timeline = document.querySelector("element-timeline").timeline;
            this.timelineCursor = document.querySelector("element-timeline-cursor");
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
                        y: elementTop,
                        w: elementWidth,
                        h: elementHeight
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
                rotation: 0,
                width: width,
                height: height,
                localpath: path,
                filetype: 'image',
                animation: {
                    position: {
                        isActivate: false,
                        points: [[], []],
                        allpoints: [[], []]
                    },
                    opacity: {
                        isActivate: false,
                        points: [[]],
                        allpoints: [[]]
                    },
                }

            }

            this.showImage(elementId)
            this.elementTimeline.addElementBar(elementId)

        }
    }


    addVideo(blob, path) {
        const elementId = this.generateUUID()
        const video = document.createElement('video')
        const toastMetadata = bootstrap.Toast.getInstance(document.getElementById('loadMetadataToast'))
        toastMetadata.show()

        

        video.src = blob
        video.preload = 'metadata'

        video.onloadedmetadata = () => {

            let width = video.videoWidth
            let height = video.videoHeight
            let duration = video.duration * 1000

            window.electronAPI.req.ffmpeg.getMetadata(blob, path)
            
            window.electronAPI.res.ffmpeg.getMetadata( (evt, blobdata, metadata) => {
                if (blobdata != blob) {
                    return 0
                }
                let isExist = false

                setTimeout(() => {
                    toastMetadata.hide()
                }, 1000)

                metadata.streams.forEach(element => {
                    if (element.codec_type == "audio") {
                        isExist = true
                    }
                });


                this.timeline[elementId] = {
                    blob: blob,
                    startTime: 0,
                    duration: duration,
                    location: {x: 0, y: 0},
                    trim: {startTime: 0, endTime: duration},
                    rotation: 0,
                    width: width,
                    height: height,
                    localpath: path,
                    isExistAudio: isExist,
                    filetype: 'video',
                    codec: { video: "default", audio: "default" }
                }
    
                
                this.showVideo(elementId)
                this.elementTimeline.addElementBar(elementId)
            })


            // ffmpeg.ffprobe(path, (err, metadata) => {

            // })
    



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
            fontname: "notosanskr",
            fontweight: "medium",
            fonttype: "otf",
            location: {x: 0, y: 0},
            rotation: 0,
            localpath: '/TEXTELEMENT',
            filetype: 'text',
            height: 52,
            width: 500,
            widthInner: 200,
            animation: {
                position: {
                    isActivate: false,
                    points: [[], []],
                    allpoints: [[], []]
                },
                opacity: {
                    isActivate: false,
                    points: [[]],
                    allpoints: [[]]
                }
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

    showAnimation(elementId, animationType) {
        let index = Math.round(document.querySelector("element-control").progressTime / 20)
        let indexToMs = index * 20
        let startTime = Number(this.timeline[elementId].startTime)
        let indexPoint = Math.round((indexToMs - startTime) / 20)

        try {
            if (indexPoint < 0) {
                return 0
            }

            document.querySelector(`#element-${elementId}`).style.left = `${this.timeline[elementId].animation[animationType].allpoints[0][indexPoint].y / this.previewRatio}px`
            document.querySelector(`#element-${elementId}`).style.top = `${this.timeline[elementId].animation[animationType].allpoints[1][indexPoint].y / this.previewRatio}px`

        } catch (error) {
            
        }


    }


    showImage(elementId) {

        if (document.getElementById(`element-${elementId}`) == null) {
            this.insertAdjacentHTML("beforeend", `<element-control-asset element-id="${elementId}" element-filetype="image"></element-control-asset>`)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }

        let animationType = "position"
        if (this.timeline[elementId].animation[animationType].isActivate == true) {
            this.showAnimation(elementId, animationType)
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
        let inputTarget = elementBody.querySelector('input-text')
        let inputTargetSpan = inputTarget.querySelector("span")

        let inputValue = inputTarget.value

        this.timeline[elementId].text = inputValue
        

        elementBody.style.width = `${inputTarget.offsetWidth}px`



    }

    changeTextColor({ elementId, color }) {
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input-text')

        inputTarget.style.color = color
        this.timeline[elementId].textcolor = color
    }

    changeTextSize({ elementId, size }) {
        let elementBody = document.querySelector(`#element-${elementId}`)
        let inputTarget = elementBody.querySelector('input-text')

        inputTarget.setWidthInner()


        let textSize = Number(size) / this.previewRatio
        elementBody.style.fontSize = `${textSize}px`
        elementBody.style.height = `${textSize}px`
        inputTarget.style.top = `${textSize / 2}px`



        this.timeline[elementId].fontsize = Number(size)
        this.timeline[elementId].height = Number(size)

        
    }

    changeTimelineRange() {
        const timelineRuler = document.querySelector("element-timeline-ruler")
        const timelineRange =  Number(document.querySelector("#timelineRange").value)
        const timeMagnification = timelineRange / 4
        
        timelineRuler.updateRulerSpace(timeMagnification)
        this.timelineCursor.move(this.progressTime / 5 * timeMagnification)
        this.adjustAllElementBarWidth(timeMagnification)
        this.updateAllAnimationPanel()

    }

    updateAllAnimationPanel() {
        for (const elementId in this.timeline) {
            if (Object.hasOwnProperty.call(this.timeline, elementId)) {
                const element = this.timeline[elementId];
                
                if (element.filetype != 'image') {
                    continue
                }
    
                if (element.animation.position.isActivate == false) {
                    continue
                }

                let targetAnimationPanel = document.querySelector(`animation-panel[element-id="${elementId}"]`)
                let targetElementBar = document.querySelector(`element-bar[element-id="${elementId}"]`)

                let originalLeft = targetElementBar.millisecondsToPx(this.timeline[elementId].startTime)

                targetAnimationPanel.updateItem()
                targetElementBar.animationPanelMove(originalLeft)
            }
        }
    }

    getTimeFromProgress() {
        let timelineRange =  Number(document.querySelector("#timelineRange").value)
        let timeMagnification = timelineRange / 4

        let relativeMilliseconds = this.progress * 5
        let absoluteMilliseconds = relativeMilliseconds / timeMagnification
        return absoluteMilliseconds
    }

    getTimeFromTimelineBar() {
        let timelineCursorProgress =  Number(this.timelineCursor.style.left.split("px")[0])
        let timelineRange =  Number(document.querySelector("#timelineRange").value)
        let timeMagnification = timelineRange / 4

        let milliseconds = (timelineCursorProgress * 5) / timeMagnification
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
            let nowTimelineProgress = Number(this.timelineCursor.style.left.split('px')[0]) + nowTimelineRange
            this.progress = nowTimelineProgress
            this.progressTime = this.getTimeFromProgress()

            this.timelineCursor.move(nowTimelineProgress)
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
        this.timelineCursor.move(0)
    }

    handleClickPreview() {
        this.deactivateAllOutline()
    }

    connectedCallback() {
        preview.addEventListener('click', this.handleClickPreview.bind(this));

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
        this.isRotate = false


        this.initialPosition = {x: 0, y: 0, w: 0, h: 0}
        this.resizeDirection = 'n'
        this.resizeEventHandler
        this.rotateEventHandler
        this.dragdownEventHandler
        this.dragupEventHandler

    }

    render(){
        let template
        if (this.elementFiletype == 'image') {
            // NOTE: this.templateRotate() 는 사이드 잘림 문제로 추후 업데이트 필요
            template = this.templateImage() + this.templateResize() //+ this.templateRotate()
        } else if (this.elementFiletype == 'video') {
            template = this.templateVideo() + this.templateResize()
        } else if (this.elementFiletype == 'text') {
            template = this.templateText() + this.templateResize('horizon')
        } else if (this.elementFiletype == 'audio') {
            template = this.templateAudio()
        }

        this.innerHTML = template;


        let resizeElement = this.convertAbsoluteToRelativeSize({
            x: this.timeline[this.elementId].location.x,
            y: this.timeline[this.elementId].location.y,
            w: !this.timeline[this.elementId].width ? 500 : this.timeline[this.elementId].width,
            h: this.timeline[this.elementId].height
        })



        this.classList.add("element-drag")
        this.setAttribute("id", `element-${this.elementId}`)
        
        if (this.elementFiletype !== 'text') {
            this.setAttribute("style", `width: ${resizeElement.w}px; top: ${resizeElement.y}px; left: ${resizeElement.x}px; height: ${resizeElement.h}px; transform: rotate(${this.timeline[this.elementId].rotation}deg);`)
        } else if (this.elementFiletype == 'text') {
            let resizeRatio = this.elementControl.previewRatio
            let resizeText = this.timeline[this.elementId].fontsize / resizeRatio

            this.setAttribute("style", `width: ${resizeElement.w}px; top: ${resizeElement.y}px; left: ${resizeElement.x}px; height: ${resizeText}px; font-size: ${resizeText}px;`)
            this.querySelector(`input-text`).style.top = `${resizeText / 2}px`
        }

        

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
        let style = "color: rgb(255, 255, 255); top: 0px; position: absolute;"

        return `<input-text element-id="${this.elementId}"></input-text>`

        // <input type="text" class="asset-transparent element-text" draggable="false" style="${style}" onkeyup="document.querySelector('element-control').changeText('${this.elementId}')" value="${this.timeline[this.elementId].text}">

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

    templateRotate() {
        return `<div class="handle-rotate text-center" onmousedown="this.parentNode.rotateMousedown()">
        <span class="material-symbols-outlined handle-rotate-icon">
cached
</span>
        </div>`
    }

    pxToInteger(px = '0px') {
        return Number(px.split('px')[0])
    }

    showDragAlignmentGuide() {
        let dragAlignmentGuide = document.querySelector("drag-alignment-guide")
        let videoCanvas = document.querySelector("#video")

        let canvas = {
            width: Number(videoCanvas.style.width.split("px")[0]),
            height: Number(videoCanvas.style.height.split("px")[0])
        }

        let elementPositions = {
            top: Number(this.style.top.split("px")[0]),
            left: Number(this.style.left.split("px")[0]),
            width: Number(this.style.width.split("px")[0]),
            height: Number(this.style.height.split("px")[0]),
            centerTop: (Number(this.style.height.split("px")[0]) / 2) + Number(this.style.top.split("px")[0]),
            centerLeft: (Number(this.style.width.split("px")[0]) / 2) + Number(this.style.left.split("px")[0])

        }

        if (elementPositions.top < 6) {
            dragAlignmentGuide.showGuide({ position: 'top' })
            let y = 0
            this.style.top = `${y}px`
            let convertLocation = this.convertRelativeToAbsoluteSize({y: y})
            this.timeline[this.elementId].location.y = convertLocation.y

        } else {
            dragAlignmentGuide.hideGuide({ position: 'top' })
        }

        if (elementPositions.top + elementPositions.height > canvas.height - 6) {
            dragAlignmentGuide.showGuide({ position: 'bottom' })
            let y = canvas.height - elementPositions.height
            this.style.top = `${y}px`
            let convertLocation = this.convertRelativeToAbsoluteSize({y: y})
            this.timeline[this.elementId].location.y = convertLocation.y

        } else {
            dragAlignmentGuide.hideGuide({ position: 'bottom' })
        }

        if (elementPositions.left < 6) {
            dragAlignmentGuide.showGuide({ position: 'left' })
            let x = 0
            this.style.left = `${x}px`
            let convertLocation = this.convertRelativeToAbsoluteSize({x: x})
            this.timeline[this.elementId].location.x = convertLocation.x

        } else {
            dragAlignmentGuide.hideGuide({ position: 'left' })
        }

        if (elementPositions.left + elementPositions.width > canvas.width - 6) {
            dragAlignmentGuide.showGuide({ position: 'right' })
            let x = canvas.width - elementPositions.width
            this.style.left = `${x}px`
            let convertLocation = this.convertRelativeToAbsoluteSize({x: x})
            this.timeline[this.elementId].location.x = convertLocation.x
        } else {
            dragAlignmentGuide.hideGuide({ position: 'right' })
        }

        // 'horizontal', 'vertical'
        

        if (elementPositions.centerTop < (canvas.height / 2) + 6 && elementPositions.centerTop >  (canvas.height / 2) - 6) {
            dragAlignmentGuide.showGuide({ position: 'horizontal' })

            let y = (canvas.height / 2) - (elementPositions.height / 2)
            this.style.top = `${y}px`
            let convertLocation = this.convertRelativeToAbsoluteSize({y: y})
            this.timeline[this.elementId].location.y = convertLocation.y

        } else {
            dragAlignmentGuide.hideGuide({ position: 'horizontal' })
        }

        if (elementPositions.centerLeft < (canvas.width / 2) + 6 && elementPositions.centerLeft >  (canvas.width / 2) - 6) {
            dragAlignmentGuide.showGuide({ position: 'vertical' })
            let x = (canvas.width / 2) - (elementPositions.width / 2)
            this.style.left = `${x}px`
            let convertLocation = this.convertRelativeToAbsoluteSize({x: x})
            this.timeline[this.elementId].location.x = convertLocation.x
        } else {
            dragAlignmentGuide.hideGuide({ position: 'vertical' })
        }
    }

    hideDragAlignmentGuide() {
        let dragAlignmentGuide = document.querySelector("drag-alignment-guide")
        dragAlignmentGuide.hideGuide({ position: 'top' })
        dragAlignmentGuide.hideGuide({ position: 'bottom' })
        dragAlignmentGuide.hideGuide({ position: 'left' })
        dragAlignmentGuide.hideGuide({ position: 'right' })
        dragAlignmentGuide.hideGuide({ position: 'horizontal' })
        dragAlignmentGuide.hideGuide({ position: 'vertical' })

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
                this.changeLocation({ x: x, y: y })

                if (this.elementFiletype == 'image') {
                    document.querySelector("option-image").updateValue()

                }

            }

            this.showDragAlignmentGuide()
        }
    }

    changeLocation({ x, y }) {
        this.style.top = `${y}px`
        this.style.left = `${x}px`

        let convertLocation = this.convertRelativeToAbsoluteSize({x: x, y: y})

        this.timeline[this.elementId].location.x = convertLocation.x 
        this.timeline[this.elementId].location.y = convertLocation.y
    }

    dragMousedown(e) {
        if (!this.isResize && !this.isRotate) {
            this.isDrag = true
            this.initialPosition.x = e.pageX - this.pxToInteger(this.style.left)
            this.initialPosition.y = e.pageY - this.pxToInteger(this.style.top)
            this.dragdownEventHandler = this.drag.bind(this)
            document.addEventListener('mousemove', this.dragdownEventHandler);
        }
    }

    dragMouseup() {
        this.hideDragAlignmentGuide()

        document.removeEventListener('mousemove', this.dragdownEventHandler)

        //NOTE: 추후에 이미지 말고 오디오, 영상의 경우 filetype 수정
        if (this.isDrag == true && this.timeline[this.elementId].filetype == 'image') {
            this.addAnimationPoint({
                animationType: "position"
            })
        }
        this.isDrag = false

    }

    addAnimationPoint({ animationType }) {
        if (this.timeline[this.elementId].animation[animationType].isActivate == false) {
            return 0
        }

        const timelineRange =  Number(document.querySelector("#timelineRange").value)
        const timeMagnification = timelineRange / 4

        let keyframeEditor = document.querySelector(`keyframe-editor[element-id="${this.elementId}"]`)
        let progress = (this.elementControl.progressTime - this.timeline[this.elementId].startTime) / 5

        const addPoint = {
            "position": () => {
                keyframeEditor.addPoint({
                    x: progress, 
                    y: this.timeline[this.elementId].location.x,
                    line: 0
                })

                keyframeEditor.addPoint({
                    x: progress, 
                    y: this.timeline[this.elementId].location.y,
                    line: 1
                })

                keyframeEditor.drawLine(0)
                keyframeEditor.drawLine(1)

            }
        }

        addPoint[animationType]()

        let animationPanel = document.querySelector(`animation-panel[element-id="${this.elementId}"]`)
        animationPanel.updateItem() 
    }

    getGcd(a,b) {
        if (b == 0) {
            return a
        }
        return this.getGcd(b, a%b)
    }

    rotate(e) {
        this.isDrag = false
        console.log("rotate", e.target.tagName)


        if (e.target.tagName != "CANVAS") {
            return 0
        }


        let referenceRotationPoint = this.convertAbsoluteToRelativeSize({
            x: this.timeline[this.elementId].location.x + (this.timeline[this.elementId].width / 2), 
            y: this.timeline[this.elementId].location.y + (this.timeline[this.elementId].height / 2)
        })

        let mouseX = e.offsetX
        let mouseY = e.offsetY

        let degree = - Math.atan2( referenceRotationPoint.x - mouseX, referenceRotationPoint.y - mouseY ) / (Math.PI / 180)

        console.log()

        if (degree < 0) {
            degree = 360 + degree
        }

        this.timeline[this.elementId].rotation = degree
        this.style.transform = `rotate(${degree}deg)`;
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
        if (!this.querySelector("input-text")) {
            return 0
        }

        let targetInput = this.querySelector("input-text")


        this.style.fontSize = `${px}px`

        this.elementControl.changeTextSize({ 
            elementId: this.elementId,
            size: this.timeline[this.elementId].fontsize
        })

    }

    rotateMousedown() {
        this.isDrag = false
        this.isResize = false

        if (this.isRotate == false) {
            
            this.rotateEventHandler = this.rotate.bind(this)
            document.querySelector("#preview").addEventListener('mousemove', this.rotateEventHandler);
        }


        this.isRotate = true

    }

    rotateMouseup() {
        document.querySelector("#preview").removeEventListener('mousemove', this.rotateEventHandler);
        this.isRotate = false
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



    showSideOption() {

        // let optionTab = new bootstrap.Tab(document.querySelector('#sidebar button[data-bs-target="#nav-option"]'))
        // let offcanvasOptionListsId = ['option_text']

        // for (let index = 0; index < offcanvasOptionListsId.length; index++) {
        //     const element = offcanvasOptionListsId[index];
        //     document.querySelector(`#${element}`).classList.add("d-none")
        // }

        const optionGroup = document.querySelector("option-group")
        optionGroup.showOption({ filetype: this.elementFiletype, elementId: this.elementId })

        // if (this.elementFiletype == 'text') {
        //     document.querySelector(`#option_text`).classList.remove("d-none")
        //     document.querySelector(`#optionTargetElement`).value = this.elementId
        //     //optionTab.show()
        // }
    }


    handleMousedown(e) {
        this.dragMousedown(e)
        this.activateOutline(e)
        this.showSideOption()

    }


    handleDoubleClick(e) {
        //this.showSideOption()
    }

    connectedCallback() {
        this.render();

        this.addEventListener('mousedown', this.handleMousedown.bind(this));
        this.addEventListener('dblclick', this.handleDoubleClick.bind(this));

        // this.addEventListener('mousedown', this.dragMousedown.bind(this));
        // this.addEventListener('mousedown', this.activateOutline.bind(this));

        document.addEventListener('mouseup', this.resizeMouseup.bind(this));
        document.addEventListener('mouseup', this.rotateMouseup.bind(this));
        document.addEventListener('mouseup', this.dragMouseup.bind(this));

    }


}

class DragAlignmentGuide extends HTMLElement {
    constructor() {
        super()

        this.videoCanvas = document.querySelector("#video")
        this.allPositions = ['top', 'bottom', 'left', 'right', 'horizontal', 'vertical']
    }

    addGuide() {
        for (let index = 0; index < this.allPositions.length; index++) {
            const position = this.allPositions[index];
            this.videoCanvas.insertAdjacentHTML("beforeend", `<alignment-guide position="${position}" class="alignment-guide alignment-guide-${position}"></alignment-guide>`)
            this.hideGuide({ position: position })

        }
    }

    hideGuide({ position }) {
        let target = this.videoCanvas.querySelector(`alignment-guide[position='${position}']`)
        target.classList.add("d-none")
    }

    showGuide({ position }) {
        let target = this.videoCanvas.querySelector(`alignment-guide[position='${position}']`)
        target.classList.remove("d-none")
    }

    connectedCallback() {
        this.addGuide()
    }
}

export { ElementControl, ElementControlAsset, DragAlignmentGuide }