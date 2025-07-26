import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import LoadingSpinner from "./LoadingSpinner";
import { projectApi, imageApi, videoApi } from "../services/api";
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

function FlowWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // We only track messages via setter; value itself not needed for UI rendering
  const [, setFlowMessages] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [projectData, setProjectData] = useState(null);
  const [regeneratingImages, setRegeneratingImages] = useState(new Set());
  const [regeneratingVideos, setRegeneratingVideos] = useState(new Set());

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
    console.log("🔄 flowData useMemo called, projectData:", projectData);
    if (!projectData || !projectData.success || !projectData.project) {
      return { segments: [], images: {}, videos: {}, imageDetails: {}, videoDetails: {} };
    }
    const project = projectData.project;

    // 1. Pick the segmentation to use (prefer selectedSegmentations, else first videoSegmentation)
    let segments = [];
    let segmentationSource = null;
    if (Array.isArray(project.selectedSegmentations) && project.selectedSegmentations.length > 0) {
      segmentationSource = project.selectedSegmentations[0];
    } else if (Array.isArray(project.videoSegmentations) && project.videoSegmentations.length > 0) {
      segmentationSource = project.videoSegmentations[0];
    }
    if (segmentationSource && Array.isArray(segmentationSource.segments)) {
      segments = segmentationSource.segments.map(seg => ({
        ...seg,
        id: seg.segmentId || seg.id, // Use segmentId for mapping
        visual: seg.visual || '',
        narration: seg.narration || '',
        animation: seg.animation || ''
      }));
    }
    console.log("📋 Processed segments:", segments);

    // 2. Build images/videos lookup by segmentId and store image details
    const images = {};
    const imageDetails = {};
    if (Array.isArray(project.generatedImages)) {
      project.generatedImages.forEach(img => {
        if (img && img.success && img.s3Key && img.uuid) {
          // uuid is like 'seg-2', so extract the segmentId
          const segmentId = img.uuid.replace(/^seg-/, '');
          images[segmentId] = `https://ds0fghatf06yb.cloudfront.net/${img.s3Key}`;
          imageDetails[segmentId] = {
            id: img.id,
            visualPrompt: img.visualPrompt,
            artStyle: img.artStyle,
            s3Key: img.s3Key,
          };
        }
      });
    }
    const videos = {};
    const videoDetails = {};
    if (Array.isArray(project.generatedVideos)) {
      project.generatedVideos.forEach(video => {
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
    return { segments, images, videos, imageDetails, videoDetails };
  }, [projectData]);

  // Handle image regeneration
  const handleRegenerateImage = useCallback(async (imageId, segmentData) => {
    if (!isAuthenticated || regeneratingImages.has(imageId)) return;

    console.log("🔄 Regenerating image (overwrite via generateImage + PATCH):", imageId, segmentData);
    setRegeneratingImages(prev => new Set(prev).add(imageId));
    try {
      // 1. Overwrite the image in S3
      const genResponse = await imageApi.generateImage({
        visual_prompt: segmentData.visual,
        art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
        uuid: `seg-${segmentData.id}`,
      });
      console.log("✅ Image generation (overwrite) successful:", genResponse);
      // 2. PATCH to update metadata with s3_key
      if (genResponse && genResponse.s3_key) {
        const patchResponse = await imageApi.regenerateImage({
          id: imageId,
          visual_prompt: segmentData.visual,
          art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
          s3_key: genResponse.s3_key,
        });
        console.log("✅ Image PATCH (metadata update) successful:", patchResponse);
      }
      // 3. Refresh project data to get the updated image
      const updatedProjectData = await projectApi.getProjectById();
      setProjectData(updatedProjectData);
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
  }, [isAuthenticated, regeneratingImages]);

  // Handle video regeneration
  const handleRegenerateVideo = useCallback(async (videoId, segmentData) => {
    if (!isAuthenticated || regeneratingVideos.has(videoId)) return;
    setRegeneratingVideos(prev => new Set(prev).add(videoId));
    try {
      // Always use the s3_key of the connected image for imageS3Key
      const imageS3Key = flowData.imageDetails?.[segmentData.id]?.s3Key || segmentData.imageS3Key;
      
      const genResponse = await videoApi.generateVideo({
        animation_prompt: segmentData.animation,
        art_style: segmentData.artStyle,
        imageS3Key,
        uuid: `seg-${segmentData.id}`,
      });
      if (genResponse && genResponse.s3Keys && genResponse.s3Keys.length > 0) {
        console.log("🔄 Video re-generation response:", genResponse.s3Keys);
        await videoApi.regenerateVideo({
          id: videoId,
          animation_prompt: segmentData.animation,
          art_style: segmentData.artStyle,
          image_s3_key: imageS3Key,
          video_s3_keys: [...genResponse.s3Keys],
        });
      }
      // 3. Refresh project data to get the updated video
      const updatedProjectData = await projectApi.getProjectById();
      setProjectData(updatedProjectData);
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
  }, [isAuthenticated, regeneratingVideos, flowData.imageDetails]);

  // Create nodes and edges from flow data
  const createFlowElements = useCallback(() => {
    console.log("🎯 createFlowElements called with flowData:", flowData);
    const newNodes = [];
    const newEdges = [];
    
    // NodeTypes are defined later with hooks; local reference not necessary here

    if (flowData.segments && flowData.segments.length > 0) {
      console.log("📊 Creating nodes for", flowData.segments.length, "segments");
      const nodeSpacing = 350;
      const rowSpacing = 250;
      const startX = 50;
      const startY = 50;
      
      flowData.segments.forEach((segment, index) => {
        console.log(`🎬 Processing segment ${index}:`, segment);
        const x = startX;
        const y = startY + index * rowSpacing;
        // Use segment.id (which is segmentId) for lookup
        const segmentImageUrl = flowData.images[segment.id];
        const segmentVideoUrl = flowData.videos[segment.id];
        const imageDetail = flowData.imageDetails[segment.id];
        const segmentStatus = segmentVideoUrl ? "completed" : segmentImageUrl ? "generating" : "pending";
        console.log(`  📍 Segment ${segment.id}: image=${!!segmentImageUrl}, video=${!!segmentVideoUrl}, status=${segmentStatus}`);
        
        // Segment node
        newNodes.push({
          id: `segment-${segment.id}`,
          type: "segmentNode",
          position: { x, y },
          data: {
            ...segment,
            status: segmentStatus,
          },
        });
        
        // Image node (always create, even if no image)
        const imageX = x + nodeSpacing;
        newNodes.push({
          id: `image-${segment.id}`,
          type: "imageNode",
          position: { x: imageX, y },
          data: {
            segmentId: segment.id,
            imageUrl: segmentImageUrl,
            imageId: imageDetail?.id,
            segmentData: {
              id: segment.id,
              visual: segment.visual,
              artStyle: imageDetail?.artStyle || 'cinematic photography with soft lighting'
            }
          },
        });
        
        // Connect segment to image
        newEdges.push({
          id: `segment-${segment.id}-to-image-${segment.id}`,
          source: `segment-${segment.id}`,
          target: `image-${segment.id}`,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: { stroke: "#8b5cf6", strokeWidth: 3 }
        });
        
        // Video node (only if image exists)
        if (segmentImageUrl) {
          const videoX = imageX + nodeSpacing;
          newNodes.push({
            id: `video-${segment.id}`,
            type: "videoNode",
            position: { x: videoX, y },
            data: {
              segmentId: segment.id,
              videoUrl: segmentVideoUrl,
              videoId: flowData?.videoDetails?.[segment.id]?.id || null,
              segmentData: {
                id: segment.id,
                animation: segment.animation,
                artStyle: flowData?.videoDetails?.[segment.id]?.artStyle || 'cinematic photography with soft lighting',
                imageS3Key: imageDetail?.s3Key || null,
              },
            },
          });
          
          // Connect image to video
          newEdges.push({
            id: `image-${segment.id}-to-video-${segment.id}`,
            source: `image-${segment.id}`,
            target: `video-${segment.id}`,
            sourceHandle: 'output',
            targetHandle: 'input',
            style: { stroke: "#10b981", strokeWidth: 3 },
          });
        }
      });
    }
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges, handleRegenerateImage, regeneratingImages]);

  // Add a stable callback to refresh project data after edit
  const handleAfterImageEdit = useCallback(async () => {
    const updatedProjectData = await projectApi.getProjectById();
    setProjectData(updatedProjectData);
  }, []);

  // Update nodeTypes to pass onAfterEdit to ImageNode and VideoNode
  const nodeTypes = useMemo(() => ({
    segmentNode: SegmentNode,
    imageNode: (props) => <ImageNode {...props} onRegenerateImage={handleRegenerateImage} regeneratingImages={regeneratingImages} onAfterEdit={handleAfterImageEdit} />,
    videoNode: (props) => <VideoNode {...props} onRegenerateVideo={handleRegenerateVideo} regeneratingVideos={regeneratingVideos} onAfterEdit={handleAfterImageEdit} />,
  }), [handleRegenerateImage, regeneratingImages, handleAfterImageEdit, handleRegenerateVideo, regeneratingVideos]);

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
      // Simulate flow processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

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
    console.log("HERE...")
    const fetchProjectData = async () => {
      if (!isAuthenticated) {
        console.log("User not authenticated, skipping API call");
        return;
      }
      
      console.log("Fetching project data from API...");
      try {
        setLoading(true);
        const data = await projectApi.getProjectById();
        console.log("Project data fetched:", data);
        
        if (data.success && data.project) {
          console.log("Project details:", data.project);
          console.log("Conversations:", data.project.conversations);
          console.log("Video segmentations:", data.project.videoSegmentations);
          console.log("Generated images:", data.project.generatedImages);
          console.log("Generated videos:", data.project.generatedVideos);
          
          setProjectData(data);
        }
      } catch (error) {
        console.error("Failed to fetch project data:", error);
        setError("Failed to fetch project data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [isAuthenticated]);

  return (
    <div className="z-10">
      {/* Full-screen overlay; hidden when not open */}
      <div
        className={`fixed inset-0 h-screen w-screen bg-[#0d0d0d] text-white ${
          open ? "flex" : "hidden"
        } z-[9999] flex-col shadow-xl transition-opacity duration-300`}
        style={{ opacity: open ? 1 : 0, visibility: open ? 'visible' : 'hidden' }}
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
                    <div className="space-y-3">
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
                      
                      <button
                        onClick={async () => {
                          console.log("🧪 Manual test button clicked");
                          try {
                            const data = await projectApi.getProjectById();
                            console.log("✅ Manual test successful:", data);
                            alert("API call successful! Check console for details.");
                          } catch (error) {
                            console.error("❌ Manual test failed:", error);
                            alert("API call failed! Check console for details.");
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        🧪 Test API Call
                      </button>
                    </div>
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