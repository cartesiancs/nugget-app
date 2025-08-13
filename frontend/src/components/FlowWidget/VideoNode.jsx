import { useState, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { createPortal } from "react-dom";
import { videoApi } from "../../services/video-gen";

const VideoNode = ({ data, onRegenerateVideo, regeneratingVideos, onAfterEdit, onChatClick, selected }) => {
  const isRegenerating = data.videoId && regeneratingVideos && regeneratingVideos.has(data.videoId);
  const isTemporary = !data.videoId; // Temporary videos don't have videoId since they're not saved to DB
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
      // 1. Generate new video with the new animation prompt
      const videoGenResponse = await videoApi.generateVideo({
        animation_prompt: editPrompt,
        art_style: data.segmentData.artStyle,
        imageS3Key: data.segmentData.imageS3Key,
        uuid: `seg-${data.segmentId}`,
        project_id: projectId,
      });
      // 2. Regenerate video with new animation prompt and new video s3_keys
      if (videoGenResponse && videoGenResponse.s3Keys && videoGenResponse.s3Keys.length > 0) {
        await videoApi.regenerateVideo({
          id: data.videoId,
          animation_prompt: editPrompt,
          art_style: data.segmentData.artStyle,
          image_s3_key: data.segmentData.imageS3Key,
          video_s3_keys: [...videoGenResponse.s3Keys],
          project_id: projectId,
        });
      }
      setEditSuccess("Video updated and regenerated!");
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
      <div
        className={`bg-gray-800/90 rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible transition-all duration-200 ${
          selected ? 'ring-4 ring-green-400 ring-opacity-50 shadow-green-500/50' : ''
        }`}
        style={{
          border: '1px solid rgba(233, 232, 235, 0.2)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex items-center justify-center w-[220px] h-[220px] bg-gray-900/80 rounded-lg mx-auto">
          <div className="text-center">
            <div className="text-2xl mb-1">🎬</div>
            <p className="text-sm text-gray-400">No video</p>
            <p className="text-xs text-gray-500">Generate video</p>
          </div>
        </div>
        <div className="absolute bottom-1 left-2 text-sm text-gray-400">
          Scene {data.segmentId}
        </div>
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            background: '#10b981',
            width: 20,
            height: 20,
            border: '4px solid #fff',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.8)',
            zIndex: 9999,
            left: -10
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
      <div
        className={`rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible transition-all duration-200 ${
          selected ? 'ring-4 ring-green-400 ring-opacity-50 shadow-green-500/50' : ''
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(50, 53, 62, 0.9) 0%, rgba(17, 18, 21, 0.95) 100%)",
          border: "1px solid rgba(233, 232, 235, 0.2)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
        }}
      >
        {/* Loader overlay when regenerating (covers whole node) */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center rounded z-30">
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-white text-sm font-semibold">Regenerating...</span>
          </div>
        )}
        <div className="relative flex items-center justify-center w-[220px] h-[200px] rounded mx-auto"
          style={{
            background: "rgba(17, 18, 21, 0.8)",
            border: "1px solid rgba(233, 232, 235, 0.15)",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)"
          }}
        >
          <video
            src={data.videoUrl}
            className="w-full h-full object-contain rounded"
            muted
            loop
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => e.target.pause()}
          />
          {/* Temporary video indicator */}
          {isTemporary && (
            <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">
              PREVIEW
            </div>
          )}
        </div>
        <div className="absolute bottom-1 left-2 text-sm text-gray-300">
          Scene {data.segmentId} Video
          {isTemporary && <span className="text-yellow-400 ml-1">(Temporary)</span>}
        </div>
        {/* Regenerate button always visible in bottom right of the node */}
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || !data.videoId || !data.segmentData || isTemporary}
          className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
          title={isTemporary ? "Cannot regenerate temporary videos" : "Regenerate this video"}
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
          disabled={isRegenerating || !data.videoId || !data.segmentData || isTemporary}
          className="absolute bottom-2 right-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
          title={isTemporary ? "Cannot edit temporary videos" : "Edit animation prompt"}
          style={{ width: 32, height: 32 }}
        >
          <span role="img" aria-label="Edit">✏️</span>
        </button>
        
        {/* Chat button */}
        {onChatClick && (
          <button
            onClick={() => onChatClick(data.id || data.videoId, "video")}
            disabled={isRegenerating}
            className="absolute bottom-2 right-24 bg-green-600 hover:bg-green-500 text-white rounded-full p-2 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed z-20"
            title="Open chat for this video"
            style={{ width: 32, height: 32 }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        )}
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            background: '#10b981',
            width: 20,
            height: 20,
            border: '4px solid #fff',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.8)',
            zIndex: 9999,
            left: -10
          }}
        />
      </div>
    </>
  );
};

export default VideoNode; 