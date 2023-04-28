
import { window } from "./window.js"

import path from 'path'
import fs from 'fs'
import * as fsp from 'fs/promises';
import fse from 'fs-extra'

const manifestFilename = "manifest.json"


type manifestType = {
    name: string
    description: string
    version: string
    index: string
    window: {
        width: number
        height: number
    }
}

class Extension {
    directory: string
    fileList: string[]
    manifest: manifestType

    constructor(directory) {
        this.directory = directory
        this.init()
    }

    async init() {
        this.fileList = await this.loadFolder()

        const isExistManifest = await this.isExistManifest()
        if (isExistManifest == false) {
            return 0
        }

        this.manifest = await this.getManifest()

        await this.loadWindow({ index: this.manifest.index })
    }

    async loadWindow({ index }) {
        window.createWindow({
            width: this.manifest.window.width,
            height: this.manifest.window.height,
            webPreferences: {
                preload: path.join(__dirname, '..', 'preloadExtension.js')

            },
            indexFile: index
        })
    }

    async loadFolder() {
        return []
    }

    async getManifest() {
        const filepath = path.join(this.directory, manifestFilename)
        const readData = await fsp.readFile(filepath, 'utf8')
        const json = JSON.parse(readData)
        const indexpath = path.join(this.directory, json.index)

        return {
            name: json.name || "name",
            description: json.description || "description",
            version: json.version || "1.0.0",
            index: indexpath,
            window: {
                width: json.window.width,
                height: json.window.height
            }
        }
    }

    async isExistManifest() {
        try {
            const manifestfilepath = path.join(this.directory, manifestFilename)
            const filestat = await fsp.stat(manifestfilepath)
            return true
        } catch (error) {
            return false
        }
    }
}

export { Extension }