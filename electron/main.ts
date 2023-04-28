import { app, BrowserWindow, ipcMain, dialog, net, Menu, shell, crashReporter } from 'electron'
import { autoUpdater } from "electron-updater"
import { renderMain, renderFilter } from './lib/render.js'
import { window } from "./lib/window.js";
import { menu } from './lib/menu.js'
import { ipcDialog, ipcFilesystem, ipcStore, ipcApp, ipcTimeline } from './ipc.js'
import { ffmpegConfig } from "./lib/ffmpeg.js";
import { updater } from "./lib/autoUpdater.js"
import { Extension } from "./lib/extension.js"

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

log.info('App starting...');
if (isDev) {
  resourcesPath = '.'
	log.info('Running in development');
} else {
  resourcesPath = process.resourcesPath
	log.info('Running in production');
}


const FFMPEG_BIN_PATH = ffmpegConfig.FFMPEG_BIN_PATH
const FFMPEG_PATH = ffmpegConfig.FFMPEG_PATH
const FFPROBE_PATH = ffmpegConfig.FFPROBE_PATH

autoUpdater.on('checking-for-update', updater.checkingForUpdate)
autoUpdater.on('update-available', updater.updateAvailable)
autoUpdater.on('update-not-available', updater.updateNotAvailable)
autoUpdater.on('error', updater.error)
autoUpdater.on('download-progress', updater.downloadProgress)
autoUpdater.on('update-downloaded', updater.updateDownloaded);


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

ipcMain.on('DOWNLOAD_FFMPEG', async (evt) => {
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

ipcMain.on('RENDER', (evt, elements, options) => {
  renderMain.start(evt, elements, options)
})

ipcMain.handle('extension:timeline:get', ipcTimeline.get)
ipcMain.handle('extension:timeline:add', ipcTimeline.add)


ipcMain.handle('dialog:openDirectory', ipcDialog.openDirectory)
ipcMain.handle('dialog:openFile', ipcDialog.openFile)
ipcMain.handle('dialog:exportVideo', ipcDialog.exportVideo)
ipcMain.handle('dialog:saveProject', ipcDialog.saveProject)

ipcMain.handle("filesystem:getDirectory", ipcFilesystem.getDirectory)
ipcMain.handle('filesystem:mkdir', ipcFilesystem.makeDirectory)
ipcMain.handle('filesystem:emptyDirSync', ipcFilesystem.emptyDirectorySync)
ipcMain.handle('filesystem:writeFile', ipcFilesystem.writeFile)
ipcMain.handle('filesystem:readFile', ipcFilesystem.readFile)

ipcMain.handle('store:set', ipcStore.set)
ipcMain.handle('store:get', ipcStore.get)
ipcMain.handle('store:delete', ipcStore.delete)


ipcMain.on('app:forceClose', ipcApp.forceClose)
ipcMain.handle('app:getResourcesPath', ipcApp.getResourcesPath)
ipcMain.handle('app:getAppInfo', ipcApp.getAppInfo)

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

ipcMain.handle('extension:open:file', async (event, file) => {
  const extendApp = new Extension({ isDev: false, file: file })
})

ipcMain.handle('extension:open:dir', async (event, dir) => {
  const extendApp = new Extension({ isDev: true, directory: dir })
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