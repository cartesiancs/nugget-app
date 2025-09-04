import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth";
import { useTimeline } from "../hooks/useTimeline";
import { useConceptGeneration } from "../hooks/flow-widget/useConceptGeneration";
import { useScriptGeneration } from "../hooks/flow-widget/useScriptGeneration";
import { useSegmentCreation } from "../hooks/flow-widget/useSegmentCreation";
import { useImageGeneration } from "../hooks/flow-widget/useImageGeneration";
import { useVideoGeneration } from "../hooks/flow-widget/useVideoGeneration";
import { useErrorHandling } from "../hooks/flow-widget/useErrorHandling";
import ChatLoginButton from "./ChatLoginButton";
import { projectApi } from "../services/project";
import { CLOUDFRONT_URL } from "../config/baseurl.js";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Node components
import NodeImage from "./FlowWidget/Node_Image";
import NodeVideo from "./FlowWidget/Node_Video";
import NodeSegment from "./FlowWidget/Node_Segment";
import NodeConcept from "./FlowWidget/Node_Concept";
import NodeScript from "./FlowWidget/Node_Script";
import NodeChat from "./FlowWidget/NodeChat";
import TextNode from "./FlowWidget/TextNode";
import FlowWidgetSidebar from "./FlowWidget/FlowWidgetSidebar";
import ChatNode from "./FlowWidget/ChatNode";
import UserNode from "./FlowWidget/UserNode";
import TaskList from "./FlowWidget/TaskList";
import FlowWidgetBottomToolbar from "./FlowWidget/FlowWidgetBottomToolbar";
import UserProfileDropdown from "./UserProfileDropdown";

// Assets and services
import { assets } from "../assets/assets";

function FlowWidget() {
  const { isAuthenticated, user } = useAuth();
  const timeline = useTimeline();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Modal state for image viewing
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);

  const [rfInstance, setRfInstance] = useState(null);
  const nodesRef = useRef(nodes);
  
  // Update nodesRef whenever nodes change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Image modal handlers
  const handleImageClick = useCallback((imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageUrl(null);
  }, []);

  // Auto-remove chat nodes and text nodes when their parent nodes are deleted
  useEffect(() => {
    const userNodeIds = new Set(
      nodes
        .filter(node => node.type === "userNode" && node.data?.nodeState === "new")
        .map(node => node.id)
    );

    // Get all existing node IDs (excluding chat and text nodes)
    const existingNodeIds = new Set(
      nodes
        .filter(node => node.type !== "chatNode" && node.type !== "textNode")
        .map(node => node.id)
    );

    // Find chat nodes that have parent user nodes that no longer exist
    const orphanedChatNodes = nodes.filter(node => 
      node.type === "chatNode" && 
      node.data?.parentNodeId && 
      !userNodeIds.has(node.data.parentNodeId)
    );

    // Find text nodes that have parent nodes that no longer exist
    const orphanedTextNodes = nodes.filter(node => 
      node.type === "textNode" && 
      node.data?.parentNodeId && 
      !existingNodeIds.has(node.data.parentNodeId)
    );

    const orphanedNodes = [...orphanedChatNodes, ...orphanedTextNodes];

    if (orphanedNodes.length > 0) {
      // Remove orphaned nodes and their edges
      setNodes(prevNodes => 
        prevNodes.filter(node => 
          !orphanedNodes.some(orphan => orphan.id === node.id)
        )
      );

      setEdges(prevEdges => 
        prevEdges.filter(edge => 
          !orphanedNodes.some(orphan => 
            edge.target === orphan.id || edge.source === orphan.id
          )
        )
      );
    }
  }, [nodes, setNodes, setEdges]);

  // Node chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNodeId, setChatNodeId] = useState(null);
  const [chatNodeType, setChatNodeType] = useState(null);

  // Selected node state for sidebar
  const [selectedNode, setSelectedNode] = useState(null);

  // Generation state tracking
  const [userConcepts, setUserConcepts] = useState(new Map());
  const [generatingConcepts, setGeneratingConcepts] = useState(new Set());
  const [generatingScripts, setGeneratingScripts] = useState(new Set());
  const [generatingImages, setGeneratingImages] = useState(new Set());
  const [generatingVideos, setGeneratingVideos] = useState(new Set());

  // Generation state helper functions
  const getGenerationStateKey = (projectId, type) =>
    `generation-states-${projectId}-${type}`;

  const saveGenerationState = (projectId, type, nodeId, data) => {
    try {
      const key = getGenerationStateKey(projectId, type);
      const existingStates = JSON.parse(localStorage.getItem(key) || "{}");
      existingStates[nodeId] = {
        ...data,
        timestamp: Date.now(),
        status: data.status || "generating",
      };
      localStorage.setItem(key, JSON.stringify(existingStates));
    } catch (error) {
      console.error(`Error saving ${type} generation state:`, error);
    }
  };

  const removeGenerationState = (projectId, type, nodeId) => {
    try {
      const key = getGenerationStateKey(projectId, type);
      const existingStates = JSON.parse(localStorage.getItem(key) || "{}");
      delete existingStates[nodeId];
      localStorage.setItem(key, JSON.stringify(existingStates));
    } catch (error) {
      console.error(`Error removing ${type} generation state:`, error);
    }
  };

  const getGenerationStates = (projectId, type) => {
    try {
      const key = getGenerationStateKey(projectId, type);
      const states = JSON.parse(localStorage.getItem(key) || "{}");
      const now = Date.now();
      const cleanedStates = {};

      Object.entries(states).forEach(([nodeId, data]) => {
        const isGenerating = data.status === "generating";
        const maxAge = isGenerating ? 3600000 : 600000;
        if (now - data.timestamp < maxAge) {
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
    video: false,
  });

  // Project data state
  const [allProjectData, setAllProjectData] = useState({
    concepts: [],
    scripts: [],
    segments: [],
    images: [],
    videos: [],
  });

  const [projectName, setProjectName] = useState("Untitled");

  const [disableAutoGeneration, setDisableAutoGeneration] = useState(false);

  // Initialize generation hooks
  const { generateConcepts } = useConceptGeneration({
    setNodes,
    setEdges,
    setGeneratingConcepts,
    setUserConcepts,
    setTaskCompletionStates,
    saveGenerationState,
    removeGenerationState,
    nodes
  });

  const { generateScript } = useScriptGeneration({
    setNodes,
    setEdges,
    setGeneratingScripts,
    setTaskCompletionStates,
    saveGenerationState,
    removeGenerationState,
  });

  const { createSegments } = useSegmentCreation({
    setNodes,
    setEdges,
    setTaskCompletionStates,
  });

  const { generateImage, regenerateImage } = useImageGeneration({
    setNodes,
    setEdges,
    setGeneratingImages,
    setTaskCompletionStates,
    saveGenerationState,
    removeGenerationState,
    edges,
  });

  const { generateVideo, regenerateVideo } = useVideoGeneration({
    setNodes,
    setEdges,
    setGeneratingVideos,
    setTaskCompletionStates,
    saveGenerationState,
    removeGenerationState,
    edges,
    nodes,
  });

  // Initialize error handling hook
  const { retryGeneration } = useErrorHandling({
    setNodes,
    setEdges,
    saveGenerationState,
    removeGenerationState,
    generateConcepts,
    generateScript,
    generateImage,
    generateVideo,
    nodes
  });

  // Restore generation states on component load
  const restoreGenerationStates = useCallback(async () => {
    try {
      const storedProject = localStorage.getItem("project-store-selectedProject");
      const selectedProject = storedProject ? JSON.parse(storedProject) : null;

      if (!selectedProject) return;

      const projectId = selectedProject.id;
      const stateTypes = ["concept", "script", "image", "video"];
      const setterMap = {
        concept: setGeneratingConcepts,
        script: setGeneratingScripts,
        image: setGeneratingImages,
        video: setGeneratingVideos,
      };

      stateTypes.forEach((type) => {
        const states = getGenerationStates(projectId, type);
        Object.entries(states).forEach(([nodeId, state]) => {
          const isError = state.status === "error";
          const isTimedOut = Date.now() - state.timestamp > 900000;

          if (isError || isTimedOut) {
            const errorNode = {
              id: nodeId,
              type: `${type}Node`,
              position: state.position || { x: 400, y: 400 },
              data: {
                id: nodeId,
                content: isTimedOut
                  ? "Generation timed out"
                  : state.errorMessage || `Failed to generate ${type}`,
                nodeState: "error",
                title: state.title || "Error",
                error: isTimedOut
                  ? "Generation timed out after 15 minutes"
                  : state.errorMessage || "Generation failed",
                ...state,
              },
            };

            setNodes((prevNodes) => {
              const existingIndex = prevNodes.findIndex((n) => n.id === nodeId);
              if (
                existingIndex >= 0 &&
                prevNodes[existingIndex].data?.nodeState === "existing"
              ) {
                return prevNodes;
              }
              const updatedNodes = [...prevNodes];
              updatedNodes[
                existingIndex >= 0 ? existingIndex : updatedNodes.length
              ] = errorNode;
              return existingIndex >= 0
                ? updatedNodes
                : [...prevNodes, errorNode];
            });

            setTimeout(
              () => removeGenerationState(projectId, type, nodeId),
              5000,
            );
            return;
          }

          setterMap[type]((prev) => new Set(prev.add(nodeId)));

          const loadingNode = {
            id: nodeId,
            type: `${type}Node`,
            position: state.position || { x: 400, y: 400 },
            data: {
              id: nodeId,
              content: state.loadingMessage || `Generating ${type}...`,
              nodeState: "loading",
              title: state.title || `Loading ${type}`,
              ...state,
            },
          };

          setNodes((prevNodes) => {
            const existingIndex = prevNodes.findIndex((n) => n.id === nodeId);
            if (
              existingIndex >= 0 &&
              prevNodes[existingIndex].data?.nodeState === "existing"
            ) {
              return prevNodes;
            }
            const updatedNodes = [...prevNodes];
            updatedNodes[
              existingIndex >= 0 ? existingIndex : updatedNodes.length
            ] = loadingNode;
            return existingIndex >= 0
              ? updatedNodes
              : [...prevNodes, loadingNode];
          });

          if (state.parentNodeId) {
            const edge = {
              id: `${state.parentNodeId}-to-${nodeId}`,
              source: state.parentNodeId,
              target: nodeId,
              sourceHandle: "output",
              targetHandle: "input",
              style: {
                stroke: "#E9E8EB33",
                strokeWidth: 2,
                filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
              },
            };

            setEdges((prevEdges) => {
              const existingIndex = prevEdges.findIndex(
                (e) => e.id === edge.id,
              );
              return existingIndex < 0 ? [...prevEdges, edge] : prevEdges;
            });
          }
        });
      });
    } catch (error) {
      console.error("Error restoring generation states:", error);
    }
  }, [
    setNodes,
    setEdges,
    setGeneratingConcepts,
    setGeneratingScripts,
    setGeneratingImages,
    setGeneratingVideos,
  ]);

  // Load data from API
  const flowData = useMemo(() => {
    // Process concepts
    const concepts = allProjectData.concepts.map((concept) => ({
      ...concept,
      id: concept.id,
      conceptId: concept.id,
      content:
        concept.content ||
        concept.text ||
        concept.concept ||
        concept.description ||
        concept.prompt ||
        "",
      title: concept.title || concept.name || `Concept ${concept.id}`,
    }));

    // Process scripts (segmentations)
    const scripts = allProjectData.scripts.map((script) => ({
      ...script,
      id: script.id,
      scriptId: script.id,
      artStyle: script.artStyle || "cinematic photography with soft lighting",
      concept: script.concept || "",
      segments: script.segments || [],
      title: script.title || `Script ${script.id}`,
    }));

    // Process segments
    const segments = allProjectData.segments.map((seg) => ({
      ...seg,
      id: seg.id, // Keep the original ID from API response
      segmentId: seg.segmentId || seg.id, // Keep segmentId for backward compatibility
      visual: seg.visual || "",
      narration: seg.narration || "",
      animation: seg.animation || "",
    }));
    


    // Build images lookup by segmentId
    const images = {};
    const imageDetails = {};
    const allImagesBySegment = {};

    if (Array.isArray(allProjectData.images)) {
      allProjectData.images.forEach((img) => {
        if (img && img.success && img.s3Key && img.visualPrompt) {
          // Find matching segment by comparing segment.visual with image.visualPrompt
          let matchingSegment = null;
          
          // Look for exact match between segment.visual and image.visualPrompt
          matchingSegment = allProjectData.segments.find((segment) => 
            segment.visual && segment.visual.trim() === img.visualPrompt.trim()
          );
          
          if (matchingSegment) {
            // Use the actual segment ID from the project data response
            const segmentId = matchingSegment.id;
            
            
            if (!allImagesBySegment[segmentId]) {
              allImagesBySegment[segmentId] = [];
            }

            allImagesBySegment[segmentId].push({
              id: img.id,
              url: `${CLOUDFRONT_URL}/${img.s3Key}`,
              visualPrompt: img.visualPrompt,
              artStyle: img.artStyle,
              s3Key: img.s3Key,
              uuid: img.uuid,
              isPrimary: !img.uuid.includes("-"),
            });
          }
        }
      });

      Object.keys(allImagesBySegment).forEach((segmentId) => {
        const segmentImages = allImagesBySegment[segmentId];
        if (segmentImages.length > 0) {
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
            allImages: segmentImages,
          };
          

        }
      });
      

    }
    // Build videos lookup - match videos to images by S3 key
    const videos = {};
    const videoDetails = {};
    const videosByImageS3Key = {}; // New: Map videos by their source image S3 key
    
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
          const videoKey = video.uuid.replace(/^seg-/, "");
          const videoUrl = `${CLOUDFRONT_URL}/${video.videoFiles[0].s3Key}`;

          videos[videoKey] = videoUrl;
          videoDetails[videoKey] = {
            id: video.id,
            artStyle: video.artStyle,
            imageS3Key: video.imageS3Key || null,
          };

          // NEW: If video has imageS3Key, create mapping by image S3 key for precise matching
          if (video.imageS3Key) {
            videosByImageS3Key[video.imageS3Key] = {
              videoUrl: videoUrl,
              videoId: video.id,
              videoKey: videoKey,
              artStyle: video.artStyle,
              uuid: video.uuid
            };
          }
        }
      });
      

    }

    try {
      const storedProject = localStorage.getItem("project-store-selectedProject");
      const selectedProject = storedProject ? JSON.parse(storedProject) : null;
      if (selectedProject) {
        const videoStorageKey = `generated-videos-${selectedProject.id}`;
        const savedVideos = JSON.parse(
          localStorage.getItem(videoStorageKey) || "{}",
        );

        Object.entries(savedVideos).forEach(([key, videoData]) => {
          if (videoData && videoData.videoUrl) {
            videos[key] = videoData.videoUrl;
            if (!videoDetails[key]) {
              videoDetails[key] = {
                id: videoData.videoId,
                artStyle: videoData.artStyle,
                imageS3Key: videoData.imageS3Key || null,
              };
            }
            
            // CRITICAL FIX: Add saved videos to videosByImageS3Key mapping for proper node creation
            if (videoData.imageS3Key) {
              videosByImageS3Key[videoData.imageS3Key] = {
                videoUrl: videoData.videoUrl,
                videoId: videoData.videoId,
                videoKey: key,
                artStyle: videoData.artStyle,
                uuid: `seg-${key}`, // Reconstruct UUID format
                fromLocalStorage: true // Flag to identify videos
              };
            }
          }
        });
        

      }
    } catch (error) {
      console.error("Error loading saved videos from localStorage:", error);
    }

    return {
      concepts,
      scripts,
      segments,
      images,
      videos,
      imageDetails,
      videoDetails,
      videosByImageS3Key, // NEW: Add the S3 key mapping for precise video-to-image matching
    };
  }, [allProjectData]);

  // Create nodes and edges from flow data - ONLY when needed
  const createFlowElements = useCallback(() => {
    // PERFORMANCE FIX: Don't recreate if nodes already exist and are just being moved
    if (nodesRef.current.length > 0) {
      // Check if we have any new data that requires new nodes
      const hasNewData = 
        (flowData.concepts && flowData.concepts.length > 0) ||
        (flowData.scripts && flowData.scripts.length > 0) ||
        (flowData.segments && flowData.segments.length > 0) ||
        (flowData.images && Object.keys(flowData.images).length > 0) ||
        (flowData.videos && Object.keys(flowData.videos).length > 0);
      
      if (!hasNewData) {
        return; // Don't recreate nodes if no new data
      }
    }
    
    const newNodes = [];
    const newEdges = [];
    
    // Get existing nodes map for position preservation
    const existingNodesMap = new Map();
    nodesRef.current.forEach(node => {
      existingNodesMap.set(node.id, node);
    });
    
    // Helper function to create node with preserved position
    const createNodeWithPosition = (nodeId, nodeData, defaultPosition) => {
      const existingNode = existingNodesMap.get(nodeId);
      return {
        id: nodeId,
        ...nodeData,
        position: existingNode?.position || defaultPosition,
        // Preserve user interaction state
        selected: existingNode?.selected || false,
        dragging: existingNode?.dragging || false,
        // Preserve any other React Flow properties
        ...(existingNode && {
          width: existingNode.width,
          height: existingNode.height,
          positionAbsolute: existingNode.positionAbsolute,
        })
      };
    };

    // Tree Layout configuration
    const levelHeight = 400; // Vertical space between tree levels
    const nodeWidth = 380; // Width allocated per node including spacing
    const startX = 400; // Center starting position
    const startY = 80; // Top starting position

    // Tree level tracking
    let currentLevel = 0;

    // Check for user concepts that match current project
    let selectedProject = null;
    try {
      const storedProject = localStorage.getItem("project-store-selectedProject");
      selectedProject = storedProject ? JSON.parse(storedProject) : null;
    } catch (e) {
      console.error("Error parsing project data:", e);
    }

    // Add User Node if there are matching user node data for this project (ROOT of tree)
    let userNodeId = null;
    if (selectedProject) {
      const userNodeDataKey = `userNodeData-${selectedProject.id}`;
      const existingUserNodeData = JSON.parse(
        localStorage.getItem(userNodeDataKey) || "{}",
      );

      // Check if there are any user node data for this project
      const userNodeEntries = Object.entries(existingUserNodeData).filter(
        ([nodeId, data]) => data && data.projectId === selectedProject.id,
      );

      if (userNodeEntries.length > 0) {
        // Create a single user node that represents all user inputs (ROOT)
        userNodeId = `user-${selectedProject.id}`;
        const allUserTexts = userNodeEntries
          .map(([nodeId, data]) => data.text)
          .join("\n\n");

        newNodes.push(createNodeWithPosition(userNodeId, {
          type: "userNode",
          data: {
            id: userNodeId,
            userText: allUserTexts,
            projectId: selectedProject.id,
            nodeState: "user",
          },
        }, { x: startX, y: startY + currentLevel * levelHeight }));

        currentLevel++; // Move to next level for concepts
      }
    }

    // Create Concept Nodes
    if (flowData.concepts && flowData.concepts.length > 0) {
      const conceptCount = flowData.concepts.length;
      const totalWidth = (conceptCount - 1) * nodeWidth;
      const conceptStartX = startX - totalWidth / 2;

      flowData.concepts.forEach((concept, index) => {
        const conceptX = conceptStartX + index * nodeWidth;

        newNodes.push(createNodeWithPosition(`concept-${concept.id}`, {
          type: "conceptNode",
          data: concept,
        }, { x: conceptX, y: startY + currentLevel * levelHeight }));

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

      currentLevel++;
    }

    // Create Script Nodes
    if (flowData.scripts && flowData.scripts.length > 0) {
      const scriptCount = flowData.scripts.length;
      const scriptSpacing = 400;
      const totalWidth = (scriptCount - 1) * scriptSpacing;
      const scriptStartX = startX - totalWidth / 2;

      flowData.scripts.forEach((script, index) => {
        const scriptX = scriptStartX + index * scriptSpacing;

        newNodes.push(createNodeWithPosition(`script-${script.id}`, {
          type: "scriptNode",
          data: script,
        }, { x: scriptX, y: startY + currentLevel * levelHeight }));

        if (flowData.concepts && flowData.concepts.length > 0) {
          // Find the concept that matches this script's concept
          let parentConceptId = null;
          

          
          // First, try to find concept by matching the concept field (title/name)
          if (script.concept) {
            const matchingConcept = flowData.concepts.find(
              (concept) => {
                // Exact match first
                if (concept.title === script.concept) return true;
                
                // Check if script.concept starts with the concept title (handles "Title - Style" format)
                if (script.concept.startsWith(concept.title)) return true;
                
                // Check if concept title is contained in script.concept
                if (script.concept.includes(concept.title)) return true;
                
                // Case-insensitive comparison
                if (concept.title.toLowerCase() === script.concept.toLowerCase()) return true;
                
                return false;
              }
            );
            if (matchingConcept) {
              parentConceptId = matchingConcept.id;
            }
          }
          
          // If no match found, try to find concept by conceptId field
          if (!parentConceptId && script.conceptId) {
            const matchingConcept = flowData.concepts.find(
              (concept) => concept.id === script.conceptId
            );
            if (matchingConcept) {
              parentConceptId = matchingConcept.id;
            }
          }
          
          // If still no match found, default to first concept as fallback
          if (!parentConceptId) {
            parentConceptId = flowData.concepts[0].id;
          }

          newEdges.push({
            id: `concept-${parentConceptId}-to-script-${script.id}`,
            source: `concept-${parentConceptId}`,
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

      currentLevel++;
    }

    // Show ALL segments from scripts that have at least one segment with an image generated
    let segmentsToDisplay = [];
    if (flowData.segments && flowData.segments.length > 0) {
      // Group segments by their parent script using the parentScriptId field
      const segmentsByScript = {};
      
      flowData.segments.forEach(segment => {
        const parentScriptId = segment.parentScriptId;
        if (!segmentsByScript[parentScriptId]) {
          segmentsByScript[parentScriptId] = [];
        }
        segmentsByScript[parentScriptId].push(segment);
      });
      
      // Find scripts that have at least one segment with an image
      const scriptsWithImages = new Set();
      flowData.segments.forEach(segment => {
        if (flowData.images[segment.id]) {
          scriptsWithImages.add(segment.parentScriptId);
        }
      });
      
      // Include ALL segments from scripts that have images
      Object.entries(segmentsByScript).forEach(([scriptId, segments]) => {
        if (scriptsWithImages.has(scriptId)) {
          segmentsToDisplay.push(...segments);
        }
      });
    }
    


    // Create Segment Nodes - for all segments from scripts with images
    if (segmentsToDisplay.length > 0) {
      const segmentCount = segmentsToDisplay.length;
      const segmentSpacing = 400;
      const totalWidth = (segmentCount - 1) * segmentSpacing;
      const segmentStartX = startX - totalWidth / 2;

      segmentsToDisplay.forEach((segment, index) => {
        const segmentX = segmentStartX + index * segmentSpacing;

        newNodes.push(createNodeWithPosition(`segment-${segment.id}`, {
          type: "segmentNode",
          data: {
            ...segment,
            status: flowData.videos[segment.id]
              ? "completed"
              : flowData.images[segment.id]
              ? "generating"
              : "pending", // Now we show all segments, so some might be pending
          },
        }, { x: segmentX, y: startY + currentLevel * levelHeight }));

        if (flowData.scripts && flowData.segments.length > 0) {
          // Use the parentScriptId field that's already available in the segment data
          const parentScriptId = segment.parentScriptId;
          
          if (!parentScriptId) {
            return; // Skip this segment if no parent script ID
          }

          newEdges.push({
            id: `script-${parentScriptId}-to-segment-${segment.id}`,
            source: `script-${parentScriptId}`,
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

      currentLevel++;
      

    }

    // Create Image Nodes for segments that have images (use all segments from scripts with images)
    let imageNodesBySegment = new Map();
    segmentsToDisplay.forEach((segment, segmentIndex) => {
      const imageDetail = flowData.imageDetails[segment.id];
      if (flowData.images[segment.id] && imageDetail?.allImages) {

        imageNodesBySegment.set(segment.id, {
          segment: segment,
          segmentIndex: segmentIndex,
          images: imageDetail.allImages,
          imageDetail: imageDetail,
        });
      }
    });

    if (imageNodesBySegment.size > 0) {
      const segmentSpacing = 400;

      imageNodesBySegment.forEach((segmentData, segmentId) => {
        const { segment, segmentIndex, images, imageDetail } = segmentData;

        const segmentNode = newNodes.find(
          (n) => n.id === `segment-${segment.id}`,
        );
        const segmentX = segmentNode
          ? segmentNode.position.x
          : startX + segmentIndex * segmentSpacing;

        const imageSpacing = 320;
        const imageCount = images.length;
        const imagesTotalWidth = (imageCount - 1) * imageSpacing;
        const imageStartX = segmentX - imagesTotalWidth / 2;

        images.forEach((image, imageIndex) => {
          const imageX = imageStartX + imageIndex * imageSpacing;

          newNodes.push(createNodeWithPosition(`image-${segment.id}-${image.id}`, {
            type: "imageNode",
            data: {
              segmentId: segment.id,
              imageUrl: image.url,
              imageId: image.id,
              isPrimary: image.isPrimary,
              allImages: imageDetail.allImages,
              s3Key: image.s3Key,
              nodeState: "existing",
              visualPrompt: image.visualPrompt,
              artStyle:
                image.artStyle || "cinematic photography with soft lighting",
              segmentData: {
                id: segment.id,
                visual: segment.visual,
                animation: segment.animation,
                artStyle:
                  image.artStyle ||
                  "cinematic photography with soft lighting",
              },
            },
          }, { x: imageX, y: startY + currentLevel * levelHeight }));

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

      currentLevel++;
    }

    // Create Video Nodes for images that have videos - using S3 key matching for precise attachment
    let videoNodesByImage = new Map();

    segmentsToDisplay.forEach((segment, segmentIndex) => {
      const imageDetail = flowData.imageDetails[segment.id];
      if (flowData.images[segment.id] && imageDetail?.allImages) {
        imageDetail.allImages.forEach((image, imageIndex) => {
          let videoUrl = null;
          let videoId = null;
          let videoKey = null;
          let matchedByS3Key = false;

          // PRIORITY 1: Try to match video by image S3 key (most precise)
          if (image.s3Key && flowData.videosByImageS3Key && flowData.videosByImageS3Key[image.s3Key]) {
            const videoData = flowData.videosByImageS3Key[image.s3Key];
            videoUrl = videoData.videoUrl;
            videoId = videoData.videoId;
            videoKey = `${segment.id}-${image.id}`;
            matchedByS3Key = true;
          }
          
          // ONLY use S3 key matching - no fallback logic
          if (videoUrl) {
            videoNodesByImage.set(videoKey, {
              segment: segment,
              segmentIndex: segmentIndex,
              image: image,
              imageIndex: imageIndex,
              videoUrl: videoUrl,
              videoId: videoId,
              matchedByS3Key: matchedByS3Key, // Track how the match was made
            });
          }
        });
      }
    });

    if (videoNodesByImage.size > 0) {
      videoNodesByImage.forEach((videoData, key) => {
        const {
          segment,
          segmentIndex,
          image,
          imageIndex,
          videoUrl,
          videoId,
          matchedByS3Key,
        } = videoData;

        const imageNodeId = `image-${segment.id}-${image.id}`;
        const imageNode = newNodes.find((n) => n.id === imageNodeId);
        const videoX = imageNode ? imageNode.position.x : startX;

        newNodes.push(createNodeWithPosition(`video-${segment.id}-${image.id}`, {
          type: "videoNode",
          data: {
            segmentId: segment.id,
            imageId: image.id,
            videoUrl: videoUrl,
            videoId: videoId,
            nodeState: "existing",
            matchedByS3Key: matchedByS3Key, // NEW: Track how video was matched to image
            segmentData: {
              id: segment.id,
              animation: segment.animation,
              artStyle:
                flowData?.videoDetails?.[segment.id]?.artStyle ||
                "cinematic photography with soft lighting",
              imageS3Key: image.s3Key,
            },
          },
        }, { x: videoX, y: startY + currentLevel * levelHeight }));

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

    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges]);

  // Fetch project data from API
  const fetchAllProjectData = useCallback(async () => {
    if (!isAuthenticated) return;

    let projectId;
    let projectName = "Untitled";
    try {
          const storedProject = localStorage.getItem("project-store-selectedProject");
    const project = storedProject ? JSON.parse(storedProject) : null;
      if (project) {
        projectId = project.id;
        projectName = project.name || project.title || "Untitled";
        setProjectName(projectName);
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }

    if (!projectId) {
      setError("No project selected. Please select a project first.");
      return;
    }

    try {
      const [conceptsData, segmentationsData, imagesData, videosData] =
        await Promise.all([
          projectApi.getProjectConcepts(projectId),
          projectApi.getProjectSegmentations(projectId),
          projectApi.getProjectImages(projectId),
          projectApi.getProjectVideos(projectId),
        ]);

      let concepts = [];
      if (conceptsData?.success && Array.isArray(conceptsData.data)) {
        concepts = conceptsData.data;
      }

      let scripts = [];
      let segments = [];
      if (segmentationsData?.success && segmentationsData.data?.length > 0) {
        scripts = segmentationsData.data;
        
        // Collect segments from ALL scripts, not just the first one
        segments = [];
        segmentationsData.data.forEach((script, scriptIndex) => {
          if (script.segments && Array.isArray(script.segments)) {
            script.segments.forEach((segment) => {
              segments.push({
                ...segment,
                // Use the actual segment ID from the API response
                id: segment.id, // Use the original segment.id from API
                segmentId: segment.segmentId || segment.id, // Keep segmentId for backward compatibility
                // Add reference to parent script for debugging
                parentScriptId: script.id,
                parentScriptIndex: scriptIndex
              });
            });

          }
        });
        

      }

      setAllProjectData({
        concepts,
        scripts,
        segments,
        images: imagesData?.data || [],
        videos: videosData?.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch project data:", error);
      setError("Failed to fetch project data");
    }
  }, [isAuthenticated]);

  // Handle tidy/layout arrangement - recreate the proper project structure
  const handleTidyLayout = useCallback(() => {
    if (!rfInstance) return;

    try {
      // Use the same layout configuration as createFlowElements
      const levelHeight = 400; // Same as createFlowElements
      const nodeWidth = 380; // Same as createFlowElements  
      const startX = 400; // Same as createFlowElements
      const startY = 80; // Same as createFlowElements

      let currentLevel = 0;
      const updatedNodes = [];

      // Step 1: Position User Nodes (ROOT level)
      const userNodes = nodes.filter((n) => n.type === "userNode");
      userNodes.forEach((node) => {
        updatedNodes.push({
          ...node,
          position: { x: startX, y: startY + currentLevel * levelHeight }
        });
      });
      if (userNodes.length > 0) currentLevel++;

      // Step 2: Position Concept Nodes
      const conceptNodes = nodes.filter((n) => n.type === "conceptNode");
      if (conceptNodes.length > 0) {
        const conceptCount = conceptNodes.length;
        const totalWidth = (conceptCount - 1) * nodeWidth;
        const conceptStartX = startX - totalWidth / 2;

        conceptNodes.forEach((node, index) => {
          const conceptX = conceptStartX + index * nodeWidth;
          updatedNodes.push({
            ...node,
            position: { x: conceptX, y: startY + currentLevel * levelHeight }
          });
        });
        currentLevel++;
      }

      // Step 3: Position Script Nodes
      const scriptNodes = nodes.filter((n) => n.type === "scriptNode");
      if (scriptNodes.length > 0) {
        const scriptCount = scriptNodes.length;
        const scriptSpacing = 400; // Same as createFlowElements
        const totalWidth = (scriptCount - 1) * scriptSpacing;
        const scriptStartX = startX - totalWidth / 2;

        scriptNodes.forEach((node, index) => {
          const scriptX = scriptStartX + index * scriptSpacing;
          updatedNodes.push({
            ...node,
            position: { x: scriptX, y: startY + currentLevel * levelHeight }
          });
        });
        currentLevel++;
      }

      // Step 4: Position Segment Nodes
      const segmentNodes = nodes.filter((n) => n.type === "segmentNode");
      if (segmentNodes.length > 0) {
        const segmentCount = segmentNodes.length;
        const segmentSpacing = 400; // Same as createFlowElements
        const totalWidth = (segmentCount - 1) * segmentSpacing;
        const segmentStartX = startX - totalWidth / 2;

        segmentNodes.forEach((node, index) => {
          const segmentX = segmentStartX + index * segmentSpacing;
          updatedNodes.push({
            ...node,
            position: { x: segmentX, y: startY + currentLevel * levelHeight }
          });
        });
        currentLevel++;
      }

      // Step 5: Position Image Nodes - group by segment and align under their parent segments
      const imageNodes = nodes.filter((n) => n.type === "imageNode");
      if (imageNodes.length > 0) {
        // Group images by segment
        const imagesBySegment = new Map();
        imageNodes.forEach((imageNode) => {
          const segmentId = imageNode.data?.segmentId;
          if (segmentId) {
            if (!imagesBySegment.has(segmentId)) {
              imagesBySegment.set(segmentId, []);
            }
            imagesBySegment.get(segmentId).push(imageNode);
          }
        });

        // Position images under their parent segments
        imagesBySegment.forEach((images, segmentId) => {
          // Find the parent segment node
          const parentSegmentNode = updatedNodes.find((n) => 
            n.type === "segmentNode" && 
            (n.id === `segment-${segmentId}` || n.data?.id === segmentId)
          );
          
          if (parentSegmentNode) {
            const segmentX = parentSegmentNode.position.x;
            const imageSpacing = 320; // Same as createFlowElements
            const imageCount = images.length;
            const imagesTotalWidth = (imageCount - 1) * imageSpacing;
            const imageStartX = segmentX - imagesTotalWidth / 2;

            images.forEach((imageNode, imageIndex) => {
              const imageX = imageStartX + imageIndex * imageSpacing;
              updatedNodes.push({
                ...imageNode,
                position: { x: imageX, y: startY + currentLevel * levelHeight }
              });
            });
          } else {
            // Fallback: position images in a row if no parent segment found
            images.forEach((imageNode, imageIndex) => {
              updatedNodes.push({
                ...imageNode,
                position: { x: startX + imageIndex * 350, y: startY + currentLevel * levelHeight }
              });
            });
          }
        });
        currentLevel++;
      }

      // Step 6: Position Video Nodes - align under their parent images
      const videoNodes = nodes.filter((n) => n.type === "videoNode");
      if (videoNodes.length > 0) {
        videoNodes.forEach((videoNode) => {
          const segmentId = videoNode.data?.segmentId;
          const imageId = videoNode.data?.imageId;
          
          // Find the parent image node
          const parentImageNode = updatedNodes.find((n) => 
            n.type === "imageNode" && 
            (n.data?.segmentId === segmentId || n.data?.imageId === imageId)
          );
          
          if (parentImageNode) {
            // Position video directly under its parent image
            updatedNodes.push({
              ...videoNode,
              position: { x: parentImageNode.position.x, y: startY + currentLevel * levelHeight }
            });
          } else {
            // Fallback: position in sequence if no parent image found
            const videoIndex = videoNodes.findIndex((n) => n.id === videoNode.id);
            updatedNodes.push({
              ...videoNode,
              position: { x: startX + videoIndex * 350, y: startY + currentLevel * levelHeight }
            });
          }
        });
      }

      // Handle any other node types that might exist
      const otherNodes = nodes.filter((n) => 
        !['userNode', 'conceptNode', 'scriptNode', 'segmentNode', 'imageNode', 'videoNode'].includes(n.type)
      );
      otherNodes.forEach((node) => {
        updatedNodes.push(node); // Keep original position for unknown node types
      });

      setNodes(updatedNodes);

      // Fit view with animation
      setTimeout(() => {
        rfInstance.fitView({
          padding: 0.2,
          includeHiddenNodes: true,
          duration: 800,
        });
      }, 100);


    } catch (error) {
      console.error("Error arranging layout:", error);
    }
  }, [nodes, setNodes, rfInstance]);

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
  const handleChatMessage = useCallback(
    async (message, nodeId, nodeType, model) => {
      // Remove chat node after sending message
      setNodes((prevNodes) =>
        prevNodes.filter((node) => node.type !== "chatNode"),
      );
      setEdges((prevEdges) =>
        prevEdges.filter((edge) => !edge.target.includes("chat-")),
      );

      if (nodeType === "userNode") {
        // Use the concept generation hook
        await generateConcepts(message, nodeId);
      }
    },
    [nodes, setNodes, setEdges, setError, generateConcepts],
  );

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

      setNodes((prevNodes) => {
        const updatedNodes = [...prevNodes, newNode];
        
        // Auto-add chat node for new user nodes
        if (nodeType === "user") {
          const chatNodeId = `chat-${newNodeId}-${Date.now()}`;
          const chatNode = {
            id: chatNodeId,
            type: "chatNode",
            position: {
              x: centerX - 20,
              y: centerY + 380,
            },
            data: {
              nodeType: newNodeType,
              parentNodeId: newNodeId,
              onSendMessage: (message, nodeType, model) => {
                handleChatMessage(message, newNodeId, newNodeType, model);
              },
            },
          };
          
          // Add both user node and chat node
          updatedNodes.push(chatNode);
          
          // Also add the edge connecting them
          setTimeout(() => {
            const newEdge = {
              id: `${newNodeId}-to-${chatNodeId}`,
              source: newNodeId,
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
          }, 100);
        }
        
        return updatedNodes;
      });
    },
    [setNodes, handleChatClick, rfInstance, handleChatMessage, setEdges], // Add all dependencies
  );

  // Handle text node toggle for concept, script, and segment nodes
  const handleToggleTextNode = useCallback(
    (parentNodeId, parentNodeType, isExpanded, fullText, position) => {
      // Handle text node creation/removal
      
      const textNodeId = `text-${parentNodeId}`;
      
      if (isExpanded) {
        // Use the position passed from the node component
        const parentPosition = position || { xPos: 400, yPos: 200 }; // fallback
        
        // Create text node positioned to the left of the parent node
        const textNode = {
          id: textNodeId,
          type: "textNode",
          position: {
            x: parentPosition.xPos - 450, 
            y: parentPosition.yPos,
          },
          data: {
            parentNodeId: parentNodeId,
            parentNodeType: parentNodeType,
            fullText: fullText,
            onClose: () => {
              // Remove the text node when close button is clicked and reset parent node state
              setNodes((prevNodes) => 
                prevNodes.filter((node) => node.id !== textNodeId)
              );
              
              // Reset the expanded state in the parent node
              // This will be handled by the component's internal state
            },
          },
        };
        
        // Add text node to the flow
        setNodes((prevNodes) => [...prevNodes, textNode]);
      } else {
        // Remove text node
        setNodes((prevNodes) => 
          prevNodes.filter((node) => node.id !== textNodeId)
        );
      }
    },
    [setNodes],
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
          x: clickedNode.position.x - 20,
          y: clickedNode.position.y + 380,
        },
        data: {
          nodeType: clickedNode.type,
          parentNodeId: clickedNode.id,
          onSendMessage: (message, nodeType, model) => {
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

  // Update nodeTypes to include all new clean node components with retry functionality
  const nodeTypes = useMemo(() => {
    // Memoized components with stable references
    const MemoizedImageNode = React.memo((props) => <NodeImage {...props} onRetry={retryGeneration} onImageClick={handleImageClick} />);
    const MemoizedVideoNode = React.memo((props) => <NodeVideo {...props} onRetry={retryGeneration} />);
    const MemoizedScriptNode = React.memo((props) => <NodeScript {...props} onRetry={retryGeneration} onToggleTextNode={handleToggleTextNode} nodes={nodes} />);
    const MemoizedConceptNode = React.memo((props) => <NodeConcept {...props} onRetry={retryGeneration} onToggleTextNode={handleToggleTextNode} nodes={nodes} />);
    const MemoizedSegmentNode = React.memo((props) => <NodeSegment {...props} onToggleTextNode={handleToggleTextNode} nodes={nodes} />);
    const MemoizedChatNode = React.memo(ChatNode);
    const MemoizedUserNode = React.memo(UserNode);
    const MemoizedTextNode = React.memo(TextNode);
    
    return {
      imageNode: MemoizedImageNode,
      videoNode: MemoizedVideoNode,
      scriptNode: MemoizedScriptNode,
      segmentNode: MemoizedSegmentNode,
      conceptNode: MemoizedConceptNode,
      chatNode: MemoizedChatNode,
      userNode: MemoizedUserNode,
      textNode: MemoizedTextNode,
    };
  }, [retryGeneration, handleToggleTextNode, nodes]);

  // Initialize flow when data changes - but NOT when nodes are just moved
  useEffect(() => {
    createFlowElements();
  }, [createFlowElements]);

  // Load user concepts on mount
  useEffect(() => {
    const storedProject = localStorage.getItem("project-store-selectedProject");
    const project = storedProject ? JSON.parse(storedProject) : null;
    if (project) {
      try {
        const projectId = project.id;

        const userConceptsKey = `user-concepts-${projectId || "default"}`;
        const existingUserConcepts = JSON.parse(
          localStorage.getItem(userConceptsKey) || "{}",
        );
        setUserConcepts(new Map(Object.entries(existingUserConcepts)));
      } catch (e) {
        console.error("Error loading user concepts:", e);
      }
    }
  }, []);

  const onConnect = useCallback(
    async (params) => {
      // Create the edge
      setEdges((eds) => addEdge(params, eds));

      // Skip auto-generation if disabled (e.g., during brush tool operations)
      if (disableAutoGeneration) {
        return;
      }

      // Handle special connection logic for new project flow
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        // Script connected to concept - generate script
        if (
          sourceNode.type === "conceptNode" &&
          targetNode.type === "scriptNode" &&
          targetNode.data?.nodeState === "new"
        ) {
          await generateScript(sourceNode, targetNode);
        }

        // Segment connected to script - create 5 segment nodes
        if (
          sourceNode.type === "scriptNode" &&
          targetNode.type === "segmentNode" &&
          targetNode.data?.nodeState === "new"
        ) {
          await createSegments(sourceNode, targetNode);
        }

        // Image connected to segment - generate image
        if (
          sourceNode.type === "segmentNode" &&
          targetNode.type === "imageNode" &&
          targetNode.data?.nodeState === "new"
        ) {
          await generateImage(sourceNode, targetNode);
        }

        // Video connected to image - generate video
        if (
          sourceNode.type === "imageNode" &&
          targetNode.type === "videoNode" &&
          targetNode.data?.nodeState === "new"
        ) {
          await generateVideo(sourceNode, targetNode);
        }
      }
    },
    [
      setEdges,
      nodes,
      disableAutoGeneration,
      generateScript,
      createSegments,
      generateImage,
      generateVideo,
    ],
  );

  const handleRegeneration = useCallback(
    async (regenerationParams) => {
      const { nodeType } = regenerationParams;

      if (nodeType === "image") {
        await regenerateImage(regenerationParams);
      } else if (nodeType === "video") {
        await regenerateVideo(regenerationParams);
      } else {
        console.error("Unsupported node type for regeneration:", nodeType);
      }
    },
    [regenerateImage, regenerateVideo],
  );

  useEffect(() => {
    fetchAllProjectData();
  }, [fetchAllProjectData]);

  // Restore generation states after data loads
  useEffect(() => {
    if (allProjectData && Object.keys(allProjectData).length > 0) {
      const timeoutId = setTimeout(restoreGenerationStates, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [allProjectData, restoreGenerationStates]);

  // Update task completion states and project name based on project data
  useEffect(() => {
    if (!allProjectData) return;

    const newCompletionStates = {
      userInput: false,
      concept: allProjectData.concepts?.length > 0,
      script: allProjectData.scripts?.length > 0,
      segment: allProjectData.images?.some((img) => img?.success && img?.s3Key), // Complete when any segment has images
      image: allProjectData.images?.some((img) => img?.success && img?.s3Key),
      video: allProjectData.videos?.some(
        (video) =>
          video?.success &&
          Array.isArray(video.videoFiles) &&
          video.videoFiles.length > 0 &&
          video.videoFiles[0]?.s3Key,
      ),
    };

    // Check for user input in localStorage
    try {
          const storedProject = localStorage.getItem("project-store-selectedProject");
    const project = storedProject ? JSON.parse(storedProject) : null;
      if (project) {
        const userNodeDataKey = `userNodeData-${project.id}`;
        const existingUserNodeData = JSON.parse(
          localStorage.getItem(userNodeDataKey) || "{}",
        );
        newCompletionStates.userInput =
          Object.keys(existingUserNodeData).length > 0;
      }
    } catch (e) {
      console.error("Error checking user input data:", e);
    }

    setTaskCompletionStates(newCompletionStates);
  }, [allProjectData]);

  // Update project name on mount
  useEffect(() => {
    try {
          const storedProject = localStorage.getItem("project-store-selectedProject");
    const project = storedProject ? JSON.parse(storedProject) : null;
      if (project) {
        setProjectName(project.name || project.title || "Untitled");
      }
    } catch (error) {
      console.error("Error parsing project from localStorage:", error);
    }
  }, []);

  // Cleanup old localStorage data periodically
  useEffect(() => {
    const cleanup = () => {
      try {
            const storedProject = localStorage.getItem("project-store-selectedProject");
    const project = storedProject ? JSON.parse(storedProject) : null;
        if (!project) return;

        const projectId = project.id;

        ["concept", "script", "image", "video"].forEach((type) => {
          getGenerationStates(projectId, type);
        });

        // Clean up old temporary data and videos
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key) continue;

          try {
            if (key.startsWith(`temp-`) && key.includes(projectId)) {
              const data = JSON.parse(localStorage.getItem(key) || "{}");
              if (data.timestamp && Date.now() - data.timestamp > 3600000) {
                localStorage.removeItem(key);
              }
            }

            if (key.startsWith(`generated-videos-${projectId}`)) {
              const videos = JSON.parse(localStorage.getItem(key) || "{}");
              const videoEntries = Object.entries(videos);
              if (videoEntries.length > 20) {
                const sortedVideos = videoEntries.sort(
                  (a, b) => b[1].timestamp - a[1].timestamp,
                );
                const videosToKeep = sortedVideos.slice(0, 20);
                localStorage.setItem(
                  key,
                  JSON.stringify(Object.fromEntries(videosToKeep)),
                );
              }
            }
          } catch (error) {
            console.error(`Error cleaning up localStorage key ${key}:`, error);
          }
        }
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for sandbox open/close events
  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      window.dispatchEvent(new CustomEvent("sandbox:opened"));
      setTimeout(restoreGenerationStates, 100);
    };

    const closeHandler = () => {
      setOpen(false);
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



      try {
        // Create a videos map with the single video for the timeline function
        const singleVideoMap = {};
        if (segmentId) {
          singleVideoMap[segmentId] = videoUrl;
        } else {
          // Fallback: use videoId or nodeId as key
          const key = videoId || nodeId || "video";
          singleVideoMap[key] = videoUrl;
        }

        // Use the existing timeline function to add the single video
        const success = await timeline.addSingleVideoToTimeline(
          segmentId || videoId || nodeId || "video",
          singleVideoMap,
          setError,
        );

        if (success) {

          // Optional: Show success notification or close sidebar
        } else {
          console.error("❌ Failed to add video to timeline");
          setError("Failed to add video to timeline");
        }
      } catch (error) {
        console.error("❌ Error adding video to timeline:", error);
        setError(`Error adding video to timeline: ${error.message}`);
      }
    };

    window.addEventListener("addVideoToTimeline", handleAddVideoToTimeline);

    return () => {
      window.removeEventListener(
        "addVideoToTimeline",
        handleAddVideoToTimeline,
      );
    };
  }, [timeline, setError]);

  // Listen for project change events to automatically refresh FlowWidget
  useEffect(() => {
    const handleProjectChanged = async (event) => {
      const { project } = event.detail;
      console.log('🔄 FlowWidget received projectChanged event:', project);
      
      if (project) {
        // Update project name in the UI
        setProjectName(project.name || project.title || "Untitled");
        
        // Clear existing nodes and edges to prepare for new project data
        setNodes([]);
        setEdges([]);
        
        // Clear existing project data
        setAllProjectData({
          concepts: [],
          scripts: [],
          segments: [],
          images: [],
          videos: [],
        });
        
        // Fetch new project data
        await fetchAllProjectData();
      }
    };

    const handleProjectEssentialsLoaded = async (event) => {
      const { project, projectId } = event.detail;
      console.log('📊 FlowWidget received projectEssentialsLoaded event:', project);
      
      if (project && projectId) {
        // Refresh the flow data after essentials are loaded
        await fetchAllProjectData();
      }
    };

    const handleNewProjectCreated = async (event) => {
      const { project } = event.detail;
      console.log('🆕 FlowWidget received newProjectCreated event:', project);
      
      if (project) {
        // Update project name
        setProjectName(project.name || project.title || "Untitled");
        
        // Clear existing data for new project
        setNodes([]);
        setEdges([]);
        setAllProjectData({
          concepts: [],
          scripts: [],
          segments: [],
          images: [],
          videos: [],
        });
        
        // Reset task completion states for new project
        setTaskCompletionStates({
          userInput: false,
          concept: false,
          script: false,
          segment: false,
          image: false,
          video: false,
        });
        
        // Fetch project data (will be empty for new project)
        await fetchAllProjectData();
      }
    };

    // Add event listeners
    window.addEventListener('projectChanged', handleProjectChanged);
    window.addEventListener('projectEssentialsLoaded', handleProjectEssentialsLoaded);
    window.addEventListener('newProjectCreated', handleNewProjectCreated);

    return () => {
      window.removeEventListener('projectChanged', handleProjectChanged);
      window.removeEventListener('projectEssentialsLoaded', handleProjectEssentialsLoaded);
      window.removeEventListener('newProjectCreated', handleNewProjectCreated);
    };
  }, [fetchAllProjectData]);

  // Reflect open state and handle dropdown clicks
  const [logoDropdownOpen, setLogoDropdownOpen] = useState(false);

  useEffect(() => {
    const host = document.querySelector("react-flow-widget");
    if (host) host.setAttribute("data-open", open ? "true" : "false");
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setLogoDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
                            <svg
                              className='w-4 h-4'
                              viewBox='0 0 24 24'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                d='M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                              <path
                                d='M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2569 9.77251 19.9859C9.5799 19.7148 9.31074 19.5067 9 19.39C8.69838 19.2569 8.36381 19.2172 8.03941 19.276C7.71502 19.3348 7.41568 19.4895 7.18 19.72L7.12 19.78C6.93425 19.966 6.71368 20.1135 6.47088 20.2141C6.22808 20.3148 5.96783 20.3666 5.705 20.3666C5.44217 20.3666 5.18192 20.3148 4.93912 20.2141C4.69632 20.1135 4.47575 19.966 4.29 19.78C4.10405 19.5943 3.95653 19.3737 3.85588 19.1309C3.75523 18.8881 3.70343 18.6278 3.70343 18.365C3.70343 18.1022 3.75523 17.8419 3.85588 17.5991C3.95653 17.3563 4.10405 17.1357 4.29 16.95L4.35 16.89C4.58054 16.6543 4.73519 16.355 4.794 16.0306C4.85282 15.7062 4.81312 15.3716 4.68 15.07C4.55324 14.7742 4.34276 14.522 4.07447 14.3443C3.80618 14.1666 3.49179 14.0713 3.17 14.07H3C2.46957 14.07 1.96086 13.8593 1.58579 13.4842C1.21071 13.1091 1 12.6004 1 12.07C1 11.5396 1.21071 11.0309 1.58579 10.6558C1.96086 10.2807 2.46957 10.07 3 10.07H3.09C3.42099 10.0623 3.742 9.95512 4.01309 9.76251C4.28417 9.5699 4.49226 9.30074 4.61 9C4.74312 8.69838 4.78282 8.36381 4.724 8.03941C4.66519 7.71502 4.51054 7.41568 4.28 7.18L4.22 7.12C4.03405 6.93425 3.88653 6.71368 3.78588 6.47088C3.68523 6.22808 3.63343 5.96783 3.63343 5.705C3.63343 5.44217 3.68523 5.18192 3.78588 4.93912C3.88653 4.69632 4.03405 4.47575 4.22 4.29C4.40575 4.10405 4.62632 3.95653 4.86912 3.85588C5.11192 3.75523 5.37217 3.70343 5.635 3.70343C5.89783 3.70343 6.15808 3.75523 6.40088 3.85588C6.64368 3.95653 6.86425 4.10405 7.05 4.29L7.11 4.35C7.34568 4.58054 7.64502 4.73519 7.96941 4.794C8.29381 4.85282 8.62838 4.81312 8.93 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          ),
                          text: "Settings",
                          active: true,
                        },
                        {
                          icon: (
                            <svg
                              className='w-4 h-4'
                              viewBox='0 0 24 24'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <circle
                                cx='12'
                                cy='12'
                                r='10'
                                stroke='currentColor'
                                strokeWidth='2'
                              />
                              <path
                                d='M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                              <path
                                d='M12 17H12.01'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          ),
                          text: "Help & Resources",
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => setLogoDropdownOpen(false)}
                          className={`p-1.5 px-3 text-white text-xs cursor-pointer rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                            item.active ? "bg-white/5" : "hover:bg-white/10"
                          }`}
                        >
                          <span className='w-4 flex justify-center text-white'>
                            {item.icon}
                          </span>
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
                <div className='h-10 flex items-center gap-1.5 bg-[#32353E66]/40 border-0 rounded-lg px-4 py-2 backdrop-blur-sm'>
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
                  <span className='text-gray-200 text-sm font-medium'>
                    {user.credits || "2000"}
                  </span>
                </div>
              )}

              {/* Debug: Project Data Display */}
              {process.env.NODE_ENV === "development" && (
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => {
                    }}
                    className='h-10 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border-0 text-blue-300 text-sm font-medium rounded-lg transition-colors backdrop-blur-sm'
                    title='Debug: Log Project Data'
                  >
                    📊
                  </button>
                </div>
              )}

              {/* User Profile Dropdown */}
              <UserProfileDropdown />

              {/* Chat Bot Icon - Click to open chat widget */}
              <div
                className='h-10 flex items-center justify-center bg-[#32353E66]/40 hover:bg-[#32353E66] rounded-lg transition-colors backdrop-blur-sm cursor-pointer px-2'
                onClick={() => {
                  // Open chat widget if available
                  if (typeof window.openChat === "function") {
                    window.openChat();
                  }
                }}
                title='Open Chat Widget'
              >
                <img
                  src={assets.ChatBotButton}
                  alt='Chat Bot Icon'
                  className='w-6 h-6'
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
                        stroke: "#E9E8EB33",
                        strokeWidth: 2,
                        filter: "drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))",
                      },
                    }}
                    fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    onNodeClick={(event, node) => {
                      // Show sidebar for generated image and video nodes
                      const shouldShowSidebar =
                        (node.type === "imageNode" ||
                          node.type === "videoNode") &&
                        node.data?.nodeState === "existing";

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
                      // Remove all chat nodes and text nodes when deselecting
                      setNodes((prevNodes) =>
                        prevNodes.filter((node) => node.type !== "chatNode" && node.type !== "textNode"),
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
          <FlowWidgetBottomToolbar
            onAddNode={handleAddNode}
            onRefreshLayout={handleTidyLayout}
          />
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
          }}
        />
      )}

      {/* Image Modal */}
      {showImageModal && modalImageUrl && createPortal(
        <div
          className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]'
          onClick={closeImageModal}
        >
          <img
            src={modalImageUrl}
            alt='Preview'
            className='max-w-full max-h-full rounded shadow-lg'
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className='absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors'
            onClick={closeImageModal}
          >
            ✕
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}

export default FlowWidget;
