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
