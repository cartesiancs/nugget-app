import { dialog } from "electron";
import log from "electron-log";

const updater = {
  checkingForUpdate: () => {
    //sendStatusToWindow('Checking for update...');
  },
  updateAvailable: (info) => {
    const dialogOpts: any = {
      type: "info",
      buttons: ["업데이트", "닫기"],
      defaultId: 0,
      cancelId: 1,
      title: "Update Available",
      message: "Update Available",
      detail: "Update Available",
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
    const dialogOpts: any = {
      type: "error",
      buttons: ["확인"],
      title: "Error",
      message: "Error",
      detail: "E013",
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
    const dialogOpts: any = {
      type: "info",
      buttons: ["확인"],
      title: "Success",
      message: "Success",
      detail: "Success",
    };
    dialog.showMessageBox(dialogOpts);
  },
};

export { updater };
