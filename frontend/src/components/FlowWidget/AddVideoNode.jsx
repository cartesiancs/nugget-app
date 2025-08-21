import React from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * AddVideoNode props:
 * - data: contains segmentId, imageId, and segmentData
 * - onCreateNewVideo: callback to create new video
 * - creatingVideos: Set of imageIds that are currently creating videos
 */
const AddVideoNode = ({ data, onCreateNewVideo, creatingVideos }) => {
  const isCreating = creatingVideos && creatingVideos.has(data.imageId);

  const handleAddVideo = () => {
    if (onCreateNewVideo && data.segmentId && data.imageId && data.segmentData && !isCreating) {
      onCreateNewVideo(data.segmentId, data.imageId, data.segmentData);
    }
  };

  return (
    <div className="relative">
      {/* Node Label */}
      <div className="absolute -top-8 left-0 text-sm font-semibold text-green-400 bg-gray-900/90 px-2 py-1 rounded-md border border-green-400/30">
        ADD VIDEO
      </div>
      
      <div
        className={`rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible hover:border-green-400/60 transition-colors ${isCreating ? 'opacity-50 pointer-events-none' : ''}`}
        style={{
          background: "linear-gradient(180deg, rgba(50, 53, 62, 0.9) 0%, rgba(17, 18, 21, 0.95) 100%)",
          border: "1px solid rgba(233, 232, 235, 0.2)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
        }}
      >
      {/* Loader overlay when creating */}
      {isCreating && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded z-30">
          <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-white text-sm font-semibold">Creating...</span>
        </div>
      )}
      
      <div 
        className="flex items-center justify-center w-[220px] h-[200px] rounded-lg mx-auto"
        style={{
          background: "rgba(17, 18, 21, 0.8)",
          border: "1px solid rgba(233, 232, 235, 0.15)",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)"
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">🎬</div>
          <p className="text-sm text-gray-400">Add Video</p>
          <p className="text-xs text-gray-500">Generate new</p>
        </div>
      </div>
      <div className="absolute bottom-1 left-2 text-sm text-gray-400">
        {data?.segmentId ? `Scene ${data.segmentId}` : 'New Video'}
      </div>

      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{
          background: '#10b981',
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.8)',
          zIndex: 9999,
          top: -10
        }}
      />
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        style={{
          background: '#3b82f6',
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
          zIndex: 9999,
          bottom: -10
        }}
      />
        </div>
      </div>
    );
  };

export default AddVideoNode; 