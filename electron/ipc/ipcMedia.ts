import { removeBackground } from "@imgly/background-removal-node";
import { app } from "electron";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export const ipcMedia = {
  backgroundRemove: async (event, imagePath) => {
    const tmppath = app.getPath("temp");
    const filename = uuidv4() + "." + "png";
    const filePath = path.join(tmppath, filename);

    const result = new Promise((resolve, reject) => {
      removeBackground(imagePath).then(async (blob: Blob) => {
        const arrayBuffer = (await blob.arrayBuffer()) as any;

        const makeImage = new Promise((resolve, reject) => {
          fs.writeFile(filePath, Buffer.from(arrayBuffer), async (err) => {
            if (err) {
              console.error("Failed to save video file:", err);
              resolve({
                status: false,
              });
            } else {
              console.log("Video file saved successfully:", filePath);
              resolve({
                status: true,
                path: filePath,
              });
            }
          });
        });

        resolve(makeImage);
      });
    });

    return result;
  },
};
