import { path } from "./path";

const asset = {
  nowDirectory: "",

  loadPrevDirectory: function () {
    let splitNowDirectory = asset.nowDirectory.split("/");
    let splitPrevDirectory = splitNowDirectory.slice(
      -splitNowDirectory.length,
      -1
    );

    ipc.requestAllDir(splitPrevDirectory.join("/"));
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
};

export default asset;
