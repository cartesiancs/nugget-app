import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import LoadingSpinner from "./LoadingSpinner";
import { projectApi } from "../services/project";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
// Import new clean node components
import NodeImage from "./FlowWidget/Node_Image";
import NodeVideo from "./FlowWidget/Node_Video";
import NodeSegment from "./FlowWidget/Node_Segment";
import NodeConcept from "./FlowWidget/Node_Concept";
import NodeScript from "./FlowWidget/Node_Script";
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [temporaryVideos, setTemporaryVideos] = useState(new Map()); // Store temporary videos: key = `${segmentId}-${imageId}`, value = videoUrl
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
    concepts: [],
    scripts: [], // segmentations
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
      "Fetching project concepts, segmentations and related images/videos for project ID:",
      projectId,
    );
    try {
      setLoading(true);

      // Fetch project concepts, segmentations, images, and videos in parallel
      const [conceptsData, segmentationsData, imagesData, videosData] = await Promise.all([
        projectApi.getProjectConcepts(projectId),
        projectApi.getProjectSegmentations(projectId),
        projectApi.getProjectImages(projectId),
        projectApi.getProjectVideos(projectId),
      ]);

      console.log("Project data fetched successfully:");
      console.log("Concepts:", conceptsData);
      console.log("Segmentations:", segmentationsData);
      console.log("Images:", imagesData);
      console.log("Videos:", videosData);

      // Extract concepts
      let concepts = [];
      if (
        conceptsData &&
        conceptsData.success &&
        conceptsData.data &&
        Array.isArray(conceptsData.data)
      ) {
        concepts = conceptsData.data;
      }

      // Extract scripts (segmentations) and segments
      let scripts = [];
      let segments = [];
      if (
        segmentationsData &&
        segmentationsData.success &&
        segmentationsData.data &&
        segmentationsData.data.length > 0
      ) {
        scripts = segmentationsData.data;
        
        // Extract segments from the first segmentation for backward compatibility
        const firstSegmentation = segmentationsData.data[0];
        if (
          firstSegmentation.segments &&
          Array.isArray(firstSegmentation.segments)
        ) {
          segments = firstSegmentation.segments;
        }
      }

      setAllProjectData({
        concepts: concepts,
        scripts: scripts,
        segments: segments,
        images: imagesData?.data || [],
        videos: videosData?.data || [],
      });

      // Keep the old projectData for backward compatibility
      // setProjectData({ success: true, project: { segments: segments } }); // This line was removed
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

    // 1. Process concepts
    const concepts = allProjectData.concepts.map((concept) => ({
      ...concept, // Keep all original fields
      id: concept.id,
      content: concept.content || concept.text || concept.concept || concept.description || concept.prompt || "",
      title: concept.title || concept.name || `Concept ${concept.id}`,
    }));
    console.log("💡 Processed concepts:", concepts);
    console.log("💡 Raw concept data:", allProjectData.concepts);

    // 2. Process scripts (segmentations)
    const scripts = allProjectData.scripts.map((script) => ({
      ...script,
      id: script.id,
      artStyle: script.artStyle || "cinematic photography with soft lighting",
      concept: script.concept || "",
      segments: script.segments || [],
      title: script.title || `Script ${script.id}`,
    }));
    console.log("📜 Processed scripts:", scripts);

    // 3. Get segments from segmentation API response (backward compatibility)
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
    return { concepts, scripts, segments, images, videos, imageDetails, videoDetails };
  }, [allProjectData, temporaryVideos]);

  // Create nodes and edges from flow data
  const createFlowElements = useCallback(() => {
    console.log("🎯 createFlowElements called with flowData:", flowData);
    const newNodes = [];
    const newEdges = [];

    // Layout configuration
    const nodeSpacing = 450; // Vertical space between levels
    const itemSpacing = 400; // Horizontal space between items in same level
    const startX = 150;
    const startY = 100;

    let currentY = startY;

    // 1. Create Concept Nodes
    if (flowData.concepts && flowData.concepts.length > 0) {
      console.log("💡 Creating concept nodes:", flowData.concepts.length);
      console.log("💡 Concept data for nodes:", flowData.concepts);
      
      flowData.concepts.forEach((concept, index) => {
        const conceptX = startX + index * itemSpacing;
        
        console.log(`💡 Creating concept node ${index}:`, concept);
        
        newNodes.push({
          id: `concept-${concept.id}`,
          type: "conceptNode",
          position: { x: conceptX, y: currentY },
          data: concept,
        });
      });
      
      currentY += nodeSpacing; // Move to next level
    } else {
      console.log("💡 No concepts found, flowData.concepts:", flowData.concepts);
    }

    // 2. Create Script Nodes  
    if (flowData.scripts && flowData.scripts.length > 0) {
      console.log("📜 Creating script nodes:", flowData.scripts.length);
      
      flowData.scripts.forEach((script, index) => {
        const scriptX = startX + index * itemSpacing;
        
        newNodes.push({
          id: `script-${script.id}`,
          type: "scriptNode", 
          position: { x: scriptX, y: currentY },
          data: script,
        });

        // Connect to concepts if available
        if (flowData.concepts && flowData.concepts.length > 0) {
          // Connect to first concept for now (you can enhance this logic)
          const conceptId = flowData.concepts[0].id;
          newEdges.push({
            id: `concept-${conceptId}-to-script-${script.id}`,
            source: `concept-${conceptId}`,
            target: `script-${script.id}`,
            sourceHandle: "output",
            targetHandle: "input",
            style: {
              stroke: "#8b5cf6",
              strokeWidth: 3,
              filter: "drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))",
            },
          });
        }
      });
      
      currentY += nodeSpacing; // Move to next level
    }

    // 3. Create Segment Nodes (show only if we have data)
    if (flowData.segments && flowData.segments.length > 0) {
      console.log("📊 Creating segment nodes:", flowData.segments.length);
      
      flowData.segments.forEach((segment, index) => {
        const segmentX = startX + index * itemSpacing;
        
        newNodes.push({
          id: `segment-${segment.id}`,
          type: "segmentNode",
          position: { x: segmentX, y: currentY },
          data: {
            ...segment,
            status: flowData.videos[segment.id]
              ? "completed"
              : flowData.images[segment.id]
              ? "generating"
              : "pending",
          },
        });

        // Connect to scripts if available
        if (flowData.scripts && flowData.scripts.length > 0) {
          // Connect to first script for now (you can enhance this logic)
          const scriptId = flowData.scripts[0].id;
          newEdges.push({
            id: `script-${scriptId}-to-segment-${segment.id}`,
            source: `script-${scriptId}`,
            target: `segment-${segment.id}`,
            sourceHandle: "output",
            targetHandle: "input",
            style: {
              stroke: "#3b82f6",
              strokeWidth: 3,
              filter: "drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))",
            },
          });
        }
      });
      
      currentY += nodeSpacing; // Move to next level

      // 4. Create Image Nodes for segments that have images
      let hasImages = false;
      flowData.segments.forEach((segment, segmentIndex) => {
        const imageDetail = flowData.imageDetails[segment.id];
        if (flowData.images[segment.id] && imageDetail?.allImages) {
          hasImages = true;
          imageDetail.allImages.forEach((image, imageIndex) => {
            const imageX = startX + segmentIndex * itemSpacing + imageIndex * 280; // Better spacing for images
            
            newNodes.push({
              id: `image-${segment.id}-${image.id}`,
              type: "imageNode",
              position: { x: imageX, y: currentY },
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
                  artStyle: image.artStyle || "cinematic photography with soft lighting",
                },
              },
            });
            
            // Connect image to segment
            newEdges.push({
              id: `segment-${segment.id}-to-image-${segment.id}-${image.id}`,
              source: `segment-${segment.id}`,
              target: `image-${segment.id}-${image.id}`,
              sourceHandle: "output",
              targetHandle: "input",
              style: {
                stroke: "#f59e0b",
                strokeWidth: 2,
                filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))",
              },
            });
          });
        }
      });
      
      // Only move to next level if we have images
      if (hasImages) {
        currentY += nodeSpacing;
      }

      // 5. Create Video Nodes for images that have videos
      flowData.segments.forEach((segment, segmentIndex) => {
        const imageDetail = flowData.imageDetails[segment.id];
        if (flowData.images[segment.id] && imageDetail?.allImages) {
          imageDetail.allImages.forEach((image, imageIndex) => {
            const videoUrl = flowData.videos[`${segment.id}-${image.id}`] || flowData.videos[segment.id];
            const videoId = flowData?.videoDetails?.[`${segment.id}-${image.id}`]?.id || flowData?.videoDetails?.[segment.id]?.id;
            
            if (videoUrl) {
              const videoX = startX + segmentIndex * itemSpacing + imageIndex * 280; // Match image spacing
              
              newNodes.push({
                id: `video-${segment.id}-${image.id}`,
                type: "videoNode",
                position: { x: videoX, y: currentY },
                data: {
                  segmentId: segment.id,
                  imageId: image.id,
                  videoUrl: videoUrl,
                  videoId: videoId,
                  segmentData: {
                    id: segment.id,
                    animation: segment.animation,
                    artStyle: flowData?.videoDetails?.[segment.id]?.artStyle || "cinematic photography with soft lighting",
                    imageS3Key: image.s3Key,
                  },
                },
              });
              
              // Connect video to image
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
            }
          });
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges]);

  // Function to fetch project concepts, segmentations and related images/videos
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
      "Fetching project concepts, segmentations and related images/videos for project ID:",
      projectId,
    );
    try {
      setLoading(true);

      // Fetch project concepts, segmentations, images, and videos in parallel
      const [conceptsData, segmentationsData, imagesData, videosData] = await Promise.all([
        projectApi.getProjectConcepts(projectId),
        projectApi.getProjectSegmentations(projectId),
        projectApi.getProjectImages(projectId),
        projectApi.getProjectVideos(projectId),
      ]);

      console.log("Project data fetched successfully:");
      console.log("Concepts:", conceptsData);
      console.log("Segmentations:", segmentationsData);
      console.log("Images:", imagesData);
      console.log("Videos:", videosData);

      // Extract concepts
      let concepts = [];
      if (
        conceptsData &&
        conceptsData.success &&
        conceptsData.data &&
        Array.isArray(conceptsData.data)
      ) {
        concepts = conceptsData.data;
      }

      // Extract scripts (segmentations) and segments
      let scripts = [];
      let segments = [];
      if (
        segmentationsData &&
        segmentationsData.success &&
        segmentationsData.data &&
        segmentationsData.data.length > 0
      ) {
        scripts = segmentationsData.data;
        
        // Extract segments from the first segmentation for backward compatibility
        const firstSegmentation = segmentationsData.data[0];
        if (
          firstSegmentation.segments &&
          Array.isArray(firstSegmentation.segments)
        ) {
          segments = firstSegmentation.segments;
        }
      }

      setAllProjectData({
        concepts: concepts,
        scripts: scripts,
        segments: segments,
        images: imagesData?.data || [],
        videos: videosData?.data || [],
      });

      // Keep the old projectData for backward compatibility
      // setProjectData({ success: true, project: { segments: segments } }); // This line was removed
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

  // Update nodeTypes to include all new clean node components
  const nodeTypes = useMemo(
    () => ({
      // New clean nodes
      imageNode: NodeImage,
      videoNode: NodeVideo,
      scriptNode: NodeScript,
      segmentNode: NodeSegment,
      conceptNode: NodeConcept,
      chatNode: ChatNode,
    }),
    [],
  );

  // Initialize flow when data changes
  useEffect(() => {
    createFlowElements();
  }, [createFlowElements]);

  const onConnect = useCallback(
    (params) => {
      // Create the edge
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges],
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
                      if (node.type !== "chatNode") {
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
