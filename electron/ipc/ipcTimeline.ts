import { ipcMain } from "electron";
import { mainWindow } from "../lib/window";
import ffmpeg from "fluent-ffmpeg";
import { ffmpegConfig } from "../lib/ffmpeg";
import https from "https";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import path from "path";
import { pipeline } from "stream/promises";

ffmpeg.setFfprobePath(ffmpegConfig.FFPROBE_PATH);

export const ipcTimeline = {
  get: async (evt) => {
    mainWindow.webContents.send("timeline:get");

    const result = new Promise((resolve, reject) => {
      ipcMain.on("return:timeline:get", (_event, value) => {
        resolve({ timeline: value });
      });
    });

    return result;
  },

  add: async (evt, timeline) => {
    mainWindow.webContents.send("timeline:add", timeline);

    return { status: 1 };
  },
};

// -------------------- NEW handler addByUrl --------------------

ipcMain.handle("extension:timeline:addByUrl", async (_evt, list: {id:number,url:string}[]) => {
  const timeline:any = {};
  let cursor = 0;

  for (const item of list.sort((a,b)=>a.id-b.id)) {
    const { id, url } = item;
    if (!url) continue;

    // download to temp
    const tempPath = path.join(tmpdir(), `seg-${id}-${Date.now()}.mp4`);
    try {
      const response = await new Promise<any>((res, rej) => {
        https.get(url, (resp) => {
          if (resp.statusCode && resp.statusCode >= 400) {
            rej(new Error(`HTTP ${resp.statusCode}`));
          } else {
            res(resp);
          }
        }).on("error", rej);
      });
      await pipeline(response, createWriteStream(tempPath));
    } catch (e) {
      console.error("Download failed", e);
      continue;
    }

    // probe duration
    let duration = 5;
    try {
      const metadata: any = await new Promise((res, rej) => {
        ffmpeg.ffprobe(tempPath, (err, data) => {
          if (err) rej(err);
          else res(data);
        });
      });
      const dur = parseFloat(metadata?.format?.duration);
      if (!Number.isNaN(dur) && dur > 0) duration = dur;
    } catch (e) {
      console.warn("ffprobe failed", e);
    }

    const key = `seg-${id}`;
    timeline[key] = {
      filetype: "video",
      key,
      localpath: tempPath,
      blob: tempPath,
      priority: 0,
      startTime: cursor,
      duration,
      location: { x: 0, y: 0 },
      timelineOptions: { color: "#888" },
      width: 1920,
      height: 1080,
      ratio: 16/9,
      opacity: 1,
      rotation: 0,
      animation: {
        opacity: { isActivate:false, x:[], ax:[] },
        position: { isActivate:false, x:[], y:[], ax:[], ay:[] },
        scale: { isActivate:false, x:[], ax:[] },
        rotation: { isActivate:false, x:[], ax:[] }
      },
      trim: { startTime: 0, endTime: duration },
      isExistAudio: true,
      codec: { video: "", audio: "" },
      speed: 1,
      filter: { enable:false, list:[] },
      origin: { width:1920, height:1080 }
    };

    cursor += duration;
  }

  mainWindow.webContents.send("timeline:add", timeline);
  return { status: 1 };
});
