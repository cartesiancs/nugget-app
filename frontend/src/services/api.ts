const API_BASE_URL = "https://backend.usuals.ai";

interface SegmentationResponse {
  segments: Array<{
    id: string;
    visual: string;
    narration: string;
  }>;
  style: string;
}

export const segmentationApi = {
  getSegmentation: async (prompt: string): Promise<SegmentationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/segmentation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
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

// New types for image generation response
interface ImageGenerationResponse {
  images: Array<{
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  }>;
  seed: number;
}

// Image generation API wrapper
export const imageApi = {
  generateImage: async (visual_prompt: string): Promise<ImageGenerationResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/image-gen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visual_prompt }),
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
