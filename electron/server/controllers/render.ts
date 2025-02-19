import fs from "fs";
import * as fsp from "fs/promises";
import fse from "fs-extra";
import { Router, Response, Request } from "express";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { window } from "../../lib/window.js";
import { spawn } from "child_process";
import { mainWindow } from "../../main";
import { ipcMain } from "electron";
import { ffmpegConfig } from "../../lib/ffmpeg";
import { sendRenderDone, sendRenderProgress } from "../sockets/conn.js";

let ffmpegProcess;
let offscreenRender;

export function startFFmpegProcess(options, timeline) {
  const ffmpegPath = ffmpegConfig.FFMPEG_PATH;
  const ffprobePath = ffmpegConfig.FFPROBE_PATH;

  const filterComplexArray: string[] = [];
  const mapAudioLists: string[] = [];
  const args: string[] = [];

  args.push("-f", "image2pipe", "-vcodec", "png", "-r", "60", "-i", "pipe:0");

  let index = 0;

  for (const key in timeline) {
    if (Object.prototype.hasOwnProperty.call(timeline, key)) {
      const element = timeline[key];
      if (element.filetype == "video" || element.filetype == "audio") {
        if (
          element.filetype == "video" &&
          (element.isExistAudio || false) == false
        ) {
          continue;
        }
        let inStartTime = element.trim.startTime * (element.speed || 1);
        let inDuration = element.trim.endTime - element.trim.startTime;
        let trackDelay = element.startTime;

        if (inStartTime >= 0 && trackDelay >= 0) {
          trackDelay = element.startTime + inStartTime;
        } else if (trackDelay < 0) {
          let d = inStartTime - Math.abs(trackDelay);
          if (d >= 0) {
            trackDelay = d;
          } else {
            trackDelay = 0;
            inStartTime =
              element.trim.startTime * (element.speed || 1) + Math.abs(d);
          }
        }

        console.log(inStartTime, inDuration, trackDelay);

        args.push("-ss", `${inStartTime / 1000}`);
        args.push("-t", `${inDuration / 1000}`);
        args.push("-i", element.localpath);

        const delayMs = Math.round(trackDelay);
        const label = `audio${index}`;
        filterComplexArray.push(
          `[${index + 1}:a]adelay=${delayMs}|${delayMs}[${label}]`,
        );
        mapAudioLists.push(`[${label}]`);
        index += 1;
      }
    }
  }

  if (mapAudioLists.length == 0) {
    filterComplexArray.push(
      `anullsrc=channel_layout=stereo:sample_rate=44100:d=${options.videoDuration}[silent]`,
    );
    mapAudioLists.push(`[silent]`);
  }

  filterComplexArray.push(`[0:v]null[vout]`);

  if (mapAudioLists.length > 1) {
    const amixInput = mapAudioLists.join("");
    filterComplexArray.push(
      `${amixInput}amix=inputs=${mapAudioLists.length}[aout]`,
    );
  } else {
    filterComplexArray.push(`${mapAudioLists[0]}aresample=async=1[aout]`);
  }

  const filterComplex = filterComplexArray.join(";");
  args.push("-filter_complex", filterComplex);

  args.push("-map", "[vout]", "-map", "[aout]");

  args.push(
    "-c:a",
    "aac",
    "-c:v",
    "libx264",
    `-t`,
    `${options.videoDuration}`,
    "-b:v",
    `${options.videoBitrate}k`,
    "-pix_fmt",
    "yuv420p",
    options.videoDestination,
  );

  ffmpegProcess = spawn(ffmpegPath, args);

  ffmpegProcess.stderr.on("data", (data) => {
    console.log("[ffmpeg]", data.toString());
  });

  ffmpegProcess.on("close", (code) => {
    mainWindow.webContents.send("PROCESSING_FINISH");
  });
}

let timeline, options;

export const httpRender = {
  start: async function (req: Request, res: Response) {
    timeline = req.body.timeline;
    options = req.body.options;

    if (offscreenRender) {
      offscreenRender.webContents.send("render:offscreen:start", {
        timeline: timeline,
        options: options,
      });
    } else {
      offscreenRender = window.createOffscreenRenderWindow();
    }

    res.status(200).send({
      status: true,
    });
  },
};

export const httpFFmpegRenderV2 = {
  start: (event, options, timeline) => {
    sendRenderProgress(0);
    startFFmpegProcess(options, timeline);
  },

  readyToRender: (event) => {
    console.log("== READT TO RENDER");

    return { status: true, timeline: timeline, options: options };

    //startFFmpegProcess(options, timeline);
  },

  sendFrame: (event, arrayBuffer, per) => {
    const buffer = Buffer.from(arrayBuffer);
    sendRenderProgress(per);
    if (ffmpegProcess && ffmpegProcess.stdin.writable) {
      ffmpegProcess.stdin.write(buffer);
    }
  },
  finishStream: () => {
    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
      sendRenderDone(options.videoDestination);
    }
  },
};
