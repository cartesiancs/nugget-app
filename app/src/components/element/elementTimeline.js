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
        <element-timeline-editor></element-timeline-editor>
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
        this.replaceTimelineBarHeight(height)
    }

    templateElementBar(elementId) {
        let width = this.timeline[elementId].duration
        let filetype = this.timeline[elementId].filetype

        let elementSplitedFilepath = this.timeline[elementId].localpath.split('/')
        let elementFilepath = elementSplitedFilepath[elementSplitedFilepath.length-1]

        let elementType = this.getElementType(filetype)

        if (elementType == 'static') {
            return `<element-bar element-id="${elementId}" element-type="static"></element-bar>`

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
            this.elementControl.removeElementById(elementId)
        });
        this.elementControl.selectElementsId = []
    }

    keydown(event) {
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

    deactivateSeletedBar() {
        this.elementControl.selectElementsId.forEach(elementId => {
            let targetElement = document.querySelector(`element-bar[element-id='${elementId}']`)
            targetElement.unselectThisElement()
        });
    }

    clickTimeline() {
        this.elementControl.deactivateAllOutline()
        this.deactivateSeletedBar()
        console.log("CLICKTIMELIONE")
    }

    connectedCallback() {
        this.render();
        document.addEventListener('keydown', this.keydown.bind(this));
        this.addEventListener('mousedown', this.clickTimeline.bind(this));

    }
}


class ElementTimelineBar extends HTMLElement { 
    constructor() {
        super();
    }

    render(){
        this.classList.add("timeline-bar")
        this.setAttribute("id", "timeline_bar")
        this.style.left = `0px`
    }

    move(px) {
        this.style.left = `${px}px`
    }

    connectedCallback() {
        this.render();

    }
}

class ElementTimelineEditor extends HTMLElement { 
    constructor() {
        super();

    }

    render(){
        const template = this.template();
        this.classList.add("timeline-editor", "ruler")
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


    mousedown(e) {
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



    connectedCallback() {
        this.render();
        this.addEventListener('mousedown', this.mousedown.bind(this));

    }
}


export { ElementTimeline, ElementTimelineBar, ElementTimelineEditor }