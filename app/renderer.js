const { ipcRenderer, shell } = require('electron')
const fs = require('fs');
var JSZip = require("jszip");



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
    let prog = rendererUtil.secondsToProgress(sec).toFixed(2)
    document.querySelector("#progress").style.width = `${prog}%`
    document.querySelector("#progress").innerHTML = `${prog}%`

})

ipcRenderer.on('PROCESSING_FINISH', (evt) => {
    rendererModal.progressModal.hide()
    rendererModal.progressFinish.show()

    document.querySelector("#progress").style.width = `100%`
    document.querySelector("#progress").innerHTML = `100%`
})

ipcRenderer.on('PROCESSING_ERROR', (evt, errormsg) => {
    rendererModal.progressModal.hide()
    rendererModal.progressError.show()

    document.querySelector("#progressErrorMsg").innerHTML = `${errormsg}`
})



ipcRenderer.on('WHEN_CLOSE_EVENT', (evt) => {
    console.log("S")
    let isTimelineChange = document.querySelector('element-timeline').isTimelineChange()
    if (isTimelineChange == true) {
        rendererModal.whenClose.show()
    } else {
        rendererUtil.forceClose()
    }
    
})

// NOTE: ipcRenderer.send('INIT') 명령어로 실행중인 앱의 경로를 확인할 수 있습니다
ipcRenderer.on('GET_PATH', (evt, path) => {
    console.log(path)
})




const rendererModal = {
    progressModal: new bootstrap.Modal(document.getElementById('progressRender'), {
        keyboard: false
    }),
    progressFinish: new bootstrap.Modal(document.getElementById('progressFinish'), {
        keyboard: false
    }),
    progressError: new bootstrap.Modal(document.getElementById('progressError'), {
        keyboard: false
    }),
    whenClose: new bootstrap.Modal(document.getElementById('whenClose'), {
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
    },

    forceClose() {
        ipcRenderer.send('FORCE_CLOSE')
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

        ipcRenderer.invoke('dialog:exportFile').then((result) => {
            let videoDestination = result || `nonefile`
            if (videoDestination == `nonefile`) {
                return 0
            }

            let timeline = document.querySelector("element-timeline").timeline // nugget.element.timeline
            let options = {
                videoDuration: projectDuration,
                previewRatio: projectRatio,
                videoDestination: result || `${projectFolder}/result.mp4`
            }
            ipcRenderer.send('RENDER', timeline, options)
        })
    },
    showFileInFolder: function (path) {
        shell.openPath(path)
    }
}
