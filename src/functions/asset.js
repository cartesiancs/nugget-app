import { path } from './path.js'

const asset = {
    nowDirectory: '',
    // loadFile: function (filename, dir) {
    //     let splitedFilename = filename.split('.')
    //     let splitedFilenameLength = splitedFilename.length
    //     let fileType = splitedFilenameLength <= 2 ? '' : splitedFilename[splitedFilenameLength-1]

    //     document.querySelector("#assetBrowser").
    //         insertAdjacentHTML("beforeend", `
    //         <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="nugget.asset.add('${dir}/${filename}', '${dir}')">
    //             <span class="material-symbols-outlined icon-lg align-self-center"> draft </span>
    //             <b class="align-self-center text-ellipsis-scroll text-light text-center">${filename}</b> 
    //         </div>`)
    // },
    // loadFolder: function (filename, dir) {
        
    //     document.querySelector("#assetBrowser").
    //         insertAdjacentHTML("beforeend", `
    //         <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="ipc.requestAllDir('${dir}/${filename}')">
    //         <span class="material-symbols-outlined icon-lg align-self-center"> folder </span>
    //             <b class="align-self-center text-ellipsis text-light text-center">${filename}</b>
    //         </div>`)
    // },

    loadPrevDirectory: function () {
        let splitNowDirectory = asset.nowDirectory.split('/')
        let splitPrevDirectory = splitNowDirectory.slice(-splitNowDirectory.length, -1)

        ipc.requestAllDir(splitPrevDirectory.join('/'))

    },
    add: function (originPath) {
        const filepath = path.encode(originPath)
        fetch(`file://${filepath}`)
        .then(res => {
            return res.blob()
        })
        .then(blob => {
            let blobUrl = URL.createObjectURL(blob);
            let blobType = blob.type.split('/')[0] // image, video, audio ...
            let control = document.querySelector("element-control")

            if (blobType == 'image') {
                control.addImage(blobUrl, filepath)
            } else if (blobType == 'video') {
                control.addVideo(blobUrl, filepath)
            } else if (blobType == 'audio') {
                control.addAudio(blobUrl, filepath)
            }
        })

    }
}

export default asset