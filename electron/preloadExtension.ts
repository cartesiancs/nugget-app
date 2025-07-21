// get add edit remove
import { contextBridge, ipcRenderer } from "electron";

const extension = {
  timeline: {
    get: () => ipcRenderer.invoke("extension:timeline:get"),
    add: (timelineElement) =>
      ipcRenderer.invoke("extension:timeline:add", timelineElement),
    // NEW: add videos by remote URL list [{id,url}]
    addByUrl: (list) => ipcRenderer.invoke("extension:timeline:addByUrl", list),
  },
};

contextBridge.exposeInMainWorld("api", {
  ext: extension,
});
