import { app } from "electron";
import isDev from "electron-is-dev";
import { desktopCapturer } from "electron/main";
import { window } from "../lib/window.js";

export const ipcOverlayRecord = {
  show: async (event) => {
    window.createOverlayRecordWindow();

    return { status: 1 };
  },
};
