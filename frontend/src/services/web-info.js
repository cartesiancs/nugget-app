import { getAuthHeaders } from "./api";
import { axiosInstance } from "../lib/axiosInstance";

// Web-info API wrapper
export const webInfoApi = {
  processWebInfo: async (prompt) => {
    try {
      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post(
        "/get-web-info",
        { prompt },
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
