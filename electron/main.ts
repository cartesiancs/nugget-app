import { app, BrowserWindow, ipcMain, dialog, net, Menu, shell, crashReporter } from 'electron'
import { autoUpdater } from "electron-updater"
import { renderMain, renderFilter } from './lib/render.js'
import { window } from "./lib/window.js";
import { menu } from './lib/menu.js'
import { ipcDialog, ipcFilesystem, ipcStore } from './ipc.js'
import { ffmpegConfig } from "./lib/ffmpeg.js";


import config from './config.json'

import ffmpeg from 'fluent-ffmpeg'

import { v4 as uuidv4 } from 'uuid';


import path from 'path'
import isDev from 'electron-is-dev'
import log from 'electron-log'
import axios from 'axios';

import fs from 'fs'
import * as fsp from 'fs/promises';
import fse from 'fs-extra'

import ProgressBar from 'electron-progressbar'
import getSystemFonts from 'get-system-fonts';




let resourcesPath = ''
let mainWindow;

crashReporter.start({
  productName: 'Nugget',
  companyName: 'devent',
  submitURL: 'https://submit.backtrace.io/devent/032e9aaf57133454505f37c1ae912daf5fbd8c57e7a100db33314a8cce71b394/minidump',
  uploadToServer: true,
});

autoUpdater.logger = log;
//autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');
 
if (isDev) {
  resourcesPath = '.'

	log.info('Running in development');
  // require('electron-reload')(__dirname, {
  //   electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  // });
} else {
  resourcesPath = process.resourcesPath
	log.info('Running in production');
}


const FFMPEG_BIN_PATH = ffmpegConfig.FFMPEG_BIN_PATH

const FFMPEG_PATH = ffmpegConfig.FFMPEG_PATH
const FFPROBE_PATH = ffmpegConfig.FFPROBE_PATH





autoUpdater.on('checking-for-update', () => {
  //sendStatusToWindow('Checking for update...');
})

autoUpdater.on('update-available', (info) => {
  const dialogOpts = {
    type: 'info',
    buttons: ["업데이트", "닫기"],
    defaultId: 0,
    cancelId: 1,
    title: 'Update Available',
    message: '업데이트 가능',
    detail: '새 버전으로 업데이트가 가능합니다.'
 };
  dialog.showMessageBox(dialogOpts).then(result => {
    if (result.response === 0) {
        // bound to buttons array
        console.log("Default button clicked.");
      }
  });
})

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
})

autoUpdater.on('error', (err) => {
  const dialogOpts = {
    type: 'error',
    buttons: ['확인'],
    title: 'Error',
    message: '업데이트에 실패했습니다',
    detail: '새 버전을 확인하는 도중에 접속 오류가 있었습니다.'
 };
 dialog.showMessageBox(dialogOpts);
 log.info('Error in auto-updater. ' + err);
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);
})

autoUpdater.on('update-downloaded', (info) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['확인'],
    title: '업데이트 다운로드 완료',
    message: '업데이트 다운로드를 완료했습니다',
    detail: '새 버전의 업데이트 다운로드를 완료했습니다.'
 };
 dialog.showMessageBox(dialogOpts);
  //sendStatusToWindow('Update downloaded');
});

let dir = app.getPath('userData')


const createFfmpegDir = async () => {
  let mkdir = await fsp.mkdir(FFMPEG_BIN_PATH, { recursive: true })
  let status = mkdir == null ? false : true
  return { status: status }
}

const checkFfmpeg = async () => {
  let isCreate = await createFfmpegDir()

  fs.stat(FFMPEG_PATH, function(error, stats) {
    if (error) {
      downloadFfmpeg('ffmpeg')
      return 0
    }

    fs.chmodSync(FFMPEG_PATH, 0o755); 
    ffmpeg.setFfmpegPath(FFMPEG_PATH);

    log.info("FFMPEG downloaded successfully")
    log.info("FFMPEG binary size: " + stats.size)

    checkffprobe()
  });
}

const checkffprobe = async () => {
  fs.stat(FFPROBE_PATH, function(error, stats) {
    if (error) {
      downloadFfmpeg('ffprobe')
      return 0
    }

    fs.chmodSync(FFPROBE_PATH, 0o755); 
    ffmpeg.setFfprobePath(FFPROBE_PATH);

    log.info("FFPROBE downloaded successfully.")
    log.info("FFPROBE binary size: " + stats.size)
  });
}


const downloadFfmpeg = (binType) => {
  let type = binType || 'ffmpeg' // ffmpeg, ffprobe
  let receivedBytes = 0;
  let totalBytes = 0;
  let percentage = 0
  let downloadPath = type == "ffmpeg" ? FFMPEG_PATH : FFPROBE_PATH

  let progressBar = new ProgressBar({
    indeterminate: false,
    text: type + ' 다운로드',
    detail: type + ' 설치중...'
  });

  const request = net.request(config.ffmpegBin[process.platform][type].url)
  request.on('response', (response: any) => {
    totalBytes = parseInt(response.headers['content-length']);
    response.pipe(fs.createWriteStream(downloadPath))
    
    response.on('data', (chunk) => {
      receivedBytes += chunk.length;
      percentage = Math.round((receivedBytes * 100) / totalBytes);

      if(!progressBar.isCompleted()){
        progressBar.value = percentage;
      }
      log.info("ffmpeg download...", percentage) 
    })
    response.on('end', () => {
      log.info(binType + " No more data in response.")
      fs.chmodSync(downloadPath, 0o755); 

      if (type == 'ffmpeg') {
        ffmpeg.setFfmpegPath(downloadPath);
      } else if (type == 'ffprobe') {
        ffmpeg.setFfprobePath(downloadPath);
      }

    })
  })
  request.end()
  
  progressBar
    .on('completed', function() {

      if (binType == 'ffmpeg') {
        checkffprobe()
      }

      progressBar.detail = type + ' 설치 완료';
    })
    .on('aborted', function(value) {
      log.info("Cancel ffmpeg installation.") 
    })
    .on('progress', function(value) {
      progressBar.detail = `100% 중 ${value}% 완료...`;
    });
}



// ipcRenderer.send("DOWNLOAD_FFMPEG")
ipcMain.on('DOWNLOAD_FFMPEG', async (evt) => {
  // ffmpeg 다운로드

  downloadFfmpeg('ffmpeg')


});




ipcMain.on('GET_METADATA', async (evt, bloburl, mediapath) => {
  log.info("Request media metadata.", mediapath)
  ffmpeg.ffprobe(mediapath, (err, metadata) => {
    mainWindow.webContents.send('GET_METADATA', bloburl, metadata)
  })
})

ipcMain.handle('ffmpeg:combineFrame', async (event, outputDir, elementId) => {
  let isFinish = false
  let command = ffmpeg()
  let outputVideoPath = `${outputDir}/${elementId}.webm`

  command.input(`${outputDir}/frame-${elementId}-%04d.png`)
  command.inputFPS(50);
  command.videoCodec('libvpx-vp9')
  command.inputOptions('-pix_fmt yuva420p');
  command.format('webm')
  command.output(outputVideoPath)
  command.on('end', function() {
      log.info('combineFrame Finish processing');
      mainWindow.webContents.send('FINISH_COMBINE_FRAME', elementId)
      isFinish = true
      return isFinish
  })

  command.on('error', function(err, stdout, stderr) {
    log.info('combineFrame Render Error', err.message);
    return isFinish

  });

  command.run();
})


ipcMain.on('CLIENT_READY', async (evt) => {
  evt.sender.send('EXIST_FFMPEG', resourcesPath, config)
})

ipcMain.on('INIT', async (evt) => {
  evt.sender.send('GET_PATH', app.getPath("userData"))
  evt.sender.send('GET_PATH', app.getAppPath())
  evt.sender.send('GET_PATH', process.resourcesPath)
})

ipcMain.on('SELECT_DIR', async (evt) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
})

ipcMain.on('OPEN_PATH', async (evt, path) => {
  shell.openPath(path)
})

ipcMain.on('OPEN_URL', async (evt, url) => {
  shell.openExternal(url)
})




ipcMain.on('REQ_ALL_DIR', (evt, dir) => {
  let result = {}

  fs.readdir(dir, (err, files) => {
    files.forEach(file => {
      let isDirectory = fs.lstatSync(`${dir}/${file}`).isDirectory() 
      result[String(file)] = {
        isDirectory: isDirectory,
        title: file
      }
    });

    mainWindow.webContents.send('RES_ALL_DIR', dir, result)
  });
})


ipcMain.on('PROGRESSBARTEST', (evt, dir) => {
  let percentage = 0
  let progressBar = new ProgressBar({
    indeterminate: false,
    text: '프로그래스바 테스트',
    detail: '테스트 중...'
  });
  
  setInterval(() => {

    if(!progressBar.isCompleted()){
      percentage += 0.45
      progressBar.value = percentage;
    }
  }, 100)

  progressBar
  .on('completed', function() {
    log.info("Completed the progress bar test.") 
    progressBar.detail =  ' 설치 완료';
  })
  .on('aborted', function(value) {
    log.info("Cancelled the progress bar test.") 
  })
  .on('progress', function(value) {
    progressBar.detail = `100% 중 ${value}% 완료...`;
  });
})



ipcMain.on('RENDER', (evt, elements, options) => {
  renderMain.start(evt, elements, options)
})


ipcMain.on('FORCE_CLOSE', async (evt) => {
  log.info("Forced shutdown of the app.")
  app.exit(0)
  app.quit();
})

ipcMain.handle('dialog:openDirectory', ipcDialog.openDirectory)
ipcMain.handle('dialog:exportVideo', ipcDialog.exportVideo)
ipcMain.handle('dialog:saveProject', ipcDialog.saveProject)

ipcMain.handle('filesystem:mkdir', ipcFilesystem.makeDirectory)
ipcMain.handle('filesystem:emptyDirSync', ipcFilesystem.emptyDirectorySync)
ipcMain.handle('filesystem:writeFile', ipcFilesystem.writeFile)
ipcMain.handle('filesystem:readFile', ipcFilesystem.readFile)

ipcMain.handle('store:set', ipcStore.set)
ipcMain.handle('store:get', ipcStore.get)
ipcMain.handle('store:delete', ipcStore.delete)


ipcMain.handle('app:getResourcesPath', async (event) => {
  return { status: 1, path: resourcesPath }
})

ipcMain.handle('app:getAppInfo', async (event) => {
  let info = {
    version: app.getVersion()
  }
  return { status: 1, data: info }
})

ipcMain.handle('font:getLists', async (event) => {
  try {
    const files = await getSystemFonts();
    let lists = []
    for (let index = 0; index < files.length; index++) {
      const fontPath = files[index]
      const fontSplitedPath = fontPath.split(path.sep)
      const fontType = fontSplitedPath[fontSplitedPath.length - 1].split(".")[1]
      const fontName = fontSplitedPath[fontSplitedPath.length - 1].split(".")[0]
      lists.push({
        path: fontPath.split(path.sep).join("/"),
        type: fontType,
        name: fontName
      })
    }
    return { status: 1, fonts: lists }
  } catch (error) {
    return { status: 0 }
  }

})



if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('nuggetapp', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('nuggetapp')
}

const gotTheLock = app.requestSingleInstanceLock()
let deeplinkingUrl

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    if (process.platform == 'win32') {
      deeplinkingUrl = commandLine.slice(1)[1]
      mainWindow.webContents.send("LOGIN_SUCCESS", deeplinkingUrl)
    }
  })

  app.whenReady().then(() => {
    mainWindow = window.createMainWindow()
  
    checkFfmpeg()
  
    mainWindow.on('close', function(e){
      e.preventDefault();
      mainWindow.webContents.send('WHEN_CLOSE_EVENT', 'message')
  
    });
  })

  app.on("open-url", function (event, data) {
    mainWindow.webContents.send("LOGIN_SUCCESS", data)
  })

}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})