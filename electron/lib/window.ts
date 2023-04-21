import { BrowserWindow, Menu } from 'electron'
import { menu } from './menu.js'
import { autoUpdater } from "electron-updater"

import isDev from 'electron-is-dev'
import path from 'path'

let mainWindow;
const WINDOW_BACKGROUND_COLOR = "#252729"
const WINDOW_ICON = path.join(__dirname, '..', 'assets/icons/png/512x512.png')

const window = {
  createMainWindow: () => {
    // mainWindow = new BrowserWindow({
    //   width: 1000,
    //   height: 600,
    //   webPreferences: {
    //     nodeIntegration: false,
    //     contextIsolation: true,
    //     preload: path.join(__dirname, '..', 'preload.js')
    //   },
    //   backgroundColor: WINDOW_BACKGROUND_COLOR,
    //   icon: WINDOW_ICON
    // })
  
  
    // mainWindow.loadFile('app/index.html')
    mainWindow = window.createWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', 'preload.js')
      },
      indexFile: "app/index.html"
    })
  
    autoUpdater.checkForUpdatesAndNotify()
    Menu.setApplicationMenu(menu)
  
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
        
    return mainWindow
  },

  createWindow: ({ width, height, webPreferences, indexFile }: any) => {
    const newWindow = new BrowserWindow({
      width: width,
      height: height,
      webPreferences: webPreferences,
      backgroundColor: WINDOW_BACKGROUND_COLOR,
      icon: WINDOW_ICON
    })

    newWindow.loadFile(indexFile)
  
    return newWindow
  }
}


export { window, mainWindow }