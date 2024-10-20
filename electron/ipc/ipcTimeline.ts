import { ipcMain } from "electron";
import { mainWindow } from "../lib/window";

export const ipcTimeline = {
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
