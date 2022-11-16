const { app, BrowserWindow, ipcMain, dialog } = require('electron')

const { renderMain, renderFilter } = require('./lib/render.js')
const path = require('path')
const isDev = require('electron-is-dev');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

let resourcesPath = ''
let mainWindow;

const forceQuit = false;
const ffmpegPath = require('ffmpeg-static').replace(
  'app.asar',
  'app.asar.unpacked'
);
ffmpeg.setFfmpegPath(ffmpegPath);

if (isDev) {
  resourcesPath = '.'

	console.log('Running in development');
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  });
} else {
  resourcesPath = process.resourcesPath

	console.log('Running in production');
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
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true

  return mainWindow

  // console.log(command)

}

let dir = app.getPath('userData')



ipcMain.on('INIT', async (evt) => {
  evt.sender.send('GET_PATH', app.getPath("userData"))
  evt.sender.send('GET_PATH', app.getAppPath())
  evt.sender.send('GET_PATH', process.resourcesPath)
})

ipcMain.on('SELECT_DIR', async (evt) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  console.log('directories selected', result.filePaths)
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

  mainWindow.on('close', function(e){
    e.preventDefault();
    mainWindow.webContents.send('WHEN_CLOSE_EVENT', 'message')

  });
})

ipcMain.on('FORCE_CLOSE', async (evt) => {
  console.log("CCCC")
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

ipcMain.handle('dialog:exportFile', async () => {
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
    console.log(filePath.toString());
    return filePath.toString()
  }
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})