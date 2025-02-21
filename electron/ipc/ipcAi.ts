import fs from "fs";
import * as fsp from "fs/promises";
import fse from "fs-extra";
import axios from "axios";
import Store from "electron-store";
const store = new Store();

export const ipcAi = {
  stt: async (evt, filepath) => {
    try {
      if (!filepath) {
        return { status: 0 };
      }

      const OPENAI_API_KEY = store.get("ai_openai_key");
      if (OPENAI_API_KEY == undefined) {
        return { status: 0 };
      }

      const fileStream = fs.createReadStream(filepath);

      const response = await axios.post(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          model: "whisper-1",
          file: fileStream,
          response_format: "verbose_json",
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log(response);

      return { status: 1, text: response.data };
    } catch (error) {
      console.error(error);
    }
  },

  setKey: async (evt, key) => {
    store.set("ai_openai_key", key);
    return { status: 1 };
  },

  getKey: async (evt, key) => {
    const value = store.get("ai_openai_key");
    if (value == undefined) {
      return { status: 0 };
    }
    return { status: 1, value: value };
  },
};
