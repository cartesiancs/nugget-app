import React, { useEffect, useRef, useState } from "react";

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
  onImagesGenerated, // Callback when images are generated
}) => {
  const isImageGeneration = type === "image";
  const mediaMap = isImageGeneration ? generatedImages : combinedVideosMap;
  const prevImageCountRef = useRef(0);

  // Debug logging
  console.log(`📺 MediaGeneration (${type}) render:`, {
    isImageGeneration,
    mediaMapEntries: Object.entries(mediaMap || {}),
    loading,
    currentStep,
  });

  // Additional debug for image URLs
  if (isImageGeneration && generatedImages) {
    console.log('🖼️ MediaGeneration received generatedImages:', generatedImages);
    console.log('🔗 Sample image URLs:', Object.entries(generatedImages).slice(0, 2));
  }

  // Trigger callback when images are first generated
  useEffect(() => {
    if (isImageGeneration && generatedImages && onImagesGenerated) {
      const currentImageCount = Object.keys(generatedImages).length;
      if (currentImageCount > 0 && prevImageCountRef.current === 0) {
        onImagesGenerated();
      }
      prevImageCountRef.current = currentImageCount;
    }
  }, [isImageGeneration, generatedImages, onImagesGenerated]);

  // Download functionality
  const handleDownload = async (mediaUrl, segmentId) => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        isImageGeneration ? "image" : "video"
      }_segment_${segmentId}.${isImageGeneration ? "jpg" : "mp4"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Enlarge functionality - use existing click handlers
  const handleEnlarge = (mediaUrl) => {
    if (isImageGeneration) {
      onImageClick?.(mediaUrl);
    } else {
      onVideoClick?.(mediaUrl);
    }
  };

  if (!mediaMap && !loading) return null;

  const mediaEntries = Object.entries(mediaMap || {});
  const progressEntries = Object.entries(generationProgress || {});

  // Sort media entries by segment ID to maintain order (segment1, segment2, etc.)
  const sortedMediaEntries = mediaEntries.sort((a, b) => {
    const segmentA = a[0]; // segmentId
    const segmentB = b[0]; // segmentId
    
    // Extract numeric part from segment IDs (e.g., "segment1" -> 1)
    const numA = parseInt(segmentA.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(segmentB.replace(/[^0-9]/g, '')) || 0;
    
    return numA - numB;
  });

  // Show generated media first if available
  if (sortedMediaEntries.length > 0) {
    return (
      <>
        <div className='mt-3'>
          <div className='grid grid-cols-2 gap-2'>
            {sortedMediaEntries.map(([segmentId, mediaUrl]) => (
              <div key={segmentId} className='relative group'>
                <div
                  className='border-0  rounded-lg overflow-hidden transition-colors'
                  style={{
                    background: "#18191C80",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {isImageGeneration ? (
                    <div
                      className='cursor-pointer'
                      onClick={() => onImageClick?.(mediaUrl)}
                    >
                      <img
                        src={mediaUrl}
                        alt={`Generated image for segment ${segmentId}`}
                        className='w-full h-24 object-cover'
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className='hidden w-full h-24 bg-gray-700/50 items-center justify-center'>
                        <span className='text-gray-400 text-xs'>
                          Failed to load image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className='relative'>
                      <video
                        src={mediaUrl}
                        className='w-full h-24 object-cover cursor-pointer'
                        onClick={() => onVideoClick?.(mediaUrl)}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      <div className='hidden w-full h-24 bg-gray-700/50 items-center justify-center'>
                        <span className='text-gray-400 text-xs'>
                          Failed to load video
                        </span>
                      </div>

                      {/* Play button overlay */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div
                          className='rounded-full p-1.5'
                          style={{
                            background: "rgba(0, 0, 0, 0.6)",
                            backdropFilter: "blur(5px)",
                          }}
                        >
                          <svg
                            className='w-4 h-4 text-white'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path d='M8 5v10l8-5-8-5z' />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating Action Tab - Always visible */}
                  <div className='absolute bottom-2 right-2'>
                    <div
                      className='flex items-center space-x-1 px-2 py-1 rounded-lg'
                      style={{
                        background: '#18191C33',
                        backdropFilter: "blur(40px)",
                      }}
                    >
                      {/* Redo Icon */}
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='cursor-pointer'
                      >
                        <g clipPath='url(#clip0_640_40599)'>
                          <path
                            d='M11.6669 1.64941C12.0064 2.44415 12.2413 3.27921 12.366 4.13366C12.3873 4.28025 12.3055 4.42202 12.1678 4.47679C12.1276 4.49279 12.0873 4.50853 12.0469 4.524M4.33357 14.3511C3.9941 13.5564 3.75921 12.7213 3.63453 11.8669C3.61313 11.7203 3.69498 11.5785 3.83263 11.5237C3.87285 11.5077 3.91316 11.492 3.95357 11.4765M9.66691 5.11352C10.4819 5.01533 11.2812 4.81722 12.0469 4.524M12.0469 4.524C11.6651 4.0796 11.2031 3.69101 10.6669 3.38146C8.11601 1.90871 4.8542 2.78271 3.38144 5.3336C2.70514 6.50498 2.5237 7.82628 2.77225 9.0554M13.2727 7.19531C13.45 8.35201 13.2497 9.57465 12.619 10.6669C11.1463 13.2178 7.88447 14.0918 5.33357 12.6191C4.79742 12.3095 4.33535 11.9209 3.95357 11.4765M6.33357 10.887C5.51858 10.9852 4.71927 11.1833 3.95357 11.4765'
                            stroke='white'
                            strokeOpacity='0.5'
                            strokeWidth='1.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </g>
                        <defs>
                          <clipPath id='clip0_640_40599'>
                            <rect
                              width='16'
                              height='16'
                              fill='white'
                              transform='translate(0 0.000488281)'
                            />
                          </clipPath>
                        </defs>
                      </svg>

                      {/* Download Icon */}
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(mediaUrl, segmentId);
                        }}
                      >
                        <path
                          d='M2 10.0003C2 11.8413 3.49238 13.3337 5.33333 13.3337H10.6667C12.5076 13.3337 14 11.8413 14 10.0003M6 8.12597C6.4935 8.78396 7.066 9.37818 7.70429 9.8954C7.79061 9.96535 7.89531 10.0003 8 10.0003M10 8.12597C9.5065 8.78396 8.934 9.37818 8.29571 9.8954C8.20939 9.96535 8.10469 10.0003 8 10.0003M8 10.0003V2.66699'
                          stroke='white'
                          strokeOpacity='0.5'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>

                      {/* Enlarge Icon */}
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnlarge(mediaUrl);
                        }}
                      >
                        <path
                          d='M8 4.19239C9.18571 3.99384 10.384 3.94881 11.5648 4.05805C11.6661 4.06742 11.7557 4.11106 11.8223 4.17768C11.8889 4.2443 11.9326 4.33391 11.942 4.4352C12.0512 5.61605 12.0062 6.81429 11.8076 8M8 11.8076C6.81429 12.0062 5.61605 12.0512 4.43521 11.942C4.33391 11.9326 4.2443 11.8889 4.17768 11.8223C4.11106 11.7557 4.06742 11.6661 4.05805 11.5648C3.94881 10.384 3.99384 9.18571 4.19239 8'
                          stroke='white'
                          strokeOpacity='0.5'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Show progress for ongoing generation if no media yet
  if (progressEntries.length > 0) {
    return (
      <div className='mt-3'>
        <div className='grid grid-cols-2 gap-2'>
          {progressEntries.map(([segmentId, progress]) => {
            if (progress.type !== type) return null;

            return (
              <div key={segmentId} className='relative group'>
                <div
                  className='border-0 rounded-lg overflow-hidden transition-colors'
                  style={{
                    background: "#18191C80",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {/* Skeleton Media Placeholder */}
                  {isImageGeneration ? (
                    // For image generation: gray skeleton box
                    <div className='w-full h-24 bg-gray-700/30 animate-pulse relative'>
                      {/* Skeleton shimmer effect */}
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-gray-600/20 to-transparent animate-pulse'></div>
                    </div>
                  ) : (
                    // For video generation: blurred generated image as skeleton
                    <div className='w-full h-24 relative'>
                      {generatedImages && generatedImages[segmentId] ? (
                        <img
                          src={generatedImages[segmentId]}
                          alt={`Generated image for segment ${segmentId}`}
                          className='w-full h-24 object-cover filter blur-sm opacity-50'
                        />
                      ) : (
                        <div className='w-full h-24 bg-gray-700/30 animate-pulse'></div>
                      )}
                    </div>
                  )}

                  {/* Floating Action Tab - Skeleton version */}
                  <div className='absolute bottom-2 right-2'>
                    <div
                      className='flex items-center space-x-1 px-2 py-1 rounded-lg'
                      style={{
                        background: '#18191C33',
                        backdropFilter: "blur(40px)",
                      }}
                    >
                      {/* Skeleton icons */}
                      <div className='w-4 h-4 bg-gray-600/50 rounded animate-pulse'></div>
                      <div className='w-4 h-4 bg-gray-600/50 rounded animate-pulse'></div>
                      <div className='w-4 h-4 bg-gray-600/50 rounded animate-pulse'></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Show simple loading state
  if (loading) {
    return (
      <div className='mt-3'>
        <div className='flex items-center space-x-2 mb-3'>
          <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400'></div>
          <span className='text-xs text-gray-300'>Processing...</span>
        </div>
      </div>
    );
  }

  return null;
};

export default MediaGeneration;