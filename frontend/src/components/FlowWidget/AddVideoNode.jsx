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
    <div className={`bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg p-4 min-w-[150px] max-w-[200px] relative hover:border-green-400 transition-colors ${isCreating ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Loader overlay when creating */}
      {isCreating && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded z-30">
          <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-white text-xs font-semibold">Creating...</span>
        </div>
      )}
      
      <div className="flex items-center justify-center h-20 bg-gray-800 rounded mb-2">
        <div className="text-center">
          <div className="text-2xl mb-1">🎬</div>
          <p className="text-xs text-gray-400">Add Video</p>
          <p className="text-xs text-gray-500">Generate new</p>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center mb-2">
        Scene {data.segmentId}
      </div>
      <button
        onClick={handleAddVideo}
        disabled={isCreating}
        className="w-full bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add new video for this image"
      >
        {isCreating ? "Creating..." : "Add Video"}
      </button>
      
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
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#3b82f6',
          width: 12,
          height: 12,
          border: '2px solid #fff',
        }}
      />
    </div>
  );
};

export default AddVideoNode; 