class ElementBar extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        this.timeline = document.querySelector("element-timeline").timeline
        this.elementControl = document.querySelector("element-control")

        this.elementId = this.getAttribute('element-id')
        this.elementBarType = this.getAttribute('element-type') || 'static'

        
        this.width = this.millisecondsToPx(this.timeline[this.elementId].duration)
        this.startTime = this.millisecondsToPx(this.timeline[this.elementId].startTime)



        this.isDrag = false
        this.isResize = false
        this.resizeLocation = 'left'
        this.initialDuration = 1000

        this.initialPosition = {x: 0, y: 0}

        let splitedFilepath = this.timeline[this.elementId].localpath.split('/')
        this.filepath = splitedFilepath[splitedFilepath.length-1]

        this.resizeEventHandler;
        this.dragEventHandler;

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
        this.setAttribute("style", `width: ${this.width}px; left: ${this.startTime}px; background-color: ${backgroundColor};`)
        this.setAttribute("value", this.elementId)

        this.innerHTML = template;

        this.setTrimBar()
    }

    setTrimBar() {
        if (this.elementBarType == 'dynamic') {
            let trimStart = this.millisecondsToPx(this.timeline[this.elementId].trim.startTime)
            let trimEnd = this.millisecondsToPx(this.timeline[this.elementId].trim.endTime)

            // let resizeRangeTargetLeft = this.querySelector(".element-bar-hiddenspace-left")
            // let resizeRangeTargetRight = this.querySelector(".element-bar-hiddenspace-right")

            // resizeRangeTargetLeft.style.width = `${trimStart}px`
            // resizeRangeTargetRight.style.width = `${trimEnd}px`

            this.setTrimStart(trimStart)
            this.setTrimEnd(trimEnd)
            this.elementControl.changeTimelineRange()

        }
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

    getRandomArbitrary(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }


    getRandomColor() {
        //let color = "#" + Math.round(Math.random() * 0xffffff).toString(16) + '51'
        let rgbMinColor = {r: 45, g: 23, b: 56}
        let rgbMaxColor = {r: 167, g: 139, b: 180}

        let rgb = {
            r: this.getRandomArbitrary(rgbMinColor.r, rgbMaxColor.r),
            g: this.getRandomArbitrary(rgbMinColor.g, rgbMaxColor.g),
            b: this.getRandomArbitrary(rgbMinColor.b, rgbMaxColor.b)
        }

        let rgbColor = `rgb(${rgb.r},${rgb.g},${rgb.b})`
        return rgbColor
    }


    drag(e) {
        if (this.isDrag) {
            let x = e.pageX - this.initialPosition.x
            let y = e.pageY - this.initialPosition.y
    
            this.style.left = `${x}px`
            this.timeline[this.elementId].startTime = this.pxToMilliseconds(x)
        }
    }

    dragMousedown(e) {
        this.addEventListener('mousemove', this.drag);

        this.isDrag = true
        this.initialPosition.x = e.pageX - Number(this.style.left.split("px")[0])
        this.initialPosition.y = e.pageY

        this.dragEventHandler = this.drag.bind(this)
        document.addEventListener('mousemove', this.dragEventHandler);
    }

    dragMouseup() {
        document.removeEventListener('mousemove', this.dragEventHandler);

        this.isDrag = false
    }

    setWidth(width) {
        this.style.width = `${width}px`
    }

    setLeft(left) {
        this.style.left = `${left}px`
    }

    setTrimStart(px) {
        let resizeRangeTargetLeft = this.querySelector(".element-bar-hiddenspace-left")
        resizeRangeTargetLeft.style.width = `${px}px`
    }

    setTrimEnd(px) {
        let duration = this.millisecondsToPx(this.timeline[this.elementId].duration)
        let startTrimWidth = this.millisecondsToPx(this.timeline[this.elementId].trim.startTime)
        if (duration - startTrimWidth < px) {
            return 0
        }
        let resizeRangeTargetRight = this.querySelector(".element-bar-hiddenspace-right")
        resizeRangeTargetRight.style.width = `${px}px`
    }


    millisecondsToPx(ms) {
        const timelineRange =  Number(document.querySelector("#timelineRange").value)
        const timeMagnification = timelineRange / 4
        const convertPixel = ms / 5 * timeMagnification
        return convertPixel
    }

    pxToMilliseconds(px) {
        const timelineRange =  Number(document.querySelector("#timelineRange").value)
        const timeMagnification = timelineRange / 4
        const convertMs = px * 5 / timeMagnification
        return convertMs
    }

    resize(e) {
        this.unselectThisElement()
        this.isDrag = false

        let x = e.pageX - this.initialPosition.x
        let y = e.pageY - this.initialPosition.y

        let duration = this.initialDuration 
        let timelineScrollLeft = document.querySelector("element-timeline").scrollLeft

        if (this.resizeLocation == 'left') {
            this.setLeft(x)
            this.setWidth(duration-x)
            this.timeline[this.elementId].startTime = this.pxToMilliseconds(x)
            this.timeline[this.elementId].duration = this.pxToMilliseconds(Number(this.style.width.split('px')[0]))
        } else {
            //this.style.left = `${x-duration}px`
            this.setWidth(timelineScrollLeft+e.pageX-Number(this.style.left.split('px')[0]))
            
            //this.timeline[this.elementId].startTime = this.initialPosition.x
            this.timeline[this.elementId].duration = this.pxToMilliseconds(Number(this.style.width.split('px')[0]))
        }
    }


    resizeRange(e) {
        this.isDrag = false

        let x = e.pageX - this.initialPosition.x

        let duration = this.initialDuration 
        let originDuration = Number(this.style.width.split('px')[0])

        let resizeRangeTargetLeft = this.querySelector(".element-bar-hiddenspace-left")
        let resizeRangeTargetRight = this.querySelector(".element-bar-hiddenspace-right")
        let timelineElement = document.querySelector("element-timeline")

        let windowWidth = window.innerWidth
        let timelineBodyWidth = timelineElement.scrollWidth
        let targetWidth = Number(this.style.width.split('px')[0])
        let targetLeft = Number(this.style.left.split('px')[0])
        let targetRight = windowWidth-originDuration-targetLeft < 0 ? timelineBodyWidth - (targetLeft + targetWidth) : 0

        let scrollLeft = timelineElement.scrollLeft
        let scrollRight = timelineBodyWidth-windowWidth-scrollLeft
        let marginLeftTargetToWidth = windowWidth-originDuration-targetLeft > 0 ? windowWidth-originDuration-targetLeft - 10 : 0


        if (this.resizeLocation == 'left') {
            this.setTrimStart(this.initialPosition.x+x+scrollLeft-targetLeft)
            this.timeline[this.elementId].trim.startTime = this.pxToMilliseconds(Number(resizeRangeTargetLeft.style.width.split('px')[0]))
        } else {
            this.setTrimEnd((scrollRight+windowWidth-x-this.initialPosition.x)-marginLeftTargetToWidth-targetRight)
            this.timeline[this.elementId].trim.endTime = this.pxToMilliseconds(duration-Number(resizeRangeTargetRight.style.width.split('px')[0]))
        }
    }

    resizeMousedown(e, location) {
        this.isResize = true
        this.resizeLocation = location
        this.isDrag = false
        this.initialPosition.x = location == 'left' ? 
            e.pageX - Number(this.style.left.split("px")[0]) : 
            Number(this.style.left.split("px")[0])
        this.initialPosition.y = e.pageY
        this.initialDuration = this.millisecondsToPx(this.timeline[this.elementId].duration) + Number(this.style.left.split("px")[0])

        this.resizeEventHandler = this.resize.bind(this)
        document.addEventListener('mousemove', this.resizeEventHandler);

    }

    resizeRangeMousedown(e, location) {
        this.isResize = true
        this.resizeLocation = location
        this.resizeRangeLeft = Number(this.querySelector(".element-bar-hiddenspace-left").style.width.split('px')[0])
        this.resizeRangeRight = Number(this.querySelector(".element-bar-hiddenspace-right").style.width.split('px')[0])

        this.isDrag = false
        this.initialPosition.x = Number(this.style.left.split("px")[0])
        this.initialDuration = this.millisecondsToPx(this.timeline[this.elementId].duration + Number(this.style.left.split("px")[0]))

        this.resizeEventHandler = this.resizeRange.bind(this)
        document.addEventListener('mousemove', this.resizeEventHandler);

    }

    resizeMouseup() {
        document.removeEventListener('mousemove', this.resizeEventHandler);

        this.isResize = false
    }

    changeOutlineColor(action = 'add') {
        if (action == 'add') {
            this.classList.add("border-inner-light")
        } else if (action == 'remove') {
            this.classList.remove("border-inner-light")
        }
    }

    selectThisElement() {
        const elementControl = document.querySelector('element-control')
        if (elementControl.selectElementsId.includes(this.elementId)) {
            return 0
        }
        elementControl.selectElementsId.push(this.elementId)
        this.changeOutlineColor('add')
    }

    unselectThisElement() {
        const elementControl = document.querySelector('element-control')
        elementControl.selectElementsId = elementControl.selectElementsId.filter((item) => {
            return item !== this.elementId;
        });

        this.changeOutlineColor('remove')
    }

    animationPanelDropdownTemplate() {
        let isShowPanel = this.isShowAnimationPanel()
        let itemName = isShowPanel == true ? "애니메이션 패널 닫기" : "애니메이션 패널 열기"
        let itemOnclickEvent = isShowPanel == true ? `document.querySelector("animation-panel[element-id='${this.elementId}']").hide()` : `document.querySelector("animation-panel[element-id='${this.elementId}']").show()`

        let template = `<menu-dropdown-item onclick=${itemOnclickEvent} item-name="${itemName}"></menu-dropdown-item>`
        return template
    }

    isShowAnimationPanel() {
        return document.querySelector(`animation-panel[element-id='${this.elementId}']`).isShow
    }


    showMenuDropdown({ x, y }) {
        let animationPanel = this.animationPanelDropdownTemplate()
        document.querySelector("#menuRightClick").innerHTML = `
            <menu-dropdown-body top="${y}" left="${x}">
            ${animationPanel}
            <menu-dropdown-item onclick="document.querySelector('element-timeline').showKeyframeEditor('${this.elementId}')" item-name="키프레임 편집"></menu-dropdown-item>

            <menu-dropdown-item onclick="document.querySelector('element-timeline').removeSeletedElements()" item-name="삭제"> </menu-dropdown-item>
        </menu-dropdown-body>`
    }

    handleMousedown(e) {
        this.selectThisElement()
        this.dragMousedown(e)
    }

    handleMouseup(e) {
        this.rightclick(e)
        this.selectThisElement()
    }

    rightclick(e) {
        const isRightClick = (e.which == 3) || (e.button == 2)

        if(!isRightClick) {
            return 0
        }

        this.showMenuDropdown({
            x: e.clientX,
            y: e.clientY
        })
        console.log("RC", e)

        
        //document.querySelector('element-timeline').removeSeletedElements()
    }


    connectedCallback() {
        this.render();

        this.addEventListener('mousedown', this.handleMousedown.bind(this));
        this.addEventListener('mouseup', this.handleMouseup.bind(this));

        //this.addEventListener('mousedown', this.dragMousedown.bind(this));
        // this.addEventListener('mouseup', this.rightclick.bind(this));
        // this.addEventListener('mouseup', this.click.bind(this));

        document.addEventListener('mouseup', this.dragMouseup.bind(this));
        document.addEventListener('mouseup', this.resizeMouseup.bind(this));

    }

    disconnectedCallback(){
        this.removeEventListener('mousedown', this.handleMousedown);
        this.removeEventListener('mouseup', this.handleMouseup);

        document.removeEventListener('mouseup', this.dragMouseup);
        document.removeEventListener('mouseup', this.resizeMouseup);
    }
}

export { ElementBar }