import path from "path";
import isDev from "electron-is-dev";
import config from "../config.json";

const resourcesPath = isDev == true ? "." : process.resourcesPath;

const FFMPEG_BIN_PATH = path.join(`${resourcesPath}/bin/`);
const FFMPEG_FILENAME = `${config.ffmpegBin[process.platform].ffmpeg.filename}`;
const FFPROBE_FILENAME = `${
  config.ffmpegBin[process.platform].ffprobe.filename
}`;
const FFMPEG_PATH = path.join(FFMPEG_BIN_PATH, FFMPEG_FILENAME);
const FFPROBE_PATH = path.join(FFMPEG_BIN_PATH, FFPROBE_FILENAME);

const ffmpegConfig = {
  FFMPEG_BIN_PATH: FFMPEG_BIN_PATH,
  FFMPEG_FILENAME: FFMPEG_FILENAME,
  FFPROBE_FILENAME: FFPROBE_FILENAME,

  FFMPEG_PATH: FFMPEG_PATH,
  FFPROBE_PATH: FFPROBE_PATH,
};

export { ffmpegConfig };
