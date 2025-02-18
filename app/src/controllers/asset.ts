import { ReactiveController, ReactiveControllerHost } from "lit";
import { path } from "../functions/path";
import mime from "../functions/mime";
import { getLocationEnv } from "../functions/getLocationEnv";

export class AssetController implements ReactiveController {
  private host: ReactiveControllerHost | undefined;

  public loadPrevDirectory(nowDirectory) {
    let splitNowDirectory = nowDirectory.split("/");
    let splitPrevDirectory = splitNowDirectory.slice(
      -splitNowDirectory.length,
      -1,
    );

    this.requestAllDir(splitPrevDirectory.join("/"));
  }

  public add(originPath) {
    const nowEnv = getLocationEnv();
    const filepath =
      nowEnv == "electron"
        ? `file://${path.encode(originPath)}`
        : `/api/file?path=${path.encode(originPath)}`;

    const fileorgpath =
      nowEnv == "electron"
        ? `file://${path.encode(originPath)}`
        : `${path.encode(originPath)}`;

    fetch(`${filepath}`)
      .then((res) => {
        return res.blob();
      })
      .then((blob) => {
        let blobUrl = URL.createObjectURL(blob);
        let blobType = mime.lookup(fileorgpath).type;
        let control: any = document.querySelector("element-control");

        if (blobType == "image") {
          control.addImage(blobUrl, fileorgpath);
        } else if (blobType == "video") {
          control.addVideo(blobUrl, fileorgpath);
        } else if (blobType == "audio") {
          control.addAudio(blobUrl, fileorgpath);
        } else if (blobType == "gif") {
          control.addGif(blobUrl, fileorgpath);
        }
      });
  }

  public addVideoWithDuration(originPath, duration) {
    const filepath = path.encode(originPath);
    fetch(`file://${filepath}`)
      .then((res) => {
        return res.blob();
      })
      .then((blob) => {
        let blobUrl = URL.createObjectURL(blob);
        let blobType = mime.lookup(filepath).type;
        let control: any = document.querySelector("element-control");

        control.addVideoWithDuration(blobUrl, filepath, duration);
      });
  }

  public addAudioWithDuration(originPath, duration) {
    const filepath = path.encode(originPath);
    fetch(`file://${filepath}`)
      .then((res) => {
        return res.blob();
      })
      .then((blob) => {
        let blobUrl = URL.createObjectURL(blob);
        let blobType = mime.lookup(filepath).type;
        let control: any = document.querySelector("element-control");

        control.addAudioWithDuration(blobUrl, filepath, duration);
      });
  }

  public requestAllDir(dir) {
    window.electronAPI.req.filesystem.getDirectory(dir).then((result) => {
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
  }

  hostConnected() {
    // projectStore.subscribe((state) => {
    //   this.nowDirectory = state.nowDirectory;
    // });
  }

  hostDisconnected() {}
}
