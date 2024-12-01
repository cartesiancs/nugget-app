import { path } from "./path";

const asset = {
  nowDirectory: "",

  loadPrevDirectory: function () {
    let splitNowDirectory = asset.nowDirectory.split("/");
    let splitPrevDirectory = splitNowDirectory.slice(
      -splitNowDirectory.length,
      -1
    );

    asset.requestAllDir(splitPrevDirectory.join("/"));
  },
  add: function (originPath) {
    const filepath = path.encode(originPath);
    fetch(`file://${filepath}`)
      .then((res) => {
        return res.blob();
      })
      .then((blob) => {
        let blobUrl = URL.createObjectURL(blob);
        let blobType = blob.type.split("/")[0]; // image, video, audio ...
        let control: any = document.querySelector("element-control");

        if (blobType == "image") {
          control.addImage(blobUrl, filepath);
        } else if (blobType == "video") {
          control.addVideo(blobUrl, filepath);
        } else if (blobType == "audio") {
          control.addAudio(blobUrl, filepath);
        }
      });
  },

  requestAllDir(dir) {
    //ipcRenderer.send('REQ_ALL_DIR', dir)
    window.electronAPI.req.filesystem.getDirectory(dir).then((result) => {
      console.log("a", result);
      let fileLists = {};
      const assetList = document.querySelector("asset-list");
      const assetBrowser = document.querySelector("asset-browser");

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
  },
};

export default asset;
