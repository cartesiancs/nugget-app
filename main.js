const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = require('electron-is-dev');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');



// if (process.platform === "darwin") {
//   if (!isDev) {
//     ffmpeg.setFfmpegPath(path.join(path.dirname(app.getAppPath()), '..', './Resources', 'bin/ffmpeg'));
//     ffmpeg.setFfprobePath(path.join(path.dirname(app.getAppPath()), '..', './Resources', 'bin/ffprobe'));
//   } else {
//     ffmpeg.setFfmpegPath(path.join(__dirname, '.', 'bin/osx/ffmpeg'));
//     ffmpeg.setFfprobePath(path.join(__dirname, '.', 'bin/osx/ffprobe'));
//   }
// } 

// else {
//   ffmpeg.setFfmpegPath(path.join(__dirname, '.', 'bin/win64/ffmpeg.exe'));
//   ffmpeg.setFfprobePath(path.join(__dirname, '.', 'bin/win64/ffprobe.exe'));
// }

if (isDev) {
	console.log('Running in development');
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  });
} else {
	console.log('Running in production');
}



function createWindow () {
  const mainWindow = new BrowserWindow({
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


  // console.log(command)

}

let dir = "/Users/hhj"



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

ipcMain.on('RENDER', (evt, elements) => {
  let elementCounts = 1

  let filter = []
  let command = ffmpeg()
  command.input('/Users/hhj/Desktop/_IMAGES/background.jpeg').loop(10)



  for (const key in elements) {
    if (Object.hasOwnProperty.call(elements, key)) {
      const element = elements[key];
      //console.log(element)
      command.input(element.localpath)

      let options = {
        width: String(element.width),
        height: String(element.height),
        x: String(element.location.x),
        y: String(element.location.y),
        startTime: element.startTime/200,
        endTime: (element.startTime/200) + (element.duration/200)
      }


      filter.push({
        "filter": "scale",
        "options": {
          "w": options.width,
          "h": options.height
        },
        "inputs": `[${elementCounts}:v]`,
        "outputs": `image${elementCounts}`
      })

      filter.push({
        "filter": "overlay",
        "options": {
          "enable": `between(t,${options.startTime},${options.endTime})`,
          "x": options.x,
          "y": options.y
        },
        "inputs": elementCounts == 1 ? `[0:v][image${elementCounts}]` : `[tmp][image${elementCounts}]`,
        "outputs": `tmp`
      })

      elementCounts += 1
    }
  }

  command.complexFilter(filter, 'tmp')
  command.outputOptions(["-map 0:a?"])
  command.on('progress', function(progress) {
    console.log('Processing: ' + progress.timemark + ' done');
  })
    
    
  command.output('/Users/hhj/Desktop/_FILES/_Video/s1.mp4')
  command.on('end', function() {
        console.log('Finished processing');
      })
      command.run();
  
})

app.whenReady().then(() => {
  createWindow()
  


  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})