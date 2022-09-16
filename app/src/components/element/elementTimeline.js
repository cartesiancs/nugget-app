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