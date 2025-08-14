import React from "react";

const MediaGeneration = ({
  type, // "image" or "video"
  generatedImages,
  combinedVideosMap,
  generationProgress,
  currentStep,
  onImageClick,
  onVideoClick,
  onAddSingleVideo,
  loading = false,
}) => {
  const isImageGeneration = type === "image";
  const mediaMap = isImageGeneration ? generatedImages : combinedVideosMap;

  if (!mediaMap && !loading) return null;

  const mediaEntries = Object.entries(mediaMap || {});
  const progressEntries = Object.entries(generationProgress || {});

  // Show generated media first if available
  if (mediaEntries.length > 0) {
    return (
      <div className="mt-3">
        <div className="grid grid-cols-2 gap-3">
          {mediaEntries.map(([segmentId, mediaUrl]) => (
            <div key={segmentId} className="relative group">
              <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden hover:border-gray-500 transition-colors">
                {isImageGeneration ? (
                  <div 
                    className="cursor-pointer"
                    onClick={() => onImageClick?.(mediaUrl)}
                  >
                    <img
                      src={mediaUrl}
                      alt={`Generated image for segment ${segmentId}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="hidden w-full h-32 bg-gray-700 items-center justify-center"
                    >
                      <span className="text-gray-400 text-xs">Failed to load image</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      src={mediaUrl}
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() => onVideoClick?.(mediaUrl)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="hidden w-full h-32 bg-gray-700 items-center justify-center"
                    >
                      <span className="text-gray-400 text-xs">Failed to load video</span>
                    </div>
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-2">
                        <svg 
                          className="w-6 h-6 text-white" 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-1">
                    Segment {segmentId}
                  </div>
                  
                  {!isImageGeneration && onAddSingleVideo && (
                    <button
                      onClick={() => onAddSingleVideo(segmentId)}
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded transition-colors"
                    >
                      Add to Timeline
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show progress for ongoing generation if no media yet
  if (progressEntries.length > 0) {
    return (
      <div className="mt-3 space-y-2">
        {progressEntries.map(([segmentId, progress]) => {
          if (progress.type !== type) return null;
          
          return (
            <div key={segmentId} className="bg-gray-800 border border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">
                  Segment {segmentId}
                </span>
                <span className="text-xs text-gray-400">
                  {progress.index}/{progress.total}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {progress.status === "generating" && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    <span className="text-xs text-gray-400">Generating...</span>
                  </>
                )}
                {progress.status === "completed" && (
                  <>
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-400">Completed</span>
                  </>
                )}
                {progress.status === "error" && (
                  <>
                    <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-400">
                      Error: {progress.error || "Unknown error"}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }



  // Show simple loading state
  if (loading) {
    return (
      <div className="mt-3">
        <div className="flex items-center space-x-2 mb-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-300">
            Processing...
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default MediaGeneration;
