import { shell } from "electron";

export const shellLib = {
  openUrl: async (evt, url) => {
    shell.openExternal(url);
  },
  openPath: async (evt, path) => {
    shell.openPath(path);
  },
};
