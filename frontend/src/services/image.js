import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});
import { getAuthHeaders } from "./api";

// Image generation API wrapper
export const imageApi = {
  generateImage: async ({ visual_prompt, art_style, uuid, project_id }) => {
    try {
      const payload = { visual_prompt, uuid, projectId: project_id };
      payload.art_style =
        art_style && art_style.trim() ? art_style.trim() : "realistic";

      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post("/image-gen", payload, {
        headers,
      });
      console.log("Image generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateImage:", error);
      throw error;
    }
  },
  regenerateImage: async ({ id, visual_prompt, art_style, s3_key }) => {
    try {
      const body = { visual_prompt, art_style };
      if (s3_key) body.s3_key = s3_key;
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.patch(`/image-gen/${id}`, body, {
        headers,
      });
      console.log("Image regeneration response:", data);
      return data;
    } catch (error) {
      console.error("Error in regenerateImage:", error);
      throw error;
    }
  },
};
