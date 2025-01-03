import { BrowserWindow, Menu } from "electron";
import { menu } from "./menu.js";
import { autoUpdater } from "electron-updater";

import isDev from "electron-is-dev";
import path from "path";

let mainWindow;
const WINDOW_BACKGROUND_COLOR = "#252729";
const WINDOW_ICON = path.join(__dirname, "..", "assets/icons/png/512x512.png");

const window = {
  createMainWindow: () => {
    mainWindow = window.createWindow({
      width: 1400,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webviewTag: true,
        preload: path.join(__dirname, "..", "preload.js"),
      },
      indexFile: "app/index.html",
    });

    autoUpdater.checkForUpdatesAndNotify();
    Menu.setApplicationMenu(menu);

    if (isDev) {
      mainWindow.webContents.openDevTools();
    }

    return mainWindow;
  },

  createWindow: ({ width, height, webPreferences, indexFile }: any) => {
    const newWindow = new BrowserWindow({
      width: width,
      height: height,
      webPreferences: webPreferences,
      backgroundColor: WINDOW_BACKGROUND_COLOR,
      icon: WINDOW_ICON,
      titleBarStyle: "hidden",
      frame: false,

      trafficLightPosition: { x: 10, y: 10 },
      ...(process.platform !== "darwin" ? { titleBarOverlay: true } : {}),
    });

    newWindow.loadFile(indexFile);

    return newWindow;
  },

  createCreditWindow: () => {
    const indexFile = "app/page/credit.html";
    const newWindow = new BrowserWindow({
      width: 600,
      height: 500,
      backgroundColor: WINDOW_BACKGROUND_COLOR,
    });

    newWindow.loadFile(indexFile);

    return newWindow;
  },
};

export { window, mainWindow };
