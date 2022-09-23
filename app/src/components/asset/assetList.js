class AssetList extends HTMLElement { 
    constructor() {
        super();
        this.nowDirectory = ''

    }

    render(){
        const template = this.template();
        this.innerHTML = template;
    }

    template() {
        return `<div class="row px-2"></div>`
    }

    getFile(filename){
        let splitedFilename = filename.split('.')
        let splitedFilenameLength = splitedFilename.length
        let fileType = splitedFilenameLength <= 2 ? '' : splitedFilename[splitedFilenameLength-1]

        let listBody = this.querySelector("div")
        listBody.insertAdjacentHTML("beforeend", `<asset-file asset-name="${filename}"></asset-file>`)
    }

    getFolder(foldername){
        let splitedFoldername = foldername.split('.')
        let splitedFoldernameLength = splitedFoldername.length
        let fileType = splitedFoldernameLength <= 2 ? '' : splitedFilename[splitedFoldernameLength-1]

        let listBody = this.querySelector("div")
        listBody.insertAdjacentHTML("beforeend", `<asset-folder asset-name="${foldername}"></asset-folder>`)
    }
    
    clearList() {
        this.querySelector("div").innerHTML = '';
    }

    connectedCallback() {
        this.render();
    }
}


class AssetFile extends HTMLElement { 
    constructor() {
        super();

        this.classList.add("col-4", "d-flex", "flex-column", "bd-highlight", "overflow-hidden", "mt-1", "asset")
        this.filename = this.getAttribute('asset-name')
        this.directory = document.querySelector("asset-list").nowDirectory
    }

    render(){
        const template = this.template();
        this.innerHTML = template;
    }

    template() {
        return `<span class="material-symbols-outlined icon-lg align-self-center"> draft </span>
        <b class="align-self-center text-ellipsis-scroll text-light text-center">${this.filename}</b>`
    }

    handleClick() {
        
        this.patchToControl(`${this.directory}/${this.filename}`, `${this.directory}`)
    }

    patchToControl(url, path) {
        fetch(`file://${url}`)
        .then(res => {
            return res.blob()
        })
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);
            let blobType = blob.type.split('/')[0] // image, video, audio ...
            let control = document.querySelector("element-control")

            if (blobType == 'image') {
                control.addImage(blobUrl, url)
            } else if (blobType == 'video') {
                control.addVideo(blobUrl, url)
            } else if (blobType == 'audio') {
                control.addAudio(blobUrl, url)
            }
        })
    }


    connectedCallback() {
        this.render();
        this.addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback(){
        this.removeEventListener('click', this.handleClick);
    }
}

class AssetFolder extends HTMLElement { 
    constructor() {
        super();

        this.classList.add("col-4", "d-flex", "flex-column", "bd-highlight", "overflow-hidden", "mt-1", "asset")
        this.foldername = this.getAttribute('asset-name')
        this.directory = document.querySelector("asset-list").nowDirectory
    }

    render(){
        const template = this.template();
        this.innerHTML = template;
    }

    template() {
        return `<span class="material-symbols-outlined icon-lg align-self-center"> folder </span>
        <b class="align-self-center text-ellipsis text-light text-center">${this.foldername}</b>`
    }

    handleClick() {
        ipc.requestAllDir(`${this.directory}/${this.foldername}`)
    }


    connectedCallback() {
        this.render();
        this.addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback(){
        this.removeEventListener('click', this.handleClick);
    }
}


export { AssetList, AssetFile, AssetFolder }