const asset = {
    nowDirectory: '',
    loadFile: function (filename) {
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-6 d-flex flex-column bd-highlight overflow-hidden asset mt-1">
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
}

export default asset