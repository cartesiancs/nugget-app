import { app } from "electron";
import isDev from "electron-is-dev";

export const ipcApp = {
  forceClose: async (evt) => {
    app.exit(0);
    app.quit();
  },

  restart: async (evt) => {
    app.relaunch();
    app.exit();
  },

  getAppInfo: async (event) => {
    let info = {
      version: app.getVersion(),
    };
    return { status: 1, data: info };
  },

  getResourcesPath: async (event) => {
    let resourcesPath = ".";
    if (!isDev) {
      resourcesPath = process.resourcesPath;
    }

    return { status: 1, path: resourcesPath };
  },

  getTempPath: async (event) => {
    const path = app.getPath("temp");

    return { status: 1, path: path };
  },
};
