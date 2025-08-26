import fs from "fs";
import * as fsp from "fs/promises";
import fse from "fs-extra";
import { Router, Response, Request } from "express";
import path from "path";

export const httpFilesystem = {
  getDirectory: async function (req: Request, res: Response) {
    const dir = req.query.dir as string | undefined;

    if (!dir) {
      res.status(400).send("dir query parameter is required.");
      return;
    }

    fs.readdir(dir, async (err, files) => {
      if (err) {
        console.error(err);
        res.status(500).send("Failed to read directory");
        return;
      }

      let lists: Record<string, { isDirectory: boolean; title: string }> = {};

      const promises = files.map(async (file) => {
        const stat = await fsp.lstat(path.join(dir, file));
        lists[file] = {
          isDirectory: stat.isDirectory(),
          title: file,
        };
      });

      await Promise.all(promises);
      res.status(200).send(lists);
    });
  },
  getFile: async function (req: Request, res: Response) {
    try {
      const filepath = req.query.path as string;
      if (!filepath) {
        res.status(400).send("path query parameter is required.");
        return;
      }

      const fileSplit = filepath.split("/");
      const directoryParts = fileSplit.slice(0, -1);
      const fileDirectory = directoryParts.join("/");

      res.sendFile(
        fileSplit[fileSplit.length - 1],
        { root: fileDirectory },
        (err) => {
          if (err) {
            console.error("Error sending file:", err);
            const anyErr = err as any;
            res.status(anyErr?.status || 500).send(anyErr?.message || "Error");
          }
        },
      );
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).send("Internal server error");
    }
  },
  makeDirectory: async (event, path, options) => {
    let mkdir = await fsp.mkdir(path, options);

    let status = mkdir == null ? false : true;
    return status;
  },

  emptyDirectorySync: async (event, path) => {
    let status = true;
    fse.emptyDirSync(path);
    return status;
  },

  removeDirectory: async (event, dirPath) => {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  writeFile: async (event, filename, data, options) => {
    fs.writeFile(filename, data, options, (error) => {
      if (error) {
        return false;
      }

      return true;
    });
  },

  readFile: async (event, filename) => {
    let data = await fsp.readFile(filename);
    return data;
  },

  existFile: async (event, path) => {
    try {
      await fsp.access(path);
      return true;
    } catch (err) {
      return false;
    }
  },

  removeFile: async (event, path) => {
    try {
      await fsp.unlink(path);
      return true;
    } catch (err) {
      return false;
    }
  },
};
