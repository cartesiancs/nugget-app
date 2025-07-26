import React, { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { createPortal } from "react-dom";
import { imageApi } from "../../services/image";

/**
 * ImageNode props:
 * - data
 * - onRegenerateImage
 * - regeneratingImages
 * - onMakePrimary (optional): callback to make this image primary
 * - isPrimary (optional): whether this image is the primary one
 * - onAfterEdit (optional): called after successful edit/regeneration to refresh parent data
 */
const ImageNode = ({ data, onRegenerateImage, regeneratingImages, onMakePrimary, isPrimary, onAfterEdit }) => {
  const isRegenerating = data.imageId && regeneratingImages.has(data.imageId);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState(data.segmentData?.visual || "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const inputRef = useRef(null);

  const handleRegenerate = () => {
    if (!data.imageId || !data.segmentData || isRegenerating) return;
    onRegenerateImage(data.imageId, data.segmentData);
  };

  const handleMakePrimary = () => {
    if (!data.imageId || !data.segmentId || isPrimary) return;
    onMakePrimary?.(data.imageId, data.segmentId, data.allImages);
  };

  const handleEdit = () => {
    setEditPrompt(data.segmentData?.visual || "");
    setEditOpen(true);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!data.imageId || !data.segmentData || !data.imageUrl) return;
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        if (storedProject) {
          const project = JSON.parse(storedProject);
          projectId = project.id;
        }
      } catch (error) {
        console.error("Error parsing project from localStorage:", error);
      }
      // 1. POST to generate new image with new visual_prompt
      const genResponse = await imageApi.generateImage({
        visual_prompt: editPrompt,
        art_style: data.segmentData.artStyle,
        uuid: `seg-${data.segmentId}`,
        project_id: projectId,
      });
      // 2. PATCH with new visual_prompt and new s3_key
      if (genResponse && genResponse.s3_key) {
        await imageApi.regenerateImage({
          id: data.imageId,
          visual_prompt: editPrompt,
          art_style: data.segmentData.artStyle,
          s3_key: genResponse.s3_key,
        });
      }
      setEditSuccess("Image updated and regenerated!");
      setTimeout(() => {
        setEditOpen(false);
        if (typeof onAfterEdit === 'function') onAfterEdit();
      }, 1000);
    } catch (err) {
      setEditError(err.message || "Failed to update image");
    } finally {
      setEditLoading(false);
    }
  };

  if (!data.imageUrl) {
    return (
      <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 min-w-[150px] max-w-[200px] relative">
        <div className="flex items-center justify-center h-20 bg-gray-800 rounded mb-2">
          <div className="text-center">
            <div className="text-2xl mb-1">🖼️</div>
            <p className="text-xs text-gray-400">No image here</p>
            <p className="text-xs text-gray-500">Generate image</p>
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
    <>
      {/* Edit popup modal rendered globally using portal */}
      {editOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <form onSubmit={handleEditSubmit} className="bg-gray-800 p-4 rounded-lg shadow-lg w-96 flex flex-col gap-3 relative">
            <label className="text-xs text-gray-300 mb-1">Edit Visual Prompt</label>
            <textarea
              ref={inputRef}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none resize-y min-h-[60px] max-h-[300px]"
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              disabled={editLoading}
              autoFocus
              rows={4}
              style={{ minHeight: 60 }}
            />
            {editError && <div className="text-xs text-red-400">{editError}</div>}
            {editSuccess && <div className="text-xs text-green-400">{editSuccess}</div>}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1"
                onClick={() => setEditOpen(false)}
                disabled={editLoading}
              >Cancel</button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white rounded px-2 py-1"
                disabled={editLoading || !editPrompt.trim()}
              >{editLoading ? "Loading..." : "Submit"}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
      <div className={`bg-gray-700 border ${isPrimary ? 'border-yellow-400 border-2' : 'border-gray-600'} rounded-lg p-4 min-w-[150px] max-w-[200px] relative ${isRegenerating ? 'opacity-50 pointer-events-none' : ''}`}> 
        {/* Primary indicator */}
        {isPrimary && (
          <div className="absolute -top-2 -left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-bold z-30">
            ⭐ Primary
          </div>
        )}
        
        {/* Loader overlay when regenerating (covers whole node) */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded z-30">
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-white text-xs font-semibold">Regenerating...</span>
          </div>
        )}
        <div className="relative">
          <img 
            src={data.imageUrl} 
            alt={`Scene ${data.segmentId}`} 
            className="w-full h-20 object-cover rounded mb-2"
          />
        </div>
        <div className="text-xs text-gray-400 text-center">
          Scene {data.segmentId} Image
        </div>
        
        {/* Button container */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {/* Regenerate button */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating || !data.imageId || !data.segmentData}
            className="bg-purple-600 hover:bg-purple-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
            title="Regenerate this image"
            style={{ width: 32, height: 32 }}
          >
            {isRegenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span role="img" aria-label="Regenerate">🔄</span>
            )}
          </button>
          
          {/* Edit button */}
          <button
            onClick={handleEdit}
            disabled={isRegenerating || !data.imageId || !data.segmentData}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
            title="Edit visual prompt"
            style={{ width: 32, height: 32 }}
          >
            <span role="img" aria-label="Edit">✏️</span>
          </button>
          
          {/* Star indicator for all images */}
          {onMakePrimary && (
            <button
              onClick={isPrimary ? undefined : handleMakePrimary}
              disabled={isRegenerating || !data.imageId || !data.segmentId || isPrimary}
              className={`rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20 ${
                isPrimary 
                  ? 'bg-yellow-400 text-black cursor-default' 
                  : 'bg-gray-600 hover:bg-gray-500 text-white cursor-pointer'
              }`}
              title={isPrimary ? "This is the primary image" : "Make this image primary"}
              style={{ width: 32, height: 32 }}
            >
              <span role="img" aria-label={isPrimary ? "Primary" : "Make Primary"}>⭐</span>
            </button>
          )}
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
    </>
  );
};

export default ImageNode; 