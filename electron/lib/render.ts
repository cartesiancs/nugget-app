import ffmpeg from "fluent-ffmpeg";
import isDev from "electron-is-dev";
import log from "electron-log";
import fs from "fs";
import { ffmpegConfig } from "./ffmpeg.js";

import config from "../config.json";

import { renderMain, renderFilter } from "../render/renderMain.js";
import "../render/renderUtil.js";

export { renderMain, renderFilter };
