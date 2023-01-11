class ElementTimeline extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''
        this.elementControl

        window.addEventListener('DOMContentLoaded', () => {
            this.elementControl = document.querySelector("element-control");
        });

        this.timeline = {

        }

        this.timelineHashTable = {}
        this.appendCheckpointInHashTable()
    }

    generateHash(text) {
        let hash = 0, i, chr;
        if (text.length === 0) return hash;
        for (i = 0; i < text.length; i++) {
            chr = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }
        return hash;
    }

    getTime() {
        return Date.now()
    }

    appendCheckpointInHashTable() { // NOTE: 해시 테이블에 변경점 입력
        let hashString = JSON.stringify(this.timeline)
        let hash = this.generateHash(hashString)
        let nowTimestamp = this.getTime()
        this.timelineHashTable[nowTimestamp] = hash
    }

    isTimelineChange() {
        let nowHashString = JSON.stringify(this.timeline)
        let nowTimelineHash = this.generateHash(nowHashString)
        let timelineHashLength = Object.keys(this.timelineHashTable).length
        let firstKeyInTimelineHashTable = Object.keys(this.timelineHashTable)[timelineHashLength-1]
        let prevTimelineHash = this.timelineHashTable[firstKeyInTimelineHashTable]
        return nowTimelineHash != prevTimelineHash
    }

    render(){
        const template = this.template();
        this.classList.add("col-12", "cursor-default", "h-100", "line")
        this.innerHTML = template;
    }


    template() {
        return `
        <element-timeline-ruler></element-timeline-ruler>
        <element-timeline-bar></element-timeline-bar>

        `
    }

    replaceTimelineBarHeight(height) {
        let timelineBar = this.querySelector(".timeline-bar")
        timelineBar.style.height = `${height}px`
    }

    getTimelineScrollHeight() {
        return this.scrollHeight
    }

    async patchTimeline(timeline) {
        this.timeline = timeline
        this.elementControl.timeline = timeline

        for (const elementId in timeline) {
            if (Object.hasOwnProperty.call(timeline, elementId)) {
                const element = timeline[elementId];
                if (element.filetype == 'image') {
                    let blobUrl = await this.getBlobUrl(`file://${element.localpath}`)
                    this.timeline[elementId].blob = String(blobUrl)
                    this.elementControl.showImage(elementId)
                } else if (element.filetype == 'video') {
                    let blobUrl = await this.getBlobUrl(`file://${element.localpath}`)
                    this.timeline[elementId].blob = String(blobUrl)
                    this.elementControl.showVideo(elementId)
                } else if (element.filetype == 'text') {
                    this.elementControl.showText(elementId)
                } else if (element.filetype == 'audio') {
                    let blobUrl = await this.getBlobUrl(`file://${element.localpath}`)
                    this.timeline[elementId].blob = String(blobUrl)
                    this.elementControl.showAudio(elementId)
                }
                this.addElementBar(elementId)
                
            }
        }
    }

    resetTimelineData() {
        this.timeline = {}
        this.removeAllTimelineBars()
        this.elementControl.removeAllElementAsset()
    }

    removeAllTimelineBars() {
        const bars = this.querySelectorAll("element-bar")
        bars.forEach(element => {
            element.remove()
        });
    }


    async getBlobUrl(url) {
        const response = await fetch(url);
        const data = await response.blob()
        return URL.createObjectURL(data);
    }

    addElementBar(elementId) {
        const templateBar = this.templateElementBar(elementId)
        this.insertAdjacentHTML("beforeend", templateBar)

        let height = this.getTimelineScrollHeight()
    }

    templateElementBar(elementId) {
        let width = this.timeline[elementId].duration
        let filetype = this.timeline[elementId].filetype

        let elementSplitedFilepath = this.timeline[elementId].localpath.split('/')
        let elementFilepath = elementSplitedFilepath[elementSplitedFilepath.length-1]

        let elementType = this.getElementType(filetype)

        if (elementType == 'static') {
            return `
            <element-bar element-id="${elementId}" element-type="static"></element-bar> 

            <animation-panel element-id="${elementId}"> 
                <animation-panel-item animation-type="position" element-id="${elementId}"></animation-panel-item> 

            </animation-panel> 
            `

        } else if (elementType == 'dynamic') {
            return `<element-bar element-id="${elementId}" element-type="dynamic"></element-bar>`
        } else {
            return `none`
        }
    }



    getElementType(filetype) {
        let elementType = 'undefined'
        const elementFileExtensionType = {
            "static": ['image', 'text', 'png', 'jpg', 'jpeg'],
            "dynamic": ['video', 'audio', 'mp4', 'mp3', 'mov']
        }

        for (const type in elementFileExtensionType) {
            if (Object.hasOwnProperty.call(elementFileExtensionType, type)) {
                const extensionList = elementFileExtensionType[type];

                if(extensionList.indexOf(filetype) >= 0)  {
                    elementType = type
                    break
                }
                
            }
        }

        return elementType
    }

    togglePlayer() {
        if (this.elementControl.isPaused == true) {
            this.elementControl.play()
        } else {
            this.elementControl.stop()
        }
    }

    removeAnimationPanelById(elementId) {
        let target = this.querySelector(`animation-panel[element-id="${elementId}"]`)
        if (!target) {
            return 0
        }

        target.remove()
    }

    removeElementInTimelineData(elementId) {
        delete this.timeline[elementId]
    }

    removeElementById(elementId) {
        this.querySelector(`element-bar[element-id="${elementId}"]`).remove()
    }

    removeSeletedElements() {
        this.elementControl.selectElementsId.forEach(elementId => {
            this.removeElementById(elementId)
            this.removeElementInTimelineData(elementId)
            this.removeAnimationPanelById(elementId)
            this.elementControl.removeElementById(elementId)
        });
        this.elementControl.selectElementsId = []
    }


    showAnimationPanel(elementId) {
        this.querySelector(`animation-panel[element-id='${elementId}']`).show()
    }

    hideAnimationPanel(elementId) {
        this.querySelector(`animation-panel[element-id='${elementId}']`).hide()
    }

    showKeyframeEditor(elementId, animationType) {
        let timelineOptionOffcanvas = new bootstrap.Offcanvas(document.getElementById('option_bottom'))
        let timelineOption = document.querySelector("#timelineOptionBody")
        let targetElementId = document.querySelector("#timelineOptionTargetElement")

        timelineOption.innerHTML = `<keyframe-editor element-id="${elementId}" animation-type="${animationType}"></keyframe-editor>`
        timelineOption.classList.remove("d-none")
        targetElementId.value = elementId
        timelineOptionOffcanvas.show()
    }

    deactivateSeletedBar() {
        this.elementControl.selectElementsId.forEach(elementId => {
            let targetElement = document.querySelector(`element-bar[element-id='${elementId}']`)
            targetElement.unselectThisElement()
        });
    }

    fixRulerOnTop() {
        const scrollTop = this.scrollTop
        const elementTimelineRuler = document.querySelector("element-timeline-ruler")
        const elementTimelineBar = document.querySelector("element-timeline-bar")

        elementTimelineRuler.setTopPosition(scrollTop)
        elementTimelineBar.style.top = `${scrollTop}px`
    }

    scrollKeyframeEditor() {
        let isExistKeyframeEditor = !!document.querySelector("keyframe-editor")
        if (isExistKeyframeEditor == false) {
            return 0
        }

        document.querySelector("keyframe-editor").scrollTo(this.scrollLeft, this.scrollTop)
    }

    handleKeydown(event) {
        console.log(event.keyCode)
        if (this.elementControl.existActiveElement == true) {
            return 0
        }

        if(event.keyCode == 32) { // Space
            event.preventDefault();
            this.togglePlayer()

        }

        if (event.keyCode == 8) { // backspace
            event.preventDefault();
            this.removeSeletedElements()
        
        }
    }

    handleMousedown() {
        this.elementControl.deactivateAllOutline()
        this.deactivateSeletedBar()
    }

    handleScroll() {
        this.fixRulerOnTop()
        this.scrollKeyframeEditor()
    }

    connectedCallback() {
        this.render();
        this.addEventListener('mousedown', this.handleMousedown.bind(this));
        this.addEventListener('scroll', this.handleScroll.bind(this));

        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
}


class ElementTimelineBar extends HTMLElement { 
    constructor() {
        super();

        this.elementTimelineRuler;

        window.addEventListener('DOMContentLoaded', () => {
            this.elementTimelineRuler = document.querySelector("element-timeline-ruler")
        });
        
    }

    render(){
        this.classList.add("timeline-bar")
        this.setAttribute("id", "timeline_bar")
        this.style.left = `0px`
        this.style.top = `0px`

    }

    move(px) {
        this.style.left = `${px}px`
    }

    handleMousedown(e) {
        this.elementTimelineRuler.moveTime(e)
        this.elementTimelineRuler.mousemoveEventHandler = this.elementTimelineRuler.handleMousemove.bind(this.elementTimelineRuler)
        document.addEventListener('mousemove', this.elementTimelineRuler.mousemoveEventHandler);
    }


    handleMouseup(e) {
        document.removeEventListener('mousemove', this.elementTimelineRuler.mousemoveEventHandler);
    }


    connectedCallback() {
        this.render();
        this.addEventListener('mousedown', this.handleMousedown.bind(this));
        document.addEventListener('mouseup', this.handleMouseup.bind(this));

    }
}

class ElementTimelineRuler extends HTMLElement { 
    constructor() {
        super();
        this.mousemoveEventHandler = undefined
        this.mouseTimeout = undefined
    }

    render(){
        const template = this.template();
        this.classList.add("timeline-ruler", "ruler")

        this.innerHTML = template;
        this.addTickNumber(10)
    }


    template() {
        return `<ul class="ruler-x">
        <li></li><li></li><li></li><li></li><li></li> <!-- repeat -->
      </ul>`
    }

    addTickNumber(licount) {
        let addedli = '<li></li>'.repeat(licount)
        this.querySelector("ul").innerHTML = addedli

    }


    updateRulerSpace(timeMagnification) {
        const spaceRuler2 = 50 * timeMagnification
        const spaceRuler1 = 5 * timeMagnification

        this.style.setProperty('--ruler2-space', spaceRuler2); // NOTE: 기본값 50
        this.style.setProperty('--ruler1-space', spaceRuler1); // NOTE: 기본값 5

        
    }


    updateRulerLength(e) {
        let duration = Number(e.value) * 200
        this.changeWidth(duration)
        this.addTickNumber(Number(e.value))
    }


    changeWidth(px) {
        this.style.width = `${px}px`
    }

    setTopPosition(px) {
        this.style.top = `${px}px`
    }

    moveTime(e) {
        const elementTimelineBar = document.querySelector("element-timeline-bar")
        const elementTimeline = document.querySelector("element-timeline")
        const elementControl = document.querySelector("element-control")
        
        
        elementControl.progress = e.pageX + elementTimeline.scrollLeft
        elementControl.progressTime = elementControl.getTimeFromProgress()

        elementControl.stop()
        elementControl.showTime() 
        elementControl.appearAllElementInTime()

        elementTimelineBar.move(e.pageX + elementTimeline.scrollLeft)
    }

    handleMousemove(e) {
        const elementTimelineBar = document.querySelector("element-timeline-bar")
        const elementTimeline = document.querySelector("element-timeline")
        const elementControl = document.querySelector("element-control")


        elementTimelineBar.move(e.pageX + elementTimeline.scrollLeft)
        elementControl.showTime() 

        clearTimeout(this.mouseTimeout)

        this.mouseTimeout = setTimeout(() => {
            clearInterval(this.resizeInterval)
            this.moveTime(e)
        }, 100);
       
    }


    handleMousedown(e) {
        e.stopPropagation();
        this.moveTime(e)
        this.mousemoveEventHandler = this.handleMousemove.bind(this)
        document.addEventListener('mousemove', this.mousemoveEventHandler);

    }


    handleMouseup(e) {
        document.removeEventListener('mousemove', this.mousemoveEventHandler);

    }



    connectedCallback() {
        this.render();
        this.addEventListener('mousedown', this.handleMousedown.bind(this));
        document.addEventListener('mouseup', this.handleMouseup.bind(this));

    }
}


export { ElementTimeline, ElementTimelineBar, ElementTimelineRuler }