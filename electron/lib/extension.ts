import { window } from "./window.js";
import { app } from "electron";

import path from "path";
import * as fsp from "fs/promises";
import isDev from "electron-is-dev";
import DecompressZip from "decompress-zip";

const manifestFilename = "manifest.json";
const resourcesPath = isDev == true ? app.getPath("temp") : app.getPath("temp");

type manifestType = {
  name: string;
  description: string;
  version: string;
  index: string;
  window: {
    width: number;
    height: number;
  };
};

type classType = {
  isDev: boolean;
  directory?: string;
  file?: string;
  windowType: string; // window, webview
};

class Extension {
  isDev: boolean;
  directory: string | any;
  file?: string | undefined;
  fileList: string[] | undefined;
  manifest: manifestType | any;

  constructor({ isDev, directory, file, windowType }: classType) {
    this.isDev = isDev || false;

    if (isDev == false) {
      this.file = file;
    } else {
      this.directory = directory;
    }

    this.init();
  }

  async init() {
    this.fileList = await this.loadFolder();
    if (this.isDev == false) {
      await this.unzip();
      const filename = await this.getFilenameFromPath({ dir: this.file });
      this.directory = path.join(`${resourcesPath}/${filename}`);
    }
    console.log("this.directory", this.directory);

    const isExistManifest = await this.isExistManifest();
    if (isExistManifest == false) {
      return 0;
    }

    this.manifest = await this.getManifest();

    await this.loadWindow({ index: this.manifest.index });
  }

  async loadWindow({ index }) {
    window.createWindow({
      width: this.manifest.window.width,
      height: this.manifest.window.height,
      webPreferences: {
        preload: path.join(__dirname, "..", "preloadExtension.js"),
      },
      indexFile: index,
    });
  }

  async loadFolder() {
    return [];
  }

  async getFilenameFromPath({ dir }) {
    const filename = path.basename(dir, ".zip");
    return filename;
  }

  async unzip() {
    const filename = await this.getFilenameFromPath({ dir: this.file });
    const unzipper = new DecompressZip(this.file);

    const isDone = new Promise((resolve, reject) => {
      unzipper.on("error", function (err) {
        console.log("Caught an error");
        reject(false);
      });

      unzipper.on("extract", function (log) {
        resolve(true);
      });

      unzipper.on("progress", function (fileIndex, fileCount) {
        console.log("Extracted file " + (fileIndex + 1) + " of " + fileCount);
      });

      unzipper.extract({
        path: path.join(`${resourcesPath}/${filename}`),
        filter: function (file) {
          return file.type !== "SymbolicLink";
        },
      });
    });

    return isDone;
  }

  async loadManifestFromDir() {
    const filepath = path.join(this.directory, manifestFilename);
    const readData = await fsp.readFile(filepath, "utf8");
    const json = JSON.parse(readData);

    return json;
  }

  async getManifest() {
    const json = await this.loadManifestFromDir();
    const indexpath = path.join(this.directory, json.index);

    return {
      name: json.name || "name",
      description: json.description || "description",
      version: json.version || "1.0.0",
      index: indexpath,
      window: {
        width: json.window.width,
        height: json.window.height,
      },
    };
  }

  async isExistManifest() {
    try {
      const manifestfilepath = path.join(this.directory, manifestFilename);
      await fsp.stat(manifestfilepath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export { Extension };
