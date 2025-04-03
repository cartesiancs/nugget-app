import {
  BrowserWindow,
  desktopCapturer,
  Menu,
  session,
  screen,
  Tray,
  nativeImage,
} from "electron";
import { menu } from "./menu.js";
import { autoUpdater } from "electron-updater";

import isDev from "electron-is-dev";
import path from "path";

const trayIcon = nativeImage.createFromPath(
  path.join("assets/icons/png/tray.png"),
);

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
      indexFile: "apps/app/index.html",
    });

    autoUpdater.checkForUpdatesAndNotify();
    Menu.setApplicationMenu(menu);

    session.defaultSession.setDisplayMediaRequestHandler((_, callback) => {
      desktopCapturer
        .getSources({ types: ["window", "screen"] })
        .then((sources) => {
          for (let i = 0; i < sources.length; ++i) {
            console.log(
              sources[i].name,
              sources[i].thumbnail.getSize(),
              sources[i].thumbnail.getAspectRatio(),
              sources[i].thumbnail.getScaleFactors(),
            );
          }

          callback({ video: sources[0], audio: "loopback" });
        });
    });

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
      ...(process.platform !== "darwin"
        ? {
            titleBarOverlay: {
              color: "#0f1012",
              symbolColor: "#ffffff",
            },
          }
        : {}),
    });

    newWindow.loadFile(indexFile);

    return newWindow;
  },

  createCreditWindow: () => {
    const indexFile = "apps/app/page/credit.html";
    const newWindow = new BrowserWindow({
      width: 600,
      height: 500,
      backgroundColor: WINDOW_BACKGROUND_COLOR,
    });

    newWindow.loadFile(indexFile);

    return newWindow;
  },

  createOverlayRecordWindow: () => {
    const indexFile = "apps/overlay-record/dist/index.html";
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize as any;

    const overlayWindow = new BrowserWindow({
      width: width,
      height: height,
      webPreferences: {
        backgroundThrottling: false,
        preload: path.join(__dirname, "..", "preload.js"),
      },
      resizable: false,
      transparent: true,
      skipTaskbar: true,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      movable: false,
      show: false,
      hasShadow: false,
    });

    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.setVisibleOnAllWorkspaces(true);
    overlayWindow.setPosition(0, 0, false);
    overlayWindow.show();
    overlayWindow.setIgnoreMouseEvents(true);

    overlayWindow.loadFile(indexFile);

    // setInterval(() => {
    //   overlayWindow.webContents.send("overlayRecord:stop:res", {
    //     msg: "Hello Renderer!",
    //   });
    // }, 1000);

    return overlayWindow;
  },

  createOffscreenRenderWindow: () => {
    const indexFile = "packages/render/dist/index.html";

    const renderWindow = new BrowserWindow({
      width: 100,
      height: 100,
      webPreferences: {
        backgroundThrottling: false,
        preload: path.join(__dirname, "..", "preload.js"),
      },
      resizable: false,
      transparent: true,
      skipTaskbar: true,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      movable: false,
      show: false,
    });

    renderWindow.loadFile(indexFile);

    return renderWindow;
  },

  createAutomaticCaptionWindow: () => {
    const overlayWindow = new BrowserWindow({
      webPreferences: {
        backgroundThrottling: false,
        preload: path.join(__dirname, "..", "preload.js"),
      },
      width: 600,
      height: 500,
      backgroundColor: WINDOW_BACKGROUND_COLOR,
    });

    overlayWindow.loadURL("http://localhost:5173/");

    // setInterval(() => {
    //   overlayWindow.webContents.send("overlayRecord:stop:res", {
    //     msg: "Hello Renderer!",
    //   });
    // }, 1000);

    return overlayWindow;
  },
};

const createOverlayWindowTray = (overlayWindow) => {
  const tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Exit",
      type: "checkbox",
      checked: false,
      click: (menuItem) => {
        overlayWindow.webContents.send("overlayRecord:stop:res", "");
        overlayWindow.close();
        tray.destroy();
        console.log("Stop Record:", menuItem.checked);
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
};

export { window, mainWindow, createOverlayWindowTray };
