import { getAuthHeaders } from "./api";
import { axiosInstance } from "../lib/axiosInstance";

// Concept-writer API wrapper
export const conceptWriterApi = {
  generateConcepts: async (prompt, web_info) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        "/concept-writer",
        { prompt, web_info },
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
