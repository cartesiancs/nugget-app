const asset = {
    nowDirectory: '',
    loadFile: function (filename, dir) {
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-6 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="nugget.asset.add('${dir}/${filename}', '${dir}')">
                <i class="fas fa-file icon-lg align-self-center"></i>
                <b class="align-self-center text-light">${filename}</b>
            </div>`)
    },
    loadFolder: function (filename, dir) {
        
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-6 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="ipc.requestAllDir('${dir}/${filename}')">
                <i class="fas fa-folder icon-lg align-self-center"></i>
                <b class="align-self-center text-light">${filename}</b>
            </div>`)
    },
    loadPrevDirectory: function () {
        let splitNowDirectory = asset.nowDirectory.split('/')
        let splitPrevDirectory = splitNowDirectory.slice(-splitNowDirectory.length, -1)

        ipc.requestAllDir(splitPrevDirectory.join('/'))
    },
    add: function (url, path) {
        fetch(`file://${url}`)
        .then(res => res.blob())
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);
            nugget.element.bar.append(blobUrl)
            nugget.element.control.upload.image(blobUrl, url)
        });

    }
}

export default asset