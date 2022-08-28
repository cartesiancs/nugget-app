const { ipcRenderer } = require('electron')


ipcRenderer.on('RES_ALL_DIR', (evt, dir, result) => {
    console.log(result)
    for (const key in result) {
        if (Object.hasOwnProperty.call(result, key)) {
            const element = result[key];
            if (!element.isDirectory) {
                nugget.asset.loadFile(element.title)
            } else {
                nugget.asset.loadFolder(element.title)

            }
        }
    }
})

function requestAllDir(dir) {
    ipcRenderer.send('REQ_ALL_DIR', dir)
    console.log(dir)

}
