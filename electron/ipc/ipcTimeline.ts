import { ipcMain } from "electron";
import { mainWindow } from "../lib/window";
import ffmpeg from "fluent-ffmpeg";
import { ffmpegConfig } from "../lib/ffmpeg";
import https from "https";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import path from "path";
import { pipeline } from "stream/promises";
import fs from "fs";

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
  console.log('🎬 Timeline received videos:', list);
  
  const timeline:any = {};
  let cursor = 0;

  // Sort the list by ID to ensure correct sequence in timeline
  const sortedList = [...list].sort((a, b) => {
    const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0;
    const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0;
    return idA - idB;
  });
  
  console.log('🎬 Timeline sorted videos:', sortedList);

  for (let idx = 0; idx < sortedList.length; idx++) {
    const item = sortedList[idx] as any;
    const url = item.url;
    const id = item.id || (idx + 1); // Use actual video ID if available, fallback to sequential

    if (!url) continue;

    console.log(`[ipcTimeline] Start download ${id}: ${url}`);
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

    // Ensure pixel format compatibility (yuv420p)
    const compatiblePath = path.join(path.dirname(tempPath), `compat-${id}-${Date.now()}.mp4`);
    try {
      await new Promise((res, rej) => {
        ffmpeg(tempPath)
          .outputOptions(["-pix_fmt yuv420p", "-c:v libx264", "-preset ultrafast", "-an"])
          .save(compatiblePath)
          .on('end', res)
          .on('error', rej);
      });
      fs.unlinkSync(tempPath);
    } catch(e){
      console.warn("ffmpeg convert failed, using original", e);
    }

    const finalPath = fs.existsSync(compatiblePath) ? compatiblePath : tempPath;

    // probe duration
    let durationSeconds = 5;
    try {
      const metadata: any = await new Promise((res, rej) => {
        ffmpeg.ffprobe(finalPath, (err, data) => {
          if (err) rej(err);
          else res(data);
        });
      });
      const dur = parseFloat(metadata?.format?.duration);
      if (!Number.isNaN(dur) && dur > 0) durationSeconds = dur;
    } catch (e) {
      console.warn("ffprobe failed", e);
    }

    const duration = Math.round(durationSeconds * 1000); // convert to ms for timeline

    const key = `seg-${id}`;
    const elementObj = {
      filetype: "video",
      key,
      localpath: finalPath,
      blob: "",
      priority: 0,
      track: 0,
      startTime: cursor,
      duration,
      location: { x: 0, y: 0 },
      timelineOptions: { color: "rgb(71, 59, 179)" },
      width: 1920,
      height: 1080,
      ratio: 16/9,
      opacity: 100,
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

    // Send each element immediately so timeline updates progressively
    mainWindow.webContents.send("timeline:add", { [key]: elementObj });
    console.log("[ipcTimeline] SENT timeline:add", key, "start=", elementObj.startTime, "dur(ms)=", elementObj.duration);

    timeline[key] = elementObj;
  }

  mainWindow.webContents.send("timeline:add", timeline);
  console.log("[ipcTimeline] SENT timeline:add batch", Object.keys(timeline));
  return { status: 1 };
});

// NEW: ask user for destination directory, download videos there, then add to timeline
ipcMain.handle("extension:timeline:addByUrlWithDir", async (_evt, list: {id:number,url:string}[]) => {
  console.log('🎬 Timeline (with dir) received videos:', list);
  
  // Open directory chooser
  const { dialog } = require("electron");
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (canceled || filePaths.length === 0) {
    return { status: 0, reason: "User canceled directory selection" };
  }

  const destDir = filePaths[0];

  const timeline: any = {};
  let cursor = 0;

  // Sort the list by ID to ensure correct sequence in timeline
  const sortedList = [...list].sort((a, b) => {
    const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0;
    const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0;
    return idA - idB;
  });
  
  console.log('🎬 Timeline (with dir) sorted videos:', sortedList);

  for (let idx = 0; idx < sortedList.length; idx++) {
    const item = sortedList[idx] as any;
    const url = (item as any).url;
    const id = item.id || (idx + 1); // Use actual video ID if available, fallback to sequential

    if (!url) continue;

    const filename = `seg-${id}-${Date.now()}.mp4`;
    const destPath = path.join(destDir, filename);

    // download
    try {
      const response: any = await new Promise((res, rej) => {
        https.get(url, (resp) => {
          if (resp.statusCode && resp.statusCode >= 400) {
            rej(new Error(`HTTP ${resp.statusCode}`));
          } else {
            res(resp);
          }
        }).on("error", rej);
      });
      await pipeline(response, createWriteStream(destPath));
      console.log(`[ipcTimeline] Download complete ${id}`);
    } catch (e) {
      console.error("Download failed", e);
      continue;
    }

    // Ensure pixel format compatibility (yuv420p)
    const compatiblePath = path.join(path.dirname(destPath), `compat-${id}-${Date.now()}.mp4`);
    try {
      await new Promise((res, rej) => {
        ffmpeg(destPath)
          .outputOptions(["-pix_fmt yuv420p", "-c:v libx264", "-preset ultrafast", "-an"])
          .save(compatiblePath)
          .on('end', res)
          .on('error', rej);
      });
      fs.unlinkSync(destPath);
    } catch(e){
      console.warn("ffmpeg convert failed, using original", e);
    }

    const finalPath = fs.existsSync(compatiblePath) ? compatiblePath : destPath;

    // probe duration
    let durationSeconds = 5;
    try {
      const metadata: any = await new Promise((res, rej) => {
        ffmpeg.ffprobe(finalPath, (err, data) => {
          if (err) rej(err);
          else res(data);
        });
      });
      const dur = parseFloat(metadata?.format?.duration);
      if (!Number.isNaN(dur) && dur > 0) durationSeconds = dur;
    } catch (e) {
      console.warn("ffprobe failed", e);
    }
    console.log(`[ipcTimeline] Probe duration ${id}: ${durationSeconds}s`);

    const duration = Math.round(durationSeconds * 1000); // convert to ms for timeline

    const key = `seg-${id}`;
    const elementObj = {
      filetype: "video",
      key,
      localpath: finalPath,
      blob: finalPath,
      priority: 0,
      track: 0,
      startTime: cursor,
      duration,
      location: { x: 0, y: 0 },
      timelineOptions: { color: "rgb(71, 59, 179)" },
      width: 1920,
      height: 1080,
      ratio: 16 / 9,
      opacity: 100,
      rotation: 0,
      animation: {
        opacity: { isActivate: false, x: [], ax: [] },
        position: { isActivate: false, x: [], y: [], ax: [], ay: [] },
        scale: { isActivate: false, x: [], ax: [] },
        rotation: { isActivate: false, x: [], ax: [] },
      },
      trim: { startTime: 0, endTime: duration },
      isExistAudio: true,
      codec: { video: "", audio: "" },
      speed: 1,
      filter: { enable: false, list: [] },
      origin: { width: 1920, height: 1080 },
    };
    cursor += duration;

    // Send each element immediately so timeline updates progressively
    mainWindow.webContents.send("timeline:add", { [key]: elementObj });
    console.log("[ipcTimeline] SENT timeline:add", key, "start=", elementObj.startTime, "dur(ms)=", elementObj.duration);

    timeline[key] = elementObj;
  }

  mainWindow.webContents.send("timeline:add", timeline);
  console.log("[ipcTimeline] SENT timeline:add batch", Object.keys(timeline));
  return { status: 1 };
});

// Utility to probe duration in milliseconds (ffprobe usually returns seconds but some builds may return ms)
async function probeDurationMs(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      ffmpeg.ffprobe(filePath, (err: any, data: any) => {
        if (err) {
          console.warn("[ipcTimeline] ffprobe err", err);
          return resolve(5000); // fallback 5 000 ms
        }
        const raw = parseFloat(data?.format?.duration);
        if (!Number.isNaN(raw) && raw > 0) {
          // Heuristic: if value > 1000 treat as ms already
          const ms = raw > 1000 ? raw : raw * 1000;
          return resolve(ms);
        }
        resolve(5000);
      });
    } catch (e) {
      console.warn("[ipcTimeline] ffprobe throw", e);
      resolve(5000);
    }
  });
}

// NEW: user passes a directory path that already contains downloaded videos.
// We scan *.mp4|*.webm|*.mov files, sort by filename, then add sequentially.
ipcMain.handle("extension:timeline:addFromDir", async (_evt, dirPath: string) => {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return { status: 0, reason: "Directory does not exist" };
  }

  const supported = [".mp4", ".webm", ".mov", ".m4v"];
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => supported.includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    return { status: 0, reason: "No video files in directory" };
  }

  const timeline: any = {};
  let cursor = 0;

  for (let idx = 0; idx < files.length; idx++) {
    const fname = files[idx];
    const full = path.join(dirPath, fname);

    const duration = Math.round(await probeDurationMs(full));

    const key = `seg-${idx + 1}`;
    const elementObj = {
      filetype: "video",
      key,
      localpath: full,
      blob: "",
      priority: 0,
      track: 0,
      startTime: cursor,
      duration,
      location: { x: 0, y: 0 },
      timelineOptions: { color: "rgb(71, 59, 179)" },
      width: 1920,
      height: 1080,
      ratio: 16 / 9,
      opacity: 100,
      rotation: 0,
      animation: {
        opacity: { isActivate: false, x: [], ax: [] },
        position: { isActivate: false, x: [], y: [], ax: [], ay: [] },
        scale: { isActivate: false, x: [], ax: [] },
        rotation: { isActivate: false, x: [], ax: [] },
      },
      trim: { startTime: 0, endTime: duration },
      isExistAudio: true,
      codec: { video: "", audio: "" },
      speed: 1,
      filter: { enable: false, list: [] },
      origin: { width: 1920, height: 1080 },
    };

    cursor += duration;

    mainWindow.webContents.send("timeline:add", { [key]: elementObj });
    timeline[key] = elementObj;
    console.log("[ipcTimeline] addFromDir sent", key);
  }

  mainWindow.webContents.send("timeline:add", timeline);
  return { status: 1 };
});
