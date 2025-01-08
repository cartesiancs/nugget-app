import { app, dialog } from "electron";
import isDev from "electron-is-dev";
import fs from "fs";
import { mainWindow } from "../lib/window";

export const ipcStream = {
  saveBufferToVideo: async (event, arrayBuffer) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save Video",
      buttonLabel: "Export",
      filters: [
        {
          name: "Export Video",
          extensions: ["webm"],
        },
      ],
      properties: [],
    });

    if (filePath) {
      const result = new Promise((resolve, reject) => {
        fs.writeFile(filePath, arrayBuffer, async (err) => {
          if (err) {
            console.error("Failed to save video file:", err);
            resolve({
              status: false,
            });
          } else {
            console.log("Video file saved successfully:", filePath);
            resolve({
              status: true,
              path: filePath,
            });
          }
        });
      });

      console.log("Video file sresultresultresultaved successfully:", result);

      return result;
    }
  },
};
