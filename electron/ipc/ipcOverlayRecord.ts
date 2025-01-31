import { app } from "electron";
import isDev from "electron-is-dev";
import { desktopCapturer } from "electron/main";
import { createOverlayWindowTray, window } from "../lib/window.js";

export const ipcOverlayRecord = {
  show: async (event) => {
    const overlayRecordWindow = window.createOverlayRecordWindow();
    createOverlayWindowTray(overlayRecordWindow);

    return { status: 1 };
  },
};
