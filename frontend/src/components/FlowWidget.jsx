import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import LoadingSpinner from "./LoadingSpinner";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import SegmentNode from "./FlowWidget/SegmentNode";
import ImageNode from "./FlowWidget/ImageNode";
import VideoNode from "./FlowWidget/VideoNode";
import { imageApi } from "../services/image";
import { videoApi } from "../services/video-gen";
import { projectApi } from "../services/project";

function FlowWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [regeneratingImages, setRegeneratingImages] = useState(new Set());
  const [regeneratingVideos, setRegeneratingVideos] = useState(new Set());

  // Local state for project data
  const [selectedProject, setSelectedProject] = useState(null);
  const [segmentations, setSegmentations] = useState([]);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  // Sync from localStorage on mount and on storage event
  useEffect(() => {
    function syncFromStorage() {
      const storedSelected = localStorage.getItem('project-store-selectedProject');
      const storedSegmentations = localStorage.getItem('project-store-segmentations');
      const storedImages = localStorage.getItem('project-store-images');
      const storedVideos = localStorage.getItem('project-store-videos');
      setSelectedProject(storedSelected ? JSON.parse(storedSelected) : null);
      setSegmentations(storedSegmentations ? JSON.parse(storedSegmentations) : []);
      setImages(storedImages ? JSON.parse(storedImages) : []);
      setVideos(storedVideos ? JSON.parse(storedVideos) : []);
    }
    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  // Remove zustand loadingData logic, use a simple loading check for essentials
  const isLoadingEssentials = false; // All data is loaded from localStorage

  // The rest of the logic remains the same, but use local state for all project data
  const flowData = useMemo(() => {
    if (!segmentations || !images || !videos) {
      return { segments: [], images: {}, videos: {}, imageDetails: {}, videoDetails: {} };
    }
    let segments = [];
    let segmentationSource = null;
    if (Array.isArray(segmentations) && segmentations.length > 0) {
      segmentationSource = segmentations.find(seg => seg.isSelected) || segmentations[0];
    }
    if (segmentationSource && Array.isArray(segmentationSource.segments)) {
      segments = segmentationSource.segments.map(seg => ({
        ...seg,
        id: seg.segmentId || seg.id,
        visual: seg.visual || '',
        narration: seg.narration || '',
        animation: seg.animation || ''
      }));
    }
    const imagesMap = {};
    const imageDetails = {};
    if (Array.isArray(images)) {
      images.forEach(img => {
        if (img && img.success && img.s3Key && img.uuid) {
          const segmentId = img.uuid.replace(/^seg-/, '');
          imagesMap[segmentId] = `https://ds0fghatf06yb.cloudfront.net/${img.s3Key}`;
          imageDetails[segmentId] = {
            id: img.id,
            visualPrompt: img.visualPrompt,
            artStyle: img.artStyle,
            s3Key: img.s3Key,
          };
        }
      });
    }
    const videosMap = {};
    const videoDetails = {};
    if (Array.isArray(videos)) {
      videos.forEach(video => {
        if (
          video && video.success && video.uuid &&
          Array.isArray(video.videoFiles) && video.videoFiles.length > 0 && video.videoFiles[0].s3Key
        ) {
          const segmentId = video.uuid.replace(/^seg-/, '');
          videosMap[segmentId] = `https://ds0fghatf06yb.cloudfront.net/${video.videoFiles[0].s3Key}`;
          videoDetails[segmentId] = {
            id: video.id,
            artStyle: video.artStyle,
            imageS3Key: video.imageS3Key || null,
          };
        }
      });
    }
    return {
      segments,
      images: imagesMap,
      videos: videosMap,
      imageDetails,
      videoDetails
    };
  }, [segmentations, images, videos]);

  const handleRegenerateImage = useCallback(async (imageId, segmentData) => {
    if (!isAuthenticated || regeneratingImages.has(imageId)) return;
    setRegeneratingImages(prev => new Set(prev).add(imageId));
    try {
      const genResponse = await imageApi.generateImage({
        visual_prompt: segmentData.visual,
        art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
        uuid: `seg-${segmentData.id}`,
        project_id: selectedProject.id
      });
      if (genResponse && genResponse.s3_key) {
        const patchResponse = await imageApi.regenerateImage({
          id: imageId,
          visual_prompt: segmentData.visual,
          art_style: segmentData.artStyle || 'cinematic photography with soft lighting',
          s3_key: genResponse.s3_key,
        });
        // Fetch the updated images for the project using projectApi
        if (selectedProject?.id) {
          try {
            const imagesRes = await projectApi.getProjectImages(selectedProject.id, { page: 1, limit: 100 });
            const imagesArr = imagesRes?.data || [];
            localStorage.setItem('project-store-images', JSON.stringify(imagesArr));
            setImages(imagesArr);
          } catch (err) {
            console.error('Failed to fetch updated images after regeneration', err);
          }
        }
      }
      setError(null);
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
  }, [isAuthenticated, regeneratingImages, selectedProject]);

  const handleRegenerateVideo = useCallback(async (videoId, segmentData) => {
    if (!isAuthenticated || regeneratingVideos.has(videoId)) return;
    setRegeneratingVideos(prev => new Set(prev).add(videoId));
    try {
      const imageS3Key = flowData.imageDetails?.[segmentData.id]?.s3Key || segmentData.imageS3Key;
      const genResponse = await videoApi.generateVideo({
        animation_prompt: segmentData.animation,
        art_style: segmentData.artStyle,
        imageS3Key,
        uuid: `seg-${segmentData.id}`,
        project_id: selectedProject.id,
      });
      if (genResponse && genResponse.s3Keys && genResponse.s3Keys.length > 0) {
        await videoApi.regenerateVideo({
          id: videoId,
          animation_prompt: segmentData.animation,
          art_style: segmentData.artStyle,
          image_s3_key: imageS3Key,
          video_s3_keys: [...genResponse.s3Keys],
        });
        // Fetch the updated videos for the project using projectApi
        if (selectedProject?.id) {
          try {
            const videosRes = await projectApi.getProjectVideos(selectedProject.id, { page: 1, limit: 100 });
            const videosArr = videosRes?.data || [];
            localStorage.setItem('project-store-videos', JSON.stringify(videosArr));
            setVideos(videosArr);
          } catch (err) {
            console.error('Failed to fetch updated videos after regeneration', err);
          }
        }
      }
      setError(null);
    } catch (error) {
      setError(`Failed to regenerate video: ${error.message}`);
    } finally {
      setRegeneratingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  }, [isAuthenticated, regeneratingVideos, flowData.imageDetails, selectedProject]);

  const createFlowElements = useCallback(() => {
    console.log("🎯 createFlowElements called with flowData:", {
      segments: flowData.segments.length,
      images: Object.keys(flowData.images).length,
      videos: Object.keys(flowData.videos).length
    });
    
    const newNodes = [];
    const newEdges = [];

    if (flowData.segments && flowData.segments.length > 0) {
      console.log("📊 Creating nodes for", flowData.segments.length, "segments");
      const nodeSpacing = 350;
      const rowSpacing = 250;
      const startX = 50;
      const startY = 50;
      
      flowData.segments.forEach((segment, index) => {
        console.log(`🎬 Processing segment ${index}:`, segment.id);
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
    } else {
      console.log("❌ No segments found for flow creation");
    }
    
    console.log("🎯 Setting nodes:", newNodes.length, "edges:", newEdges.length);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges]);

  // Add a stable callback to refresh project data after edit
  const handleAfterImageEdit = useCallback(async () => {
    console.log("🔄 handleAfterImageEdit called");
    // No refreshSelectedProjectData needed here, as it's handled by storage event
  }, []);

  // Update nodeTypes to pass callbacks to ImageNode and VideoNode
  const nodeTypes = useMemo(() => ({
    segmentNode: SegmentNode,
    imageNode: (props) => <ImageNode {...props} onRegenerateImage={handleRegenerateImage} regeneratingImages={regeneratingImages} onAfterEdit={handleAfterImageEdit} />,
    videoNode: (props) => <VideoNode {...props} onRegenerateVideo={handleRegenerateVideo} regeneratingVideos={regeneratingVideos} onAfterEdit={handleAfterImageEdit} />,
  }), [handleRegenerateImage, regeneratingImages, handleAfterImageEdit, handleRegenerateVideo, regeneratingVideos]);

  // Initialize flow when data changes
  useEffect(() => {
    console.log("🎯 Effect triggered - creating flow elements");
    createFlowElements();
  }, [createFlowElements]);

  // Add effect to refresh data when selectedProject changes
  useEffect(() => {
    if (selectedProject?.id) {
      console.log("🔄 Selected project changed, refreshing data for:", selectedProject.id);
      // Small delay to ensure store has updated
      const timer = setTimeout(() => {
        // No refreshSelectedProjectData needed here, as it's handled by storage event
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedProject?.id]);

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
      setError(null);
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
        className={`fixed top-0 right-0 h-screen w-[80vw] max-w-[1200px] bg-[#0d0d0d] text-white transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[1000] flex flex-col shadow-xl`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0">
          <div>
            <h2 className="text-lg font-semibold">Video Creation Flow</h2>
            {/* Debug info */}
            <div className="text-xs text-gray-400 mt-1">
              Project: {selectedProject?.name || 'None'} | 
              Segments: {flowData.segments.length} | 
              Images: {Object.keys(flowData.images).length} | 
              Videos: {Object.keys(flowData.videos).length}
            </div>
          </div>
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
              {loading || isLoadingEssentials ? (
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
              ) : !selectedProject ? (
                <div className="p-4 space-y-4">
                  <div className="text-center p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      No Project Selected
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Select a project from the project history dropdown to view its workflow.
                    </p>
                  </div>
                </div>
              ) : flowData.segments.length === 0 ? (
                <div className="p-4 space-y-4">
                  <div className="text-center p-6 bg-gray-800 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      No Workflow Data
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Project "{selectedProject.name}" doesn't have any video segments yet. Start creating a video in the chat widget to see the workflow here.
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
                          console.log("🧪 Manual refresh button clicked");
                          try {
                            // No refreshSelectedProjectData needed here, as it's handled by storage event
                            console.log("✅ Manual refresh successful");
                          } catch (error) {
                            console.error("❌ Manual refresh failed:", error);
                            setError("Failed to refresh project data");
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        🧪 Refresh Project Data
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