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
    <div className={`bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg p-4 min-w-[150px] max-w-[200px] relative hover:border-purple-400 transition-colors ${isCreating ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Loader overlay when creating */}
      {isCreating && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded z-30">
          <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-white text-xs font-semibold">Creating...</span>
        </div>
      )}
      
      <div className="flex items-center justify-center h-20 bg-gray-800 rounded mb-2">
        <div className="text-center">
          <div className="text-2xl mb-1">➕</div>
          <p className="text-xs text-gray-400">
            {hasExistingImages ? "Add Another" : "Add Image"}
          </p>
          <p className="text-xs text-gray-500">Generate new</p>
        </div>
      </div>
      <div className="text-xs text-gray-400 text-center mb-2">
        Scene {data.segmentId}
        {hasExistingImages && (
          <div className="text-xs text-yellow-400 mt-1">
            Has existing images
          </div>
        )}
      </div>
      <button
        onClick={handleAddImage}
        disabled={isCreating}
        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-1 px-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AddImageNode; 