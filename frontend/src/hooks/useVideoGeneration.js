import { useCallback } from 'react';
import { chatApi } from '../services/chat';
import { s3Api } from '../services/s3';

/**
 * Custom hook for handling video generation from images
 * @param {Object} params - Hook parameters
 * @param {Function} params.setNodes - React Flow setNodes function
 * @param {Function} params.setEdges - React Flow setEdges function
 * @param {Function} params.setGeneratingVideos - Function to update generating videos state
 * @param {Function} params.setTaskCompletionStates - Function to update task completion states
 * @param {Function} params.setTemporaryVideos - Function to update temporary videos state
 * @param {Function} params.saveGenerationState - Function to save generation state to localStorage
 * @param {Function} params.removeGenerationState - Function to remove generation state from localStorage
 * @param {Array} params.edges - Current edges array
 * @param {Array} params.nodes - Current nodes array
 */
export const useVideoGeneration = ({
  setNodes,
  setEdges,
  setGeneratingVideos,
  setTaskCompletionStates,
  setTemporaryVideos,
  saveGenerationState,
  removeGenerationState,
  edges,
  nodes
}) => {
  const generateVideo = useCallback(async (imageNode, videoNode) => {
    try {
      setGeneratingVideos(prev => new Set(prev.add(videoNode.id)));
      
      // Get selected project from localStorage
      let selectedProject = null;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        selectedProject = storedProject ? JSON.parse(storedProject) : null;
      } catch (e) {
        console.error('Error parsing project data:', e);
      }
      
      if (!selectedProject) {
        throw new Error('No project selected. Please select a project first.');
      }
      
      // Update video node to show loading
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === videoNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Generating video...',
              nodeState: 'loading'
            }
          };
        }
        return node;
      }));

      // Generate video using image and segment animation prompt
      const animationPrompt = imageNode.data?.segmentData?.animation || imageNode.data?.segmentData?.visual || 'Smooth cinematic movement';
      const artStyle = imageNode.data?.artStyle || 'cinematic photography with soft lighting';
      const segmentId = imageNode.data?.segmentId || Date.now();
      // Try multiple possible s3Key field names for backward compatibility
      let imageS3Key = imageNode.data?.s3Key || imageNode.data?.imageS3Key || imageNode.data?.image_s3_key;

      // Save persistent generation state
      saveGenerationState(selectedProject.id, 'video', videoNode.id, {
        loadingMessage: 'Generating video...',
        title: 'Loading Video',
        position: videoNode.position,
        parentNodeId: imageNode.id,
        animationPrompt: animationPrompt,
        artStyle: artStyle,
        segmentId: segmentId,
        imageId: imageNode.data?.imageId
      });
      
      // If no direct s3Key, try to extract from imageUrl
      if (!imageS3Key && imageNode.data?.imageUrl) {
        const imageUrl = imageNode.data.imageUrl;
        if (imageUrl.includes('cloudfront.net/')) {
          const urlParts = imageUrl.split('cloudfront.net/');
          if (urlParts.length > 1) {
            imageS3Key = urlParts[1];
            console.log('Extracted s3Key from imageUrl:', imageS3Key);
          }
        }
      }
      
      if (!imageS3Key) {
        console.error('Image node data:', imageNode.data);
        console.error('Available keys:', Object.keys(imageNode.data));
        throw new Error('No image S3 key found for video generation. Check if the image has s3Key property or valid imageUrl.');
      }
      
      console.log("Starting video generation...");
      console.log("Video generation request:", {
        animation_prompt: animationPrompt,
        art_style: artStyle,
        image_s3_key: imageS3Key,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: 'gen4_turbo' // Using RunwayML gen4_turbo model
      });
      
      const videoResponse = await chatApi.generateVideo({
        animation_prompt: animationPrompt,
        art_style: artStyle,
        image_s3_key: imageS3Key,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: 'gen4_turbo' // Using RunwayML gen4_turbo model
      });
      
      console.log("Video generation response:", videoResponse);
      
      if (videoResponse && videoResponse.s3_key) {
        // Remove persistent generation state and clean up
        removeGenerationState(selectedProject.id, 'video', videoNode.id);
        
        // Clean up any temporary video generation data
        try {
          const tempVideoKey = `temp-video-${selectedProject.id}-${videoNode.id}`;
          localStorage.removeItem(tempVideoKey);
          console.log('✅ Cleaned up temporary video data from localStorage');
        } catch (error) {
          console.error('Error cleaning up temporary video data:', error);
        }
        
        // Download video URL
        const videoUrl = await s3Api.downloadVideo(videoResponse.s3_key);
        
        // Update video node with generated video
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === videoNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                videoUrl: videoUrl,
                videoId: videoResponse.id,
                segmentId: segmentId,
                imageId: imageNode.data?.imageId,
                animationPrompt: animationPrompt,
                nodeState: 'existing',
                segmentData: imageNode.data?.segmentData
              }
            };
          }
          return node;
        }));
        
        // Store temporary video for immediate display
        setTemporaryVideos(prev => {
          const newMap = new Map(prev);
          const key = `${segmentId}-${imageNode.data?.imageId}`;
          newMap.set(key, videoUrl);
          return newMap;
        });

        // Save video to localStorage for persistence across refreshes
        try {
          const videoStorageKey = `generated-videos-${selectedProject.id}`;
          const existingVideos = JSON.parse(localStorage.getItem(videoStorageKey) || '{}');
          existingVideos[`${segmentId}-${imageNode.data?.imageId}`] = {
            videoUrl: videoUrl,
            videoId: videoResponse.id,
            segmentId: segmentId,
            imageId: imageNode.data?.imageId,
            animationPrompt: animationPrompt,
            artStyle: artStyle,
            model: 'gen4_turbo',
            timestamp: Date.now()
          };
          localStorage.setItem(videoStorageKey, JSON.stringify(existingVideos));
          console.log(`💾 Saved generated video to localStorage for ${segmentId}-${imageNode.data?.imageId}`);
          
          // Clean up old videos (keep only last 50 videos per project)
          const videoEntries = Object.entries(existingVideos);
          if (videoEntries.length > 50) {
            const sortedVideos = videoEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            const videosToKeep = sortedVideos.slice(0, 50);
            const cleanedVideos = Object.fromEntries(videosToKeep);
            localStorage.setItem(videoStorageKey, JSON.stringify(cleanedVideos));
            console.log(`🧹 Cleaned up old videos, kept ${videosToKeep.length} most recent`);
          }
        } catch (error) {
          console.error('Error saving video to localStorage:', error);
        }
        
        console.log(`Generated video for segment ${segmentId}`);
        
        // Mark video generation as completed
        setTaskCompletionStates(prev => ({ ...prev, video: true }));
      } else {
        throw new Error('No video key returned from API');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      
      // Get selected project again for error handling
      let selectedProject = null;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        selectedProject = storedProject ? JSON.parse(storedProject) : null;
      } catch (e) {
        console.error('Error parsing project data:', e);
      }
      
      const animationPrompt = imageNode.data?.segmentData?.animation || imageNode.data?.segmentData?.visual || 'Smooth cinematic movement';
      const artStyle = imageNode.data?.artStyle || 'cinematic photography with soft lighting';
      const segmentId = imageNode.data?.segmentId || Date.now();
      
      // Determine error type and message
      const getErrorDetails = (error) => {
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
          return { message: 'Network Error', description: 'Please check your internet connection and try again.' };
        }
        if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error') || errorMessage.includes('server')) {
          return { message: 'Internal Server Error', description: 'Server is temporarily unavailable. Please try again.' };
        }
        if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
          return { message: 'Authentication Error', description: 'Please log in again to continue.' };
        }
        if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
          return { message: 'Rate Limit Exceeded', description: 'Too many requests. Please wait a moment and try again.' };
        }
        return { message: 'Generation Failed', description: 'Failed to generate video. Please try again.' };
      };
      
      const errorDetails = getErrorDetails(error);
      
      if (selectedProject) {
        // Save error state instead of removing it immediately
        saveGenerationState(selectedProject.id, 'video', videoNode.id, {
          loadingMessage: 'Failed to generate video',
          title: 'Error',
          position: videoNode.position,
          parentNodeId: imageNode.id,
          animationPrompt: animationPrompt,
          artStyle: artStyle,
          segmentId: segmentId,
          imageId: imageNode.data?.imageId,
          status: 'error',
          errorMessage: errorDetails.message,
          originalData: {
            imageNode: imageNode,
            videoNode: videoNode
          }
        });
      }
      
      // Show error in video node with enhanced error display
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === videoNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: errorDetails.message,
              error: errorDetails.message,
              errorDescription: errorDetails.description,
              nodeState: 'error',
              canRetry: true,
              originalData: {
                imageNode: imageNode,
                videoNode: videoNode
              }
            }
          };
        }
        return node;
      }));
      
      // Don't auto-remove error states - let user manually retry or dismiss
      // if (selectedProject) {
      //   setTimeout(() => {
      //     removeGenerationState(selectedProject.id, 'video', videoNode.id);
      //   }, 5000);
      // }
    } finally {
      setGeneratingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoNode.id);
        return newSet;
      });
    }
  }, [setNodes, setTemporaryVideos, setGeneratingVideos, setTaskCompletionStates, saveGenerationState, removeGenerationState]);

  const regenerateVideo = useCallback(async (regenerationParams) => {
    try {
      const { selectedNode, prompt, model, artStyle } = regenerationParams;
      
      if (!selectedNode || selectedNode.type !== 'videoNode') {
        console.error('Invalid node for video regeneration:', selectedNode);
        return;
      }

      // Get selected project from localStorage
      let selectedProject = null;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        selectedProject = storedProject ? JSON.parse(storedProject) : null;
      } catch (e) {
        console.error('Error parsing project data:', e);
      }
      
      if (!selectedProject) {
        throw new Error('No project selected. Please select a project first.');
      }

      // Create a new video node for the regenerated video
      const regeneratedVideoNodeId = `regenerated-video-${selectedNode.id}-${Date.now()}`;
      const segmentId = selectedNode.data?.segmentId || Date.now();
      const imageId = selectedNode.data?.imageId || Date.now();
      
      // Position the new node next to the original video node
      const newPosition = {
        x: selectedNode.position.x + 350, // Place it to the right
        y: selectedNode.position.y
      };

      // Create loading video node
      const loadingVideoNode = {
        id: regeneratedVideoNodeId,
        type: 'videoNode',
        position: newPosition,
        data: {
          id: regeneratedVideoNodeId,
          content: 'Regenerating video...',
          nodeState: 'loading',
          title: 'Regenerating Video',
          animationPrompt: prompt,
          artStyle: artStyle,
          segmentId: segmentId,
          imageId: imageId,
          segmentData: selectedNode.data?.segmentData
        }
      };

      // Add the loading node immediately
      setNodes(prevNodes => [...prevNodes, loadingVideoNode]);

      // Connect the new node to the same parent as the original video node
      const parentEdge = edges.find(edge => edge.target === selectedNode.id);
      if (parentEdge) {
        const newEdge = {
          id: `${parentEdge.source}-to-${regeneratedVideoNodeId}`,
          source: parentEdge.source,
          target: regeneratedVideoNodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        };
        setEdges(prevEdges => [...prevEdges, newEdge]);
      }

      // Save persistent generation state
      saveGenerationState(selectedProject.id, 'video', regeneratedVideoNodeId, {
        loadingMessage: 'Regenerating video...',
        title: 'Regenerating Video',
        position: newPosition,
        parentNodeId: parentEdge?.source,
        animationPrompt: prompt,
        artStyle: artStyle,
        segmentId: segmentId,
        imageId: imageId
      });

      // Mark as generating
      setGeneratingVideos(prev => new Set(prev.add(regeneratedVideoNodeId)));

      // We need the parent image's S3 key for video generation
      const parentImageNode = nodes.find(node => node.id === parentEdge?.source);
      let imageS3Key = parentImageNode?.data?.s3Key || parentImageNode?.data?.imageS3Key;

      // If no direct s3Key, try to extract from imageUrl
      if (!imageS3Key && parentImageNode?.data?.imageUrl) {
        const imageUrl = parentImageNode.data.imageUrl;
        if (imageUrl.includes('cloudfront.net/')) {
          const urlParts = imageUrl.split('cloudfront.net/');
          if (urlParts.length > 1) {
            imageS3Key = urlParts[1];
          }
        }
      }

      if (!imageS3Key) {
        throw new Error('No parent image S3 key found for video regeneration. Video generation requires a source image.');
      }

      console.log("Starting video regeneration...");
      console.log("Video regeneration request:", {
        animation_prompt: prompt,
        art_style: artStyle,
        image_s3_key: imageS3Key,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: model
      });

      // Generate the video using the chat API
      const videoResponse = await chatApi.generateVideo({
        animation_prompt: prompt,
        art_style: artStyle,
        image_s3_key: imageS3Key,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: model
      });

      console.log("Video regeneration response:", videoResponse);

      if (videoResponse && videoResponse.s3_key) {
        // Remove persistent generation state
        removeGenerationState(selectedProject.id, 'video', regeneratedVideoNodeId);

        // Download video URL
        const videoUrl = await s3Api.downloadVideo(videoResponse.s3_key);

        // Update the loading node with the generated video
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === regeneratedVideoNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                videoUrl: videoUrl,
                videoId: videoResponse.id,
                segmentId: segmentId,
                imageId: imageId,
                animationPrompt: prompt,
                artStyle: artStyle,
                nodeState: 'existing',
                segmentData: selectedNode.data?.segmentData,
                title: 'Regenerated Video'
              }
            };
          }
          return node;
        }));

        // Store temporary video for immediate display
        setTemporaryVideos(prev => {
          const newMap = new Map(prev);
          const key = `${segmentId}-${imageId}`;
          newMap.set(key, videoUrl);
          return newMap;
        });

        // Save video to localStorage for persistence across refreshes
        try {
          const videoStorageKey = `generated-videos-${selectedProject.id}`;
          const existingVideos = JSON.parse(localStorage.getItem(videoStorageKey) || '{}');
          existingVideos[`${segmentId}-${imageId}`] = {
            videoUrl: videoUrl,
            videoId: videoResponse.id,
            segmentId: segmentId,
            imageId: imageId,
            animationPrompt: prompt,
            artStyle: artStyle,
            model: model,
            timestamp: Date.now()
          };
          localStorage.setItem(videoStorageKey, JSON.stringify(existingVideos));
          console.log(`💾 Saved regenerated video to localStorage for ${segmentId}-${imageId}`);
          
          // Clean up old videos (keep only last 50 videos per project)
          const videoEntries = Object.entries(existingVideos);
          if (videoEntries.length > 50) {
            const sortedVideos = videoEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            const videosToKeep = sortedVideos.slice(0, 50);
            const cleanedVideos = Object.fromEntries(videosToKeep);
            localStorage.setItem(videoStorageKey, JSON.stringify(cleanedVideos));
            console.log(`🧹 Cleaned up old videos, kept ${videosToKeep.length} most recent`);
          }
        } catch (error) {
          console.error('Error saving video to localStorage:', error);
        }

        console.log(`Successfully regenerated video for segment ${segmentId}`);
      } else {
        throw new Error('No video key returned from API');
      }
    } catch (error) {
      console.error('Error regenerating video:', error);
      // Error handling would be implemented here similar to generateVideo
    } finally {
      // Clean up generating state
      setGeneratingVideos(prev => {
        const newSet = new Set(prev);
        // Remove any loading nodes from generating set
        nodes.forEach(node => {
          if (node.data?.nodeState === 'loading' && node.data?.title === 'Regenerating Video') {
            newSet.delete(node.id);
          }
        });
        return newSet;
      });
    }
  }, [nodes, edges, setNodes, setEdges, setGeneratingVideos, setTemporaryVideos, saveGenerationState, removeGenerationState]);

  return {
    generateVideo,
    regenerateVideo
  };
};
