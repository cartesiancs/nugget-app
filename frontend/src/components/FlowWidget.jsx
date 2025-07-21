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
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Custom node types
const SegmentNode = ({ data }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "generating":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "generating":
        return "🔄";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 min-w-[200px] max-w-[300px] relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-blue-400">Scene {data.id}</h3>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(data.status)}`}></div>
      </div>
      
      <div className="space-y-2">
        <div>
          <h4 className="text-xs font-medium text-gray-300 mb-1">Visual:</h4>
          <p className="text-xs text-gray-400 line-clamp-3">{data.visual}</p>
        </div>
        
        {data.narration && (
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-1">Narration:</h4>
            <p className="text-xs text-gray-400 line-clamp-2">{data.narration}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-gray-400">
          {getStatusIcon(data.status)} {data.status}
        </span>
      </div>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#8b5cf6',
          width: 12,
          height: 12,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
};

const ImageNode = ({ data }) => {
  if (!data.imageUrl) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-w-[150px] max-w-[200px] relative">
        <div className="flex items-center justify-center h-20 bg-gray-800 rounded mb-2">
          <div className="text-center">
            <div className="text-2xl mb-1">🖼️</div>
            <p className="text-xs text-gray-400">No image here</p>
            <p className="text-xs text-gray-500">Regenerate image</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center">
          Scene {data.segmentId}
        </div>
        
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            background: '#8b5cf6',
            width: 12,
            height: 12,
            border: '2px solid #fff',
          }}
        />
        
        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{
            background: '#10b981',
            width: 12,
            height: 12,
            border: '2px solid #fff',
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-w-[150px] max-w-[200px] relative">
      <img 
        src={data.imageUrl} 
        alt={`Scene ${data.segmentId}`} 
        className="w-full h-20 object-cover rounded mb-2"
      />
      <div className="text-xs text-gray-400 text-center">
        Scene {data.segmentId} Image
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#8b5cf6',
          width: 12,
          height: 12,
          border: '2px solid #fff',
        }}
      />
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#10b981',
          width: 12,
          height: 12,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
};

const VideoNode = ({ data }) => {
  if (!data.videoUrl) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-w-[150px] max-w-[200px] relative">
        <div className="flex items-center justify-center h-20 bg-gray-800 rounded mb-2">
          <div className="text-center">
            <div className="text-2xl mb-1">🎬</div>
            <p className="text-xs text-gray-400">No video</p>
            <p className="text-xs text-gray-500">Generate video</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center">
          Scene {data.segmentId}
        </div>
        
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            background: '#10b981',
            width: 12,
            height: 12,
            border: '2px solid #fff',
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-w-[150px] max-w-[200px] relative">
      <video 
        src={data.videoUrl} 
        className="w-full h-20 object-cover rounded mb-2"
        muted
        loop
        onMouseEnter={(e) => e.target.play()}
        onMouseLeave={(e) => e.target.pause()}
      />
      <div className="text-xs text-gray-400 text-center">
        Scene {data.segmentId} Video
      </div>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#10b981',
          width: 12,
          height: 12,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
};

const nodeTypes = {
  segmentNode: SegmentNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
};

function FlowWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flowMessages, setFlowMessages] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Load data from localStorage
  const flowData = useMemo(() => {
    try {
      const segments = JSON.parse(localStorage.getItem("segmentData") || "[]");
      const images = JSON.parse(localStorage.getItem("segmentImages") || "{}");
      const videos = JSON.parse(localStorage.getItem("segmentVideos") || "{}");
      const segmentsData = JSON.parse(localStorage.getItem("segments") || "[]");
      
      return {
        segments: segments.length > 0 ? segments : segmentsData,
        images,
        videos,
      };
    } catch (e) {
      console.error("Error parsing localStorage data:", e);
      return { segments: [], images: {}, videos: {} };
    }
  }, []);

  // Create nodes and edges from flow data
  const createFlowElements = useCallback(() => {
    const newNodes = [];
    const newEdges = [];

    if (flowData.segments && flowData.segments.length > 0) {
      const nodeSpacing = 350; // Increased spacing for better visual separation
      const rowSpacing = 250;
      const startX = 50;
      const startY = 50;

      flowData.segments.forEach((segment, index) => {
        const x = startX;
        const y = startY + index * rowSpacing;

        // Segment node
        newNodes.push({
          id: `segment-${segment.id}`,
          type: "segmentNode",
          position: { x, y },
          data: {
            ...segment,
            status: flowData.videos[segment.id] ? "completed" : 
                   flowData.images[segment.id] ? "generating" : "pending",
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
            imageUrl: segment.imageUrl || flowData.images[segment.id],
          },
        });

        // Connect segment to image
        newEdges.push({
          id: `segment-${segment.id}-to-image-${segment.id}`,
          source: `segment-${segment.id}`,
          target: `image-${segment.id}`,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: { 
            stroke: "#8b5cf6", 
            strokeWidth: 3 
          }
        });

        // Video node (only if image exists)
        if (segment.imageUrl || flowData.images[segment.id]) {
          const videoX = imageX + nodeSpacing;
          newNodes.push({
            id: `video-${segment.id}`,
            type: "videoNode",
            position: { x: videoX, y },
            data: {
              segmentId: segment.id,
              videoUrl: segment.videoUrl || flowData.videos[segment.id],
            },
          });

          // Connect image to video
          newEdges.push({
            id: `image-${segment.id}-to-video-${segment.id}`,
            source: `image-${segment.id}`,
            target: `video-${segment.id}`,
            sourceHandle: 'output',
            targetHandle: 'input',
            style: { 
              stroke: "#10b981", 
              strokeWidth: 3 
            },
          });
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [flowData, setNodes, setEdges]);

  // Initialize flow when data changes
  useEffect(() => {
    createFlowElements();
  }, [createFlowElements]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      createFlowElements();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [createFlowElements]);

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