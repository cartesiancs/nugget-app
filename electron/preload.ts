import { contextBridge, ipcRenderer } from "electron";

const request = {
  app: {
    forceClose: () => ipcRenderer.send("app:forceClose"),
    restart: () => ipcRenderer.send("app:restart"),
    getResourcesPath: () => ipcRenderer.invoke("app:getResourcesPath"),
    getTempPath: () => ipcRenderer.invoke("app:getTempPath"),
    getAppInfo: () => ipcRenderer.invoke("app:getAppInfo"),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
    openFile: (extension) => ipcRenderer.invoke("dialog:openFile", extension),
    exportVideo: () => ipcRenderer.invoke("dialog:exportVideo"),
  },
  store: {
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    get: (key) => ipcRenderer.invoke("store:get", key),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
  },
  font: {
    getLists: () => ipcRenderer.invoke("font:getLists"),
    getLocalFontLists: () => ipcRenderer.invoke("font:getLocalFontLists"),
  },
  project: {
    save: () => ipcRenderer.invoke("dialog:saveProject"),
  },
  desktopCapturer: {
    getSources: () => ipcRenderer.invoke("desktopCapturer:getSources"),
  },
  overlayRecord: {
    show: () => ipcRenderer.invoke("overlayRecord:show"),
  },
  filesystem: {
    getDirectory: (dir) => ipcRenderer.invoke("filesystem:getDirectory", dir),
    openDirectory: (path) => ipcRenderer.send("OPEN_PATH", path),
    test: () => ipcRenderer.invoke("filesystem:test"),
    mkdir: (path, options) =>
      ipcRenderer.invoke("filesystem:mkdir", path, options),
    emptyDirSync: (path) => ipcRenderer.invoke("filesystem:emptyDirSync", path),
    removeDirectory: (path) =>
      ipcRenderer.invoke("filesystem:removeDirectory", path),

    writeFile: (filename, data, options) =>
      ipcRenderer.invoke("filesystem:writeFile", filename, data, options),
    readFile: (filename) => ipcRenderer.invoke("filesystem:readFile", filename),
  },
  progressBar: {
    test: () => ipcRenderer.send("PROGRESSBARTEST"),
  },
  ffmpeg: {
    getMetadata: (bloburl, mediapath) =>
      ipcRenderer.send("GET_METADATA", bloburl, mediapath),
    combineFrame: (outputDir, elementId) =>
      ipcRenderer.invoke("ffmpeg:combineFrame", outputDir, elementId),
    extractAudioFromVideo: (outputAudio, videoPath) =>
      ipcRenderer.invoke(
        "ffmpeg:extractAudioFromVideo",
        outputAudio,
        videoPath,
      ),
    installFFmpeg: () => ipcRenderer.send("DOWNLOAD_FFMPEG"),
  },
  render: {
    outputVideo: (elements, options) =>
      ipcRenderer.send("RENDER", elements, options),
  },
  url: {
    openUrl: (url) => ipcRenderer.send("OPEN_URL", url),
  },
  stream: {
    saveBufferToVideo: (arrayBuffer) =>
      ipcRenderer.invoke("stream:saveBufferToVideo", arrayBuffer),

    saveBufferToAudio: (arrayBuffer) =>
      ipcRenderer.invoke("stream:saveBufferToAudio", arrayBuffer),
  },
  extension: {
    openDir: (dir) => ipcRenderer.invoke("extension:open:dir", dir),
    openFile: (file) => ipcRenderer.invoke("extension:open:file", file),
  },
};

const response = {
  app: {
    forceClose: (callback) => ipcRenderer.on("WHEN_CLOSE_EVENT", callback),
    getAppPath: (callback) => ipcRenderer.on("GET_PATH", callback),
  },
  auth: {
    loginSuccess: (callback) => ipcRenderer.on("LOGIN_SUCCESS", callback),
  },
  filesystem: {
    getAllDirectory: (callback) => ipcRenderer.on("RES_ALL_DIR", callback),
  },
  render: {
    progressing: (callback) => ipcRenderer.on("PROCESSING", callback),
    finish: (callback) => ipcRenderer.on("PROCESSING_FINISH", callback),
    error: (callback) => ipcRenderer.on("PROCESSING_ERROR", callback),
    finishCombineFrame: (callback) =>
      ipcRenderer.on("FINISH_COMBINE_FRAME", callback),
  },
  ffmpeg: {
    getMetadata: (callback) => ipcRenderer.on("GET_METADATA", callback),
    extractAudioFromVideoProgress: (callback) =>
      ipcRenderer.on("ffmpeg:extractAudioFromVideo:progress", callback),
    extractAudioFromVideoFinish: (callback) =>
      ipcRenderer.on("ffmpeg:extractAudioFromVideo:finish", callback),
  },
  shortcut: {
    controlS: (callback) => ipcRenderer.on("SHORTCUT_CONTROL_S", callback),
    controlO: (callback) => ipcRenderer.on("SHORTCUT_CONTROL_O", callback),
  },
  timeline: {
    get: (callback) => ipcRenderer.on("timeline:get", callback),
    add: (callback) => ipcRenderer.on("timeline:add", callback),
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      req: request,
      res: response,
    });
  } catch (error) {
    console.error(error);
  }
}
