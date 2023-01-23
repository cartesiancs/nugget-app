const { contextBridge, ipcRenderer, shell } = require('electron')

const request = {
    app: {
        forceClose: () => ipcRenderer.send('FORCE_CLOSE')
    },
    dialog: {
        openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
        exportVideo: () => ipcRenderer.invoke('dialog:openDireexportVideoctory')
        
    },
    filesystem: {
        getAllDirectory: (dir) => ipcRenderer.send('REQ_ALL_DIR', dir),
        openDirectory: (path) => shell.openPath(path)
        
    },
    progressBar: {
        test: () => ipcRenderer.send('PROGRESSBARTEST')
    },
    ffmpeg: {
        getMetadata: (bloburl, mediapath) => ipcRenderer.send('GET_METADATA', bloburl, mediapath)
    }
}


const response = {
    app: {
        forceClose: (callback) => ipcRenderer.on('WHEN_CLOSE_EVENT', callback),
        getAppPath: (callback) => ipcRenderer.on('GET_PATH', callback)

        
    },
    filesystem: {
        getAllDirectory: (callback) => ipcRenderer.on('RES_ALL_DIR', callback)
    },
    render: {
        progressing: (callback) => ipcRenderer.on('PROCESSING', callback),
        finish: (callback) => ipcRenderer.on('PROCESSING_FINISH', callback),
        error: (callback) => ipcRenderer.on('PROCESSING_ERROR', callback)
    },
    ffmpeg: {
        getMetadata: (callback) => ipcRenderer.on('GET_METADATA', callback)
    }
}

contextBridge.exposeInMainWorld('electronAPI', {
    req: request,
    res: response
})

