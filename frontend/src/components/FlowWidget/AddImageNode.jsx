import React from "react";
import { Handle, Position } from "@xyflow/react";

/**
 * AddImageNode props:
 * - data: contains segmentId and segmentData
 * - onCreateNewImage: callback to create new image
 * - creatingImages: Set of segmentIds that are currently creating images
 * - hasExistingImages: boolean indicating if this segment already has images
 */
const AddImageNode = ({ data, onCreateNewImage, creatingImages, hasExistingImages = false }) => {
  const isCreating = creatingImages && creatingImages.has(data.segmentId);

  const handleAddImage = () => {
    if (onCreateNewImage && data.segmentId && data.segmentData && !isCreating) {
      onCreateNewImage(data.segmentId, data.segmentData);
    }
  };

  return (
    <div
      className={`rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible hover:border-purple-400/60 transition-colors ${isCreating ? 'opacity-50 pointer-events-none' : ''}`}
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
          <div className="text-2xl mb-1">➕</div>
          <p className="text-sm text-gray-400">
            {hasExistingImages ? "Add Another" : "Add Image"}
          </p>
          <p className="text-xs text-gray-500">Generate new</p>
        </div>
      </div>
      <div className="absolute bottom-1 left-2 text-sm text-gray-400">
        {data?.segmentId ? `Scene ${data.segmentId}` : 'New Image'}
      </div>
      <button
        onClick={handleAddImage}
        disabled={isCreating}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm py-1 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`${hasExistingImages ? 'Add another' : 'Add new'} image for this scene`}
      >
        {isCreating ? "Creating..." : (hasExistingImages ? "Add Another" : "Add Image")}
      </button>
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#8b5cf6',
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(139, 92, 246, 0.8)',
          zIndex: 9999,
          left: -10
        }}
      />
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: '#f59e0b',
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(245, 158, 11, 0.8)',
          zIndex: 9999,
          right: -10
        }}
      />
    </div>
  );
};

export default AddImageNode; 