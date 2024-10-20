import { Extension } from "../lib/extension";

export const ipcExtension = {
  openFile: async (event, file) => {
    const extendApp = new Extension({
      isDev: false,
      file: file,
      windowType: "window",
    });
  },
  openDir: async (event, dir) => {
    const extendApp = new Extension({
      isDev: true,
      directory: dir,
      windowType: "window",
    });
  },
};
