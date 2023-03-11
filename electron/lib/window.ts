import { BrowserWindow, Menu } from 'electron'
import { menu } from './menu.js'
import { autoUpdater } from "electron-updater"

import isDev from 'electron-is-dev'
import path from 'path'

let mainWindow;

const window = {
  createMainWindow: () => {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '..', 'preload.js')
      },
      backgroundColor: '#252729',
      icon: path.join(__dirname, '..', 'assets/icons/png/512x512.png')
    })
  
  
    mainWindow.loadFile('app/index.html')
  
    autoUpdater.checkForUpdatesAndNotify()
    Menu.setApplicationMenu(menu)
  
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
        
    return mainWindow
  }
}


export { window, mainWindow }