const { app, BrowserWindow, ipcMain, dialog, net, Menu } = require('electron')
const { autoUpdater } = require("electron-updater");
const { renderMain, renderFilter } = require('./lib/render.js')
const { menu } = require('./lib/menu.js')


const config = require('./config.json')

const path = require('path')
const isDev = require('electron-is-dev');
const log = require('electron-log');
const fs = require('fs');
const ProgressBar = require('electron-progressbar');

let resourcesPath = ''
let mainWindow;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');
 
if (isDev) {
  resourcesPath = '.'

	log.info('Running in development');
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  });
} else {
  resourcesPath = process.resourcesPath
	log.info('Running in production');
}





function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#252729',
    icon: path.join(__dirname, 'assets/icons/png/512x512.png')
  })


  mainWindow.loadFile('app/index.html')

  autoUpdater.checkForUpdatesAndNotify()
  Menu.setApplicationMenu(menu)


  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true

  return mainWindow
}
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


const checkFfmpeg = () => {
  fs.stat(`${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffmpeg.filename}`, function(error, stats) {
    if (error) {
        console.log("ERR", `${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffmpeg.filename}`);
        downloadFfmpeg('ffmpeg')
  
        return 0
    }
    console.log("파일 크기: ", stats.size);
  });
  
  fs.stat(`${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffprobe.filename}`, function(error, stats) {
    if (error) {
        console.log("ERR", `${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffprobe.filename}`);
        downloadFfmpeg('ffprobe')
  
        return 0
    }
    console.log("파일 크기: ", stats.size);
  });
}


const downloadFfmpeg = (binType) => {
  let type = binType || 'ffmpeg' // ffmpeg, ffprobe
  let receivedBytes = 0;
  let totalBytes = 0;
  let percentage = 0

  let progressBar = new ProgressBar({
    indeterminate: false,
    text: type + ' 다운로드',
    detail: type + ' 설치중...'
  });

  const request = net.request(config.ffmpegBin[process.platform][type].url)
  request.on('response', (response) => {
    totalBytes = parseInt(response.headers['content-length' ]);
    response.pipe(fs.createWriteStream(`${resourcesPath}/bin/${config.ffmpegBin[process.platform][type].filename}`))
    
    response.on('data', (chunk) => {
      receivedBytes += chunk.length;
      percentage = Math.round((receivedBytes * 100) / totalBytes);

      if(!progressBar.isCompleted()){
        progressBar.value = percentage;
      }
      log.info("ffmpeg download...", percentage) 
    })
    response.on('end', () => {
      console.log('No more data in response.')
      fs.chmodSync(`${resourcesPath}/bin/${config.ffmpegBin[process.platform][type].filename}`, 0o755); 
    })
  })
  request.end()
  
  progressBar
    .on('completed', function() {
      log.info("ffmpeg 설치 완료.") 
      progressBar.detail = type + ' 설치 완료';
    })
    .on('aborted', function(value) {
      log.info("ffmpeg 설치 취소.") 
      console.info(`취소... ${value}`);
    })
    .on('progress', function(value) {
      progressBar.detail = `100% 중 ${value}% 완료...`;
    });
}

// ipcRenderer.send("DOWNLOAD_FFMPEG")
ipcMain.on('DOWNLOAD_FFMPEG', async (evt) => {
  // ffmpeg 다운로드

  downloadFfmpeg('ffprobe')

});

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
    evt.sender.send('RES_ALL_DIR', dir, result)
  });
})

ipcMain.on('RENDER', (evt, elements, options) => {

  renderMain.start(evt, elements, options)
      
})


app.whenReady().then(() => {
  const mainWindow = createWindow()


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  checkFfmpeg()

  mainWindow.on('close', function(e){
    e.preventDefault();
    mainWindow.webContents.send('WHEN_CLOSE_EVENT', 'message')

  });
})

ipcMain.on('FORCE_CLOSE', async (evt) => {
  log.info("Force close")
  app.exit(0)
  app.quit();
})

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (canceled) {
    return
  } else {
    return filePaths[0]
  }
})

ipcMain.handle('dialog:exportVideo', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export the File Path to save',
    buttonLabel: 'Export',
    filters: [
        {
          name: 'Export Video',
            extensions: ['mp4']
        }, ],
    properties: []
  })
  if (!canceled) {
    return filePath.toString()
  }
})

ipcMain.handle('dialog:saveProject', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save the Project Path to save',
    buttonLabel: 'Save',
    filters: [
        {
          name: 'Save Project',
            extensions: ['ngt']
        }, ],
    properties: []
  })
  if (!canceled) {
    return filePath.toString()
  }
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})