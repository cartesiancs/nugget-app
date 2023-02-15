const { contextBridge, ipcRenderer, shell } = require('electron')

const request = {
    app: {
        forceClose: () => ipcRenderer.send('FORCE_CLOSE')
    },
    dialog: {
        openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
        exportVideo: () => ipcRenderer.invoke('dialog:exportVideo')
        
    },
    store: {
        set: (key, value) => ipcRenderer.invoke('store:set', key, value),
        get: (key) => ipcRenderer.invoke('store:get', key),
        delete: (key) => ipcRenderer.invoke('store:delete', key),

    },
    project: {
        save: () => ipcRenderer.invoke('dialog:saveProject')        
    },
    filesystem: {
        getAllDirectory: (dir) => ipcRenderer.send('REQ_ALL_DIR', dir),
        openDirectory: (path) => ipcRenderer.send('OPEN_PATH', path),
        test: () => ipcRenderer.invoke('filesystem:test'),
        mkdir: (path, options) => ipcRenderer.invoke('filesystem:mkdir', path, options),
        emptyDirSync: (path) => ipcRenderer.invoke('filesystem:emptyDirSync', path),
        writeFile: (filename, data, options) => ipcRenderer.invoke('filesystem:writeFile', filename, data, options),
        readFile: (filename) => ipcRenderer.invoke('filesystem:readFile', filename)
        
    },
    progressBar: {
        test: () => ipcRenderer.send('PROGRESSBARTEST')
    },
    ffmpeg: {
        getMetadata: (bloburl, mediapath) => ipcRenderer.send('GET_METADATA', bloburl, mediapath),
        combineFrame: (outputDir, elementId) => ipcRenderer.invoke('ffmpeg:combineFrame', outputDir, elementId),

    },
    render: {
        outputVideo: (elements, options) => ipcRenderer.send('RENDER', elements, options)
    },
    url: {
        openUrl: (url) => ipcRenderer.send('OPEN_URL', url),
    }


    
}


const response = {
    app: {
        forceClose: (callback) => ipcRenderer.on('WHEN_CLOSE_EVENT', callback),
        getAppPath: (callback) => ipcRenderer.on('GET_PATH', callback)

        
    },
    auth: {
        loginSuccess: (callback) => ipcRenderer.on('LOGIN_SUCCESS', callback)
    },
    filesystem: {
        getAllDirectory: (callback) => ipcRenderer.on('RES_ALL_DIR', callback)
    },
    render: {
        progressing: (callback) => ipcRenderer.on('PROCESSING', callback),
        finish: (callback) => ipcRenderer.on('PROCESSING_FINISH', callback),
        error: (callback) => ipcRenderer.on('PROCESSING_ERROR', callback),
        finishCombineFrame: (callback) => ipcRenderer.on('FINISH_COMBINE_FRAME', callback)
    },
    ffmpeg: {
        getMetadata: (callback) => ipcRenderer.on('GET_METADATA', callback)
    }
}

contextBridge.exposeInMainWorld('electronAPI', {
    req: request,
    res: response
})

