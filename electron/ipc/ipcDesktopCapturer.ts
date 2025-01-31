import { app } from "electron";
import isDev from "electron-is-dev";
import { desktopCapturer } from "electron/main";

export const ipcDesktopCapturer = {
  getSources: async (event) => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
    });

    return { status: 1, sources: sources };
  },
};
