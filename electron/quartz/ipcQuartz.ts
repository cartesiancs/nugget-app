// import { BrowserWindow } from "electron";
import axios from "axios";

export const ipcQuartz = {
  handleLLMResponse: async (_: any, command: string, context: any) => {
    try {
      const response = await axios.post("http://localhost:8000/api/llm", {
        command,
        context,
      });

      return response.data;
    } catch (error) {
      console.error("Error handling LLM response:", error);
      throw error;
    }
  },
};
