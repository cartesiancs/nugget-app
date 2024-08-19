import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  net,
  Menu,
  shell,
  crashReporter,
} from "electron";
import { mainWindow } from "./lib/window.js";

import isDev from "electron-is-dev";

import fs from "fs";
import * as fsp from "fs/promises";
import fse from "fs-extra";

import Store from "electron-store";
import { resolveFiles } from "electron-updater/out/providers/Provider.js";

const store = new Store();

const ipcDialog = {
  openDirectory: async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  },

  openFile: async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  },

  exportVideo: async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Export the File Path to save",
      buttonLabel: "Export",
      filters: [
        {
          name: "Export Video",
          extensions: ["mp4"],
        },
      ],
      properties: [],
    });
    if (!canceled) {
      return filePath.toString();
    }
  },

  saveProject: async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save the Project Path to save",
      buttonLabel: "Save",
      filters: [
        {
          name: "Save Project",
          extensions: ["ngt"],
        },
      ],
      properties: [],
    });
    if (!canceled) {
      return filePath.toString();
    }
  },
};

const ipcFilesystem = {
  getDirectory: async (event, dir) => {
    const result = new Promise((resolve, reject) => {
      fs.readdir(dir, async (err, files) => {
        let lists = {};

        const promises = files.map(async (file) => {
          const stat = await fsp.lstat(`${dir}/${file}`);
          const isDirectory = stat.isDirectory();

          lists[String(file)] = {
            isDirectory: isDirectory,
            title: file,
          };
        });

        await Promise.all(promises);
        resolve(lists);
      });
    });

    return result;
  },
  makeDirectory: async (event, path, options) => {
    let mkdir = await fsp.mkdir(path, options);

    let status = mkdir == null ? false : true;
    return status;
  },

  emptyDirectorySync: async (event, path) => {
    let status = true;
    fse.emptyDirSync(path);
    return status;
  },

  writeFile: async (event, filename, data, options) => {
    fs.writeFile(filename, data, options, (error) => {
      if (error) {
        return false;
      }

      return true;
    });
  },

  readFile: async (event, filename) => {
    let data = await fsp.readFile(filename);
    return data;
  },
};

const ipcStore = {
  set: async (event, key, value) => {
    store.set(key, value);
    return { status: 1 };
  },

  get: async (event, key) => {
    let value = store.get(key);
    if (value == undefined) {
      return { status: 0 };
    }
    return { status: 1, value: value };
  },

  delete: async (event, key) => {
    store.delete(key);
    return { status: 1 };
  },
};

const ipcApp = {
  forceClose: async (evt) => {
    app.exit(0);
    app.quit();
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
};

const ipcTimeline = {
  get: async (evt) => {
    mainWindow.webContents.send("timeline:get");

    const result = new Promise((resolve, reject) => {
      ipcMain.on("return:timeline:get", (_event, value) => {
        resolve({ timeline: value });
      });
    });

    return result;
  },

  add: async (evt, timeline) => {
    mainWindow.webContents.send("timeline:add", timeline);

    return { status: 1 };
  },
};

export { ipcDialog, ipcFilesystem, ipcStore, ipcApp, ipcTimeline };
