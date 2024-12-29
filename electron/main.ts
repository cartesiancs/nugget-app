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
import { autoUpdater } from "electron-updater";
import { renderMain, renderFilter } from "./lib/render.js";
import { window } from "./lib/window.js";
import { menu } from "./lib/menu.js";
import { ffmpegConfig } from "./lib/ffmpeg.js";
import { updater } from "./lib/autoUpdater.js";
import { Extension } from "./lib/extension.js";

import config from "./config.json";

import ffmpeg from "fluent-ffmpeg";

import { v4 as uuidv4 } from "uuid";

import path from "path";
import isDev from "electron-is-dev";
import log from "electron-log";
import axios from "axios";

import fs from "fs";
import * as fsp from "fs/promises";
import fse from "fs-extra";

import ProgressBar from "electron-progressbar";
import getSystemFonts from "get-system-fonts";

import { shellLib } from "./lib/shell.js";
import { electronInit } from "./lib/init.js";
import { ffprobeUtil } from "./lib/ffprobe.js";
import { fontLib } from "./lib/font.js";
import { ipcExtension } from "./ipc/ipcExtension.js";
import { ipcStore } from "./ipc/ipcStore.js";
import { ipcApp } from "./ipc/ipcApp.js";
import { ipcTimeline } from "./ipc/ipcTimeline.js";
import { ipcDialog } from "./ipc/ipcDialog.js";
import { ipcFilesystem } from "./ipc/ipcFilesystem.js";
import { downloadFfmpeg, validateFFmpeg } from "./validate.js";

let resourcesPath = "";
export let mainWindow;

log.info("App starting...");
if (isDev) {
  resourcesPath = ".";
  log.info("Running in development");
} else {
  resourcesPath = process.resourcesPath;
  log.info("Running in production");
}

const FFMPEG_BIN_PATH = ffmpegConfig.FFMPEG_BIN_PATH;
const FFMPEG_PATH = ffmpegConfig.FFMPEG_PATH;
const FFPROBE_PATH = ffmpegConfig.FFPROBE_PATH;

autoUpdater.on("checking-for-update", updater.checkingForUpdate);
autoUpdater.on("update-available", updater.updateAvailable);
autoUpdater.on("update-not-available", updater.updateNotAvailable);
autoUpdater.on("error", updater.error);
autoUpdater.on("download-progress", updater.downloadProgress);
autoUpdater.on("update-downloaded", updater.updateDownloaded);

const createFfmpegDir = async () => {
  let mkdir = await fsp.mkdir(FFMPEG_BIN_PATH, { recursive: true });
  let status = mkdir == null ? false : true;
  return { status: status };
};

ipcMain.on("DOWNLOAD_FFMPEG", async (evt) => {
  downloadFfmpeg("ffmpeg");
});

ipcMain.on("CLIENT_READY", async (evt) => {
  evt.sender.send("EXIST_FFMPEG", resourcesPath, config);
});

ipcMain.on("GET_METADATA", async (evt, bloburl, mediapath) => {
  ffmpeg.ffprobe(mediapath, (err, metadata) => {
    console.log(mediapath, metadata, bloburl);
    mainWindow.webContents.send("GET_METADATA", bloburl, metadata);
  });
});
ipcMain.on("INIT", electronInit.init);
ipcMain.on("SELECT_DIR", ipcDialog.openDirectory);
ipcMain.on("OPEN_PATH", shellLib.openPath);
ipcMain.on("OPEN_URL", shellLib.openUrl);
ipcMain.on("RENDER", renderMain.start);

ipcMain.handle("ffmpeg:combineFrame", renderMain.combineFrame);

ipcMain.handle("extension:timeline:get", ipcTimeline.get);
ipcMain.handle("extension:timeline:add", ipcTimeline.add);

ipcMain.handle("dialog:openDirectory", ipcDialog.openDirectory);
ipcMain.handle("dialog:openFile", ipcDialog.openFile);
ipcMain.handle("dialog:exportVideo", ipcDialog.exportVideo);
ipcMain.handle("dialog:saveProject", ipcDialog.saveProject);

ipcMain.handle("filesystem:getDirectory", ipcFilesystem.getDirectory);
ipcMain.handle("filesystem:mkdir", ipcFilesystem.makeDirectory);
ipcMain.handle("filesystem:emptyDirSync", ipcFilesystem.emptyDirectorySync);
ipcMain.handle("filesystem:writeFile", ipcFilesystem.writeFile);
ipcMain.handle("filesystem:readFile", ipcFilesystem.readFile);
ipcMain.handle("filesystem:removeDirectory", ipcFilesystem.removeDirectory);

ipcMain.handle("store:set", ipcStore.set);
ipcMain.handle("store:get", ipcStore.get);
ipcMain.handle("store:delete", ipcStore.delete);

ipcMain.on("app:forceClose", ipcApp.forceClose);
ipcMain.on("app:restart", ipcApp.restart);

ipcMain.handle("app:getResourcesPath", ipcApp.getResourcesPath);
ipcMain.handle("app:getAppInfo", ipcApp.getAppInfo);
ipcMain.handle("font:getLists", fontLib.getFontList);
ipcMain.handle("font:getLocalFontLists", fontLib.getLocalFontList);

ipcMain.handle("extension:open:file", ipcExtension.openFile);
ipcMain.handle("extension:open:dir", ipcExtension.openDir);

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("nuggetapp", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("nuggetapp");
}

const gotTheLock = app.requestSingleInstanceLock();
let deeplinkingUrl;

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    if (process.platform == "win32") {
      deeplinkingUrl = commandLine.slice(1)[1];
      mainWindow.webContents.send("LOGIN_SUCCESS", deeplinkingUrl);
    }
  });

  app.whenReady().then(() => {
    mainWindow = window.createMainWindow();
    validateFFmpeg();

    mainWindow.on("close", function (e) {
      e.preventDefault();
      mainWindow.webContents.send("WHEN_CLOSE_EVENT", "message");
    });
  });

  app.on("open-url", function (event, data) {
    mainWindow.webContents.send("LOGIN_SUCCESS", data);
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
