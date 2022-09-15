class ElementTimeline extends HTMLElement { 
    constructor() {
        super();

        //this.directory = ''

        this.timeline = {

        }
    }

    render(){
        const template = this.template();
        this.classList.add("col-12", "cursor-default", "h-100", "line")
        this.innerHTML = template;
    }

    template() {
        return `<div id="timeline_bar" class="timeline-bar" style="left: 0px;"></div>`
    }

    addElementBar(elementId) {
        const templateBar = this.templateElementBar(elementId)


        this.insertAdjacentHTML("beforeend", templateBar)
    }

    templateElementBar(elementId) {
        let width = this.timeline[elementId].duration
        let filetype = this.timeline[elementId].filetype

        let elementSplitedFilepath = this.timeline[elementId].localpath.split('/')
        let elementFilepath = elementSplitedFilepath[elementSplitedFilepath.length-1]

        let elementType = this.getElementType(filetype)

        if (elementType == 'static') {
            return `<element-bar-static element-id="${elementId}"></element-bar-static>`

        } else if (elementType == 'dynamic') {
            return `<div class="element-bar" style="width: ${width}px; left: 0px; background-color: ${elementBarBackgroundColor};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${elementId}">
                    ${elementFilepath}
                    <div class="element-bar-hiddenspace-left position-absolute">
                        <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'left')">
                        </div>
                    </div>
                    <div class="element-bar-hiddenspace-right position-absolute">
                        <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'right')">
                        </div>
                    </div>
                    </div>`
        } else {
            return `none`
        }
    }



    getElementType(filetype) {
        let elementType = 'undefined'
        const elementFileExtensionType = {
            "static": ['image', 'png', 'jpg', 'jpeg'],
            "dynamic": ['video', 'mp4', 'mp3', 'mov']
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

    connectedCallback() {
        this.render();

    }
}


export { ElementTimeline }