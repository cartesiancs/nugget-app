// get add edit remove
import { contextBridge, ipcRenderer } from 'electron'

const extension = {
    timeline: {
        get: () => ipcRenderer.invoke('timeline:get'),
    }

}

contextBridge.exposeInMainWorld('api', {
    ext: extension
})

