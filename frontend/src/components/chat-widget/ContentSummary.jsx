import React from "react";

const ContentSummary = ({
  selectedScript,
  currentStep,
  generatedImages,
  generatedVideos,
}) => {
  if (!selectedScript || (currentStep !== 4 && currentStep !== 5)) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Generated Content:
      </h4>
      <div className='space-y-2'>
        <div className='text-xs text-gray-400'>
          Segments: {selectedScript.segments.length}
        </div>
        {Object.keys(generatedImages).length > 0 && (
          <div className='text-xs text-gray-400'>
            Images: {Object.keys(generatedImages).length}/
            {selectedScript.segments.length}
          </div>
        )}
        {Object.keys(generatedVideos).length > 0 && (
          <div className='text-xs text-gray-400'>
            Videos: {Object.keys(generatedVideos).length}/
            {selectedScript.segments.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentSummary;
