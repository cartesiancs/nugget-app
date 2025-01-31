import ffmpeg from "fluent-ffmpeg";
import { mainWindow } from "../main";
import { ffmpegConfig } from "./ffmpeg";

// const FFMPEG_BIN_PATH = ffmpegConfig.FFMPEG_BIN_PATH;
// const FFMPEG_PATH = ffmpegConfig.FFMPEG_PATH;
const FFPROBE_PATH = ffmpegConfig.FFPROBE_PATH;

ffmpeg.setFfprobePath(FFPROBE_PATH);

export const ffprobeUtil = {
  getMetadata: async (evt, bloburl, mediapath) => {
    ffmpeg.ffprobe(mediapath, (err, metadata) => {
      console.log(mediapath, metadata, bloburl);
      mainWindow.webContents.send("GET_METADATA", bloburl, metadata);
    });
  },
};
