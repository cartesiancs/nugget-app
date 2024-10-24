// const path = require('path');
// const ffmpeg = require('fluent-ffmpeg');
// const fs = require('fs');
// const fse = require('fs-extra')

//const JSZip = require("jszip");
//const lodash = require('lodash');

// ipcRenderer.on('EXIST_FFMPEG', (evt, resourcesPath, config) => {
//     console.log("EXIST FF")
//     const ffmpegPath = `${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffmpeg.filename}`
//     const ffprobePath = `${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffprobe.filename}`

//     fs.stat(ffmpegPath, function(error, stats) {
//         if (error) {
//             return 0
//         }

//         ffmpeg.setFfmpegPath(ffmpegPath);
//     });

//     fs.stat(ffprobePath, function(error, stats) {
//         if (error) {
//             return 0
//         }
//         ffmpeg.setFfprobePath(ffprobePath);
//     });
// })

const NUGGET_WEBSITE = "https://nugget.studio";
let APP_;

window.electronAPI.res.auth.loginSuccess((evt, data) => {
  console.log("AUTHDATA", data);
  let token = data.split("/")[2];
  rendererModal.notLogin.hide();

  //NOTE: URL 변경필요
  fetch(`${NUGGET_WEBSITE}/api/auth/me`, {
    headers: {
      Accept: "application/json",
      "x-access-token": token,
    },
  })
    .then((response) => response.json())
    .then((res) => {
      console.log(res);
      if (res.status == 0) {
        return 0;
      }

      window.electronAPI.req.store.set("token", token).then((result) => {
        if (result.status == 0) {
          return 0;
        }

        console.log("login!");
      });
    });
});

window.electronAPI.res.render.progressing((evt, prog) => {
  rendererUtil.showProgressModal();
  document.querySelector("#progress").style.width = `${prog}%`;
  document.querySelector("#progress").innerHTML = `${Math.round(prog)}%`;
});

window.electronAPI.res.render.finish((evt) => {
  rendererModal.progressModal.hide();
  rendererModal.progressFinish.show();

  document.querySelector("#progress").style.width = `100%`;
  document.querySelector("#progress").innerHTML = `100%`;

  const projectFolder = document.querySelector("#projectFolder").value;

  window.electronAPI.req.filesystem.emptyDirSync(
    `${projectFolder}/renderAnimation`
  );
  window.electronAPI.req.filesystem.removeDirectory(
    `${projectFolder}/renderAnimation`
  );
});

window.electronAPI.res.render.error((evt, errormsg) => {
  rendererModal.progressModal.hide();
  rendererModal.progressError.show();

  document.querySelector("#progressErrorMsg").innerHTML = `${errormsg}`;
});

window.electronAPI.res.app.forceClose((evt) => {
  let isTimelineChange = document
    .querySelector("element-timeline")
    .isTimelineChange();
  if (isTimelineChange == true) {
    rendererModal.whenClose.show();
  } else {
    rendererUtil.forceClose();
  }
});

window.electronAPI.res.shortcut.controlS((evt) => {
  NUGGET.project.save();
});

window.electronAPI.res.shortcut.controlO((evt) => {
  NUGGET.project.load();
});

window.electronAPI.res.timeline.get((event) => {
  let timeline = _.cloneDeep(
    document.querySelector("element-timeline").timeline
  );

  event.sender.send("return:timeline:get", timeline);
});

window.electronAPI.res.timeline.add(async (event, timeline) => {
  for (const timelineId in timeline) {
    if (Object.hasOwnProperty.call(timeline, timelineId)) {
      const element = timeline[timelineId];
      const elementTimeline = document.querySelector("element-timeline");

      Object.assign(elementTimeline.timeline, timeline);
      await elementTimeline.patchElementInTimeline({
        elementId: timelineId,
        element: element,
      });
    }
  }
});

// NOTE: ipcRenderer.send('INIT') 명령어로 실행중인 앱의 경로를 확인할 수 있습니다
// window.electronAPI.res.app.getAppPath((evt, path) => {
//     console.log(path)
// })

// ipcRenderer.on('DOWNLOAD_PROGRESS_FFMPEG', (evt, prog) => {
//     rendererModal.downloadFfmpeg.show()
//     document.querySelector("#download_progress_ffmpeg").style.width = `${prog}%`
//     document.querySelector("#download_progress_ffmpeg").innerHTML = `${Math.round(prog)}%`
// })

const rendererModal = {
  progressModal: new bootstrap.Modal(
    document.getElementById("progressRender"),
    {
      keyboard: false,
    }
  ),
  progressFinish: new bootstrap.Modal(
    document.getElementById("progressFinish"),
    {
      keyboard: false,
    }
  ),
  progressError: new bootstrap.Modal(document.getElementById("progressError"), {
    keyboard: false,
  }),
  whenClose: new bootstrap.Modal(document.getElementById("whenClose"), {
    keyboard: false,
  }),
  whenTimelineChanged: new bootstrap.Modal(
    document.getElementById("whenTimelineChanged"),
    {
      keyboard: false,
    }
  ),
};

const rendererUtil = {
  hmsToSeconds(hms) {
    let splitHMS = hms.split(":");
    let seconds = +splitHMS[0] * 60 * 60 + +splitHMS[1] * 60 + +splitHMS[2];

    return seconds;
  },

  secondsToProgress(seconds) {
    const projectDuration = Number(
      document.querySelector("#projectDuration").value
    );
    return (seconds / projectDuration) * 100;
  },

  showProgressModal() {
    rendererModal.progressModal.show();
  },

  openRenderedVideoFolder() {
    const projectFolder = document.querySelector("#projectFolder").value;
    ipc.showFileInFolder(projectFolder);
  },

  forceClose() {
    //ipcRenderer.send('FORCE_CLOSE')
    window.electronAPI.req.app.forceClose();
  },
};

//getAllDirectory

const ipc = {
  requestAllDir: function (dir) {
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
  render: function () {
    const projectDuration = Number(
      document.querySelector("#projectDuration").value
    );
    const projectFolder = document.querySelector("#projectFolder").value;
    const projectRatio = elementControlComponent.previewRatio;

    if (projectFolder == "") {
      document
        .querySelector("toast-box")
        .showToast({ message: "프로젝트 폴더를 지정해주세요", delay: "4000" });

      return 0;
    }

    window.electronAPI.req.dialog.exportVideo().then((result) => {
      let videoDestination = result || `nonefile`;
      if (videoDestination == `nonefile`) {
        return 0;
      }

      let timeline = _.cloneDeep(
        document.querySelector("element-timeline").timeline
      );

      let options = {
        videoDuration: projectDuration,
        videoDestination: result || `${projectFolder}/result.mp4`,
        videoDestinationFolder: projectFolder,
        previewRatio: projectRatio,
      };

      NUGGET.renderAnimation.render(timeline, options);
      //ipcRenderer.send('RENDER', timeline, options)
    });
  },
  showFileInFolder: function (path) {
    //shell.openPath(path)
    window.electronAPI.req.filesystem.openDirectory(path);
  },

  extTest: function () {
    window.electronAPI.req.dialog.openDirectory().then((result) => {
      projectFolder.value = result || "/";
      const dir = String(projectFolder.value);

      window.electronAPI.req.extension.openDir(dir);
    });
  },

  ext: function () {
    window.electronAPI.req.dialog.openFile().then((result) => {
      window.electronAPI.req.extension.openFile(result);
    });
  },
};

const auth = {
  openLogin: () => {
    let loginLink = `${NUGGET_WEBSITE}/auth/login`;
    window.electronAPI.req.url.openUrl(loginLink);
  },
  checkLogin: () => {
    window.electronAPI.req.store.get("token").then((result) => {
      console.log(result);
      if (result.status == 0) {
        rendererModal.notLogin.show();
        return 0;
      }

      rendererModal.notLogin.hide();
    });
  },
};
