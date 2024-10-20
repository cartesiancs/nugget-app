import { log } from "electron-log";
import ffmpeg from "fluent-ffmpeg";
import { mainWindow } from "../main";

export const ffprobeUtil = {
  getMetadata: async (evt, bloburl, mediapath) => {
    ffmpeg.ffprobe(mediapath, (err, metadata) => {
      mainWindow.webContents.send("GET_METADATA", bloburl, metadata);
    });
  },
};
