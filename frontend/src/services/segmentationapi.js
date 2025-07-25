import { getAuthHeaders } from "./api";
import { axiosInstance } from "../lib/axiosInstance";

export const segmentationApi = {
  getSegmentation: async ({ prompt, concept = "", negative_prompt = "", project_id }) => {
    try {
      const headers = await getAuthHeaders();
      const payload = { prompt, concept, negative_prompt };
      if (project_id) payload.projectId = project_id;
      
      const { data } = await axiosInstance.post(
        "/segmentation",
        payload,
        { headers },
      );
      console.log("Segmentation response:", data);
      if (!data.segments || !Array.isArray(data.segments)) {
        throw new Error("Invalid response format: missing segments array");
      }
      return data;
    } catch (error) {
      console.error("Error in getSegmentation:", error);
      throw error;
    }
  },
};
