import { getAuthHeaders } from "./api";
import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const segmentationApi = {
  getSegmentation: async ({ prompt, concept = "", negative_prompt = "", project_id ,model}) => {
    try {
      const headers = await getAuthHeaders();
      const payload = { prompt, concept, negative_prompt,model };
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
