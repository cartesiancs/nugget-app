import Store from "electron-store";
import { runServer } from "../webServer";
const store = new Store();

export const ipcSelfhosted = {
  run: async (event) => {
    runServer();

    return { status: 1 };
  },
};
