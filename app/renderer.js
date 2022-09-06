const { ipcRenderer } = require('electron')


ipcRenderer.on('RES_ALL_DIR', (evt, dir, result) => {
    let fileLists = {}
    nugget.asset.nowDirectory = dir
    assetBrowser.innerHTML = ''
    for (const key in result) {
        if (Object.hasOwnProperty.call(result, key)) {
            const element = result[key];
            if (!element.isDirectory) {
                fileLists[key] = element
            } else {
                nugget.asset.loadFolder(element.title, dir)
            }
        }
    }

    for (const file in fileLists) {
        if (Object.hasOwnProperty.call(fileLists, file)) {
            const element = fileLists[file];
            nugget.asset.loadFile(element.title, dir)
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
