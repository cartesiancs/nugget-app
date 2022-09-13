const { ipcRenderer } = require('electron')


ipcRenderer.on('RES_ALL_DIR', (evt, dir, result) => {
    let fileLists = {}
    const assetList = document.querySelector("asset-list")
    assetList.nowDirectory = dir
    assetList.clearList()

    nugget.asset.nowDirectory = dir
    assetDir.value = dir

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
        let options = {
            videoDuration: 10,
            previewRatio: nugget.element.preview.previewRatio,
            videoDestination: '/Users/hhj/Desktop/_FILES/_Video/result.mp4'
        }
        ipcRenderer.send('RENDER', nugget.element.timeline, options)
    }
}
