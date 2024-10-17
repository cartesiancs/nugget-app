const directory = {
  select: function () {
    const projectFolder: any = document.querySelector("#projectFolder");
    window.electronAPI.req.dialog.openDirectory().then((result) => {
      projectFolder.value = result || "/";
      const dir = String(projectFolder.value);

      window.electronAPI.req.filesystem.getDirectory(dir).then((result) => {
        let fileLists = {};
        const assetList: any = document.querySelector("asset-list");
        const assetBrowser: any = document.querySelector("asset-browser");

        assetList.nowDirectory = dir;
        assetList.clearList();
        assetBrowser.updateDirectoryInput(dir);

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
