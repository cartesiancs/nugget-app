import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import LoadingSpinner from "./LoadingSpinner";
import { projectApi } from "../services/project";
import { chatApi } from "../services/chat";
import ModelSelector from "./ModelSelector";
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
// Import new clean node components
import NodeImage from "./FlowWidget/Node_Image";
import NodeVideo from "./FlowWidget/Node_Video";
import NodeScript from "./FlowWidget/Node_Script";
import NodeSegment from "./FlowWidget/Node_Segment";
import NodeConcept from "./FlowWidget/Node_Concept";
import NodeChat from "./FlowWidget/NodeChat";
import FlowWidgetSidebar from "./FlowWidget/FlowWidgetSidebar";
import ChatNode from "./FlowWidget/ChatNode";
import { assets } from "../assets/assets";
import FlowWidgetBottomToolbar from "./FlowWidget/FlowWidgetBottomToolbar";

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
  const [addModalOpen, setAddModalOpen] = useState(false);
  // Model selection states
  const [selectedImageModel, setSelectedImageModel] = useState(
    chatApi.getDefaultModel("IMAGE"),
  );
  const [selectedVideoModel, setSelectedVideoModel] = useState(
    chatApi.getDefaultModel("VIDEO"),
  );
  // ReactFlow instance for dynamic fitView control
  const [rfInstance, setRfInstance] = useState(null);

  // Node chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNodeId, setChatNodeId] = useState(null);
  const [chatNodeType, setChatNodeType] = useState(null);

  // Selected node state for sidebar
  const [selectedNode, setSelectedNode] = useState(null);

  // New state for all fetched data
  const [allProjectData, setAllProjectData] = useState({
    segments: [],
    images: [],
    videos: [],
  });

  // Project name state
  const [projectName, setProjectName] = useState("Untitled");

  // Helper function to refresh project data
  const refreshProjectData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping API calls");
      return;
    }

    // Get project ID and name from localStorage
    let projectId;
    let projectName = "Untitled";
    try {
      const storedProject = localStorage.getItem(
        "project-store-selectedProject",
      );
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
        projectName = project.name || project.title || "Untitled";
        setProjectName(projectName);
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      console.log("No project ID found in localStorage");
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log(
      "Fetching project segmentations and related images/videos for project ID:",
      projectId,
    );
    try {
      setLoading(true);

      // Fetch project segmentations, images, and videos in parallel
      const [segmentationsData, imagesData, videosData] = await Promise.all([
        projectApi.getProjectSegmentations(projectId),
        projectApi.getProjectImages(projectId),
        projectApi.getProjectVideos(projectId),
      ]);

      console.log("Project data fetched successfully:");
      console.log("Segmentations:", segmentationsData);
      console.log("Images:", imagesData);
      console.log("Videos:", videosData);

      // Extract segments from the first segmentation
      let segments = [];
      if (
        segmentationsData &&
        segmentationsData.success &&
        segmentationsData.data &&
        segmentationsData.data.length > 0
      ) {
        const firstSegmentation = segmentationsData.data[0];
        if (
          firstSegmentation.segments &&
          Array.isArray(firstSegmentation.segments)
        ) {
          segments = firstSegmentation.segments;
        }
      }

      setAllProjectData({
        segments: segments,
        images: imagesData?.data || [],
        videos: videosData?.data || [],
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
    const segments = allProjectData.segments.map((seg) => ({
      ...seg,
      id: seg.segmentId || seg.id, // Use segmentId for mapping
      visual: seg.visual || "",
      narration: seg.narration || "",
      animation: seg.animation || "",
    }));
    console.log("📋 Processed segments:", segments);

    // 2. Build images/videos lookup by segmentId and store image details
    const images = {};
    const imageDetails = {};
    const allImagesBySegment = {};

    if (Array.isArray(allProjectData.images)) {
      allProjectData.images.forEach((img) => {
        if (img && img.success && img.s3Key && img.uuid) {
          // Extract segmentId from uuid (handles both 'seg-2' and 'seg-2-1234567890' formats)
          const segmentId = img.uuid.replace(/^seg-(\d+)(?:-\d+)?$/, "$1");

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
            isPrimary: !img.uuid.includes("-"), // Consider images without timestamp as primary
          });
        }
      });

      // For backward compatibility, keep the first image as the main one
      Object.keys(allImagesBySegment).forEach((segmentId) => {
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
            allImages: segmentImages, // Store all images for the segment
          };
        }
      });
    }
    const videos = {};
    const videoDetails = {};
    if (Array.isArray(allProjectData.videos)) {
      allProjectData.videos.forEach((video) => {
        if (
          video &&
          video.success &&
          video.uuid &&
          Array.isArray(video.videoFiles) &&
          video.videoFiles.length > 0 &&
          video.videoFiles[0].s3Key
        ) {
          const segmentId = video.uuid.replace(/^seg-/, "");
          videos[
            segmentId
          ] = `https://ds0fghatf06yb.cloudfront.net/${video.videoFiles[0].s3Key}`;
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
  const handleRegenerateImage = useCallback(
    async (imageId, segmentData) => {
      if (!isAuthenticated || regeneratingImages.has(imageId)) return;

      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem(
          "project-store-selectedProject",
        );
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

      console.log("🔄 Regenerating image:", imageId, segmentData);
      setRegeneratingImages((prev) => new Set(prev).add(imageId));
      try {
        let genResponse;

        // Check if we already have a new s3_key from the ImageNode edit
        if (segmentData.s3Key) {
          console.log(
            "✅ Using existing s3_key from ImageNode edit:",
            segmentData.s3Key,
          );
          genResponse = { s3_key: segmentData.s3Key };
        } else {
          // Generate new image
          genResponse = await chatApi.generateImage({
            visual_prompt: segmentData.visual,
            art_style:
              segmentData.artStyle ||
              "cinematic photography with soft lighting",
            uuid: `seg-${segmentData.id}`,
            project_id: projectId,
            model: selectedImageModel,
          });
          console.log("✅ Image generation successful:", genResponse);
        }

        // Update the image metadata if we have a new s3_key
        if (genResponse && genResponse.s3_key) {
          // Note: The new unified API doesn't have a separate regenerateImage endpoint
          // The image is regenerated directly through the generateImage call
          console.log(
            "✅ Image regeneration completed with s3_key:",
            genResponse.s3_key,
          );
        }

        // Refresh project data to get the updated image
        await refreshProjectData();
        setFlowMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: `Image for scene ${segmentData.id} regenerated successfully!`,
          },
        ]);
      } catch (error) {
        console.error("❌ Image regeneration (overwrite+patch) failed:", error);
        setError(`Failed to regenerate image: ${error.message}`);
      } finally {
        setRegeneratingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    },
    [isAuthenticated, regeneratingImages, refreshProjectData],
  );

  // Handle video regeneration
  const handleRegenerateVideo = useCallback(
    async (videoId, segmentData) => {
      if (!isAuthenticated || regeneratingVideos.has(videoId)) return;

      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem(
          "project-store-selectedProject",
        );
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

      setRegeneratingVideos((prev) => new Set(prev).add(videoId));
      try {
        // Always use the s3_key of the connected image for imageS3Key
        const imageS3Key =
          flowData.imageDetails?.[segmentData.id]?.s3Key ||
          segmentData.imageS3Key;

        const genResponse = await chatApi.generateVideo({
          animation_prompt: segmentData.animation,
          art_style: segmentData.artStyle,
          image_s3_key: imageS3Key,
          uuid: `seg-${segmentData.id}`,
          project_id: projectId,
          model: selectedVideoModel,
        });
        if (genResponse && genResponse.s3_key) {
          console.log("🔄 Video re-generation response:", genResponse.s3_key);
          // Note: The new unified API doesn't have a separate regenerateVideo endpoint
          // The video is regenerated directly through the generateVideo call
        }
        // 3. Refresh project data to get the updated video
        await refreshProjectData();
        setFlowMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content: `Video for scene ${segmentData.id} regenerated, overwritten, and metadata updated successfully!`,
          },
        ]);
      } catch (error) {
        setError(`Failed to regenerate video: ${error.message}`);
      } finally {
        setRegeneratingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    },
    [
      isAuthenticated,
      regeneratingVideos,
      flowData.imageDetails,
      refreshProjectData,
    ],
  );

  // Handle creating new image for a segment
  const handleCreateNewImage = useCallback(
    async (segmentId, segmentData) => {
      if (!isAuthenticated) return;

      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem(
          "project-store-selectedProject",
        );
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
      setCreatingImages((prev) => new Set(prev).add(segmentId));
      try {
        // Generate new image with unique timestamp to avoid overwriting
        const timestamp = Date.now();
        const uniqueUuid = `seg-${segmentId}-${timestamp}`;

        const genResponse = await chatApi.generateImage({
          visual_prompt: segmentData.visual,
          art_style:
            segmentData.artStyle || "cinematic photography with soft lighting",
          uuid: uniqueUuid,
          project_id: projectId,
          model: selectedImageModel,
        });
        console.log("✅ New image generation successful:", genResponse);

        // Refresh project data to get the new image
        await refreshProjectData();
        setFlowMessages((prev) => [
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
        setCreatingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(segmentId);
          return newSet;
        });
      }
    },
    [isAuthenticated, refreshProjectData],
  );

  // Handle making an image primary
  const handleMakePrimary = useCallback(
    async (imageId, segmentId, allImages) => {
      if (!isAuthenticated) return;

      console.log(
        "⭐ Making image primary:",
        imageId,
        "for segment:",
        segmentId,
      );
      try {
        // Find the image to make primary
        const targetImage = allImages.find((img) => img.id === imageId);
        if (!targetImage) {
          console.error("Image not found:", imageId);
          return;
        }

        // Get project ID from localStorage
        let projectId;
        try {
          const storedProject = localStorage.getItem(
            "project-store-selectedProject",
          );
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
          art_style:
            targetImage.artStyle || "cinematic photography with soft lighting",
          s3_key: targetImage.s3Key, // Use the existing image's s3_key
          uuid: `seg-${segmentId}`, // Change UUID to original format to make it primary
        });

        // Refresh project data to get the updated image
        await refreshProjectData();
        setFlowMessages((prev) => [
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
    },
    [isAuthenticated, refreshProjectData],
  );

  // Handle creating new video for a specific image
  const handleCreateNewVideo = useCallback(
    async (segmentId, imageId, segmentData) => {
      if (!isAuthenticated || creatingVideos.has(imageId)) return;

      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem(
          "project-store-selectedProject",
        );
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

      console.log(
        "🎬 Creating new video for image:",
        imageId,
        "segment:",
        segmentId,
      );
      setCreatingVideos((prev) => new Set(prev).add(imageId));
      try {
        // Find the image details to get the s3_key
        const imageDetail = flowData.imageDetails[segmentId];
        const targetImage = imageDetail?.allImages?.find(
          (img) => img.id === imageId,
        );

        if (!targetImage) {
          throw new Error("Image not found");
        }

        // Generate new video with unique timestamp
        const timestamp = Date.now();
        const uniqueUuid = `seg-${segmentId}-${timestamp}`;

        const genResponse = await chatApi.generateVideo({
          animation_prompt: segmentData.animation,
          art_style:
            segmentData.artStyle || "cinematic photography with soft lighting",
          image_s3_key: targetImage.s3Key,
          uuid: uniqueUuid,
          project_id: projectId,
          model: selectedVideoModel,
        });

        console.log("✅ New video generation successful:", genResponse);

        // Store the generated video URL in temporary videos state
        if (genResponse && genResponse.s3_key) {
          const videoUrl = `https://ds0fghatf06yb.cloudfront.net/${genResponse.s3_key}`;
          const videoKey = `${segmentId}-${imageId}`;
          setTemporaryVideos((prev) => new Map(prev).set(videoKey, videoUrl));

          setFlowMessages((prev) => [
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
        setCreatingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    },
    [
      isAuthenticated,
      refreshProjectData,
      flowData.imageDetails,
      creatingVideos,
    ],
  );

  // Create nodes and edges from flow data
  const createFlowElements = useCallback(() => {
    console.log("🎯 createFlowElements called with flowData:", flowData);
    const newNodes = [];
    const newEdges = [];

    // Create custom node types with regeneration callback
    const nodeTypes = {
      segmentNode: SegmentNode,
      imageNode: (props) => (
        <NodeImage
          {...props}
          onRegenerateImage={handleRegenerateImage}
          regeneratingImages={regeneratingImages}
        />
      ),
      videoNode: (props) => (
        <NodeVideo
          {...props}
          onRegenerateVideo={handleRegenerateVideo}
          regeneratingVideos={regeneratingVideos}
        />
      ),
    };

    if (flowData.segments && flowData.segments.length > 0) {
      console.log(
        "📊 Creating nodes for",
        flowData.segments.length,
        "segments",
      );
      const nodeSpacing = 400; // Increased vertical space between nodes
      const rowSpacing = 400; // Increased horizontal space between columns
      const startX = 100;
      const startY = 100;
      const segmentSpacing = 800; // Increased space between segments

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
            status: flowData.videos[segment.id]
              ? "completed"
              : flowData.images[segment.id]
              ? "generating"
              : "pending",
          },
        });
        
        // Add Image node below segment
        const addImageY = y + nodeSpacing;
        newNodes.push({
          id: `add-image-${segment.id}`,
          type: "addImageNode",
          position: { x, y: addImageY },
          data: {
            segmentId: segment.id,
            segmentData: {
              id: segment.id,
              visual: segment.visual,
              animation: segment.animation,
              artStyle: "cinematic photography with soft lighting",
            },
            hasExistingImages: !!flowData.images[segment.id],
          },
        });
        
        newEdges.push({
          id: `segment-${segment.id}-to-add-image-${segment.id}`,
          source: `segment-${segment.id}`,
          target: `add-image-${segment.id}`,
          sourceHandle: "output",
          targetHandle: "input",
          style: {
            stroke: "#8b5cf6",
            strokeWidth: 3,
            filter: "drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))",
          },
        });
        
        // If segment has images, stack them horizontally to the right of add image node
        const imageDetail = flowData.imageDetails[segment.id];
        if (flowData.images[segment.id] && imageDetail?.allImages) {
          imageDetail.allImages.forEach((image, imageIndex) => {
            const imageX = x + rowSpacing + imageIndex * rowSpacing; // Horizontal stacking
            const imageY = addImageY; // Same Y level as add image node
            
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
                  artStyle:
                    image.artStyle ||
                    "cinematic photography with soft lighting",
                },
              },
            });
            
            newEdges.push({
              id: `add-image-${segment.id}-to-image-${segment.id}-${image.id}`,
              source: `add-image-${segment.id}`,
              target: `image-${segment.id}-${image.id}`,
              sourceHandle: "output",
              targetHandle: "input",
              style: {
                stroke: "#f59e0b",
                strokeWidth: 2,
                strokeDasharray: "5,5",
                filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))",
              },
            });
            
            // Video/add-video node below each image
            const imageVideoUrl =
              flowData.videos[`${segment.id}-${image.id}`] ||
              flowData.videos[segment.id];
            const imageVideoId =
              flowData?.videoDetails?.[`${segment.id}-${image.id}`]?.id ||
              flowData?.videoDetails?.[segment.id]?.id;
            const videoY = imageY + nodeSpacing; // Below the image
            
            if (imageVideoUrl) {
              newNodes.push({
                id: `video-${segment.id}-${image.id}`,
                type: "videoNode",
                position: { x: imageX, y: videoY },
                data: {
                  segmentId: segment.id,
                  imageId: image.id,
                  videoUrl: imageVideoUrl,
                  videoId: imageVideoId,
                  segmentData: {
                    id: segment.id,
                    animation: segment.animation,
                    artStyle:
                      flowData?.videoDetails?.[segment.id]?.artStyle ||
                      "cinematic photography with soft lighting",
                    imageS3Key: image.s3Key,
                  },
                },
              });
              
              newEdges.push({
                id: `image-${segment.id}-${image.id}-to-video-${segment.id}-${image.id}`,
                source: `image-${segment.id}-${image.id}`,
                target: `video-${segment.id}-${image.id}`,
                sourceHandle: "output",
                targetHandle: "input",
                style: {
                  stroke: "#10b981",
                  strokeWidth: 3,
                  filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))",
                },
              });
            } else {
              newNodes.push({
                id: `add-video-${segment.id}-${image.id}`,
                type: "addVideoNode",
                position: { x: imageX, y: videoY },
                data: {
                  segmentId: segment.id,
                  imageId: image.id,
                  segmentData: {
                    id: segment.id,
                    animation: segment.animation,
                    artStyle:
                      image.artStyle ||
                      "cinematic photography with soft lighting",
                  },
                },
              });
              
              newEdges.push({
                id: `image-${segment.id}-${image.id}-to-add-video-${segment.id}-${image.id}`,
                source: `image-${segment.id}-${image.id}`,
                target: `add-video-${segment.id}-${image.id}`,
                sourceHandle: "output",
                targetHandle: "input",
                style: {
                  stroke: "#10b981",
                  strokeWidth: 2,
                  strokeDasharray: "5,5",
                  filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))",
                },
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

    // Get project ID and name from localStorage
    let projectId;
    let projectName = "Untitled";
    try {
      const storedProject = localStorage.getItem(
        "project-store-selectedProject",
      );
      if (storedProject) {
        const project = JSON.parse(storedProject);
        projectId = project.id;
        projectName = project.name || project.title || "Untitled";
        setProjectName(projectName);
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      console.log("No project ID found in localStorage");
      setError("No project selected. Please select a project first.");
      return;
    }

    console.log(
      "Fetching project segmentations and related images/videos for project ID:",
      projectId,
    );
    try {
      setLoading(true);

      // Fetch project segmentations, images, and videos in parallel
      const [segmentationsData, imagesData, videosData] = await Promise.all([
        projectApi.getProjectSegmentations(projectId),
        projectApi.getProjectImages(projectId),
        projectApi.getProjectVideos(projectId),
      ]);

      console.log("Project data fetched successfully:");
      console.log("Segmentations:", segmentationsData);
      console.log("Images:", imagesData);
      console.log("Videos:", videosData);

      // Extract segments from the first segmentation
      let segments = [];
      if (
        segmentationsData &&
        segmentationsData.success &&
        segmentationsData.data &&
        segmentationsData.data.length > 0
      ) {
        const firstSegmentation = segmentationsData.data[0];
        if (
          firstSegmentation.segments &&
          Array.isArray(firstSegmentation.segments)
        ) {
          segments = firstSegmentation.segments;
        }
      }

      setAllProjectData({
        segments: segments,
        images: imagesData?.data || [],
        videos: videosData?.data || [],
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

  // Handle chat click for nodes
  const handleChatClick = useCallback((nodeId, nodeType) => {
    setChatNodeId(nodeId);
    setChatNodeType(nodeType);
    setChatOpen(true);
  }, []);

  // Handle chat close
  const handleChatClose = useCallback(() => {
    setChatOpen(false);
    setChatNodeId(null);
    setChatNodeType(null);
  }, []);

  // Handle adding new nodes
  const handleAddNode = useCallback(
    (nodeType) => {
      const newNodeId = `${nodeType}-${Date.now()}`;

      // Get viewport center position instead of random position
      let centerX = 400; // fallback
      let centerY = 400; // fallback

      if (rfInstance) {
        const viewport = rfInstance.getViewport();
        const bounds = document
          .querySelector(".react-flow__viewport")
          ?.getBoundingClientRect();

        if (bounds) {
          // Calculate the center of the visible viewport in flow coordinates
          centerX = (-viewport.x + bounds.width / 2) / viewport.zoom;
          centerY = (-viewport.y + bounds.height / 2) / viewport.zoom;
        }
      }

      let newNodeType;
      let newNodeData = {
        id: newNodeId,
        nodeType: nodeType,
        onChatClick: handleChatClick,
      };

      // Set specific data based on node type
      switch (nodeType) {
        case "script":
          newNodeType = "scriptNode";
          newNodeData.content = "New script content...";
          break;
        case "image":
          newNodeType = "imageNode";
          newNodeData.content = "New image content...";
          break;
        case "video":
          newNodeType = "videoNode";
          newNodeData.content = "New video content...";
          break;
        case "segment":
          newNodeType = "segmentNode";
          newNodeData.content = "New segment content...";
          break;
        case "concept":
          newNodeType = "conceptNode";
          newNodeData.content = "New concept content...";
          break;
        default:
          newNodeType = "scriptNode";
          newNodeData.content = "New node...";
      }

      const newNode = {
        id: newNodeId,
        type: newNodeType,
        position: { x: centerX, y: centerY }, // Use viewport center
        data: newNodeData,
      };

      setNodes((prevNodes) => [...prevNodes, newNode]);
    },
    [setNodes, handleChatClick, rfInstance], // Add rfInstance to dependencies
  );

  // Handle adding chat node when clicking on other nodes
  const handleAddChatNode = useCallback(
    (clickedNode) => {
      // Remove any existing chat nodes first
      setNodes((prevNodes) =>
        prevNodes.filter((node) => node.type !== "chatNode"),
      );
      setEdges((prevEdges) =>
        prevEdges.filter((edge) => !edge.target.includes("chat-")),
      );

      // Create new chat node
      const chatNodeId = `chat-${clickedNode.id}-${Date.now()}`;
      const chatNode = {
        id: chatNodeId,
        type: "chatNode",
        position: {
          x: clickedNode.position.x - 40, 
          y: clickedNode.position.y + 350, 
        },
        data: {
          nodeType: clickedNode.type,
          parentNodeId: clickedNode.id,
          onSendMessage: (message, nodeType, model) => {
            console.log(
              "Message sent:",
              message,
              "Node type:",
              nodeType,
              "Model:",
              model,
            );
          },
        },
      };

      // Add chat node to the flow
      setNodes((prevNodes) => [...prevNodes, chatNode]);

      // Create edge connecting the clicked node to the chat node
      const newEdge = {
        id: `${clickedNode.id}-to-${chatNodeId}`,
        source: clickedNode.id,
        target: chatNodeId,
        sourceHandle: "output",
        targetHandle: "input",
        style: {
          stroke: "#3B82F6",
          strokeWidth: 2,
          strokeDasharray: "5,5",
          filter: "drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))",
        },
        type: "smoothstep",
      };

      setEdges((prevEdges) => [...prevEdges, newEdge]);
    },
    [setNodes, setEdges],
  );
  const handleImageGenerated = useCallback(
    ({ segmentId, imageData, segmentData, addImageNodeId }) => {
      console.log("🎨 Auto-creating image node:", {
        segmentId,
        imageData,
        segmentData,
      });

      // Find the AddImageNode to position the new ImageNode below it
      const addImageNode = nodes.find((node) => node.id === addImageNodeId);
      if (!addImageNode) {
        console.error(
          "AddImageNode not found for positioning:",
          addImageNodeId,
        );
        return;
      }

      // Calculate position for the new image node (below AddImageNode)
      const newImageNodePosition = {
        x: addImageNode.position.x + 400, // 400px to the right (horizontal stacking)
        y: addImageNode.position.y, // Same Y level
      };

      // Create new image node ID
      const newImageNodeId = `generated-image-${segmentId}-${
        imageData.id || Date.now()
      }`;

      // Create the new image node
      const newImageNode = {
        id: newImageNodeId,
        type: "imageNode",
        position: newImageNodePosition,
        data: {
          segmentId: segmentId,
          imageUrl: imageData.url,
          imageId: imageData.id,
          isPrimary: false, // Generated images are not primary by default
          segmentData: {
            id: segmentId,
            visual: imageData.prompt,
            animation: segmentData?.animation || "",
            artStyle:
              segmentData?.artStyle ||
              "cinematic photography with soft lighting",
          },
          // Mark as generated for special styling
          isGenerated: true,
          generationModel: imageData.model,
        },
      };

      // Create edge connecting AddImageNode to the new ImageNode
      const newEdge = {
        id: `${addImageNodeId}-to-${newImageNodeId}`,
        source: addImageNodeId,
        target: newImageNodeId,
        sourceHandle: "output",
        targetHandle: "input",
        style: {
          stroke: "#10b981", // Green for generated
          strokeWidth: 3,
          filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))",
          strokeDasharray: "8,4", // Dashed to indicate it's generated
        },
      };

      // Add the new node and edge to the flow
      setNodes((prevNodes) => [...prevNodes, newImageNode]);
      setEdges((prevEdges) => [...prevEdges, newEdge]);

      // Also create an AddVideoNode below the new ImageNode
      const addVideoNodeId = `add-video-${segmentId}-${
        imageData.id || Date.now()
      }`;
      const addVideoNode = {
        id: addVideoNodeId,
        type: "addVideoNode",
        position: {
          x: newImageNodePosition.x, // Same X position
          y: newImageNodePosition.y + 400, // 400px below the image
        },
        data: {
          segmentId: segmentId,
          imageId: imageData.id,
          segmentData: {
            id: segmentId,
            animation: segmentData?.animation || "",
            artStyle:
              imageData?.artStyle ||
              segmentData?.artStyle ||
              "cinematic photography with soft lighting",
          },
        },
      };

      // Create edge connecting ImageNode to AddVideoNode
      const imageToVideoEdge = {
        id: `${newImageNodeId}-to-${addVideoNodeId}`,
        source: newImageNodeId,
        target: addVideoNodeId,
        sourceHandle: "output",
        targetHandle: "input",
        style: {
          stroke: "#8b5cf6", // Purple for video connection
          strokeWidth: 2,
          strokeDasharray: "5,5",
          filter: "drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))",
        },
      };

      // Add the AddVideoNode and its edge
      setNodes((prevNodes) => [...prevNodes, addVideoNode]);
      setEdges((prevEdges) => [...prevEdges, imageToVideoEdge]);

      // Refresh project data to sync with backend
      setTimeout(() => {
        refreshProjectData();
      }, 1000);

      // Show success message
      setFlowMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `✅ New image node created for scene ${segmentId}! Ready for video generation.`,
        },
      ]);
    },
    [nodes, setNodes, setEdges, refreshProjectData, setFlowMessages],
  );

  // Update nodeTypes to include all new clean node components
  const nodeTypes = useMemo(
    () => ({
      // New clean nodes
      imageNode: NodeImage,
      videoNode: NodeVideo,
      scriptNode: NodeScript,
      segmentNode: NodeSegment,
      conceptNode: NodeConcept,
      
      // Legacy nodes (keeping for backward compatibility)
      addImageNode: (props) => (
        <AddImageNode
          {...props}
          id={props.id}
          onCreateNewImage={handleCreateNewImage}
          onImageGenerated={handleImageGenerated}
          creatingImages={creatingImages}
          hasExistingImages={props.data?.hasExistingImages}
        />
      ),
      addVideoNode: (props) => (
        <AddVideoNode
          {...props}
          onCreateNewVideo={handleCreateNewVideo}
          creatingVideos={creatingVideos}
        />
      ),
      chatNode: ChatNode,
    }),
    [
      handleRegenerateImage,
      regeneratingImages,
      handleAfterImageEdit,
      handleRegenerateVideo,
      regeneratingVideos,
      handleCreateNewImage,
      creatingImages,
      handleMakePrimary,
      handleCreateNewVideo,
      creatingVideos,
      handleChatClick,
      handleImageGenerated,
    ],
  );

  // Initialize flow when data changes
  useEffect(() => {
    createFlowElements();
  }, [createFlowElements, projectData]);

  const onConnect = useCallback(
    (params) => {
      // Create the edge
      setEdges((eds) => addEdge(params, eds));

      // Handle data inheritance when connecting AddImageNode to SegmentNode
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      // If connecting SegmentNode to AddImageNode
      if (
        sourceNode?.type === "segmentNode" &&
        targetNode?.type === "addImageNode"
      ) {
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (node.id === params.target && node.data.isStandalone) {
              return {
                ...node,
                data: {
                  ...node.data,
                  segmentId: sourceNode.data.id,
                  segmentData: {
                    id: sourceNode.data.id,
                    visual: sourceNode.data.visual,
                    animation: sourceNode.data.animation,
                    artStyle:
                      sourceNode.data.artStyle ||
                      "cinematic photography with soft lighting",
                  },
                  hasExistingImages: !!flowData.images[sourceNode.data.id],
                  isStandalone: false, // No longer standalone
                },
              };
            }
            return node;
          }),
        );
      }
      if (
        sourceNode?.type === "addImageNode" &&
        targetNode?.type === "segmentNode"
      ) {
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (node.id === params.source && node.data.isStandalone) {
              return {
                ...node,
                data: {
                  ...node.data,
                  segmentId: targetNode.data.id,
                  segmentData: {
                    id: targetNode.data.id,
                    visual: targetNode.data.visual,
                    animation: targetNode.data.animation,
                    artStyle:
                      targetNode.data.artStyle ||
                      "cinematic photography with soft lighting",
                  },
                  hasExistingImages: !!flowData.images[targetNode.data.id],
                  isStandalone: false, // No longer standalone
                },
              };
            }
            return node;
          }),
        );
      }
    },
    [setEdges, nodes, setNodes, flowData.images],
  );

  // Keep the graph within bounds when nodes/edges change
  useEffect(() => {
    if (rfInstance) {
      requestAnimationFrame(() => {
        try {
          // Only fitView on initial load, not when nodes/edges change
          // This prevents zoom reset when clicking elsewhere
          if (nodes.length === 0 && edges.length === 0) {
            rfInstance.fitView({ padding: 0.2, includeHiddenNodes: true });
          }
        } catch (e) {
          // no-op
        }
      });
    }
  }, [rfInstance, nodes.length, edges.length]);

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
      completionRate:
        totalSegments > 0
          ? Math.round((videosGenerated / totalSegments) * 100)
          : 0,
    };
  };

  const stats = getWorkflowStats();

  useEffect(() => {
    fetchAllProjectData();
  }, [fetchAllProjectData]);

  // Update project name when component mounts or project changes
  useEffect(() => {
    try {
      const storedProject = localStorage.getItem(
        "project-store-selectedProject",
      );
      if (storedProject) {
        const project = JSON.parse(storedProject);
        const projectName = project.name || project.title || "Untitled";
        setProjectName(projectName);
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }
  }, []);

  // Listen for sandbox open/close events
  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => {
      setOpen(false);
      // Clear temporary videos when closing the widget
      setTemporaryVideos(new Map());
    };
    window.addEventListener("flowWidget:open", openHandler);
    window.addEventListener("flowWidget:close", closeHandler);
    return () => {
      window.removeEventListener("flowWidget:open", openHandler);
      window.removeEventListener("flowWidget:close", closeHandler);
    };
  }, []);

  // Reflect open state on host element attribute for CSS
  useEffect(() => {
    const host = document.querySelector("react-flow-widget");
    if (host) host.setAttribute("data-open", open ? "true" : "false");
  }, [open]);

  // Handle click outside to close dropdowns
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setLogoDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className='z-10'>
      <div
        className={`fixed top-0 right-0 h-screen w-screen bg-[#0d0d0d] text-white transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[1000] flex flex-col shadow-xl`}
      >
        <div className='flex flex-1 overflow-hidden'>
          {/* Main content area */}
          <div className='flex-1 flex flex-col min-w-[1200px] min-h-[800px]'>
            {/* Left Section: Logo + Title */}
            <div className='fixed top-4 left-4 z-[1001] bg-black/50 backdrop-blur-sm flex items-center gap-3'>
              {/* Logo with Dropdown */}
              <div className='relative'>
                <button
                  onClick={() => setLogoDropdownOpen(!logoDropdownOpen)}
                  className='h-10 flex items-center gap-2 text-white hover:text-gray-300 transition-all duration-200 bg-black/10 px-3 py-2 rounded-lg backdrop-blur-sm'
                >
                  <img
                    src={assets.SandBoxLogo}
                    alt='Logo'
                    className='w-5 h-5'
                  />
                  <svg
                    className={`w-3 h-3 transform transition-transform duration-200 ${
                      logoDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>
                {logoDropdownOpen && (
                  <div className='absolute top-full left-0 mt-1 w-48 bg-gray-800/95 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm z-[1002]'>
                    <div className='py-2'>
                      <button
                        onClick={() => setLogoDropdownOpen(false)}
                        className='w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/70 transition-colors'
                      >
                        Option 1
                      </button>
                      <button
                        onClick={() => setLogoDropdownOpen(false)}
                        className='w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/70 transition-colors'
                      >
                        Option 2
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className='h-6 w-px border-[#FFFFFF]/50 border-1 rounded-lg bg-[#FFFFFF]/50 -ml-4'></div>

              <h2 className='h-10 flex items-center text-lg font-semibold text-white drop-shadow-lg bg-black/50 mr-5 py-2 rounded-lg backdrop-blur-sm px-3'>
                {projectName}
              </h2>
            </div>

            {/* Center Section: Tab Switching + Close Icon */}
            <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-[1001]'>
              <div className='h-10 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-1'>
                <button className='h-8 px-3 py-1 text-sm text-[#94E7ED] bg-[#94E7ED26] rounded-md transition-colors flex items-center gap-2'>
                  <img
                    src={assets.SandBoxTabIcon}
                    alt='Sandbox Icon'
                    className='w-4 h-4'
                  />
                  Sandbox
                </button>
                <button
                  className='h-8 px-3 py-1 text-gray-400 hover:text-white transition-colors flex items-center gap-2 rounded-md hover:bg-gray-700/50'
                  aria-label='Timeline tab'
                  onClick={() => setOpen(false)}
                >
                  <img
                    src={assets.TimelineTabIcon}
                    alt='Timeline Icon'
                    className='w-4 h-4'
                  />
                  Timeline
                </button>
              </div>
            </div>

            {/* Right Section: User + Chat Bot + Blue Button */}
            <div className='fixed top-4 right-4 z-[1001] flex items-center gap-3'>
              {/* User Icon with Dropdown */}
              {isAuthenticated && user ? (
                <div className='relative'>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className='h-10 flex items-center gap-2  hover:border-0 border-0 rounded-lg px-2 py-2 transition-all duration-200 bg-black/50 backdrop-blur-sm'
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt='Profile'
                        className='w-6 h-6 rounded-full border border-gray-600'
                      />
                    ) : (
                      <div className='w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center'>
                        <span className='text-white text-xs font-medium'>
                          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </span>
                      </div>
                    )}
                    <svg
                      className={`w-3 h-3 text-gray-400 transform transition-transform duration-200 ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div className='absolute top-full right-0 mt-1 w-48 bg-gray-800/95 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm z-[1002]'>
                      <div className='py-2'>
                        <div className='px-4 py-2 border-b border-gray-700'>
                          <p className='text-sm font-medium text-white'>
                            {user.name || "User"}
                          </p>
                          <p className='text-xs text-gray-400'>{user.email}</p>
                        </div>
                        <button
                          onClick={() => setUserDropdownOpen(false)}
                          className='w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/70 transition-colors'
                        >
                          Profile Settings
                        </button>
                        <button
                          onClick={() => setUserDropdownOpen(false)}
                          className='w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/70 transition-colors'
                        >
                          Preferences
                        </button>
                        <div className='border-t border-gray-700 mt-1 pt-1'>
                          <button
                            onClick={() => {
                              logout();
                              setUserDropdownOpen(false);
                            }}
                            className='w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700/70 transition-colors'
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='h-10 flex items-center bg-black/50 backdrop-blur-sm rounded-lg px-2'>
                  <ChatLoginButton />
                </div>
              )}

              {/* Chat Bot Icon */}
              <div className='rounded-lg transition-colors backdrop-blur-sm items-center '>
                <img
                  src={assets.ChatBotButton}
                  alt='Chat Bot Icon'
                  className='w-18 h-18'
                />
              </div>

              {/* Publish Button */}
              <button className='h-10 px-4 py-2 bg-[#32353E66]/40 hover:bg-[#32353E66] border-0 text-white/50 text-sm font-medium rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2'>
                <img
                  src={assets.PublishIcon}
                  alt='Publish Icon'
                  className='w-4 h-4'
                />
                Publish
              </button>

              {/* Chat History */}
              <div
                className='fixed top-24  right-4 z-[1001] w-16 h-16 hover:bg-gray-600 border-0 text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center  backdrop-blur-sm'
                style={{ background: "#18191CCC" }}
              >
                <img
                  src={assets.NewChatIcon}
                  className='w-12 h-12'
                  alt='New Chat'
                />
              </div>
            </div>
            {/* Model Selection */}
            {/* {isAuthenticated && stats.totalSegments > 0 && (
              <div className='pt-2 pb-2 pl-4 pr-4 border-b border-gray-800 bg-gray-800'>
                <h3 className='text-sm font-semibold text-gray-300 mb-3'>
                  AI Model Selection
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-xs text-gray-400 mb-1'>
                      Image Generation Model
                    </label>
                    <ModelSelector
                      genType='IMAGE'
                      selectedModel={selectedImageModel}
                      onModelChange={setSelectedImageModel}
                      disabled={loading}
                      className='w-full'
                    />
                  </div>
                  <div>
                    <label className='block text-xs text-gray-400 mb-1'>
                      Video Generation Model
                    </label>
                    <ModelSelector
                      genType='VIDEO'
                      selectedModel={selectedVideoModel}
                      onModelChange={setSelectedVideoModel}
                      disabled={loading}
                      className='w-full'
                    />
                  </div>
                </div>
              </div>
            )} */}

            <div className='flex-1 overflow-auto'>
              {loading ? (
                <div className='flex items-center justify-center h-full'>
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-red-400 text-center p-4'>
                    <p>{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className='mt-2 text-sm text-purple-400 hover:text-purple-300'
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className='p-4 space-y-4'>
                  <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
                    <div className='mb-4'>
                      <h3 className='text-lg font-semibold text-white mb-2'>
                        Video Creation Flow
                      </h3>
                      <p className='text-gray-400 text-sm'>
                        Sign in to visualize your video creation workflow
                      </p>
                    </div>
                    <ChatLoginButton />
                  </div>
                </div>
              ) : flowData.segments.length === 0 ? (
                <div className='p-4 space-y-4'>
                  <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
                    <h3 className='text-lg font-semibold text-white mb-4'>
                      No Workflow Data
                    </h3>
                    <p className='text-gray-400 text-sm mb-4'>
                      Start creating a video in the chat widget to see the
                      workflow flow here.
                    </p>
                    <button
                      onClick={() => handleFlowAction("Refresh Data")}
                      disabled={loading}
                      className='w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50'
                    >
                      {loading ? (
                        <div className='flex items-center justify-center gap-2'>
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
                <div className='w-full h-full min-w-[1000px] min-h-[700px]'>
                  <ReactFlow
                    onInit={setRfInstance}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    onNodeClick={(event, node) => {
                      setSelectedNode(node);
                      // Add chat node when clicking on non-chat nodes
                      if (
                        node.type !== "chatNode" &&
                        node.type !== "addImageNode"
                      ) {
                        handleAddChatNode(node);
                      }
                    }}
                    onPaneClick={() => {
                      setSelectedNode(null);
                      // Remove all chat nodes when deselecting
                      setNodes((prevNodes) =>
                        prevNodes.filter((node) => node.type !== "chatNode"),
                      );
                      setEdges((prevEdges) =>
                        prevEdges.filter(
                          (edge) => !edge.target.includes("chat-"),
                        ),
                      );
                    }}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition='bottom-left'
                    edgesFocusable={true}
                    edgesUpdatable={true}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color='#374151' gap={20} variant='dots' />
                    <Controls
                      position='bottom-right'
                      className='
                        !border-[#27272a] 
                        !rounded-lg 
                        [&>button]:!bg-[#23232b] 
                        [&>button]:!text-white 
                        [&>button]:!border-[#27272a] 
                        [&>button]:!hover:bg-[#3f3f46] 
                        [&>button]:!m-1
                        [&>button]:!shadow-none
                      '
                    />
                    {/* <MiniMap
                      className='bg-gray-800 border border-gray-700 rounded-lg'
                      nodeColor='#8b5cf6'
                      maskColor='rgba(0, 0, 0, 0.5)'
                    /> */}
                  </ReactFlow>

                  {/* Flow Widget Sidebar */}
                  <FlowWidgetSidebar
                    selectedNode={selectedNode}
                    onClose={() => setSelectedNode(null)}
                    onChatClick={handleChatClick}
                  />
                </div>
              )}
            </div>
          </div>
          <FlowWidgetBottomToolbar onAddNode={handleAddNode} />
        </div>
      </div>

      {/* Node Chat Modal */}
      {chatOpen && (
        <NodeChat
          nodeId={chatNodeId}
          nodeType={chatNodeType}
          isOpen={chatOpen}
          onClose={handleChatClose}
          onSendMessage={(message, nodeType, model) => {
            console.log(
              "Message sent:",
              message,
              "Node type:",
              nodeType,
              "Model:",
              model,
            );
            // Handle message sending logic here
          }}
        />
      )}
    </div>
  );
}

export default FlowWidget;
