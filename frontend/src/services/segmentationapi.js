import { getAuthHeaders } from "./api";
import { axiosInstance } from "../lib/axiosInstance";

export const segmentationApi = {
  getSegmentation: async ({ prompt, concept = "", negative_prompt = "" }) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        "/segmentation",
        { prompt, concept, negative_prompt },
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
