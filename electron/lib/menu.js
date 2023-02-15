import { app, BrowserWindow, Menu } from 'electron'
import * as path from 'path'


const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
        // {
        //     label: 'Learn More',
        //     click: () => {
        //         NUGGET.project.save()
        //       console.log("dd")
        //     }
        // },
        { label: 'saveProject' },
        { label: 'importProject' }
      ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' }
    ]
  },
  {
    label: 'About',
    submenu: [
      {
        label: 'About Nugget',
        click: async () => {
            let mainWindow = new BrowserWindow({
              width: 600,
              height: 240,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
              },
              backgroundColor: '#252729'
            })
            
            
            mainWindow.loadFile('./app/page/about.html')
        }
      },

      {
        label: 'Setting',
        click: async () => {
            let mainWindow = new BrowserWindow({
              width: 600,
              height: 540,
              webPreferences: {
                preload: path.join(__dirname, '../preload.js')

              },
              backgroundColor: '#252729'
            })
            
            
            mainWindow.loadFile('./app/page/setting.html')
        }
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://devent.kr')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)

//exports.menu = menu

export { menu }

// Menu.setApplicationMenu(menu)