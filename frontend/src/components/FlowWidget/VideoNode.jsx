import React, { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { createPortal } from "react-dom";
import { videoApi } from "../../services/api";

const VideoNode = ({ data, onRegenerateVideo, regeneratingVideos, onAfterEdit }) => {
  const isRegenerating = data.videoId && regeneratingVideos && regeneratingVideos.has(data.videoId);
  const [editOpen, setEditOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState(data.segmentData?.animation || "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const inputRef = useRef(null);

  const handleRegenerate = () => {
    if (!data.videoId || !data.segmentData || isRegenerating) return;
    onRegenerateVideo(data.videoId, data.segmentData);
  };

  const handleEdit = () => {
    setEditPrompt(data.segmentData?.animation || "");
    setEditOpen(true);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!data.videoId || !data.segmentData || !data.videoUrl) return;
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      // PATCH to update metadata with new animation_prompt (same imageS3Key)
      await videoApi.regenerateVideo({
        id: data.videoId,
        animation_prompt: editPrompt,
        art_style: data.segmentData.artStyle,
        imageS3Key: data.segmentData.imageS3Key,
      });
      // POST to generate new video with new animation_prompt (simulate, if needed)
      // Not implemented here, as video generation may be async/triggered elsewhere
      setEditSuccess("Video prompt updated!");
      setTimeout(() => {
        setEditOpen(false);
        if (typeof onAfterEdit === 'function') onAfterEdit();
      }, 1000);
    } catch (err) {
      setEditError(err.message || "Failed to update video");
    } finally {
      setEditLoading(false);
    }
  };

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
    <>
      {/* Edit popup modal rendered globally using portal */}
      {editOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <form onSubmit={handleEditSubmit} className="bg-gray-800 p-4 rounded-lg shadow-lg w-96 flex flex-col gap-3 relative">
            <label className="text-xs text-gray-300 mb-1">Edit Animation Prompt</label>
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
      <div className={`bg-gray-700 border border-gray-600 rounded-lg p-4 min-w-[150px] max-w-[200px] relative ${isRegenerating ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Loader overlay when regenerating (covers whole node) */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded z-30">
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-white text-xs font-semibold">Regenerating...</span>
          </div>
        )}
        <div className="relative">
          <video
            src={data.videoUrl}
            className="w-full h-20 object-cover rounded mb-2"
            muted
            loop
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => e.target.pause()}
          />
        </div>
        <div className="text-xs text-gray-400 text-center">
          Scene {data.segmentId} Video
        </div>
        {/* Regenerate button always visible in bottom right of the node */}
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || !data.videoId || !data.segmentData}
          className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
          title="Regenerate this video"
          style={{ width: 32, height: 32 }}
        >
          {isRegenerating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span role="img" aria-label="Regenerate">🔄</span>
          )}
        </button>
        {/* Edit button next to regenerate */}
        <button
          onClick={handleEdit}
          disabled={isRegenerating || !data.videoId || !data.segmentData}
          className="absolute bottom-2 right-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
          title="Edit animation prompt"
          style={{ width: 32, height: 32 }}
        >
          <span role="img" aria-label="Edit">✏️</span>
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
      </div>
    </>
  );
};

export default VideoNode; 