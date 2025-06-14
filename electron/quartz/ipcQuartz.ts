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
  }
};
