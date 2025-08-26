import React from "react";

const GenerationProgress = ({ generationProgress, currentStep }) => {
  if (
    Object.keys(generationProgress).length === 0 ||
    (currentStep !== 4 && currentStep !== 5)
  ) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Generation Progress:
      </h4>
      <div className='space-y-2'>
        {Object.entries(generationProgress).map(([segmentId, progress]) => (
          <div
            key={segmentId}
            className='flex items-center justify-between p-2 bg-gray-800 rounded'
          >
            <span className='text-gray-300 text-xs'>Segment {segmentId}</span>
            <div className='flex items-center gap-2'>
              {progress.status === "generating" && (
                <>
                  <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                  <span className='text-blue-400 text-xs'>
                    Generating {progress.type}...
                  </span>
                </>
              )}
              {progress.status === "completed" && (
                <span className='text-green-400 text-xs'>
                  ✓ {progress.type} completed
                </span>
              )}
              {progress.status === "error" && (
                <span className='text-red-400 text-xs'>
                  ✗ {progress.type} failed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenerationProgress;
