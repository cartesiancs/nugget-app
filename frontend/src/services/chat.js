import { axiosInstance } from "../lib/axiosInstance";
import { getAuthHeaders } from "./api";

// Available models for generation
export const AVAILABLE_MODELS = {
  TEXT: {
    "gemini-2.0-flash-exp": {
      name: "Gemini 2.0 Flash",
      description: "Fast and efficient text generation",
      provider: "Google",
      contextLength: "1M tokens",
      speed: "Fast",
    },
    "gemini-flash": {
      name: "Gemini Flash",
      description: "Balanced performance and speed",
      provider: "Google",
      contextLength: "1M tokens", 
      speed: "Fast",
    },
    "gemini-pro": {
      name: "Gemini Pro",
      description: "High-quality text generation",
      provider: "Google",
      contextLength: "2M tokens",
      speed: "Moderate",
    },
  },
  IMAGE: {
    "recraft-v3": {
      name: "Recraft AI v3",
      description: "Realistic photographic image generation",
      provider: "Recraft AI",
      imageSize: "1024x1024",
    },
    imagen: {
      name: "Google Imagen",
      description: "High-quality image generation",
      provider: "Google Gemini",
      imageSize: "Variable",
    },
  },
  VIDEO: {
    "gen4_turbo": {
      name: "RunwayML Gen4 Turbo",
      description: "Advanced video generation",
      provider: "RunwayML",
      duration: "5 seconds",
      resolution: "1280:720",
    },
    "kling-v2.1-master": {
      name: "Kling v2.1 Master",
      description: "Image-to-video generation",
      provider: "Fal.ai",
      duration: "5 seconds",
      resolution: "Variable",
    },
  },
};

// Unified chat API wrapper
export const chatApi = {
  // Generate image using the new unified chat endpoint
  generateImage: async ({
    visual_prompt,
    art_style,
    project_id,
    segmentId,
    model = "recraft-v3",
  }) => {
    try {
      const payload = {
        model,
        gen_type: "image",
        visual_prompt,
        art_style:
          art_style && art_style.trim() ? art_style.trim() : "realistic",
        projectId: project_id,
        segmentId,
      };

      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post("/chat", payload, {
        headers,
      });
      console.log("Chat API image generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in chatApi.generateImage:", error);
      throw error;
    }
  },

  // Generate video using the new unified chat endpoint
  generateVideo: async ({
    animation_prompt,
    art_style,
    image_s3_key,
    project_id,
    segmentId,
    model = "gen4_turbo",
  }) => {
    try {
      const payload = {
        model,
        gen_type: "video",
        segmentId,
        animation_prompt,
        image_s3_key,
        art_style:
          art_style && art_style.trim() ? art_style.trim() : "realistic",
        projectId: project_id,
      };

      const headers = await getAuthHeaders();
      const { data } = await axiosInstance.post("/chat", payload, {
        headers,
      });
      console.log("Chat API video generation response:", data);
      return data;
    } catch (error) {
      console.error("Error in chatApi.generateVideo:", error);
      throw error;
    }
  },

  // Get available models for a specific generation type
  getAvailableModels: (genType) => {
    return AVAILABLE_MODELS[genType.toUpperCase()] || {};
  },

  // Get default model for a generation type
  getDefaultModel: (genType) => {
    const models = AVAILABLE_MODELS[genType.toUpperCase()];
    if (!models) return null;

    // Return the first model as default (index 0, not 1)
    return Object.keys(models)[0];
  },
};
