// import { BrowserWindow } from "electron";
import axios from "axios";

export const ipcQuartz = {
  handleLLMResponse: async (event: any, command: string,context:any) => {
    try {
          const response = await axios.get("http://0.0.0.0:8000/api/llm", {
            params: { command:command,context:context }
          });
          return response.data;
    } catch (error) {
      console.error("Error handling LLM response:", error);
      throw error;
    }
  }
};
