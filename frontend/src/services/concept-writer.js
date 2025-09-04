import { getAuthHeaders } from "./api";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Concept-writer API wrapper
export const conceptWriterApi = {
  generateConcepts: async (prompt, web_info, project_id) => {
    try {
      const headers = await getAuthHeaders();
      const payload = { prompt, web_info };
      if (project_id) payload.projectId = project_id;
      
      const { data } = await axiosInstance.post(
        "/concept-writer",
        payload,
        { headers },
      );
      console.log("Concept-writer response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateConcepts:", error);
      throw error;
    }
  },
};
