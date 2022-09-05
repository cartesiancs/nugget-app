const asset = {
    nowDirectory: '',
    loadFile: function (filename, dir) {
        let splitedFilename = filename.split('.')
        let splitedFilenameLength = splitedFilename.length
        let fileType = splitedFilenameLength <= 2 ? '' : splitedFilename[splitedFilenameLength-1]
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="nugget.asset.add('${dir}/${filename}', '${dir}')">
                <i class="fas fa-file icon-lg align-self-center"></i>
                <b class="align-self-center text-ellipsis-scroll text-light text-center">${filename}</b> 
            </div>`)
    },
    loadFolder: function (filename, dir) {
        
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="ipc.requestAllDir('${dir}/${filename}')">
                <i class="fas fa-folder icon-lg align-self-center"></i>
                <b class="align-self-center text-ellipsis text-light text-center">${filename}</b>
            </div>`)
    },
    loadPrevDirectory: function () {
        let splitNowDirectory = asset.nowDirectory.split('/')
        let splitPrevDirectory = splitNowDirectory.slice(-splitNowDirectory.length, -1)

        ipc.requestAllDir(splitPrevDirectory.join('/'))
    },
    add: function (url, path) {
        fetch(`file://${url}`)
        .then(res => {
            return res.blob()
        })
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);
            let blobType = blob.type.split('/')[0] // image, video ...
            
            nugget.element.control.upload[blobType](blobUrl, url)
        });

    }
}

export default asset