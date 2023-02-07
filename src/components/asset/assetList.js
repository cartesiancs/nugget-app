

class AssetList extends HTMLElement { 
    constructor() {
        super();
        this.blobThumbnail = {}
        this.nowDirectory = ''

    }

    render(){
        const template = this.template();
        this.innerHTML = template;
    }

    template() {
        return `<div class="row px-2"> <p class="text-light mt-2 text-center">프로젝트 폴더를 지정한 후 표시됩니다.</p> </div>`
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

    async render(){
        const fileType = NUGGET.mime.lookup(this.filename).type
        const fileUrl = `file://${this.directory}/${this.filename}`
        const assetList = document.querySelector("asset-list")

        let template;
        if (fileType == 'image') {
            template = this.templateImage(fileUrl);
        } else if (fileType == 'video') {

            if (assetList.blobThumbnail.hasOwnProperty(fileUrl)) {
                let savedThumbnailUrl = assetList.blobThumbnail[fileUrl]                
                template = this.templateVideoThumbnail(savedThumbnailUrl);
            } else {
                let thumbnailUrl = await this.captureVideoThumbnail(fileUrl)
                assetList.blobThumbnail[fileUrl] = thumbnailUrl
                template = this.templateVideoThumbnail(thumbnailUrl);
            }

        } else {
            template = this.template(fileType);
        }

        
        this.innerHTML = template;

    }

    template(filetype = 'unknown') {
        const fileIcon = {
            'video': 'video_file',
            "audio": "audio_file",
            "unknown": "draft"
        }
        return `<span class="material-symbols-outlined icon-lg align-self-center"> ${fileIcon[filetype]} </span>
        <b class="align-self-center text-ellipsis-scroll text-light text-center">${this.filename}</b>`
    }

    templateImage(url) {
        return `<img src="${url}" alt="" class="align-self-center asset-preview">
        <b class="align-self-center text-ellipsis-scroll text-light text-center">${this.filename}</b>`
    }

    templateVideoThumbnail(blobUrl) {
        return `
        <div class="position-relative align-self-center">
        <img src="${blobUrl}" alt="" class="align-self-center asset-preview w-100">
        <span class="material-symbols-outlined position-absolute icon-center ">
        play_arrow
        </span>
        </div>
        
        <b class="align-self-center text-ellipsis-scroll text-light text-center">${this.filename}</b>`
    }

    handleClick() {
        NUGGET.asset.add(`${this.directory}/${this.filename}`)
        //this.patchToControl(`${this.directory}/${this.filename}`, `${this.directory}`)
    }

    async captureVideoThumbnail(url) {

        const thumbnailUrl = await new Promise((resolve, reject) => {
            fetch(`${url}`)
            .then(res => {
                return res.blob()
            })
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const videoElement = document.createElement('video')
        
                videoElement.src = blobUrl
                videoElement.preload = 'metadata'
    
                videoElement.onloadedmetadata = async () => {
                    const thumbnailCanvas = document.createElement('canvas')

                    videoElement.addEventListener('seeked', () => {
                        let width = videoElement.videoWidth
                        let height = videoElement.videoHeight
                        thumbnailCanvas.width = width;
                        thumbnailCanvas.height = height;
                    
                        let ctx = thumbnailCanvas.getContext('2d');
                        ctx.drawImage(videoElement, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
                    
                        thumbnailCanvas.toBlob((blob) => {
                            const newImg = document.createElement('img');
                            const url = URL.createObjectURL(blob);
                          
                            newImg.onload = () => {
                                URL.revokeObjectURL(url);
                            };
                          
                            resolve(url)
                        });
                        
                    });
                    
                    videoElement.currentTime = 1;
            
                    // let image = thumbnailCanvas.toDataURL('image/jpeg');
                    // resolve(image)

                }
            })

        })

        return thumbnailUrl

    }


    async connectedCallback() {
        await this.render();
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