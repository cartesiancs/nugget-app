import { axiosInstance, API_BASE_URL } from "../lib/axiosInstance";
// Utility function to get auth headers
export const getAuthHeaders = async () => {
  const headers = {
    "Content-Type": "application/json",
  };

  // Get token from localStorage (for web) or Electron store
  let token = localStorage.getItem("authToken");

  // If we're in Electron, try to get token from Electron store
  if (
    window.electronAPI &&
    window.electronAPI.req &&
    window.electronAPI.req.auth
  ) {
    try {
      const tokenResult = await window.electronAPI.req.auth.getToken();
      if (tokenResult.status === 1 && tokenResult.token) {
        token = tokenResult.token;
        // Sync with localStorage for consistency
        localStorage.setItem("authToken", token);
      }
    } catch (error) {
      console.warn("Failed to get token from Electron store:", error);
      // Fallback to localStorage token
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Test API function to verify authentication
export const testApi = {
  testAuth: async () => {
    try {
      const headers = await getAuthHeaders();
      console.log("Auth headers being sent:", headers);
      const { data } = await axiosInstance.get("/auth/status", { headers });
      console.log("Auth test response:", data);
      return data;
    } catch (error) {
      console.error("Error in testAuth:", error);
      throw error;
    }
  },
};
