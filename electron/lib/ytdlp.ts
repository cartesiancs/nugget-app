import path from "path";
import isDev from "electron-is-dev";
import config from "../config.json";

const resourcesPath = isDev == true ? "." : process.resourcesPath;

const BIN_PATH = path.join(`${resourcesPath}/bin/`);
const FILENAME = `yt-dlp`;

const DLP_PATH = path.join(BIN_PATH, FILENAME);

const dlpConfig = {
  YTDLP_BIN_PATH: DLP_PATH,
};

export { dlpConfig };
