import { getAuthHeaders } from "./api";
import { axiosInstance } from "../lib/axiosInstance";

// Web-info API wrapper
export const webInfoApi = {
  processWebInfo: async (prompt, project_id) => {
    try {
      const headers = await getAuthHeaders();
      const payload = { prompt };
      if (project_id) payload.projectId = project_id;
      
      const { data } = await axiosInstance.post(
        "/get-web-info",
        payload,
        { headers },
      );
      console.log("Web-info response:", data);
      return data;
    } catch (error) {
      console.error("Error in processWebInfo:", error);
      throw error;
    }
  },
};
