// CloudFront URL wrapper for images and videos
const API_BASE_URL = "https://backend.usuals.ai";

// Helper function to get auth token
const getAuthToken = async () => {
  if (typeof window !== 'undefined' && window.electronAPI?.req?.auth) {
    // In Electron, get token from store
    try {
      const result = await window.electronAPI.req.auth.getToken();
      return result.status === 1 ? result.token : null;
    } catch (error) {
      console.error('Failed to get token from Electron:', error);
      return null;
    }
  } else {
    // In web browser, get from localStorage
    return localStorage.getItem('authToken');
  }
};

// Helper function to create headers with auth
const createHeaders = async (additionalHeaders = {}) => {
  const token = await getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
    ...additionalHeaders,
  };
};

export const segmentationApi = {
  getSegmentation: async ({ prompt, concept = "", negative_prompt = "" }) => {
    try {
      const headers = await createHeaders();
      const response = await fetch(`${API_BASE_URL}/segmentation`, {
        method: "POST",
        headers,
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

      const headers = await createHeaders();
      const response = await fetch(`${API_BASE_URL}/image-gen`, {
        method: "POST",
        headers,
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
};

// Video generation API wrapper
export const videoApi = {
  generateVideo: async ({ animation_prompt, art_style, imageS3Key, uuid }) => {
    try {
      const payload = { animation_prompt, imageS3Key, uuid };
      payload.art_style = art_style && art_style.trim() ? art_style.trim() : "realistic";

      const headers = await createHeaders();
      const response = await fetch(`${API_BASE_URL}/video-gen`, {
        method: "POST",
        headers,
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
};

// Web-info API wrapper
export const webInfoApi = {
  processWebInfo: async (prompt) => {
    try {
      const headers = await createHeaders();
      const response = await fetch(`${API_BASE_URL}/get-web-info`, {
        method: "POST",
        headers,
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
      const headers = await createHeaders();
      const response = await fetch(`${API_BASE_URL}/concept-writer`, {
        method: "POST",
        headers,
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
      const headers = await createHeaders();
      const response = await fetch(`${API_BASE_URL}/voiceover`, {
        method: "POST",
        headers,
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
