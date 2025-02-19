import fs from "fs";
import * as fsp from "fs/promises";
import fse from "fs-extra";
import { Router, Response, Request } from "express";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

export const httpFFmpeg = {
  getMetadata: async function (req: Request, res: Response) {
    const filepath = req.query.path as string;
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filepath, (err, metadata) => {
        res.status(200).send({
          bloburl: filepath,
          metadata: metadata,
        });
      });
    });
  },
};
