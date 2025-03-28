import { desktopCapturer } from "electron/main";
import { spawn } from "child_process";
import { dlpConfig } from "../lib/ytdlp";
import { mainWindow } from "../main";

let dlpProcess;

export function startYtdlp(youtubeUrl, localpath, filename) {
  const dlpPath = dlpConfig.YTDLP_BIN_PATH;

  dlpProcess = spawn(dlpPath, ["-o", `${localpath}`, youtubeUrl]);

  console.log("ES");

  dlpProcess.on("close", (code) => {
    mainWindow.webContents.send("ytdlp:finish", localpath);
  });
}

export const ipcYtdlp = {
  downloadVideo: async (event, url, options) => {
    console.log("E", url);
    const savePath = options.savePath;
    startYtdlp(url, savePath, options.filename);

    return { status: 1 };
  },
};
