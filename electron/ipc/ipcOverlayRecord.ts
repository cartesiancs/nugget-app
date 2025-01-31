import { createOverlayWindowTray, window } from "../lib/window.js";

export const ipcOverlayRecord = {
  show: async (event) => {
    const overlayRecordWindow = window.createOverlayRecordWindow();
    createOverlayWindowTray(overlayRecordWindow);

    return { status: 1 };
  },
};
