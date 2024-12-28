import getSystemFonts from "get-system-fonts";
import path from "path";

export const fontLib = {
  getFontList: async (event) => {
    try {
      const files = await getSystemFonts();
      let lists: any = [];
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
};
