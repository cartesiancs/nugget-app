// get add edit remove
import { contextBridge, ipcRenderer } from "electron";

const extension = {
  timeline: {
    get: () => ipcRenderer.invoke("extension:timeline:get"),
    add: (timelineElement) =>
      ipcRenderer.invoke("extension:timeline:add", timelineElement),
  },
};

contextBridge.exposeInMainWorld("api", {
  ext: extension,
});
