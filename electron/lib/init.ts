import { app } from "electron";

export const electronInit = {
  init: async (evt) => {
    evt.sender.send("GET_PATH", app.getPath("userData"));
    evt.sender.send("GET_PATH", app.getAppPath());
    evt.sender.send("GET_PATH", process.resourcesPath);
  },
};
