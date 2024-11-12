import { dialog } from "electron";
import { mainWindow } from "../lib/window";

export const ipcDialog = {
  openDirectory: async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  },

  openFile: async (event, allowExtensions: string[] = ["*"]) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        {
          name: "File",
          extensions: allowExtensions,
        },
      ],
    });
    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  },

  exportVideo: async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Export the File Path to save",
      buttonLabel: "Export",
      filters: [
        {
          name: "Export Video",
          extensions: ["mp4"],
        },
      ],
      properties: [],
    });
    if (!canceled) {
      return filePath.toString();
    }
  },

  saveProject: async () => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: "Save the Project Path to save",
      buttonLabel: "Save",
      filters: [
        {
          name: "Save Project",
          extensions: ["ngt"],
        },
      ],
      properties: [],
    });
    if (!canceled) {
      return filePath.toString();
    }
  },
};
