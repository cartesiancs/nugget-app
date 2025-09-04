import axios from "axios";
import { API_BASE_URL } from "../config/baseurl.js";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});
import { getAuthHeaders } from "./api";

// Video generation API wrapper
export const videoApi = {
  generateVideo: async ({ animation_prompt, art_style, imageS3Key, uuid, project_id, model}) => {
    try {
      const payload = { animation_prompt, imageS3Key, uuid, projectId: project_id };
      payload.art_style =
        art_style && art_style.trim() ? art_style.trim() : "realistic";

      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post("/video-gen", payload, {
        headers,
      });
      console.log("Video generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVideo:", error);
      throw error;
    }
  },
  regenerateVideo: async ({
    id,
    animation_prompt,
    art_style,
    image_s3_key,
    video_s3_keys,
  }) => {
    try {
      const body = { animation_prompt, art_style, video_s3_keys, image_s3_key };
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.patch(`/video-gen/${id}`, body, {
        headers,
      });
      console.log("Video regeneration response:", data);
      return data;
    } catch (error) {
      console.error("Error in regenerateVideo:", error);
      throw error;
    }
  },
};
