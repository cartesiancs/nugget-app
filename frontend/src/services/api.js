import axios from "axios";

// Create axios instance with environment variable
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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

export const projectApi = {
  getProjectById: async (projectId = "cmd8n2z28001jp04wtw1263zi") => {
    try {
      const headers = await getAuthHeaders();
      console.log("Fetching project with headers:", headers);

      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/full`,
        {
          method: "GET",
          headers,
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status}`);
      }

      const data = await response.json();
      console.log("Project data response:", data);
      return data;
    } catch (error) {
      console.error("Error in getProjectById:", error);
      throw error;
    }
  },
};

// Character generation API wrapper
export const characterGenApi = {
  getPresignedUrls: async ({ uuid, count = 6 }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/presign`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ uuid, count }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get presigned URLs: ${response.status}`);
      }

      const data = await response.json();
      console.log("Presigned URLs response:", data);
      return data;
    } catch (error) {
      console.error("Error in getPresignedUrls:", error);
      throw error;
    }
  },

  uploadImageToS3: async (file, putUrl) => {
    try {
      const response = await fetch(putUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      throw error;
    }
  },

  startCharacterGeneration: async (characterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/character-gen`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Character generation failed: ${
            errorData.message || response.statusText
          }`,
        );
      }

      const data = await response.json();
      console.log("Character generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in startCharacterGeneration:", error);
      throw error;
    }
  },

  checkCharacterStatus: async (characterId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/character-gen/${characterId}`,
        {
          method: "GET",
          headers: await getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to check character status: ${response.status}`);
      }

      const data = await response.json();
      return data.character;
    } catch (error) {
      console.error("Error in checkCharacterStatus:", error);
      throw error;
    }
  },

  getAllCharacters: async (projectId) => {
    try {
      const url = projectId
        ? `${API_BASE_URL}/character-gen?projectId=${projectId}`
        : `${API_BASE_URL}/character-gen`;

      const response = await fetch(url, {
        method: "GET",
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get characters: ${response.status}`);
      }

      const data = await response.json();
      console.log("Get all characters response:", data);
      return data;
    } catch (error) {
      console.error("Error in getAllCharacters:", error);
      throw error;
    }
  },

  generateVideoFromCharacter: async (characterId, videoConfig) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/character-gen/${characterId}/generate-video`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify(videoConfig),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Video generation failed: ${
            errorData.message || response.statusText
          }`,
        );
      }

      const data = await response.json();
      console.log("Video generation from character response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVideoFromCharacter:", error);
      throw error;
    }
  },

  generateVideo: async (videoConfig) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video-gen`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(videoConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Video generation failed: ${
            errorData.message || response.statusText
          }`,
        );
      }

      const data = await response.json();
      console.log("Video generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVideo:", error);
      throw error;
    }
  },
};
