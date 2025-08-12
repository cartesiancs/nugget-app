import React from "react";

const GeneratedVideos = ({
  combinedVideosMap,
  currentStep,
  onVideoClick,
  onAddSingleVideo,
}) => {
  if (Object.keys(combinedVideosMap).length === 0 || currentStep !== 5) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Generated Videos:
      </h4>
      <div className='grid grid-cols-2 gap-2'>
        {Object.entries(combinedVideosMap).map(([segmentId, videoUrl]) => (
          <div key={segmentId} className='relative group'>
            <video
              src={videoUrl}
              className='w-full h-20 object-cover rounded border border-gray-700 cursor-pointer'
              muted
              loop
              onClick={() => onVideoClick(videoUrl)}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
              <span className='text-white text-xs opacity-0 group-hover:opacity-100'>
                Segment {segmentId}
              </span>
            </div>
            <div
              className='absolute top-1 right-1 bg-black bg-opacity-70 rounded px-1 cursor-pointer'
              title='Add to Timeline'
              onClick={() => onAddSingleVideo(segmentId)}
            >
              <span className='text-white text-xs'>➕</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedVideos;
