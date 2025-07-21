// CloudFront URL wrapper for images and videos
const API_BASE_URL = "https://backend.usuals.ai";

// Utility function to get auth headers
const getAuthHeaders = async () => {
  const headers = {
    "Content-Type": "application/json",
  };

  // Get token from localStorage (for web) or Electron store
  let token = localStorage.getItem('authToken');

  // If we're in Electron, try to get token from Electron store
  if (window.electronAPI && window.electronAPI.req && window.electronAPI.req.auth) {
    try {
      const tokenResult = await window.electronAPI.req.auth.getToken();
      if (tokenResult.status === 1 && tokenResult.token) {
        token = tokenResult.token;
        // Sync with localStorage for consistency
        localStorage.setItem('authToken', token);
      }
    } catch (error) {
      console.warn('Failed to get token from Electron store:', error);
      // Fallback to localStorage token
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const segmentationApi = {
  getSegmentation: async ({ prompt, concept = "", negative_prompt = "" }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/segmentation`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ prompt, concept, negative_prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch segmentation: ${response.status}`);
      }

      const data = await response.json();
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

// Image generation API wrapper
export const imageApi = {
  generateImage: async ({ visual_prompt, art_style, uuid }) => {
    try {
      const payload = { visual_prompt, uuid };
      payload.art_style = art_style && art_style.trim() ? art_style.trim() : "realistic";

      const response = await fetch(`${API_BASE_URL}/image-gen`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/image-gen/${id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Failed to regenerate image: ${response.status}`);
      }
      const data = await response.json();
      console.log("Image regeneration response:", data);
      return data;
    } catch (error) {
      console.error("Error in regenerateImage:", error);
      throw error;
    }
  },
};

// Video generation API wrapper
export const videoApi = {
  generateVideo: async ({ animation_prompt, art_style, imageS3Key, uuid }) => {
    try {
      const payload = { animation_prompt, imageS3Key, uuid };
      payload.art_style = art_style && art_style.trim() ? art_style.trim() : "realistic";

      const response = await fetch(`${API_BASE_URL}/video-gen`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate video: ${response.status}`);
      }

      const data = await response.json();
      console.log("Video generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVideo:", error);
      throw error;
    }
  },
  regenerateVideo: async ({ id, animation_prompt, art_style, imageS3Key }) => {
    try {
      const body = { animation_prompt, art_style };
      if (imageS3Key) body.imageS3Key = imageS3Key;
      const response = await fetch(`${API_BASE_URL}/video-gen/${id}`, {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Failed to regenerate video: ${response.status}`);
      }
      const data = await response.json();
      console.log("Video regeneration response:", data);
      return data;
    } catch (error) {
      console.error("Error in regenerateVideo:", error);
      throw error;
    }
  },
};

// Web-info API wrapper
export const webInfoApi = {
  processWebInfo: async (prompt) => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-web-info`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to process web-info request: ${response.status}`);
      }

      const data = await response.json();
      console.log("Web-info response:", data);
      return data;
    } catch (error) {
      console.error("Error in processWebInfo:", error);
      throw error;
    }
  },
};

// Concept-writer API wrapper
export const conceptWriterApi = {
  generateConcepts: async (prompt, web_info) => {
    try {
      const response = await fetch(`${API_BASE_URL}/concept-writer`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ prompt, web_info }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate concepts: ${response.status}`);
      }

      const data = await response.json();
      console.log("Concept-writer response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateConcepts:", error);
      throw error;
    }
  },
};

export const voiceApi = {
  generateVoice: async (narration_prompt) => {
    try {
      const response = await fetch(`${API_BASE_URL}/voiceover`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ narration_prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate voice: ${response.status}`);
      }

      const data = await response.json();
      console.log("Voiceover response:", data);
      return data;
    } catch (error) {
      console.error("Error in generateVoice:", error);
      throw error;
    }
  },
};



export const s3Api = {
  downloadImage: async (s3Key) => {
    try {
      // Construct CloudFront URL directly from S3 key
      const cloudfrontUrl = `https://ds0fghatf06yb.cloudfront.net/${s3Key}`;
      
      console.log("Image CloudFront URL:", cloudfrontUrl);
      return cloudfrontUrl;
    } catch (error) {
      console.error("Error in downloadImage:", error);
      throw error;
    }
  },

  downloadVideo: async (s3Key) => {
    try {
      // Construct CloudFront URL directly from S3 key
      const cloudfrontUrl = `https://ds0fghatf06yb.cloudfront.net/${s3Key}`;
      
      console.log("Video CloudFront URL:", cloudfrontUrl);
      return cloudfrontUrl;
    } catch (error) {
      console.error("Error in downloadVideo:", error);
      throw error;
    }
  },
};

// Test API function to verify authentication
export const testApi = {
  testAuth: async () => {
    try {
      const headers = await getAuthHeaders();
      console.log("Auth headers being sent:", headers);

      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Auth test failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Auth test response:", data);
      return data;
    } catch (error) {
      console.error("Error in testAuth:", error);
      throw error;
    }
  },
};

// Project API wrapper
export const projectApi = {
  getProjectById: async (projectId = "cmd8n2z28001jp04wtw1263zi") => {
    try {
      const headers = await getAuthHeaders();
      console.log("Fetching project with headers:", headers);

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/full`, {
        method: "GET",
        headers,
      });

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
