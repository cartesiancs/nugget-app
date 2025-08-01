// Example usage of the new unified chat API
import { chatApi, AVAILABLE_MODELS } from './chat';

// Example: Generate an image
const generateImageExample = async () => {
  try {
    const result = await chatApi.generateImage({
      visual_prompt: "A majestic mountain landscape at sunset",
      art_style: "photorealistic",
      uuid: "user-123",
      project_id: "project-456",
      model: "recraft-v3" // or "imagen"
    });
    
    console.log("Image generation result:", result);
    // Expected response: { s3_key: "user-123/images/abc123-def456.png", model: "recraft-v3", image_size_bytes: 245760 }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
};

// Example: Generate a video
const generateVideoExample = async () => {
  try {
    const result = await chatApi.generateVideo({
      animation_prompt: "The mountain landscape comes alive with flowing clouds and moving shadows",
      art_style: "cinematic",
      image_s3_key: "user-123/images/abc123-def456.png",
      uuid: "user-123",
      project_id: "project-456",
      model: "kling-v2.1-master" // or "gen4_turbo"
    });
    
    console.log("Video generation result:", result);
    // Expected response: { s3_key: "user-123/videos/xyz789-uvw012.mp4", model: "kling-v2.1-master" }
  } catch (error) {
    console.error("Video generation failed:", error);
  }
};

// Example: Get available models
const getAvailableModelsExample = () => {
  const imageModels = chatApi.getAvailableModels('IMAGE');
  const videoModels = chatApi.getAvailableModels('VIDEO');
  
  console.log("Available image models:", imageModels);
  console.log("Available video models:", videoModels);
  
  // Get default models
  const defaultImageModel = chatApi.getDefaultModel('IMAGE');
  const defaultVideoModel = chatApi.getDefaultModel('VIDEO');
  
  console.log("Default image model:", defaultImageModel);
  console.log("Default video model:", defaultVideoModel);
};

// Export examples for testing
export {
  generateImageExample,
  generateVideoExample,
  getAvailableModelsExample
}; 