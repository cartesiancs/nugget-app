const { ipcRenderer } = require('electron')


ipcRenderer.on('RES_ALL_DIR', (evt, dir, result) => {
    nugget.asset.nowDirectory = dir
    assetBrowser.innerHTML = ''
    for (const key in result) {
        if (Object.hasOwnProperty.call(result, key)) {
            const element = result[key];
            if (!element.isDirectory) {
                nugget.asset.loadFile(element.title)
            } else {
                nugget.asset.loadFolder(element.title, dir)

            }
        }
    }
})



const ipc = {
    requestAllDir: function (dir) {
        ipcRenderer.send('REQ_ALL_DIR', dir)
    },
    render: function () {
        ipcRenderer.send('RENDER', nugget.element.timeline)
    }
}
