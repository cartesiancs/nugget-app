import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTimeline } from "../hooks/useTimeline";
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
import UserNode from "./FlowWidget/UserNode";
import TaskList from "./FlowWidget/TaskList";
import { assets } from "../assets/assets";
import FlowWidgetBottomToolbar from "./FlowWidget/FlowWidgetBottomToolbar";
import UserProfileDropdown from "./UserProfileDropdown";
import { webInfoApi } from "../services/web-info";
import { conceptWriterApi } from "../services/concept-writer";
import { segmentationApi } from "../services/segmentationapi";
import { imageApi } from "../services/image";
import { videoApi } from "../services/video-gen";
import { chatApi } from "../services/chat";
import { s3Api } from "../services/s3";

function FlowWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const timeline = useTimeline();
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

  // New project state management
  const [userConcepts, setUserConcepts] = useState(new Map()); // Store user concept texts: nodeId -> text
  const [generatingConcepts, setGeneratingConcepts] = useState(new Set()); // Track which concepts are generating
  const [generatingScripts, setGeneratingScripts] = useState(new Set()); // Track which scripts are generating
  const [generatingImages, setGeneratingImages] = useState(new Set()); // Track which images are generating
  const [generatingVideos, setGeneratingVideos] = useState(new Set()); // Track which videos are generating
  const [nodeConnections, setNodeConnections] = useState(new Map()); // Track node connections for generation

  // Persistent generation states helper functions
  const getGenerationStateKey = (projectId, type) => `generation-states-${projectId}-${type}`;
  
  const saveGenerationState = (projectId, type, nodeId, data) => {
    try {
      const key = getGenerationStateKey(projectId, type);
      const existingStates = JSON.parse(localStorage.getItem(key) || '{}');
      existingStates[nodeId] = {
        ...data,
        timestamp: Date.now(),
        status: 'generating'
      };
      localStorage.setItem(key, JSON.stringify(existingStates));
      console.log(`💾 Saved ${type} generation state for ${nodeId}:`, data);
    } catch (error) {
      console.error(`Error saving ${type} generation state:`, error);
    }
  };

  const removeGenerationState = (projectId, type, nodeId) => {
    try {
      const key = getGenerationStateKey(projectId, type);
      const existingStates = JSON.parse(localStorage.getItem(key) || '{}');
      delete existingStates[nodeId];
      localStorage.setItem(key, JSON.stringify(existingStates));
      console.log(`🗑️ Removed ${type} generation state for ${nodeId}`);
    } catch (error) {
      console.error(`Error removing ${type} generation state:`, error);
    }
  };

  const getGenerationStates = (projectId, type) => {
    try {
      const key = getGenerationStateKey(projectId, type);
      const states = JSON.parse(localStorage.getItem(key) || '{}');
      // Clean up states older than 1 hour (3600000 ms)
      const now = Date.now();
      const cleanedStates = {};
      Object.entries(states).forEach(([nodeId, data]) => {
        if (now - data.timestamp < 3600000) { // 1 hour
          cleanedStates[nodeId] = data;
        }
      });
      localStorage.setItem(key, JSON.stringify(cleanedStates));
      return cleanedStates;
    } catch (error) {
      console.error(`Error getting ${type} generation states:`, error);
      return {};
    }
  };

  // Task completion tracking
  const [taskCompletionStates, setTaskCompletionStates] = useState({
    userInput: false,
    concept: false,
    script: false,
    segment: false,
    image: false,
    video: false
  });

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

  // Flag to disable auto-generation during brush tool operations
  const [disableAutoGeneration, setDisableAutoGeneration] = useState(false);

  // Restore generation states on component load
  const restoreGenerationStates = useCallback(async () => {
    let selectedProject = null;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      selectedProject = storedProject ? JSON.parse(storedProject) : null;
    } catch (e) {
      console.error('Error parsing project data:', e);
      return;
    }

    if (!selectedProject) {
      console.log('No project selected, skipping generation state restoration');
      return;
    }

    const projectId = selectedProject.id;
    console.log('🔄 Restoring generation states for project:', projectId);

    // Restore concept generation states
    const conceptStates = getGenerationStates(projectId, 'concept');
    Object.entries(conceptStates).forEach(([nodeId, state]) => {
      console.log('🔄 Restoring concept generation state:', nodeId, state);
      setGeneratingConcepts(prev => new Set(prev.add(nodeId)));
      
      // Create or update the loading concept node
      const loadingConceptNode = {
        id: nodeId,
        type: 'conceptNode',
        position: state.position || { x: 400, y: 400 },
        data: {
          id: nodeId,
          content: state.loadingMessage || 'Generating concepts...',
          nodeState: 'loading',
          title: state.title || 'Loading Concepts',
          originalPrompt: state.originalPrompt
        }
      };

      setNodes(prevNodes => {
        const existingNodeIndex = prevNodes.findIndex(n => n.id === nodeId);
        if (existingNodeIndex >= 0) {
          // Only update if the existing node is not already completed
          const existingNode = prevNodes[existingNodeIndex];
          if (existingNode.data?.nodeState === 'existing' || existingNode.data?.nodeState === 'completed') {
            console.log(`🔄 Skipping restoration of ${nodeId} - already completed`);
            return prevNodes; // Don't overwrite completed nodes
          }
          // Update existing node
          const updatedNodes = [...prevNodes];
          updatedNodes[existingNodeIndex] = loadingConceptNode;
          return updatedNodes;
        } else {
          // Add new node
          return [...prevNodes, loadingConceptNode];
        }
      });

      // Restore edge if parent exists
      if (state.parentNodeId) {
        const loadingEdge = {
          id: `${state.parentNodeId}-to-${nodeId}`,
          source: state.parentNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        };
        
        setEdges(prevEdges => {
          const existingEdgeIndex = prevEdges.findIndex(e => e.id === loadingEdge.id);
          if (existingEdgeIndex < 0) {
            return [...prevEdges, loadingEdge];
          }
          return prevEdges;
        });
      }
    });

    // Restore script generation states
    const scriptStates = getGenerationStates(projectId, 'script');
    Object.entries(scriptStates).forEach(([nodeId, state]) => {
      console.log('🔄 Restoring script generation state:', nodeId, state);
      setGeneratingScripts(prev => new Set(prev.add(nodeId)));
      
      const loadingScriptNode = {
        id: nodeId,
        type: 'scriptNode',
        position: state.position || { x: 400, y: 500 },
        data: {
          id: nodeId,
          content: state.loadingMessage || 'Generating scripts...',
          nodeState: 'loading',
          title: state.title || 'Loading Script',
          conceptContent: state.conceptContent
        }
      };

      setNodes(prevNodes => {
        const existingNodeIndex = prevNodes.findIndex(n => n.id === nodeId);
        if (existingNodeIndex >= 0) {
          // Only update if the existing node is not already completed
          const existingNode = prevNodes[existingNodeIndex];
          if (existingNode.data?.nodeState === 'existing' || existingNode.data?.nodeState === 'completed') {
            console.log(`🔄 Skipping restoration of ${nodeId} - already completed`);
            return prevNodes; // Don't overwrite completed nodes
          }
          const updatedNodes = [...prevNodes];
          updatedNodes[existingNodeIndex] = loadingScriptNode;
          return updatedNodes;
        } else {
          return [...prevNodes, loadingScriptNode];
        }
      });

      if (state.parentNodeId) {
        const loadingEdge = {
          id: `${state.parentNodeId}-to-${nodeId}`,
          source: state.parentNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        };
        
        setEdges(prevEdges => {
          const existingEdgeIndex = prevEdges.findIndex(e => e.id === loadingEdge.id);
          if (existingEdgeIndex < 0) {
            return [...prevEdges, loadingEdge];
          }
          return prevEdges;
        });
      }
    });

    // Restore image generation states
    const imageStates = getGenerationStates(projectId, 'image');
    Object.entries(imageStates).forEach(([nodeId, state]) => {
      console.log('🔄 Restoring image generation state:', nodeId, state);
      setGeneratingImages(prev => new Set(prev.add(nodeId)));
      
      const loadingImageNode = {
        id: nodeId,
        type: 'imageNode',
        position: state.position || { x: 400, y: 600 },
        data: {
          id: nodeId,
          content: state.loadingMessage || 'Generating image...',
          nodeState: 'loading',
          title: state.title || 'Loading Image',
          visualPrompt: state.visualPrompt,
          artStyle: state.artStyle,
          segmentId: state.segmentId
        }
      };

      setNodes(prevNodes => {
        const existingNodeIndex = prevNodes.findIndex(n => n.id === nodeId);
        if (existingNodeIndex >= 0) {
          // Only update if the existing node is not already completed
          const existingNode = prevNodes[existingNodeIndex];
          if (existingNode.data?.nodeState === 'existing' || existingNode.data?.nodeState === 'completed') {
            console.log(`🔄 Skipping restoration of ${nodeId} - already completed`);
            return prevNodes; // Don't overwrite completed nodes
          }
          const updatedNodes = [...prevNodes];
          updatedNodes[existingNodeIndex] = loadingImageNode;
          return updatedNodes;
        } else {
          return [...prevNodes, loadingImageNode];
        }
      });

      if (state.parentNodeId) {
        const loadingEdge = {
          id: `${state.parentNodeId}-to-${nodeId}`,
          source: state.parentNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        };
        
        setEdges(prevEdges => {
          const existingEdgeIndex = prevEdges.findIndex(e => e.id === loadingEdge.id);
          if (existingEdgeIndex < 0) {
            return [...prevEdges, loadingEdge];
          }
          return prevEdges;
        });
      }
    });

    // Restore video generation states
    const videoStates = getGenerationStates(projectId, 'video');
    Object.entries(videoStates).forEach(([nodeId, state]) => {
      console.log('🔄 Restoring video generation state:', nodeId, state);
      setGeneratingVideos(prev => new Set(prev.add(nodeId)));
      
      const loadingVideoNode = {
        id: nodeId,
        type: 'videoNode',
        position: state.position || { x: 400, y: 700 },
        data: {
          id: nodeId,
          content: state.loadingMessage || 'Generating video...',
          nodeState: 'loading',
          title: state.title || 'Loading Video',
          animationPrompt: state.animationPrompt,
          artStyle: state.artStyle,
          segmentId: state.segmentId,
          imageId: state.imageId
        }
      };

      setNodes(prevNodes => {
        const existingNodeIndex = prevNodes.findIndex(n => n.id === nodeId);
        if (existingNodeIndex >= 0) {
          // Only update if the existing node is not already completed
          const existingNode = prevNodes[existingNodeIndex];
          if (existingNode.data?.nodeState === 'existing' || existingNode.data?.nodeState === 'completed') {
            console.log(`🔄 Skipping restoration of ${nodeId} - already completed`);
            return prevNodes; // Don't overwrite completed nodes
          }
          const updatedNodes = [...prevNodes];
          updatedNodes[existingNodeIndex] = loadingVideoNode;
          return updatedNodes;
        } else {
          return [...prevNodes, loadingVideoNode];
        }
      });

      if (state.parentNodeId) {
        const loadingEdge = {
          id: `${state.parentNodeId}-to-${nodeId}`,
          source: state.parentNodeId,
          target: nodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        };
        
        setEdges(prevEdges => {
          const existingEdgeIndex = prevEdges.findIndex(e => e.id === loadingEdge.id);
          if (existingEdgeIndex < 0) {
            return [...prevEdges, loadingEdge];
          }
          return prevEdges;
        });
      }
    });

    console.log('✅ Generation states restored successfully');
    
    // Show a brief notification to user that states were restored
    const restoredCount = Object.keys(conceptStates).length + 
                         Object.keys(scriptStates).length + 
                         Object.keys(imageStates).length + 
                         Object.keys(videoStates).length;
    
    if (restoredCount > 0) {
      console.log(`🔄 Restored ${restoredCount} generating node(s)`);
    }
  }, [setNodes, setEdges, setGeneratingConcepts, setGeneratingScripts, setGeneratingImages, setGeneratingVideos]);

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
          // Handle both old segment-based format (seg-1) and new image-specific format (seg-1-imageId)
          const videoKey = video.uuid.replace(/^seg-/, "");
          const videoUrl = `https://ds0fghatf06yb.cloudfront.net/${video.videoFiles[0].s3Key}`;
          
          videos[videoKey] = videoUrl;
          videoDetails[videoKey] = {
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
    console.log("🎬 Video keys:", Object.keys(videos));

    // Add temporary videos to the videos map
    temporaryVideos.forEach((videoUrl, key) => {
      videos[key] = videoUrl;
    });

    // Load saved videos from localStorage
    try {
      let selectedProject = null;
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        selectedProject = JSON.parse(storedProject);
        const videoStorageKey = `generated-videos-${selectedProject.id}`;
        const savedVideos = JSON.parse(localStorage.getItem(videoStorageKey) || '{}');
        
        Object.entries(savedVideos).forEach(([key, videoData]) => {
          if (videoData && videoData.videoUrl) {
            videos[key] = videoData.videoUrl;
            // Also add to video details if not already present
            if (!videoDetails[key]) {
              videoDetails[key] = {
                id: videoData.videoId,
                artStyle: videoData.artStyle,
                imageS3Key: null
              };
            }
          }
        });
        
        console.log(`🎬 Loaded ${Object.keys(savedVideos).length} saved videos from localStorage`);
      }
    } catch (error) {
      console.error('Error loading saved videos from localStorage:', error);
    }

    console.log("🎬 Videos map (including temporary and saved):", videos);
    return { concepts, scripts, segments, images, videos, imageDetails, videoDetails };
  }, [allProjectData, temporaryVideos]);

  // Create nodes and edges from flow data
  const createFlowElements = useCallback(() => {
    console.log("🎯 createFlowElements called with flowData:", flowData);
    const newNodes = [];
    const newEdges = [];

    // Tree Layout configuration
    const levelHeight = 450; // Increased vertical space between tree levels
    const nodeWidth = 420; // Increased width allocated per node including spacing
    const startX = 400; // Center starting position
    const startY = 80; // Increased top starting position

    // Tree level tracking
    let currentLevel = 0;

    // Check for user concepts that match current project
    let selectedProject = null;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      selectedProject = storedProject ? JSON.parse(storedProject) : null;
    } catch (e) {
      console.error('Error parsing project data:', e);
    }

    // Add User Node if there are matching user node data for this project (ROOT of tree)
    let userNodeId = null;
    if (selectedProject) {
      const userNodeDataKey = `userNodeData-${selectedProject.id}`;
      const existingUserNodeData = JSON.parse(localStorage.getItem(userNodeDataKey) || '{}');
      
      // Check if there are any user node data for this project
      const userNodeEntries = Object.entries(existingUserNodeData).filter(
        ([nodeId, data]) => data && data.projectId === selectedProject.id
      );
      
      if (userNodeEntries.length > 0) {
        // Create a single user node that represents all user inputs (ROOT)
        userNodeId = `user-${selectedProject.id}`;
        const allUserTexts = userNodeEntries.map(([nodeId, data]) => data.text).join('\n\n');
        
        newNodes.push({
          id: userNodeId,
          type: "userNode",
          position: { x: startX, y: startY + (currentLevel * levelHeight) }, // Root position
          data: {
            id: userNodeId,
            userText: allUserTexts,
            projectId: selectedProject.id,
            nodeState: 'user'
          },
        });
        
        currentLevel++; // Move to next level for concepts
      }
    }

    // 1. Create Concept Nodes (Level 1 - Children of User Node)
    if (flowData.concepts && flowData.concepts.length > 0) {
      console.log("💡 Creating concept nodes:", flowData.concepts.length);
      console.log("💡 Concept data for nodes:", flowData.concepts);
      
      const conceptCount = flowData.concepts.length;
      const totalWidth = (conceptCount - 1) * nodeWidth;
      const conceptStartX = startX - (totalWidth / 2); // Center concepts under user node
      
      flowData.concepts.forEach((concept, index) => {
        const conceptX = conceptStartX + (index * nodeWidth);
        
        console.log(`💡 Creating concept node ${index}:`, concept);
        
        newNodes.push({
          id: `concept-${concept.id}`,
          type: "conceptNode",
          position: { x: conceptX, y: startY + (currentLevel * levelHeight) },
          data: concept,
        });
        
        // Connect to user node if it exists
        if (userNodeId) {
          newEdges.push({
            id: `${userNodeId}-to-concept-${concept.id}`,
            source: userNodeId,
            target: `concept-${concept.id}`,
            sourceHandle: "output",
            targetHandle: "input",
            style: {
              stroke: "#E9E8EB33",
              strokeWidth: 2,
              filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
            },
          });
        }
      });
      
      currentLevel++; // Move to next level
    } else {
      console.log("💡 No concepts found, flowData.concepts:", flowData.concepts);
    }

    // 2. Create Script Nodes (Level 2 - Children of First Concept Node)
    if (flowData.scripts && flowData.scripts.length > 0) {
      console.log("📜 Creating script nodes:", flowData.scripts.length);
      
      const scriptCount = flowData.scripts.length;
      const scriptSpacing = 450; // Increased spacing between scripts
      const totalWidth = (scriptCount - 1) * scriptSpacing;
      
      // Center scripts under the FIRST concept node
      let parentX = startX; // Default center
      if (flowData.concepts && flowData.concepts.length > 0) {
        // Find the X position of the first concept node
        const conceptCount = flowData.concepts.length;
        const conceptTotalWidth = (conceptCount - 1) * nodeWidth;
        const conceptStartX = startX - (conceptTotalWidth / 2);
        parentX = conceptStartX; // Position of first concept
      }
      
      const scriptStartX = parentX - (totalWidth / 2); // Center under parent concept
      
      flowData.scripts.forEach((script, index) => {
        const scriptX = scriptStartX + (index * scriptSpacing);
        
        newNodes.push({
          id: `script-${script.id}`,
          type: "scriptNode", 
          position: { x: scriptX, y: startY + (currentLevel * levelHeight) },
          data: script,
        });

        // Connect all scripts to the FIRST concept only (one-to-many relationship)
        if (flowData.concepts && flowData.concepts.length > 0) {
          const firstConceptId = flowData.concepts[0].id;
          newEdges.push({
            id: `concept-${firstConceptId}-to-script-${script.id}`,
            source: `concept-${firstConceptId}`,
            target: `script-${script.id}`,
            sourceHandle: "output",
            targetHandle: "input",
            style: {
              stroke: "#E9E8EB33",
              strokeWidth: 2,
              filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
            },
          });
        }
      });
      
      currentLevel++; // Move to next level
    }

    // 3. Create Segment Nodes (Level 3 - Children of First Script Node)
    if (flowData.segments && flowData.segments.length > 0) {
      console.log("📊 Creating segment nodes:", flowData.segments.length);
      
      const segmentCount = flowData.segments.length;
      const segmentSpacing = 480; // Increased space between segments
      const totalWidth = (segmentCount - 1) * segmentSpacing;
      
      // Center segments under the FIRST script node
      let parentX = startX; // Default center
      if (flowData.scripts && flowData.scripts.length > 0) {
        // Find the X position of the first script node
        const scriptCount = flowData.scripts.length;
        const scriptSpacing = 450;
        const scriptTotalWidth = (scriptCount - 1) * scriptSpacing;
        
        // Get first concept position
        let conceptParentX = startX;
        if (flowData.concepts && flowData.concepts.length > 0) {
          const conceptCount = flowData.concepts.length;
          const conceptTotalWidth = (conceptCount - 1) * nodeWidth;
          conceptParentX = startX - (conceptTotalWidth / 2);
        }
        
        const scriptStartX = conceptParentX - (scriptTotalWidth / 2);
        parentX = scriptStartX; // Position of first script
      }
      
      const segmentStartX = parentX - (totalWidth / 2); // Center under parent script
      
      flowData.segments.forEach((segment, index) => {
        const segmentX = segmentStartX + (index * segmentSpacing);
        
        newNodes.push({
          id: `segment-${segment.id}`,
          type: "segmentNode",
          position: { x: segmentX, y: startY + (currentLevel * levelHeight) },
          data: {
            ...segment,
            status: flowData.videos[segment.id]
              ? "completed"
              : flowData.images[segment.id]
              ? "generating"
              : "pending",
          },
        });

        // Connect all segments to the FIRST script only (one-to-many relationship)
        if (flowData.scripts && flowData.scripts.length > 0) {
          const firstScriptId = flowData.scripts[0].id;
          newEdges.push({
            id: `script-${firstScriptId}-to-segment-${segment.id}`,
            source: `script-${firstScriptId}`,
            target: `segment-${segment.id}`,
            sourceHandle: "output",
            targetHandle: "input",
            style: {
              stroke: "#E9E8EB33",
              strokeWidth: 2,
              filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
            },
          });
        }
      });
      
      currentLevel++; // Move to next level

      // 4. Create Image Nodes for segments that have images (Level 4)
      let imageNodesBySegment = new Map(); // Group images by their parent segment
      flowData.segments.forEach((segment, segmentIndex) => {
        const imageDetail = flowData.imageDetails[segment.id];
        if (flowData.images[segment.id] && imageDetail?.allImages) {
          imageNodesBySegment.set(segment.id, {
            segment: segment,
            segmentIndex: segmentIndex,
            images: imageDetail.allImages,
            imageDetail: imageDetail
          });
        }
      });
      
      if (imageNodesBySegment.size > 0) {
        // Calculate segment positions first to center images under each segment
        const segmentCount = flowData.segments.length;
        const segmentSpacing = 480; // Match updated segment spacing
        const segmentTotalWidth = (segmentCount - 1) * segmentSpacing;
        
        // Get parent script position
        let scriptParentX = startX;
        if (flowData.scripts && flowData.scripts.length > 0) {
          const scriptCount = flowData.scripts.length;
          const scriptSpacing = 450;
          const scriptTotalWidth = (scriptCount - 1) * scriptSpacing;
          
          let conceptParentX = startX;
          if (flowData.concepts && flowData.concepts.length > 0) {
            const conceptCount = flowData.concepts.length;
            const conceptTotalWidth = (conceptCount - 1) * nodeWidth;
            conceptParentX = startX - (conceptTotalWidth / 2);
          }
          scriptParentX = conceptParentX - (scriptTotalWidth / 2);
        }
        
        const segmentStartX = scriptParentX - (segmentTotalWidth / 2);
        
        imageNodesBySegment.forEach((segmentData, segmentId) => {
          const { segment, segmentIndex, images, imageDetail } = segmentData;
          const segmentX = segmentStartX + (segmentIndex * segmentSpacing);
          
          const imageSpacing = 320; // Increased spacing between images
          const imageCount = images.length;
          const imagesTotalWidth = (imageCount - 1) * imageSpacing;
          const imageStartX = segmentX - (imagesTotalWidth / 2); // Center under parent segment
          
          images.forEach((image, imageIndex) => {
            const imageX = imageStartX + (imageIndex * imageSpacing);
            
            newNodes.push({
              id: `image-${segment.id}-${image.id}`,
              type: "imageNode",
              position: { x: imageX, y: startY + (currentLevel * levelHeight) },
              data: {
                segmentId: segment.id,
                imageUrl: image.url,
                imageId: image.id,
                isPrimary: image.isPrimary,
                allImages: imageDetail.allImages,
                s3Key: image.s3Key,
                nodeState: 'existing',
                visualPrompt: image.visualPrompt,
                artStyle: image.artStyle || "cinematic photography with soft lighting",
                segmentData: {
                  id: segment.id,
                  visual: segment.visual,
                  animation: segment.animation,
                  artStyle: image.artStyle || "cinematic photography with soft lighting",
                },
              },
            });
            
            // Connect image to its parent segment
            newEdges.push({
              id: `segment-${segment.id}-to-image-${segment.id}-${image.id}`,
              source: `segment-${segment.id}`,
              target: `image-${segment.id}-${image.id}`,
              sourceHandle: "output",
              targetHandle: "input",
              style: {
                stroke: "#E9E8EB33",
                strokeWidth: 2,
                filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
              },
            });
          });
        });
        
        currentLevel++; // Move to next level for videos
      }

      // 5. Create Video Nodes for images that have videos (Level 5 - Leaf nodes)
      let videoNodesByImage = new Map(); // Group videos by their parent image
      let usedSegmentVideos = new Set(); // Track which segment videos have been assigned
      
      flowData.segments.forEach((segment, segmentIndex) => {
        const imageDetail = flowData.imageDetails[segment.id];
        if (flowData.images[segment.id] && imageDetail?.allImages) {
          imageDetail.allImages.forEach((image, imageIndex) => {
            // First, check for image-specific video
            const imageVideoKey = `${segment.id}-${image.id}`;
            let videoUrl = flowData.videos[imageVideoKey];
            let videoId = flowData?.videoDetails?.[imageVideoKey]?.id;
            let videoKey = imageVideoKey;
            
            // If no image-specific video, check for segment video (but only assign to first image to avoid duplicates)
            if (!videoUrl && !usedSegmentVideos.has(segment.id)) {
              const segmentVideoUrl = flowData.videos[segment.id];
              const segmentVideoId = flowData?.videoDetails?.[segment.id]?.id;
              
              if (segmentVideoUrl) {
                videoUrl = segmentVideoUrl;
                videoId = segmentVideoId;
                videoKey = `${segment.id}-${image.id}`; // Still use image-specific key for consistency
                usedSegmentVideos.add(segment.id); // Mark this segment video as used
                
                console.log(`🎬 Assigning segment video ${segment.id} to first image ${image.id}`);
              }
            }
            
            console.log(`🎬 Checking video for segment ${segment.id}, image ${image.id}:`, {
              imageVideoKey,
              hasImageVideo: !!flowData.videos[imageVideoKey],
              hasSegmentVideo: !!flowData.videos[segment.id],
              finalVideoUrl: videoUrl ? videoUrl.substring(0, 50) + '...' : 'none',
              videoKey
            });
            
            if (videoUrl) {
              videoNodesByImage.set(videoKey, {
                segment: segment,
                segmentIndex: segmentIndex,
                image: image,
                imageIndex: imageIndex,
                videoUrl: videoUrl,
                videoId: videoId
              });
            }
          });
        }
      });
      
      console.log(`🎬 Found ${videoNodesByImage.size} video nodes to create`);
      
      if (videoNodesByImage.size > 0) {
        videoNodesByImage.forEach((videoData, key) => {
          const { segment, segmentIndex, image, imageIndex, videoUrl, videoId } = videoData;
          
          // Calculate the X position of the parent image to center video under it
          const segmentCount = flowData.segments.length;
          const segmentSpacing = 480; // Match updated segment spacing
          const segmentTotalWidth = (segmentCount - 1) * segmentSpacing;
          
          // Get parent script position
          let scriptParentX = startX;
          if (flowData.scripts && flowData.scripts.length > 0) {
            const scriptCount = flowData.scripts.length;
            const scriptSpacing = 450;
            const scriptTotalWidth = (scriptCount - 1) * scriptSpacing;
            
            let conceptParentX = startX;
            if (flowData.concepts && flowData.concepts.length > 0) {
              const conceptCount = flowData.concepts.length;
              const conceptTotalWidth = (conceptCount - 1) * nodeWidth;
              conceptParentX = startX - (conceptTotalWidth / 2);
            }
            scriptParentX = conceptParentX - (scriptTotalWidth / 2);
          }
          
          const segmentStartX = scriptParentX - (segmentTotalWidth / 2);
          const segmentX = segmentStartX + (segmentIndex * segmentSpacing);
          
          // Calculate image position under its segment
          const imageDetail = flowData.imageDetails[segment.id];
          const imageCount = imageDetail?.allImages?.length || 1;
          const imageSpacing = 320;
          const imagesTotalWidth = (imageCount - 1) * imageSpacing;
          const imageStartX = segmentX - (imagesTotalWidth / 2);
          const imageX = imageStartX + (imageIndex * imageSpacing);
          
          // Video is centered directly under its parent image
          const videoX = imageX;
          
          newNodes.push({
            id: `video-${segment.id}-${image.id}`,
            type: "videoNode",
            position: { x: videoX, y: startY + (currentLevel * levelHeight) },
            data: {
              segmentId: segment.id,
              imageId: image.id,
              videoUrl: videoUrl,
              videoId: videoId,
              nodeState: 'existing', // Mark as existing/generated so sidebar can show
              segmentData: {
                id: segment.id,
                animation: segment.animation,
                artStyle: flowData?.videoDetails?.[segment.id]?.artStyle || "cinematic photography with soft lighting",
                imageS3Key: image.s3Key,
              },
            },
          });
          
          // Connect video to its parent image
          newEdges.push({
            id: `image-${segment.id}-${image.id}-to-video-${segment.id}-${image.id}`,
            source: `image-${segment.id}-${image.id}`,
            target: `video-${segment.id}-${image.id}`,
            sourceHandle: "output",
            targetHandle: "input",
            style: {
              stroke: "#E9E8EB33",
              strokeWidth: 2,
              filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
            },
          });
        });
      }
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

  // Handle brush tool - refresh project data without auto-generation
  const handleBrushTool = useCallback(async () => {
    console.log("🎨 Brush tool: Refreshing project data with auto-generation disabled");
    
    try {
      // Disable auto-generation during refresh
      setDisableAutoGeneration(true);
      
      // Refresh project data normally
      await refreshProjectData();
      
      console.log("🎨 Brush tool: Project data refreshed successfully");
      
    } catch (error) {
      console.error("Brush tool: Failed to refresh project data:", error);
    } finally {
      // Re-enable auto-generation after a short delay
      setTimeout(() => {
        setDisableAutoGeneration(false);
        console.log("🎨 Brush tool: Auto-generation re-enabled");
      }, 1000);
    }
  }, [refreshProjectData]);

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

  // Handle chat message for concept generation
  const handleChatMessage = useCallback(async (message, nodeId, nodeType, model) => {
    console.log('Chat message received:', { message, nodeId, nodeType, model });
    
    // Remove chat node after sending message
    setNodes((prevNodes) =>
      prevNodes.filter((node) => node.type !== "chatNode"),
    );
    setEdges((prevEdges) =>
      prevEdges.filter((edge) => !edge.target.includes("chat-")),
    );
    
    if (nodeType === 'userNode') {
      // Get selected project from localStorage (following ChatWidget pattern)
      let selectedProject = null;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        selectedProject = storedProject ? JSON.parse(storedProject) : null;
      } catch (e) {
        console.error('Error parsing project data:', e);
      }
      
      if (!selectedProject) {
        console.error('No project selected');
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                error: 'No project selected. Please select a project first.',
                nodeState: 'error'
              }
            };
          }
          return node;
        }));
        return;
      }
      
      // Store user node data in localStorage with project ID and user text
      const userNodeDataKey = `userNodeData-${selectedProject.id}`;
      const existingUserNodeData = JSON.parse(localStorage.getItem(userNodeDataKey) || '{}');
      existingUserNodeData[nodeId] = {
        projectId: selectedProject.id,
        text: message
      };
      localStorage.setItem(userNodeDataKey, JSON.stringify(existingUserNodeData));
      
      // Update state
      setUserConcepts(prev => new Map(prev.set(nodeId, message)));
      
      // Mark user input as completed
      setTaskCompletionStates(prev => ({ ...prev, userInput: true }));
      
      // Update the user node to show user text immediately
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              userText: message,
              nodeState: 'user', // Mark as user input
              content: message
            }
          };
        }
        return node;
      }));
      
      // Create a single loading concept node first
      const loadingConceptNodeId = `loading-concept-${nodeId}-${Date.now()}`;
      const userNodePosition = nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 };
      const loadingConceptNode = {
        id: loadingConceptNodeId,
        type: 'conceptNode',
        position: {
          x: userNodePosition.x,
          y: userNodePosition.y + 300
        },
        data: {
          id: loadingConceptNodeId,
          content: 'Generating concepts...',
          nodeState: 'loading',
          title: 'Loading Concepts'
        }
      };

      // Save persistent generation state
      saveGenerationState(selectedProject.id, 'concept', loadingConceptNodeId, {
        loadingMessage: 'Generating concepts...',
        title: 'Loading Concepts',
        position: { x: userNodePosition.x, y: userNodePosition.y + 300 },
        parentNodeId: nodeId,
        originalPrompt: message
      });
      
      // Create edge connecting user node to loading concept node
      const loadingEdge = {
        id: `${nodeId}-to-${loadingConceptNodeId}`,
        source: nodeId,
        target: loadingConceptNodeId,
        sourceHandle: 'output',
        targetHandle: 'input',
        style: {
          stroke: '#E9E8EB33',
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
        }
      };
      
      // Add loading concept node and edge immediately
      setNodes(prevNodes => [...prevNodes, loadingConceptNode]);
      setEdges(prevEdges => [...prevEdges, loadingEdge]);

      // Generate concepts from backend (following ChatWidget pattern)
      try {
        setGeneratingConcepts(prev => new Set(prev.add(loadingConceptNodeId)));
        
        console.log("Starting concept generation pipeline...");
        
        // First call web-info API (following ChatWidget pattern)
        const webInfoResult = await webInfoApi.processWebInfo(
          message,
          selectedProject.id,
        );
        console.log("Web-info response:", webInfoResult);

        // Then call concept-writer API
        const webInfoContent = webInfoResult.choices[0].message.content;
        const conceptsResponse = await conceptWriterApi.generateConcepts(
          message,
          webInfoContent,
          selectedProject.id,
        );
        console.log("Concept-writer response:", conceptsResponse);
        console.log("Number of concepts returned:", conceptsResponse?.concepts?.length || 0);
        
        if (conceptsResponse && conceptsResponse.concepts && Array.isArray(conceptsResponse.concepts)) {
          // Remove persistent generation state
          removeGenerationState(selectedProject.id, 'concept', loadingConceptNodeId);
          
          // Remove the loading concept node and its edge
          setNodes(prevNodes => prevNodes.filter(node => node.id !== loadingConceptNodeId));
          setEdges(prevEdges => prevEdges.filter(edge => edge.target !== loadingConceptNodeId));
          
          // Create concept nodes from backend response
          const userNodePosition = nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 };
          const conceptCount = conceptsResponse.concepts.length;
          const startX = userNodePosition.x - (conceptCount - 1) * 175; // Center the concepts
          const timestamp = Date.now(); // Use single timestamp for consistency
          
          const newConceptNodes = conceptsResponse.concepts.map((concept, index) => {
            const conceptNodeId = `generated-concept-${nodeId}-${index}-${timestamp}`;
            return {
              id: conceptNodeId,
              type: 'conceptNode',
              position: {
                x: startX + index * 350,
                y: userNodePosition.y + 300
              },
                        data: {
            ...concept,
            nodeState: 'existing',
            content: concept.content || concept.text || concept.concept || concept.description || concept.title,
            title: concept.title || `Generated Concept ${index + 1}`,
            id: concept.id || `concept-${index}`
          }
            };
          });
          
          console.log(`Creating ${conceptCount} concept nodes from backend response:`, conceptsResponse.concepts);
          
          // Create edges connecting user node to generated concepts
          const newEdges = conceptsResponse.concepts.map((_, index) => {
            const conceptNodeId = `generated-concept-${nodeId}-${index}-${timestamp}`;
            return {
              id: `${nodeId}-to-${conceptNodeId}`,
              source: nodeId,
              target: conceptNodeId,
              sourceHandle: 'output',
              targetHandle: 'input',
              style: {
                stroke: '#E9E8EB33',
                strokeWidth: 2,
                filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
              }
            };
          });
          
          // Add new nodes and edges
          setNodes(prevNodes => [...prevNodes, ...newConceptNodes]);
          setEdges(prevEdges => [...prevEdges, ...newEdges]);
          
          // Mark concept generation as completed (preserve existing states)
          setTaskCompletionStates(prev => ({ ...prev, concept: true }));
          
          console.log(`Generated ${conceptsResponse.concepts.length} concept nodes`);
        } else {
          throw new Error('Invalid response format from concept generation API');
        }
      } catch (error) {
        console.error('Error generating concepts:', error);
        // Remove persistent generation state on error
        removeGenerationState(selectedProject.id, 'concept', loadingConceptNodeId);
        
        // Show error in the loading concept node
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === loadingConceptNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                content: 'Failed to generate concepts',
                error: error.message || 'Failed to generate concepts',
                nodeState: 'error'
              }
            };
          }
          return node;
        }));
      } finally {
        setGeneratingConcepts(prev => {
          const newSet = new Set(prev);
          newSet.delete(loadingConceptNodeId);
          return newSet;
        });
      }
    }
  }, [nodes, setNodes, setEdges, setError]);

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
          newNodeData.nodeState = "new";
          break;
        case "image":
          newNodeType = "imageNode";
          newNodeData.content = "New image content...";
          newNodeData.nodeState = "new";
          break;
        case "video":
          newNodeType = "videoNode";
          newNodeData.content = "New video content...";
          newNodeData.nodeState = "new";
          break;
        case "segment":
          newNodeType = "segmentNode";
          newNodeData.content = "New segment content...";
          newNodeData.nodeState = "new";
          break;
        case "concept":
          newNodeType = "conceptNode";
          newNodeData.content = "";
          newNodeData.nodeState = "new";
          break;
        case "user":
          newNodeType = "userNode";
          newNodeData.userText = "";
          newNodeData.nodeState = "new";
          // Position user node at the top of the flow
          centerY = 50;
          break;
        default:
          newNodeType = "scriptNode";
          newNodeData.content = "New node...";
          newNodeData.nodeState = "new";
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
            // Handle the message based on the parent node type
            handleChatMessage(message, clickedNode.id, clickedNode.type, model);
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
          stroke: "#E9E8EB33",
          strokeWidth: 2,
          strokeDasharray: "5,5",
          filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
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
      userNode: UserNode,
    }),
    [],
  );

  // Initialize flow when data changes
  useEffect(() => {
    createFlowElements();
  }, [createFlowElements]);
  
  // Load user concepts from localStorage on mount
  useEffect(() => {
    const projectData = localStorage.getItem('project-store-selectedProject');
    if (projectData) {
      try {
        const project = JSON.parse(projectData);
        const userConceptsKey = `user-concepts-${project.id || 'default'}`;
        const existingUserConcepts = JSON.parse(localStorage.getItem(userConceptsKey) || '{}');
        setUserConcepts(new Map(Object.entries(existingUserConcepts)));
      } catch (e) {
        console.error('Error loading user concepts:', e);
      }
    }
  }, []);

  const onConnect = useCallback(
    async (params) => {
      // Create the edge
      setEdges((eds) => addEdge(params, eds));
      
      // Skip auto-generation if disabled (e.g., during brush tool operations)
      if (disableAutoGeneration) {
        console.log("🚫 Auto-generation disabled, skipping connection logic");
        return;
      }
      
      // Handle special connection logic for new project flow
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode && targetNode) {
        // Script connected to concept - generate script
        if (sourceNode.type === 'conceptNode' && targetNode.type === 'scriptNode' && targetNode.data?.nodeState === 'new') {
          await handleScriptGeneration(sourceNode, targetNode);
        }
        
        // Segment connected to script - create 5 segment nodes
        if (sourceNode.type === 'scriptNode' && targetNode.type === 'segmentNode' && targetNode.data?.nodeState === 'new') {
          await handleSegmentCreation(sourceNode, targetNode);
        }
        
        // Image connected to segment - generate image
        if (sourceNode.type === 'segmentNode' && targetNode.type === 'imageNode' && targetNode.data?.nodeState === 'new') {
          await handleImageGeneration(sourceNode, targetNode);
        }
        
        // Video connected to image - generate video
        if (sourceNode.type === 'imageNode' && targetNode.type === 'videoNode' && targetNode.data?.nodeState === 'new') {
          await handleVideoGeneration(sourceNode, targetNode);
        }
      }
    },
    [setEdges, nodes, disableAutoGeneration],
  );
  
  // Handle script generation from concept
  const handleScriptGeneration = useCallback(async (conceptNode, scriptNode) => {
    try {
      setGeneratingScripts(prev => new Set(prev.add(scriptNode.id)));
      
      // Update script node to show loading
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === scriptNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Generating scripts...',
              nodeState: 'loading'
            }
          };
        }
        return node;
      }));
      
      // Get selected project from localStorage (following ChatWidget pattern)
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
      
      // Update script node to show loading
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === scriptNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Generating script...',
              nodeState: 'loading'
            }
          };
        }
        return node;
      }));

      // Save persistent generation state
      saveGenerationState(selectedProject.id, 'script', scriptNode.id, {
        loadingMessage: 'Generating script...',
        title: 'Loading Script',
        position: scriptNode.position,
        parentNodeId: conceptNode.id,
        conceptContent: conceptNode.data?.content || conceptNode.data?.userText || ''
      });
      
      // Generate 2 different scripts using concept content
      const conceptContent = conceptNode.data?.content || conceptNode.data?.userText || '';
      const conceptTitle = conceptNode.data?.title || 'Selected Concept';
      
      console.log("Starting script generation for concept:", conceptTitle);
      
      // Generate 2 different scripts by making 2 API calls with different approaches
      const [scriptResponse1, scriptResponse2] = await Promise.all([
        segmentationApi.getSegmentation({
          prompt: `Generate a detailed cinematic script for: ${conceptContent}`,
          concept: `${conceptTitle} - Cinematic Style`,
          negative_prompt: "",
          project_id: selectedProject.id,
          model: 'flash'
        }),
        segmentationApi.getSegmentation({
          prompt: `Generate an alternative creative script for: ${conceptContent}`,
          concept: `${conceptTitle} - Creative Style`,
          negative_prompt: "",
          project_id: selectedProject.id,
          model: 'flash'
        })
      ]);
      
      console.log("Script generation responses:", { scriptResponse1, scriptResponse2 });
      
      if (scriptResponse1 && scriptResponse1.segments && Array.isArray(scriptResponse1.segments) &&
          scriptResponse2 && scriptResponse2.segments && Array.isArray(scriptResponse2.segments)) {
        
        // Remove persistent generation state
        removeGenerationState(selectedProject.id, 'script', scriptNode.id);
        
        // Remove the placeholder script node
        setNodes(prevNodes => prevNodes.filter(node => node.id !== scriptNode.id));
        setEdges(prevEdges => prevEdges.filter(edge => edge.target !== scriptNode.id));
        
        // Create 2 new script nodes
        const newScriptNodes = [];
        const newEdges = [];
        
        // Create first script node (Cinematic)
        const script1NodeId = `script-${conceptNode.id}-1-${Date.now()}`;
        newScriptNodes.push({
          id: script1NodeId,
          type: 'scriptNode',
          position: {
            x: scriptNode.position.x - 200,
            y: scriptNode.position.y
          },
          data: {
            id: script1NodeId,
            content: `Cinematic Script - ${scriptResponse1.segments.length} segments`,
            segments: scriptResponse1.segments,
            nodeState: 'existing',
            title: `Cinematic Script`,
            artStyle: scriptResponse1.artStyle || 'cinematic photography with soft lighting',
            concept: conceptTitle
          }
        });
        
        // Create second script node (Creative)
        const script2NodeId = `script-${conceptNode.id}-2-${Date.now()}`;
        newScriptNodes.push({
          id: script2NodeId,
          type: 'scriptNode',
          position: {
            x: scriptNode.position.x + 200,
            y: scriptNode.position.y
          },
          data: {
            id: script2NodeId,
            content: `Creative Script - ${scriptResponse2.segments.length} segments`,
            segments: scriptResponse2.segments,
            nodeState: 'existing',
            title: `Creative Script`,
            artStyle: scriptResponse2.artStyle || 'creative artistic style',
            concept: conceptTitle
          }
        });
        
        // Create edges connecting concept to both script nodes
        newEdges.push({
          id: `${conceptNode.id}-to-${script1NodeId}`,
          source: conceptNode.id,
          target: script1NodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        });
        
        newEdges.push({
          id: `${conceptNode.id}-to-${script2NodeId}`,
          source: conceptNode.id,
          target: script2NodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        });
        
        // Add new nodes and edges
        setNodes(prevNodes => [...prevNodes, ...newScriptNodes]);
        setEdges(prevEdges => [...prevEdges, ...newEdges]);
        
        // Mark script generation as completed
        setTaskCompletionStates(prev => ({ ...prev, script: true }));
        
        console.log(`Generated 2 different script nodes from concept`);
      } else {
        throw new Error('Invalid response format from script generation API');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      // Remove persistent generation state on error
      removeGenerationState(selectedProject.id, 'script', scriptNode.id);
      
      // Show error in script node
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === scriptNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Failed to generate script',
              error: error.message || 'Failed to generate script',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
    } finally {
      setGeneratingScripts(prev => {
        const newSet = new Set(prev);
        newSet.delete(scriptNode.id);
        return newSet;
      });
    }
  }, [setNodes, setError]);
  
  // Handle automatic segment creation
  const handleSegmentCreation = useCallback(async (scriptNode, segmentNode) => {
    const segments = scriptNode.data?.segments || [];
    
    if (segments.length === 0) {
      console.error('No segments found in script node');
      return;
    }
    
    // Remove the placeholder segment node
    setNodes(prevNodes => prevNodes.filter(node => node.id !== segmentNode.id));
    setEdges(prevEdges => prevEdges.filter(edge => edge.target !== segmentNode.id));
    
    // Create segment nodes from script segments (limit to 5)
    const segmentsToCreate = segments.slice(0, 5);
    const timestamp = Date.now(); // Generate timestamp once for consistent IDs
    
    const newSegmentNodes = segmentsToCreate.map((segment, index) => {
      const segmentNodeId = `segment-${scriptNode.id}-${index}-${timestamp}`;
      return {
        id: segmentNodeId,
        type: 'segmentNode',
        position: {
          x: scriptNode.position.x + (index - 2) * 420,
          y: scriptNode.position.y + 400
        },
        data: {
          ...segment,
          id: segment.segmentId || segment.id || index + 1,
          nodeState: 'existing',
          title: `Segment ${index + 1}`,
          visual: segment.visual || '',
          narration: segment.narration || '',
          animation: segment.animation || ''
        }
      };
    });
    
    // Create edges connecting script to segments
    const newEdges = segmentsToCreate.map((_, index) => {
      const segmentNodeId = `segment-${scriptNode.id}-${index}-${timestamp}`;
      return {
        id: `${scriptNode.id}-to-${segmentNodeId}`,
        source: scriptNode.id,
        target: segmentNodeId,
        sourceHandle: 'output',
        targetHandle: 'input',
        style: {
          stroke: '#E9E8EB33',
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
        }
      };
    });
    
    // Add new nodes and edges
    setNodes(prevNodes => [...prevNodes, ...newSegmentNodes]);
    setEdges(prevEdges => [...prevEdges, ...newEdges]);
    
    // Mark segment creation as completed
    setTaskCompletionStates(prev => ({ ...prev, segment: true }));
  }, [setNodes, setEdges]);
  
  // Handle image generation from segment
  const handleImageGeneration = useCallback(async (segmentNode, imageNode) => {
    try {
      setGeneratingImages(prev => new Set(prev.add(imageNode.id)));
      
      // Get selected project from localStorage (following ChatWidget pattern)
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
      
      // Update image node to show loading
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === imageNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Generating image...',
              nodeState: 'loading'
            }
          };
        }
        return node;
      }));

      // Generate image using segment visual prompt (following ChatWidget pattern)
      const visualPrompt = segmentNode.data?.visual || 'A cinematic scene';
      const artStyle = segmentNode.data?.artStyle || 'cinematic photography with soft lighting';
      const segmentId = segmentNode.data?.id || Date.now();
      
      // Save persistent generation state
      saveGenerationState(selectedProject.id, 'image', imageNode.id, {
        loadingMessage: 'Generating image...',
        title: 'Loading Image',
        position: imageNode.position,
        parentNodeId: segmentNode.id,
        visualPrompt: visualPrompt,
        artStyle: artStyle,
        segmentId: segmentId
      });
      
      console.log("Starting image generation...");
      console.log("Image generation request:", {
        visual_prompt: visualPrompt,
        art_style: artStyle,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: 'imagen' // Using default model like ChatWidget
      });
      
      const imageResponse = await chatApi.generateImage({
        visual_prompt: visualPrompt,
        art_style: artStyle,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: 'imagen' // Using default model like ChatWidget
      });
      
      console.log("Image generation response:", imageResponse);
      
      if (imageResponse && imageResponse.s3_key) {
        // Remove persistent generation state
        removeGenerationState(selectedProject.id, 'image', imageNode.id);
        
        // Download image URL (following ChatWidget pattern)
        const imageUrl = await s3Api.downloadImage(imageResponse.s3_key);
        
        // Update image node with generated image
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === imageNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                imageUrl: imageUrl,
                imageId: imageResponse.id,
                s3Key: imageResponse.s3_key,
                visualPrompt: visualPrompt,
                artStyle: artStyle,
                nodeState: 'existing',
                segmentId: segmentId,
                segmentData: segmentNode.data
              }
            };
          }
          return node;
        }));
        
        console.log(`Generated image for segment ${segmentId}`);
        
        // Mark image generation as completed
        setTaskCompletionStates(prev => ({ ...prev, image: true }));
      } else {
        throw new Error('No image key returned from API');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Remove persistent generation state on error
      removeGenerationState(selectedProject.id, 'image', imageNode.id);
      
      // Show error in image node
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === imageNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Failed to generate image',
              error: error.message || 'Failed to generate image',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
    } finally {
      setGeneratingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageNode.id);
        return newSet;
      });
    }
  }, [setNodes, setError]);
  
  // Handle image regeneration from sidebar
  const handleImageRegeneration = useCallback(async (regenerationParams) => {
    try {
      const { selectedNode, prompt, model, artStyle } = regenerationParams;
      
      if (!selectedNode || selectedNode.type !== 'imageNode') {
        console.error('Invalid node for image regeneration:', selectedNode);
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

      // Create a new image node for the regenerated image
      const regeneratedImageNodeId = `regenerated-image-${selectedNode.id}-${Date.now()}`;
      const segmentId = selectedNode.data?.segmentId || Date.now();
      
      // Position the new node next to the original image node
      const newPosition = {
        x: selectedNode.position.x + 350, // Place it to the right
        y: selectedNode.position.y
      };

      // Create loading image node
      const loadingImageNode = {
        id: regeneratedImageNodeId,
        type: 'imageNode',
        position: newPosition,
        data: {
          id: regeneratedImageNodeId,
          content: 'Regenerating image...',
          nodeState: 'loading',
          title: 'Regenerating Image',
          visualPrompt: prompt,
          artStyle: artStyle,
          segmentId: segmentId,
          segmentData: selectedNode.data?.segmentData
        }
      };

      // Add the loading node immediately
      setNodes(prevNodes => [...prevNodes, loadingImageNode]);

      // Connect the new node to the same parent as the original image node
      const parentEdge = edges.find(edge => edge.target === selectedNode.id);
      if (parentEdge) {
        const newEdge = {
          id: `${parentEdge.source}-to-${regeneratedImageNodeId}`,
          source: parentEdge.source,
          target: regeneratedImageNodeId,
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
      saveGenerationState(selectedProject.id, 'image', regeneratedImageNodeId, {
        loadingMessage: 'Regenerating image...',
        title: 'Regenerating Image',
        position: newPosition,
        parentNodeId: parentEdge?.source,
        visualPrompt: prompt,
        artStyle: artStyle,
        segmentId: segmentId
      });

      // Mark as generating
      setGeneratingImages(prev => new Set(prev.add(regeneratedImageNodeId)));

      console.log("Starting image regeneration...");
      console.log("Image regeneration request:", {
        visual_prompt: prompt,
        art_style: artStyle,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: model
      });

      // Generate the image using the chat API
      const imageResponse = await chatApi.generateImage({
        visual_prompt: prompt,
        art_style: artStyle,
        segmentId: segmentId,
        project_id: selectedProject.id,
        model: model
      });

      console.log("Image regeneration response:", imageResponse);

      if (imageResponse && imageResponse.s3_key) {
        // Remove persistent generation state
        removeGenerationState(selectedProject.id, 'image', regeneratedImageNodeId);

        // Download image URL
        const imageUrl = await s3Api.downloadImage(imageResponse.s3_key);

        // Update the loading node with the generated image
        setNodes(prevNodes => prevNodes.map(node => {
          if (node.id === regeneratedImageNodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                imageUrl: imageUrl,
                imageId: imageResponse.id,
                s3Key: imageResponse.s3_key,
                visualPrompt: prompt,
                artStyle: artStyle,
                nodeState: 'existing',
                segmentId: segmentId,
                segmentData: selectedNode.data?.segmentData,
                title: 'Regenerated Image'
              }
            };
          }
          return node;
        }));

        console.log(`Successfully regenerated image for segment ${segmentId}`);
      } else {
        throw new Error('No image key returned from API');
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      
      // Show error in the loading node if it exists
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.data?.nodeState === 'loading' && node.data?.title === 'Regenerating Image') {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Failed to regenerate image',
              error: error.message || 'Failed to regenerate image',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
    } finally {
      // Clean up generating state
      setGeneratingImages(prev => {
        const newSet = new Set(prev);
        // Remove any loading nodes from generating set
        nodes.forEach(node => {
          if (node.data?.nodeState === 'loading' && node.data?.title === 'Regenerating Image') {
            newSet.delete(node.id);
          }
        });
        return newSet;
      });
    }
  }, [nodes, edges, setNodes, setEdges, setGeneratingImages, saveGenerationState, removeGenerationState]);

  // Handle video regeneration from sidebar
  const handleVideoRegeneration = useCallback(async (regenerationParams) => {
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
      
      // Show error in the loading node if it exists
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.data?.nodeState === 'loading' && node.data?.title === 'Regenerating Video') {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Failed to regenerate video',
              error: error.message || 'Failed to regenerate video',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
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

  // Unified regeneration handler that routes to image or video regeneration
  const handleRegeneration = useCallback(async (regenerationParams) => {
    const { nodeType } = regenerationParams;
    
    if (nodeType === 'image') {
      await handleImageRegeneration(regenerationParams);
    } else if (nodeType === 'video') {
      await handleVideoRegeneration(regenerationParams);
    } else {
      console.error('Unsupported node type for regeneration:', nodeType);
    }
  }, [handleImageRegeneration, handleVideoRegeneration]);

  // Handle video generation from image
  const handleVideoGeneration = useCallback(async (imageNode, videoNode) => {
    try {
      setGeneratingVideos(prev => new Set(prev.add(videoNode.id)));
      
      // Get selected project from localStorage (following ChatWidget pattern)
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

      // Generate video using image and segment animation prompt (following ChatWidget pattern)
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
        // Remove persistent generation state
        removeGenerationState(selectedProject.id, 'video', videoNode.id);
        
        // Download video URL (following ChatWidget pattern)
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
            model: 'gen4_turbo', // Fixed: use the actual model name instead of undefined variable
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
      // Remove persistent generation state on error
      removeGenerationState(selectedProject.id, 'video', videoNode.id);
      
      // Show error in video node
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === videoNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Failed to generate video',
              error: error.message || 'Failed to generate video',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
    } finally {
      setGeneratingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoNode.id);
        return newSet;
      });
    }
  }, [setNodes, setTemporaryVideos, setError]);

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

  // Restore generation states only after initial data is loaded
  useEffect(() => {
    if (allProjectData && Object.keys(allProjectData).length > 0) {
      // Restore generation states after a short delay to ensure nodes are created
      const timeoutId = setTimeout(() => {
        restoreGenerationStates();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [allProjectData, restoreGenerationStates]);

  // Reset task completion states when project changes
  useEffect(() => {
    setTaskCompletionStates({
      userInput: false,
      concept: false,
      script: false,
      segment: false,
      image: false,
      video: false
    });
  }, [projectName]); // Reset when project name changes

  // Update task completion states based on existing project data
  useEffect(() => {
    if (!allProjectData) return;

    console.log("🔍 Analyzing existing project data for task completion:", allProjectData);

    const newCompletionStates = {
      userInput: false,
      concept: false,
      script: false,
      segment: false,
      image: false,
      video: false
    };

    // Check for existing user input (stored in localStorage)
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        const userNodeDataKey = `userNodeData-${project.id}`;
        const existingUserNodeData = JSON.parse(localStorage.getItem(userNodeDataKey) || '{}');
        const hasUserInput = Object.keys(existingUserNodeData).length > 0;
        
        if (hasUserInput) {
          newCompletionStates.userInput = true;
        }
      }
    } catch (e) {
      console.error('Error checking user input data:', e);
    }

    // Check for existing concepts
    if (allProjectData.concepts && allProjectData.concepts.length > 0) {
      console.log("✅ Found existing concepts:", allProjectData.concepts.length);
      newCompletionStates.concept = true;
    }

    // Check for existing scripts (segmentations)
    if (allProjectData.scripts && allProjectData.scripts.length > 0) {
      console.log("✅ Found existing scripts:", allProjectData.scripts.length);
      newCompletionStates.script = true;
    }

    // Check for existing segments
    if (allProjectData.segments && allProjectData.segments.length > 0) {
      console.log("✅ Found existing segments:", allProjectData.segments.length);
      newCompletionStates.segment = true;
    }

    // Check for existing images
    if (allProjectData.images && allProjectData.images.length > 0) {
      console.log("🖼️ Checking images:", allProjectData.images.length, "images found");
      // Check if any images are successfully generated (have s3Key and success flag)
      const hasValidImages = allProjectData.images.some(img => 
        img && img.success && img.s3Key
      );
      console.log("🖼️ Valid images found:", hasValidImages);
      if (hasValidImages) {
        newCompletionStates.image = true;
      }
    }

    // Check for existing videos
    if (allProjectData.videos && allProjectData.videos.length > 0) {
      console.log("🎬 Checking videos:", allProjectData.videos.length, "videos found");
      // Check if any videos are successfully generated (have videoFiles with s3Key)
      const hasValidVideos = allProjectData.videos.some(video => 
        video && 
        video.success && 
        Array.isArray(video.videoFiles) && 
        video.videoFiles.length > 0 && 
        video.videoFiles[0].s3Key
      );
      console.log("🎬 Valid videos found:", hasValidVideos);
      if (hasValidVideos) {
        newCompletionStates.video = true;
      }
    }

    console.log("🔄 Updating task completion states based on existing data:", newCompletionStates);
    setTaskCompletionStates(newCompletionStates);
  }, [allProjectData]); // Update when project data changes

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

  // Cleanup old generation states periodically
  useEffect(() => {
    const cleanupOldStates = () => {
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        if (!storedProject) return;
        
        const project = JSON.parse(storedProject);
        const projectId = project.id;
        
        // Clean up each type of generation state
        ['concept', 'script', 'image', 'video'].forEach(type => {
          getGenerationStates(projectId, type); // This function already cleans up old states
        });
        
        console.log('🧹 Periodic cleanup of old generation states completed');
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    };

    // Clean up immediately on mount
    cleanupOldStates();
    
    // Set up periodic cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanupOldStates, 5 * 60 * 1000);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Listen for sandbox open/close events
  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      // Dispatch sandbox opened event to hide timeline elements
      window.dispatchEvent(new CustomEvent("sandbox:opened"));
      
      // Restore generation states when sandbox is opened
      console.log('🔄 Sandbox opened - restoring generation states...');
      setTimeout(() => {
        restoreGenerationStates();
      }, 100); // Shorter delay since we're just switching tabs
    };
    const closeHandler = () => {
      setOpen(false);
      // Don't clear temporary videos on close since they might be persistent now
      // setTemporaryVideos(new Map()); // Commented out to preserve videos
      // Dispatch sandbox closed event to show timeline elements
      window.dispatchEvent(new CustomEvent("sandbox:closed"));
    };
    window.addEventListener("flowWidget:open", openHandler);
    window.addEventListener("flowWidget:close", closeHandler);
    return () => {
      window.removeEventListener("flowWidget:open", openHandler);
      window.removeEventListener("flowWidget:close", closeHandler);
    };
  }, [restoreGenerationStates]);

  // Listen for addVideoToTimeline events from the sidebar
  useEffect(() => {
    const handleAddVideoToTimeline = async (event) => {
      const { videoUrl, videoId, segmentId, nodeId } = event.detail;
      
      console.log('🎬 Adding video to timeline:', { videoUrl, videoId, segmentId, nodeId });
      
      try {
        // Create a videos map with the single video for the timeline function
        const singleVideoMap = {};
        if (segmentId) {
          singleVideoMap[segmentId] = videoUrl;
        } else {
          // Fallback: use videoId or nodeId as key
          const key = videoId || nodeId || 'video';
          singleVideoMap[key] = videoUrl;
        }
        
        // Use the existing timeline function to add the single video
        const success = await timeline.addSingleVideoToTimeline(
          segmentId || videoId || nodeId || 'video',
          singleVideoMap,
          setError
        );
        
        if (success) {
          console.log('✅ Video successfully added to timeline!');
          // Optional: Show success notification or close sidebar
        } else {
          console.error('❌ Failed to add video to timeline');
          setError('Failed to add video to timeline');
        }
      } catch (error) {
        console.error('❌ Error adding video to timeline:', error);
        setError(`Error adding video to timeline: ${error.message}`);
      }
    };

    window.addEventListener('addVideoToTimeline', handleAddVideoToTimeline);
    
    return () => {
      window.removeEventListener('addVideoToTimeline', handleAddVideoToTimeline);
    };
  }, [timeline, setError]);

  // Reflect open state on host element attribute for CSS
  useEffect(() => {
    const host = document.querySelector("react-flow-widget");
    if (host) host.setAttribute("data-open", open ? "true" : "false");
  }, [open]);

  // Handle click outside to close dropdowns
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setLogoDropdownOpen(false);
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
                  <div className='absolute top-full left-0 mt-2 w-72 bg-[#191919] border-0 rounded-xl shadow-2xl backdrop-blur-md z-[1002] overflow-hidden'>
                    <div className='px-2'>
                      {[
                        { 
                          icon: (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2569 9.77251 19.9859C9.5799 19.7148 9.31074 19.5067 9 19.39C8.69838 19.2569 8.36381 19.2172 8.03941 19.276C7.71502 19.3348 7.41568 19.4895 7.18 19.72L7.12 19.78C6.93425 19.966 6.71368 20.1135 6.47088 20.2141C6.22808 20.3148 5.96783 20.3666 5.705 20.3666C5.44217 20.3666 5.18192 20.3148 4.93912 20.2141C4.69632 20.1135 4.47575 19.966 4.29 19.78C4.10405 19.5943 3.95653 19.3737 3.85588 19.1309C3.75523 18.8881 3.70343 18.6278 3.70343 18.365C3.70343 18.1022 3.75523 17.8419 3.85588 17.5991C3.95653 17.3563 4.10405 17.1357 4.29 16.95L4.35 16.89C4.58054 16.6543 4.73519 16.355 4.794 16.0306C4.85282 15.7062 4.81312 15.3716 4.68 15.07C4.55324 14.7742 4.34276 14.522 4.07447 14.3443C3.80618 14.1666 3.49179 14.0713 3.17 14.07H3C2.46957 14.07 1.96086 13.8593 1.58579 13.4842C1.21071 13.1091 1 12.6004 1 12.07C1 11.5396 1.21071 11.0309 1.58579 10.6558C1.96086 10.2807 2.46957 10.07 3 10.07H3.09C3.42099 10.0623 3.742 9.95512 4.01309 9.76251C4.28417 9.5699 4.49226 9.30074 4.61 9C4.74312 8.69838 4.78282 8.36381 4.724 8.03941C4.66519 7.71502 4.51054 7.41568 4.28 7.18L4.22 7.12C4.03405 6.93425 3.88653 6.71368 3.78588 6.47088C3.68523 6.22808 3.63343 5.96783 3.63343 5.705C3.63343 5.44217 3.68523 5.18192 3.78588 4.93912C3.88653 4.69632 4.03405 4.47575 4.22 4.29C4.40575 4.10405 4.62632 3.95653 4.86912 3.85588C5.11192 3.75523 5.37217 3.70343 5.635 3.70343C5.89783 3.70343 6.15808 3.75523 6.40088 3.85588C6.64368 3.95653 6.86425 4.10405 7.05 4.29L7.11 4.35C7.34568 4.58054 7.64502 4.73519 7.96941 4.794C8.29381 4.85282 8.62838 4.81312 8.93 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ), 
                          text: "Settings", 
                          active: true 
                        },
                        { 
                          icon: (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                              <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ), 
                          text: "Help & Resources" 
                        }
                      ].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => setLogoDropdownOpen(false)}
                          className={`p-1.5 px-3 text-white text-xs cursor-pointer rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                            item.active 
                              ? 'bg-white/5' 
                              : 'hover:bg-white/10'
                          }`}
                        >
                          <span className="w-4 flex justify-center text-white">{item.icon}</span>
                          <span>{item.text}</span>
                        </div>
                      ))}
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
                  onClick={() => {
                    // Use the event system to ensure timeline elements are shown
                    window.dispatchEvent(new CustomEvent("flowWidget:close"));
                  }}
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
              {/* Credits Display */}
              {isAuthenticated && user && (
                <div 
                  className='flex items-center gap-1.5 bg-[#FFFFFF0D] border-0 rounded-lg px-2 py-1'
                  style={{
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 16 16'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='text-gray-400'
                  >
                    <path
                      d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
                      stroke='currentColor'
                      strokeWidth='1.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
                      stroke='currentColor'
                      strokeWidth='1.2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <span className='text-gray-200 text-xs font-medium'>
                    {user.credits || "2000"}
                  </span>
                </div>
              )}

              {/* User Profile Dropdown */}
              <UserProfileDropdown />

              {/* Chat Bot Icon - Click to open chat widget */}
              <div 
                className='rounded-lg transition-colors backdrop-blur-sm items-center cursor-pointer hover:opacity-80'
                onClick={() => {
                  // Open chat widget if available
                  if (typeof window.openChat === 'function') {
                    window.openChat();
                  } else {
                    console.log('Chat widget not available');
                  }
                }}
                title="Open Chat Widget"
              >
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

              {/* Task List */}
              <div className='fixed top-24 right-4 z-[1001]'>
                <TaskList 
                  nodes={nodes}
                  collapsed={true}
                  taskCompletionStates={taskCompletionStates}
                />
              </div>
            </div>
            <div className='flex-1 overflow-auto'>
              {error ? (
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
                    defaultEdgeOptions={{
                      style: {
                        stroke: '#E9E8EB33',
                        strokeWidth: 2,
                        filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
                      }
                    }}
                    fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    onNodeClick={(event, node) => {
                      // Show sidebar for generated image and video nodes
                      const shouldShowSidebar = (
                        (node.type === "imageNode" || node.type === "videoNode") &&
                        node.data?.nodeState === "existing"
                      );
                      
                      if (shouldShowSidebar) {
                        setSelectedNode(node);
                      } else {
                        setSelectedNode(null);
                      }
                      
                      // Add chat node only when clicking on user nodes
                      if (node.type === "userNode") {
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
                    onRegenerate={handleRegeneration}
                  />
                </div>
              )}
            </div>
          </div>
          <FlowWidgetBottomToolbar onAddNode={handleAddNode} onRefreshLayout={handleBrushTool} />
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
          }}
        />
      )}
    </div>
  );
}

export default FlowWidget;
