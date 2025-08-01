# Unified Chat API Implementation

This document describes the implementation of the new unified chat API for image and video generation with model selection.

## Overview

The new implementation replaces the separate image and video generation APIs with a unified `/chat` endpoint that supports multiple AI models for both image and video generation.

## Key Features

1. **Unified API**: Single endpoint for both image and video generation
2. **Model Selection**: Users can choose from multiple AI models for each generation type
3. **Backward Compatibility**: Existing functionality is preserved while adding new capabilities
4. **Enhanced UI**: Model selection dropdowns in the ChatWidget and FlowWidget

## New Files Created

### 1. `frontend/src/services/chat.js`
- Unified chat API service
- Model definitions and metadata
- Helper functions for model selection

### 2. `frontend/src/components/ModelSelector.jsx`
- Reusable dropdown component for model selection
- Displays model information (name, provider, specifications)
- Supports both image and video model types

### 3. `frontend/src/services/chat.test.js`
- Example usage and testing functions
- Demonstrates API calls and model selection

## Updated Components

### ChatWidget.jsx
- Added model selection state variables
- Updated image and video generation functions to use new API
- Added ModelSelector UI components
- Updated response handling for new API format

### FlowWidget.jsx
- Updated imports to use new chat API
- Modified image and video generation calls
- Updated response handling for new API format

### ImageNode.jsx
- Updated to use new chat API
- Simplified regeneration logic (no separate PATCH calls needed)

### VideoPanel.jsx
- Updated to use new chat API
- Updated response handling for new API format

## API Changes

### Request Format
The new unified API uses a single endpoint with different `gen_type` values:

```javascript
// Image generation
{
  model: "recraft-v3", // or "imagen"
  gen_type: "image",
  uuid: "user-123",
  visual_prompt: "A majestic mountain landscape",
  art_style: "photorealistic",
  projectId: "project-456"
}

// Video generation
{
  model: "kling-v2.1-master", // or "gen4_turbo"
  gen_type: "video",
  uuid: "user-123",
  animation_prompt: "The landscape comes alive",
  image_s3_key: "user-123/images/abc123.png",
  art_style: "cinematic",
  projectId: "project-456"
}
```

### Response Format
- **Image Generation**: `{ s3_key: "path/to/image.png", model: "recraft-v3", image_size_bytes: 245760 }`
- **Video Generation**: `{ s3_key: "path/to/video.mp4", model: "kling-v2.1-master" }`

## Supported Models

### Image Generation Models
- **recraft-v3**: Recraft AI - Realistic photographic images (1024x1024)
- **imagen**: Google Gemini - High-quality images (Variable size)

### Video Generation Models
- **kling-v2.1-master**: Fal.ai - Image-to-video generation (5 seconds, Variable resolution)
- **gen4_turbo**: RunwayML - Advanced video generation (5 seconds, 1280:720)

## UI Changes

### Model Selection Interface
- Added model selection dropdowns in ChatWidget for steps 4 (Image Generation) and 5 (Video Generation)
- Dropdowns show model name, provider, and specifications
- Models are disabled during generation to prevent conflicts

### Default Model Selection
- Image generation defaults to "recraft-v3"
- Video generation defaults to "kling-v2.1-master"
- Defaults are reset when flow is reset

## Migration Notes

### Breaking Changes
- Response format changed from `s3Keys` array to single `s3_key` string for videos
- Removed separate `regenerateImage` and `regenerateVideo` endpoints
- Regeneration is now handled through the main generation endpoints

### Backward Compatibility
- All existing functionality is preserved
- UI changes are additive and don't break existing workflows
- Default models ensure existing behavior continues to work

## Usage Examples

### Basic Image Generation
```javascript
import { chatApi } from '../services/chat';

const result = await chatApi.generateImage({
  visual_prompt: "A beautiful sunset",
  art_style: "photorealistic",
  uuid: "user-123",
  project_id: "project-456",
  model: "recraft-v3"
});
```

### Basic Video Generation
```javascript
const result = await chatApi.generateVideo({
  animation_prompt: "The sunset comes alive",
  art_style: "cinematic",
  image_s3_key: "user-123/images/sunset.png",
  uuid: "user-123",
  project_id: "project-456",
  model: "kling-v2.1-master"
});
```

### Model Selection
```javascript
// Get available models
const imageModels = chatApi.getAvailableModels('IMAGE');
const videoModels = chatApi.getAvailableModels('VIDEO');

// Get default models
const defaultImageModel = chatApi.getDefaultModel('IMAGE');
const defaultVideoModel = chatApi.getDefaultModel('VIDEO');
```

## Testing

Use the test file `frontend/src/services/chat.test.js` to verify the implementation:

```javascript
import { generateImageExample, generateVideoExample, getAvailableModelsExample } from './chat.test';

// Test model availability
getAvailableModelsExample();

// Test image generation
await generateImageExample();

// Test video generation
await generateVideoExample();
```

## Future Enhancements

1. **Model Performance Metrics**: Add performance tracking for different models
2. **Custom Model Parameters**: Allow users to adjust model-specific parameters
3. **Model Comparison**: Side-by-side comparison of results from different models
4. **Batch Processing**: Support for generating multiple images/videos with different models
5. **Model Recommendations**: AI-powered suggestions for the best model based on prompt content 