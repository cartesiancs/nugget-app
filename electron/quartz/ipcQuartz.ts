// import { BrowserWindow } from "electron";
import axios from "axios";

export const ipcQuartz = {
  handleLLMResponse: async (_: any, command: string, context: any) => {
    try {
      const response = await axios.post("http://localhost:8000/api/llm", {
        command,
        context
      });
      return response.data;
    } catch (error) {
      console.error("Error handling LLM response:", error);
      throw error;
    }
  },
  transcribeAudio: async (_: any, audioData: any) => {
    try {

      console.log("HI HI HI HI ");
      // console.log(audioData);
      console.log("HI HI HI HIHI ")

      const response = await axios.post("http://192.168.46.138:8000/api/transcribe", {
        audioData
      });
      console.log(response);
      return response.data.data;
    } catch (error) {
      console.error("Error transcribing audio:");
      // throw error;
    }
  },
  directToolRemoveBg: async (_: any, imagePath: any) => {
    console.log("Removing background from image:", imagePath);
    try {
      const response = await axios.post("http://localhost:8000/api/image/remove-bg", {
        image_path: imagePath
      });
      console.log("Response from remove background API:", response.data);
      return response.data;
    }
    catch (error) {
      console.error("Error removing background from image:", error);
      throw error;
    }
  },
  directToolPotraitBlur: async (_: any, imagePath: any) => {
    console.log("Blurring portrait in image:", imagePath);
    try {
      const response = await axios.post("http://localhost:8000/api/image/portrait-effect", {
        image_path: imagePath
      });
      console.log("Response from portrait blur API:", response.data);
      return response.data;
    }
    catch (error) {
      console.error("Error blurring portrait in image:", error);
      throw error;
    }
  }
};
