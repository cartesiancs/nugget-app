import { getLocationEnv } from "./getLocationEnv";

export function enableIpcWrapper() {
  if (getLocationEnv() == "electron") return false;

  window.electronAPI = {
    req: {
      app: {
        forceClose: async function (lang) {
          return "none";
        },
        restart: async function (lang) {
          return "none";
        },
        getResourcesPath: async function (lang) {
          return "none";
        },
        getTempPath: async function (lang) {
          return "none";
        },
        getAppInfo: async function (lang) {
          return {
            data: {
              version: "SelfHosted",
            },
          };
        },
      },
      dialog: {
        openDirectory: async function (lang) {
          return "none";
        },
        openFile: async function (lang) {
          return "none";
        },
        exportVideo: async function (lang) {
          return "none";
        },
      },
      store: {
        set: async function (lang) {
          return "none";
        },
        get: async function (lang) {
          return "none";
        },
        delete: async function (lang) {
          return "none";
        },
      },
      font: {
        getLists: async function (lang) {
          return {
            fonts: [],
          };
        },
        getLocalFontLists: async function (lang) {
          return "none";
        },
      },
      project: {
        save: async function (lang) {
          return "none";
        },
      },
      desktopCapturer: {
        getSources: async function (lang) {
          return "none";
        },
      },
      overlayRecord: {
        show: async function (lang) {
          return "none";
        },
        stop: async function (lang) {
          return "none";
        },
      },
      filesystem: {
        getDirectory: async function (lang) {
          return "none";
        },
        openDirectory: async function (lang) {
          return "none";
        },
        mkdir: async function (lang) {
          return "none";
        },
        emptyDirSync: async function (lang) {
          return "none";
        },
        removeDirectory: async function (lang) {
          return "none";
        },

        writeFile: async function (lang) {
          return "none";
        },
        readFile: async function (lang) {
          return "none";
        },
        existFile: async function (lang) {
          return "none";
        },
        removeFile: async function (lang) {
          return "none";
        },
      },
      ffmpeg: {
        getMetadata: async function (lang) {
          return "none";
        },
        combineFrame: async function (lang) {
          return "none";
        },
        extractAudioFromVideo: async function (lang) {
          return "none";
        },
        installFFmpeg: async function (lang) {
          return "none";
        },
      },
      render: {
        outputVideo: async function (lang) {
          return "none";
        },
        v2: {
          sendFrame: async function (lang) {
            return "none";
          },
          finishStream: async function (lang) {
            return "none";
          },
          start: async function (lang) {
            return "none";
          },
        },
      },
      url: {
        openUrl: async function (lang) {
          return "none";
        },
      },
      stream: {
        saveBufferToVideo: async function (lang) {
          return "none";
        },

        saveBufferToAudio: async function (lang) {
          return "none";
        },

        saveBufferToTempFile: async function (lang) {
          return "none";
        },
      },
      extension: {
        openDir: async function (lang) {
          return "none";
        },
        openFile: async function (lang) {
          return "none";
        },
      },
      media: {
        backgroundRemove: async function (lang) {
          return "none";
        },
      },
    },
    res: {
      app: {
        forceClose: async function (lang) {
          return "none";
        },
        getAppPath: async function (lang) {
          return "none";
        },
      },
      auth: {
        loginSuccess: async function (lang) {
          return "none";
        },
      },
      filesystem: {
        getAllDirectory: async function (lang) {
          return "none";
        },
      },
      render: {
        progressing: async function (lang) {
          return "none";
        },
        finish: async function (lang) {
          return "none";
        },
        error: async function (lang) {
          return "none";
        },
        finishCombineFrame: async function (lang) {
          return "none";
        },
      },
      overlayRecord: {
        stop: async function (lang) {
          return "none";
        },
      },
      ffmpeg: {
        getMetadata: async function (lang) {
          return "none";
        },
        extractAudioFromVideoProgress: async function (lang) {
          return "none";
        },
        extractAudioFromVideoFinish: async function (lang) {
          return "none";
        },
      },
      shortcut: {
        controlS: async function (lang) {
          return "none";
        },
        controlO: async function (lang) {
          return "none";
        },
      },
      timeline: {
        get: async function (lang) {
          return "none";
        },
        add: async function (lang) {
          return "none";
        },
      },
    },
  };
}
