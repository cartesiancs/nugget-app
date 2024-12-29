import getSystemFonts from "get-system-fonts";
import path from "path";
import isDev from "electron-is-dev";
import fs from "fs";
import * as fsp from "fs/promises";

const resourcesPath = isDev == true ? "." : process.resourcesPath;
const LOCAL_FONT_PATH = path.join(`${resourcesPath}/assets/fonts`);

type FontList = {
  path: string;
  type: string;
  name: string;
};

export const fontLib = {
  getFontList: async (event) => {
    try {
      const files = await getSystemFonts();
      let lists: FontList[] = [];
      for (let index = 0; index < files.length; index++) {
        const fontPath = files[index];
        const fontSplitedPath = fontPath.split(path.sep);
        const fontType =
          fontSplitedPath[fontSplitedPath.length - 1].split(".")[1];
        const fontName =
          fontSplitedPath[fontSplitedPath.length - 1].split(".")[0];
        lists.push({
          path: fontPath.split(path.sep).join("/"),
          type: fontType,
          name: fontName,
        });
      }
      return { status: 1, fonts: lists };
    } catch (error) {
      return { status: 0 };
    }
  },

  getLocalFontList: async (event) => {
    try {
      const result = new Promise((resolve, reject) => {
        fs.readdir(LOCAL_FONT_PATH, async (err, files) => {
          let lists: any = [];

          const promises = files.map(async (file) => {
            const stat = await fsp.lstat(`${LOCAL_FONT_PATH}/${file}`);
            const isDirectory = stat.isDirectory();

            if (!isDirectory) {
              lists.push({
                path: `${LOCAL_FONT_PATH}/${file}`,
                type: file.split(".")[file.split(".").length - 1],
                name: file.split(".")[file.split(".").length - 2],
              });
            }
          });

          await Promise.all(promises);
          resolve({ status: 1, fonts: lists });
        });
      });

      return result;
    } catch (error) {
      return { status: 0 };
    }
  },
};
