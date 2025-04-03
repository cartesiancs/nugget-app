import { IProjectStore, projectStore } from "../states/projectStore";
import { getLocationEnv } from "./getLocationEnv";

const directory = {
  select: function () {
    if (getLocationEnv() == "demo") {
      document.querySelector("toast-box").showToast({
        message: "The folder cannot be viewed in the demo version.",
        delay: "3000",
      });

      return false;
    }

    const projectFolder: any = document.querySelector("#projectFolder");
    window.electronAPI.req.dialog.openDirectory().then((result) => {
      let dir = "/";
      if (getLocationEnv() == "web") {
        const getDirectory = localStorage.getItem("targetDirectory");
        if (getDirectory != null) {
          dir = getDirectory;
        }
      } else {
        projectFolder.value = result || "/";
        dir = String(projectFolder.value);
      }

      window.electronAPI.req.filesystem.getDirectory(dir).then((result) => {
        let fileLists = {};
        const assetList: any = document.querySelector("asset-list");
        const assetBrowser: any = document.querySelector("asset-browser");

        assetList.nowDirectory = dir;
        assetList.clearList();
        assetBrowser.updateDirectoryInput(dir);

        const projectState: IProjectStore = projectStore.getInitialState();
        projectState.updateDirectory(dir);

        for (const key in result) {
          if (Object.hasOwnProperty.call(result, key)) {
            const element = result[key];
            if (!element.isDirectory) {
              fileLists[key] = element;
            } else {
              assetList.getFolder(element.title);
            }
          }
        }

        for (const file in fileLists) {
          if (Object.hasOwnProperty.call(fileLists, file)) {
            const element = fileLists[file];
            assetList.getFile(element.title);
          }
        }
      });
    });
  },
};

export default directory;
