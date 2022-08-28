const asset = {
    loadFile: function (filename) {
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-6 d-flex flex-column bd-highlight overflow-hidden asset mt-1">
                <i class="fas fa-file icon-lg align-self-center"></i>
                <b class="align-self-center text-light">${filename}</b>
            </div>`)
    },
    loadFolder: function (filename) {
        document.querySelector("#assetBrowser").
            insertAdjacentHTML("beforeend", `
            <div class="col-6 d-flex flex-column bd-highlight overflow-hidden asset mt-1">
                <i class="fas fa-folder icon-lg align-self-center"></i>
                <b class="align-self-center text-light">${filename}</b>
            </div>`)
    },
}

export default asset