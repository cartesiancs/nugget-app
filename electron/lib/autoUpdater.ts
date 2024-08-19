import { dialog } from "electron";
import log from "electron-log";

const updater = {
  checkingForUpdate: () => {
    //sendStatusToWindow('Checking for update...');
  },
  updateAvailable: (info) => {
    const dialogOpts = {
      type: "info",
      buttons: ["업데이트", "닫기"],
      defaultId: 0,
      cancelId: 1,
      title: "Update Available",
      message: "업데이트 가능",
      detail: "새 버전으로 업데이트가 가능합니다.",
    };
    dialog.showMessageBox(dialogOpts).then((result) => {
      if (result.response === 0) {
        // bound to buttons array
        console.log("Default button clicked.");
      }
    });
  },
  updateNotAvailable: (info) => {
    console.log("Update not available.");
  },
  error: (err) => {
    const dialogOpts = {
      type: "error",
      buttons: ["확인"],
      title: "Error",
      message: "업데이트에 실패했습니다",
      detail: "새 버전을 확인하는 도중에 접속 오류가 있었습니다.",
    };
    dialog.showMessageBox(dialogOpts);
    log.info("Error in auto-updater. " + err);
  },
  downloadProgress: (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + " - Downloaded " + progressObj.percent + "%";
    log_message =
      log_message +
      " (" +
      progressObj.transferred +
      "/" +
      progressObj.total +
      ")";
    log.info(log_message);
  },
  updateDownloaded: (info) => {
    const dialogOpts = {
      type: "info",
      buttons: ["확인"],
      title: "업데이트 다운로드 완료",
      message: "업데이트 다운로드를 완료했습니다",
      detail: "새 버전의 업데이트 다운로드를 완료했습니다.",
    };
    dialog.showMessageBox(dialogOpts);
  },
};

export { updater };
