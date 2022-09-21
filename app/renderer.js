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


ipcRenderer.on('PROCESSING', (evt, hms) => {
    rendererUtil.showProgressModal()
    let sec = rendererUtil.hmsToSeconds(hms)
    let prog = rendererUtil.secondsToProgress(sec)
    document.querySelector("#progress").style.width = `${prog}%`
    document.querySelector("#progress").innerHTML = `${prog}%`

})

ipcRenderer.on('PROCESSING_FINISH', (evt) => {
    rendererModal.progressModal.hide()
    rendererModal.progressFinish.show()

    document.querySelector("#progress").style.width = `100%`
    document.querySelector("#progress").innerHTML = `100%`
})



const rendererModal = {
    progressModal: new bootstrap.Modal(document.getElementById('progressRender'), {
        keyboard: false
    }),
    progressFinish: new bootstrap.Modal(document.getElementById('progressFinish'), {
        keyboard: false
    })
}

const rendererUtil = {
    hmsToSeconds(hms) {
        let splitHMS = hms.split(':')
        let seconds = (+splitHMS[0]) * 60 * 60 + (+splitHMS[1]) * 60 + (+splitHMS[2]); 
        
        return seconds
    },

    secondsToProgress(seconds) {
        const projectDuration = Number(document.querySelector("#projectDuration").value)
        return seconds/projectDuration*100
    },

    showProgressModal() {

        rendererModal.progressModal.show()

    },

    openRenderedVideoFolder() {
        const projectFolder = document.querySelector("#projectFolder").value
        ipc.showFileInFolder(projectFolder)
    }


}


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
    },
    showFileInFolder: function (path) {
        shell.openPath(path)
    }
}
