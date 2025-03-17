import { desktopCapturer } from "electron/main";
import { spawn } from "child_process";
import { dlpConfig } from "../lib/ytdlp";

let dlpProcess;

export function startYtdlp(youtubeUrl) {
  const dlpPath = dlpConfig.YTDLP_BIN_PATH;

  dlpProcess = spawn(dlpPath, [youtubeUrl]);
}

export const ipcYtdlp = {
  downloadVideo: async (event) => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
    });

    return { status: 1, sources: sources };
  },
};
