// import { BrowserWindow } from "electron";
import axios from "axios";

export const ipcQuartz = {
  handleLLMResponse: async (options: any) => {

    let output_image_path = "/Users/pjr/Downloads/fole/boy.png"
    const response = await axios.get("")
    
    return {
      type: "sr",
      data: {
        outpath: output_image_path
      }
    };

    try {
      const response = await axios.get("http://192.168.46.138:3001/api/llm", {
        params: options
      });
      console.log("Response from LLM",response)
      return response.data;
    } catch (error) {
      console.error("Error handling LLM response:", error);
      throw error;
    }
  }
};
