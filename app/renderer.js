const { ipcRenderer, shell } = require('electron')


ipcRenderer.on('RES_ALL_DIR', (evt, dir, result) => {
    let fileLists = {}
    const assetList = document.querySelector("asset-list")
    const assetBrowser = document.querySelector("asset-browser")

    assetList.nowDirectory = dir
    assetList.clearList()
    assetBrowser.updateDirectoryInput(dir)

    //nugget.asset.nowDirectory = dir

    for (const key in result) {
        if (Object.hasOwnProperty.call(result, key)) {
            const element = result[key];
            if (!element.isDirectory) {
                fileLists[key] = element
            } else {
                assetList.getFolder(element.title)

                //nugget.asset.loadFolder(element.title, dir)
            }
        }
    }

    for (const file in fileLists) {
        if (Object.hasOwnProperty.call(fileLists, file)) {
            const element = fileLists[file];
            assetList.getFile(element.title)
            //nugget.asset.loadFile(element.title, dir)
        }
    }
})



const ipc = {
    requestAllDir: function (dir) {
        ipcRenderer.send('REQ_ALL_DIR', dir)
    },
    render: function () {
        const projectDuration = Number(document.querySelector("#projectDuration").value)
        const projectFolder = document.querySelector("#projectFolder").value
        const projectRatio = elementControlComponent.previewRatio

        let timeline = document.querySelector("element-timeline").timeline // nugget.element.timeline
        let options = {
            videoDuration: projectDuration,
            previewRatio: projectRatio,
            videoDestination: `${projectFolder}/result.mp4`
        }
        ipcRenderer.send('RENDER', timeline, options)
    }
}
