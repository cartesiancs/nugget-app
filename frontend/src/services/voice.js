import { getAuthHeaders } from "./api";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const voiceApi = {
  generateVoice: async (narration_prompt) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        "/voiceover",
        { narration_prompt },
        { headers },
      );
      console.log("Voiceover response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVoice:", error);
      throw error;
    }
  },
};
