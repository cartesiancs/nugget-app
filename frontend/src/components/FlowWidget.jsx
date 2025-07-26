import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import LoadingSpinner from "./LoadingSpinner";
import { projectApi } from "../services/project";
import { imageApi } from "../services/image";
import { videoApi } from "../services/video-gen";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import SegmentNode from "./FlowWidget/SegmentNode";
import ImageNode from "./FlowWidget/ImageNode";
import VideoNode from "./FlowWidget/VideoNode";
import AddImageNode from "./FlowWidget/AddImageNode";
import AddVideoNode from "./FlowWidget/AddVideoNode";

function FlowWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // We only track messages via setter; value itself not needed for UI rendering
  const [, setFlowMessages] = useState([]); // track assistant messages
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [projectData, setProjectData] = useState(null);
  const [regeneratingImages, setRegeneratingImages] = useState(new Set());
  const [regeneratingVideos, setRegeneratingVideos] = useState(new Set());
  const [creatingImages, setCreatingImages] = useState(new Set());
  const [creatingVideos, setCreatingVideos] = useState(new Set());
  const [temporaryVideos, setTemporaryVideos] = useState(new Map()); // Store temporary videos: key = `${segmentId}-${imageId}`, value = videoUrl

  // New state for all fetched data
  const [allProjectData, setAllProjectData] = useState({
    segments: [],
    images: [],
    videos: []
  });

  // Helper function to refresh project data
  const refreshProjectData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping API calls");
      return;
    }

    // Get project ID from localStorage
    let projectId;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      console.log("No project ID found in localStorage");
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log("Fetching project segmentations and related images/videos for project ID:", projectId);
    try {
      setLoading(true);
      
      // Fetch project segmentations, images, and videos in parallel
      const [
        segmentationsData,
        imagesData,
        videosData
      ] = await Promise.all([
        projectApi.getProjectSegmentations(projectId),
        projectApi.getProjectImages(projectId),
        projectApi.getProjectVideos(projectId)
      ]);

      console.log("Project data fetched successfully:");
      console.log("Segmentations:", segmentationsData);
      console.log("Images:", imagesData);
      console.log("Videos:", videosData);

      // Extract segments from the first segmentation
      let segments = [];
      if (segmentationsData && segmentationsData.success && segmentationsData.data && segmentationsData.data.length > 0) {
        const firstSegmentation = segmentationsData.data[0];
        if (firstSegmentation.segments && Array.isArray(firstSegmentation.segments)) {
          segments = firstSegmentation.segments;
        }
      }

      setAllProjectData({
        segments: segments,
        images: imagesData?.data || [],
        videos: videosData?.data || []
      });

      // Keep the old projectData for backward compatibility
      setProjectData({ success: true, project: { segments: segments } });
      
    } catch (error) {
      console.error("Failed to fetch project data:", error);
      setError("Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Toggle attribute on the custom element so we can style it via CSS
  useEffect(() => {
    const hostEl = document.querySelector("react-flow-widget");
    if (hostEl) {
      hostEl.setAttribute("data-open", open ? "true" : "false");
    }
  }, [open]);

  // Re-add global open / close custom event listeners for external control
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    window.addEventListener("flowWidget:open", handleOpen);
    window.addEventListener("flowWidget:close", handleClose);

    return () => {
      window.removeEventListener("flowWidget:open", handleOpen);
      window.removeEventListener("flowWidget:close", handleClose);
    };
  }, []);

  // Load data from API (no localStorage fallback)
  const flowData = useMemo(() => {
    console.log("🔄 flowData useMemo called, allProjectData:", allProjectData);
    
    // 1. Get segments from segmentation API response
    const segments = allProjectData.segments.map(seg => ({
      ...seg,
      id: seg.segmentId || seg.id, // Use segmentId for mapping
      visual: seg.visual || '',
      narration: seg.narration || '',
      animation: seg.animation || ''
    }));
    console.log("📋 Processed segments:", segments);

    // 2. Build images/videos lookup by segmentId and store image details
    const images = {};
    const imageDetails = {};
    const allImagesBySegment = {};
    
    if (Array.isArray(allProjectData.images)) {
      allProjectData.images.forEach(img => {
        if (img && img.success && img.s3Key && img.uuid) {
          // Extract segmentId from uuid (handles both 'seg-2' and 'seg-2-1234567890' formats)
          const segmentId = img.uuid.replace(/^seg-(\d+)(?:-\d+)?$/, '$1');
          
          // Initialize arrays if they don't exist
          if (!allImagesBySegment[segmentId]) {
            allImagesBySegment[segmentId] = [];
          }
          
          // Add this image to the segment's image list
          allImagesBySegment[segmentId].push({
            id: img.id,
            url: `https://ds0fghatf06yb.cloudfront.net/${img.s3Key}`,
            visualPrompt: img.visualPrompt,
            artStyle: img.artStyle,
            s3Key: img.s3Key,
            uuid: img.uuid,
            isPrimary: !img.uuid.includes('-') // Consider images without timestamp as primary
          });
        }
      });
      
      // For backward compatibility, keep the first image as the main one
      Object.keys(allImagesBySegment).forEach(segmentId => {
        const segmentImages = allImagesBySegment[segmentId];
        if (segmentImages.length > 0) {
          // Sort by primary first, then by creation time (uuid timestamp)
          segmentImages.sort((a, b) => {
            if (a.isPrimary && !b.isPrimary) return -1;
            if (!a.isPrimary && b.isPrimary) return 1;
            return 0;
          });
          
          const primaryImage = segmentImages[0];
          images[segmentId] = primaryImage.url;
          imageDetails[segmentId] = {
            id: primaryImage.id,
            visualPrompt: primaryImage.visualPrompt,
            artStyle: primaryImage.artStyle,
            s3Key: primaryImage.s3Key,
            allImages: segmentImages // Store all images for the segment
          };
        }
      });
    }
    const videos = {};
    const videoDetails = {};
    if (Array.isArray(allProjectData.videos)) {
      allProjectData.videos.forEach(video => {
        if (
          video && video.success && video.uuid &&
          Array.isArray(video.videoFiles) && video.videoFiles.length > 0 && video.videoFiles[0].s3Key
        ) {
          const segmentId = video.uuid.replace(/^seg-/, '');
          videos[segmentId] = `https://ds0fghatf06yb.cloudfront.net/${video.videoFiles[0].s3Key}`;
          videoDetails[segmentId] = {
            id: video.id,
            artStyle: video.artStyle,
            imageS3Key: video.imageS3Key || null,
          };
        }
      });
    }
    console.log("🖼️ Images map:", images);
    console.log("📝 Image details:", imageDetails);
    console.log("🎬 Videos map:", videos);
    
    // Add temporary videos to the videos map
    temporaryVideos.forEach((videoUrl, key) => {
      videos[key] = videoUrl;
    });
    
    console.log("🎬 Videos map (including temporary):", videos);
    return { segments, images, videos, imageDetails, videoDetails };
  }, [allProjectData, temporaryVideos]);

  // Handle image regeneration
  const handleRegenerateImage = useCallback(async (imageId, segmentData) => {
    if (!isAuthenticated || regeneratingImages.has(imageId)) return;

    // Get project ID from localStorage
    let projectId;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log("🔄 Regenerating image (overwrite via generateImage + PATCH):", imageId, segmentData);
    setRegeneratingImages(prev => new Set(prev).add(imageId));
    try {
      // 1. Overwrite the image in S3
      const genResponse = await imageApi.generateImage({
        visual_prompt: segmentData.visual,
        art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
        uuid: `seg-${segmentData.id}`,
        project_id: projectId,
      });
      console.log("✅ Image generation (overwrite) successful:", genResponse);
      // 2. PATCH to update metadata with s3_key
      if (genResponse && genResponse.s3_key) {
        await imageApi.regenerateImage({
          id: imageId,
          visual_prompt: segmentData.visual,
          art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
          s3_key: genResponse.s3_key,
          project_id: projectId,
        });
      }
      // 3. Refresh project data to get the updated image
      await refreshProjectData();
      setFlowMessages(prev => [
        ...prev,
        {
          type: "assistant",
          content: `Image for scene ${segmentData.id} regenerated, overwritten, and metadata updated successfully!`,
        },
      ]);
    } catch (error) {
      console.error("❌ Image regeneration (overwrite+patch) failed:", error);
      setError(`Failed to regenerate image: ${error.message}`);
    } finally {
      setRegeneratingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  }, [isAuthenticated, regeneratingImages, refreshProjectData]);

  // Handle video regeneration
  const handleRegenerateVideo = useCallback(async (videoId, segmentData) => {
    if (!isAuthenticated || regeneratingVideos.has(videoId)) return;

    // Get project ID from localStorage
    let projectId;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      setError("No project selected. Please select a project first.");
      return;
    }

    setRegeneratingVideos(prev => new Set(prev).add(videoId));
    try {
      // Always use the s3_key of the connected image for imageS3Key
      const imageS3Key = flowData.imageDetails?.[segmentData.id]?.s3Key || segmentData.imageS3Key;
      
      const genResponse = await videoApi.generateVideo({
        animation_prompt: segmentData.animation,
        art_style: segmentData.artStyle,
        imageS3Key,
        uuid: `seg-${segmentData.id}`,
        project_id: projectId,
      });
      if (genResponse && genResponse.s3Keys && genResponse.s3Keys.length > 0) {
        console.log("🔄 Video re-generation response:", genResponse.s3Keys);
        await videoApi.regenerateVideo({
          id: videoId,
          animation_prompt: segmentData.animation,
          art_style: segmentData.artStyle,
          image_s3_key: imageS3Key,
          video_s3_keys: [...genResponse.s3Keys],
          project_id: projectId,
        });
      }
      // 3. Refresh project data to get the updated video
      await refreshProjectData();
      setFlowMessages(prev => [
        ...prev,
        {
          type: "assistant",
          content: `Video for scene ${segmentData.id} regenerated, overwritten, and metadata updated successfully!`,
        },
      ]);
    } catch (error) {
      setError(`Failed to regenerate video: ${error.message}`);
    } finally {
      setRegeneratingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  }, [isAuthenticated, regeneratingVideos, flowData.imageDetails, refreshProjectData]);

  // Handle creating new image for a segment
  const handleCreateNewImage = useCallback(async (segmentId, segmentData) => {
    if (!isAuthenticated) return;

    // Get project ID from localStorage
    let projectId;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log("🆕 Creating new image for segment:", segmentId, segmentData);
    setCreatingImages(prev => new Set(prev).add(segmentId));
    try {
      // Generate new image with unique timestamp to avoid overwriting
      const timestamp = Date.now();
      const uniqueUuid = `seg-${segmentId}-${timestamp}`;
      
      const genResponse = await imageApi.generateImage({
        visual_prompt: segmentData.visual,
        art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
        uuid: uniqueUuid,
        project_id: projectId,
      });
      console.log("✅ New image generation successful:", genResponse);
      
      // Refresh project data to get the new image
      await refreshProjectData();
      setFlowMessages(prev => [
        ...prev,
        {
          type: "assistant",
          content: `New image for scene ${segmentId} created successfully!`,
        },
      ]);
    } catch (error) {
      console.error("❌ New image creation failed:", error);
      setError(`Failed to create new image: ${error.message}`);
    } finally {
      setCreatingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(segmentId);
        return newSet;
      });
    }
  }, [isAuthenticated, refreshProjectData]);

  // Handle making an image primary
  const handleMakePrimary = useCallback(async (imageId, segmentId, allImages) => {
    if (!isAuthenticated) return;

    console.log("⭐ Making image primary:", imageId, "for segment:", segmentId);
    try {
      // Find the image to make primary
      const targetImage = allImages.find(img => img.id === imageId);
      if (!targetImage) {
        console.error("Image not found:", imageId);
        return;
      }

      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        if (storedProject) {
          const project = JSON.parse(storedProject);
          projectId = project.id;
        }
      } catch (error) {
        console.error("Error parsing project from localStorage:", error);
      }

      if (!projectId) {
        setError("No project selected. Please select a project first.");
        return;
      }

      // Update the image metadata to make it primary by changing the UUID to the original segment format
      await imageApi.regenerateImage({
        id: imageId,
        visual_prompt: targetImage.visualPrompt,
        art_style: targetImage.artStyle || 'cinematic photography with soft lighting',
        s3_key: targetImage.s3Key, // Use the existing image's s3_key
        uuid: `seg-${segmentId}`, // Change UUID to original format to make it primary
      });

      // Refresh project data to get the updated image
      await refreshProjectData();
      setFlowMessages(prev => [
        ...prev,
        {
          type: "assistant",
          content: `Image for scene ${segmentId} is now primary!`,
        },
      ]);
    } catch (error) {
      console.error("❌ Failed to make image primary:", error);
      setError(`Failed to make image primary: ${error.message}`);
    }
  }, [isAuthenticated, refreshProjectData]);

  // Handle creating new video for a specific image
  const handleCreateNewVideo = useCallback(async (segmentId, imageId, segmentData) => {
    if (!isAuthenticated || creatingVideos.has(imageId)) return;

    // Get project ID from localStorage
    let projectId;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log("🎬 Creating new video for image:", imageId, "segment:", segmentId);
    setCreatingVideos(prev => new Set(prev).add(imageId));
    try {
      // Find the image details to get the s3_key
      const imageDetail = flowData.imageDetails[segmentId];
      const targetImage = imageDetail?.allImages?.find(img => img.id === imageId);
      
      if (!targetImage) {
        throw new Error("Image not found");
      }

      // Generate new video with unique timestamp
      const timestamp = Date.now();
      const uniqueUuid = `seg-${segmentId}-${timestamp}`;
      
      const genResponse = await videoApi.generateVideo({
        animation_prompt: segmentData.animation,
        art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
        imageS3Key: targetImage.s3Key,
        uuid: uniqueUuid,
        project_id: projectId,
      });
      
      console.log("✅ New video generation successful:", genResponse);
      
      // Store the generated video URL in temporary videos state
      if (genResponse && genResponse.s3Keys && genResponse.s3Keys.length > 0) {
        const videoUrl = `https://ds0fghatf06yb.cloudfront.net/${genResponse.s3Keys[0]}`;
        const videoKey = `${segmentId}-${imageId}`;
        setTemporaryVideos(prev => new Map(prev).set(videoKey, videoUrl));
        
        setFlowMessages(prev => [
          ...prev,
          {
            type: "assistant",
            content: `New video for scene ${segmentId} generated successfully! (Preview mode - not saved to database)`,
          },
        ]);
      }
    } catch (error) {
      console.error("❌ New video creation failed:", error);
      setError(`Failed to create new video: ${error.message}`);
    } finally {
      setCreatingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  }, [isAuthenticated, refreshProjectData, flowData.imageDetails, creatingVideos]);

  // Create nodes and edges from flow data
  const createFlowElements = useCallback(() => {
    console.log("🎯 createFlowElements called with flowData:", flowData);
    const newNodes = [];
    const newEdges = [];
    
    // Create custom node types with regeneration callback
    const nodeTypes = {
      segmentNode: SegmentNode,
      imageNode: (props) => <ImageNode {...props} onRegenerateImage={handleRegenerateImage} regeneratingImages={regeneratingImages} />,
      videoNode: VideoNode,
    };

    if (flowData.segments && flowData.segments.length > 0) {
      console.log("📊 Creating nodes for", flowData.segments.length, "segments");
      const nodeSpacing = 220; // horizontal space between columns
      const rowSpacing = 300; // vertical space between images
      const startX = 50;
      const startY = 50;
      const segmentSpacing = 600; // Space between segments
      
      flowData.segments.forEach((segment, segIndex) => {
        const x = startX;
        const y = startY + segIndex * segmentSpacing; // segmentSpacing = enough vertical space for all images/videos
        // Segment node
        newNodes.push({
          id: `segment-${segment.id}`,
          type: "segmentNode",
          position: { x, y },
          data: {
            ...segment,
            status: (flowData.videos[segment.id] ? "completed" : flowData.images[segment.id] ? "generating" : "pending"),
          },
        });
        // Add Image node to the right of segment
        const addImageX = x + nodeSpacing;
        newNodes.push({
          id: `add-image-${segment.id}`,
          type: "addImageNode",
          position: { x: addImageX, y },
          data: {
            segmentId: segment.id,
            segmentData: {
              id: segment.id,
              visual: segment.visual,
              artStyle: 'cinematic photography with soft lighting'
            },
            hasExistingImages: !!flowData.images[segment.id]
          },
        });
        newEdges.push({
          id: `segment-${segment.id}-to-add-image-${segment.id}`,
          source: `segment-${segment.id}`,
          target: `add-image-${segment.id}`,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: { stroke: "#8b5cf6", strokeWidth: 3 }
        });
        // If segment has images, stack them vertically to the right of add image node
        const imageDetail = flowData.imageDetails[segment.id];
        if (flowData.images[segment.id] && imageDetail?.allImages) {
          imageDetail.allImages.forEach((image, imageIndex) => {
            const imageX = addImageX + nodeSpacing;
            const imageY = y + imageIndex * rowSpacing; // <--- THIS IS THE KEY
            newNodes.push({
              id: `image-${segment.id}-${image.id}`,
              type: "imageNode",
              position: { x: imageX, y: imageY },
              data: {
                segmentId: segment.id,
                imageUrl: image.url,
                imageId: image.id,
                isPrimary: image.isPrimary,
                allImages: imageDetail.allImages,
                segmentData: {
                  id: segment.id,
                  visual: segment.visual,
                  animation: segment.animation,
                  artStyle: image.artStyle || 'cinematic photography with soft lighting'
                }
              },
            });
            newEdges.push({
              id: `add-image-${segment.id}-to-image-${segment.id}-${image.id}`,
              source: `add-image-${segment.id}`,
              target: `image-${segment.id}-${image.id}`,
              sourceHandle: 'output',
              targetHandle: 'input',
              style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "5,5" }
            });
            // Video/add-video node to the right of each image
            const imageVideoUrl = flowData.videos[`${segment.id}-${image.id}`] || flowData.videos[segment.id];
            const imageVideoId = flowData?.videoDetails?.[`${segment.id}-${image.id}`]?.id || flowData?.videoDetails?.[segment.id]?.id;
            const videoX = imageX + nodeSpacing;
            if (imageVideoUrl) {
              newNodes.push({
                id: `video-${segment.id}-${image.id}`,
                type: "videoNode",
                position: { x: videoX, y: imageY },
                data: {
                  segmentId: segment.id,
                  imageId: image.id,
                  videoUrl: imageVideoUrl,
                  videoId: imageVideoId,
                  segmentData: {
                    id: segment.id,
                    animation: segment.animation,
                    artStyle: flowData?.videoDetails?.[segment.id]?.artStyle || 'cinematic photography with soft lighting',
                    imageS3Key: image.s3Key,
                  },
                },
              });
              newEdges.push({
                id: `image-${segment.id}-${image.id}-to-video-${segment.id}-${image.id}`,
                source: `image-${segment.id}-${image.id}`,
                target: `video-${segment.id}-${image.id}`,
                sourceHandle: 'output',
                targetHandle: 'input',
                style: { stroke: "#10b981", strokeWidth: 3 },
              });
            } else {
              newNodes.push({
                id: `add-video-${segment.id}-${image.id}`,
                type: "addVideoNode",
                position: { x: videoX, y: imageY },
                data: {
                  segmentId: segment.id,
                  imageId: image.id,
                  segmentData: {
                    id: segment.id,
                    animation: segment.animation,
                    artStyle: image.artStyle || 'cinematic photography with soft lighting'
                  }
                },
              });
              newEdges.push({
                id: `image-${segment.id}-${image.id}-to-add-video-${segment.id}-${image.id}`,
                source: `image-${segment.id}-${image.id}`,
                target: `add-video-${segment.id}-${image.id}`,
                sourceHandle: 'output',
                targetHandle: 'input',
                style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "5,5" },
              });
            }
          });
        }
      });
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges]);

  // Add a stable callback to refresh project data after edit
  const handleAfterImageEdit = useCallback(async () => {
    await refreshProjectData();
  }, [refreshProjectData]);

  // Function to fetch project segmentations and related images/videos
  const fetchAllProjectData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping API calls");
      return;
    }

    // Get project ID from localStorage
    let projectId;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      console.log("No project ID found in localStorage");
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log("Fetching project segmentations and related images/videos for project ID:", projectId);
    try {
      setLoading(true);
      
      // Fetch project segmentations, images, and videos in parallel
      const [
        segmentationsData,
        imagesData,
        videosData
      ] = await Promise.all([
        projectApi.getProjectSegmentations(projectId),
        projectApi.getProjectImages(projectId),
        projectApi.getProjectVideos(projectId)
      ]);

      console.log("Project data fetched successfully:");
      console.log("Segmentations:", segmentationsData);
      console.log("Images:", imagesData);
      console.log("Videos:", videosData);

      // Extract segments from the first segmentation
      let segments = [];
      if (segmentationsData && segmentationsData.success && segmentationsData.data && segmentationsData.data.length > 0) {
        const firstSegmentation = segmentationsData.data[0];
        if (firstSegmentation.segments && Array.isArray(firstSegmentation.segments)) {
          segments = firstSegmentation.segments;
        }
      }

      setAllProjectData({
        segments: segments,
        images: imagesData?.data || [],
        videos: videosData?.data || []
      });

      // Keep the old projectData for backward compatibility
      setProjectData({ success: true, project: { segments: segments } });
      
    } catch (error) {
      console.error("Failed to fetch project data:", error);
      setError("Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update nodeTypes to pass onAfterEdit to ImageNode and VideoNode
  const nodeTypes = useMemo(() => ({
    segmentNode: SegmentNode,
    imageNode: (props) => <ImageNode {...props} onRegenerateImage={handleRegenerateImage} regeneratingImages={regeneratingImages} onAfterEdit={handleAfterImageEdit} onMakePrimary={handleMakePrimary} isPrimary={props.data?.isPrimary} />,
    videoNode: (props) => <VideoNode {...props} onRegenerateVideo={handleRegenerateVideo} regeneratingVideos={regeneratingVideos} onAfterEdit={handleAfterImageEdit} />,
    addImageNode: (props) => <AddImageNode {...props} onCreateNewImage={handleCreateNewImage} creatingImages={creatingImages} hasExistingImages={props.data?.hasExistingImages} />,
    addVideoNode: (props) => <AddVideoNode {...props} onCreateNewVideo={handleCreateNewVideo} creatingVideos={creatingVideos} />,
  }), [handleRegenerateImage, regeneratingImages, handleAfterImageEdit, handleRegenerateVideo, regeneratingVideos, handleCreateNewImage, creatingImages, handleMakePrimary, handleCreateNewVideo, creatingVideos]);

  // Initialize flow when data changes
  useEffect(() => {
    createFlowElements();
  }, [createFlowElements, projectData]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleFlowAction = async (action) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate

      setFlowMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `Flow action "${action}" completed successfully!`,
        },
      ]);
    } catch (error) {
      setError(error.message || "Flow action failed");
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowStats = () => {
    const totalSegments = flowData.segments.length;
    const imagesGenerated = Object.keys(flowData.images).length;
    const videosGenerated = Object.keys(flowData.videos).length;
    
    return {
      totalSegments,
      imagesGenerated,
      videosGenerated,
      completionRate: totalSegments > 0 ? Math.round((videosGenerated / totalSegments) * 100) : 0,
    };
  };

  const stats = getWorkflowStats();

  useEffect(() => {
    fetchAllProjectData();
  }, [fetchAllProjectData]);

  // Listen for sandbox open/close events
  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => {
      setOpen(false);
      // Clear temporary videos when closing the widget
      setTemporaryVideos(new Map());
    };
    window.addEventListener('flowWidget:open', openHandler);
    window.addEventListener('flowWidget:close', closeHandler);
    return () => {
      window.removeEventListener('flowWidget:open', openHandler);
      window.removeEventListener('flowWidget:close', closeHandler);
    };
  }, []);

  // Reflect open state on host element attribute for CSS
  useEffect(() => {
    const host = document.querySelector('react-flow-widget');
    if (host) host.setAttribute('data-open', open ? 'true' : 'false');
  }, [open]);

  return (
    <div className="z-10">
      {/* Floating button */}
      {!open && (
        <button
          className="fixed bottom-10 right-24 w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-2xl flex items-center justify-center shadow-2xl z-[1001]"
          aria-label="Open flow widget"
          onClick={() => setOpen(true)}
          style={{ boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)" }}
        >
          REACT FLOW
        </button>
      )}

      {/* Sliding sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-screen bg-[#0d0d0d] text-white transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[1000] flex flex-col shadow-xl`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0">
          <h2 className="text-lg font-semibold">Video Creation Flow</h2>
          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-6 h-6 rounded-full border border-gray-600"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <span className="text-gray-300 text-sm hidden sm:block">
                  {user.name || user.email}
                </span>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={logout}
                className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                title="Sign Out"
              >
                Sign Out
              </button>
            )}
            <button
              className="text-white text-xl focus:outline-none"
              aria-label="Close flow widget"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 flex flex-col">
            {/* Stats bar */}
            {isAuthenticated && stats.totalSegments > 0 && (
              <div className="p-4 border-b border-gray-800 bg-gray-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">Workflow Progress</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      Segments: <span className="text-white">{stats.totalSegments}</span>
                    </span>
                    <span className="text-gray-400">
                      Images: <span className="text-yellow-400">{stats.imagesGenerated}</span>
                    </span>
                    <span className="text-gray-400">
                      Videos: <span className="text-green-400">{stats.videosGenerated}</span>
                    </span>
                    <span className="text-gray-400">
                      Completion: <span className="text-purple-400">{stats.completionRate}%</span>
                    </span>
                    {temporaryVideos.size > 0 && (
                      <button
                        onClick={() => setTemporaryVideos(new Map())}
                        className="text-yellow-400 hover:text-yellow-300 text-xs underline"
                        title="Clear temporary videos"
                      >
                        Clear Previews ({temporaryVideos.size})
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>
            )}



            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-400 text-center p-4">
                    <p>{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-sm text-purple-400 hover:text-purple-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="p-4 space-y-4">
                  <div className="text-center p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Video Creation Flow
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Sign in to visualize your video creation workflow
                      </p>
                    </div>
                    <ChatLoginButton />
                  </div>
                </div>
              ) : flowData.segments.length === 0 ? (
                <div className="p-4 space-y-4">
                  <div className="text-center p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      No Workflow Data
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Start creating a video in the chat widget to see the workflow flow here.
                    </p>
                    <button
                      onClick={() => handleFlowAction("Refresh Data")}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <LoadingSpinner />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        "🔄 Refresh Data"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    edgesFocusable={true}
                    edgesUpdatable={true}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background 
                      color="#374151" 
                      gap={20} 
                      variant="dots"
                    />
                    <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg [&>button]:!bg-gray-700 [&>button]:!text-white [&>button]:!border-gray-600 [&>button:hover]:!bg-gray-600" />
                    <MiniMap 
                      className="bg-gray-800 border border-gray-700 rounded-lg"
                      nodeColor="#8b5cf6"
                      maskColor="rgba(0, 0, 0, 0.5)"
                    />
                  </ReactFlow>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlowWidget;