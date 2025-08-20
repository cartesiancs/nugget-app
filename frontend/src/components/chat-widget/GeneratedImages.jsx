import React from "react";

const GeneratedImages = ({ generatedImages, currentStep, onImageClick }) => {
  if (
    Object.keys(generatedImages).length === 0 ||
    (currentStep !== 4 && currentStep !== 5)
  ) {
    return null;
  }

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Generated Images:
      </h4>
      <div className='grid grid-cols-2 gap-2'>
        {Object.entries(generatedImages).map(([segmentId, imageUrl]) => (
          <div key={segmentId} className='relative group'>
            <img
              src={imageUrl}
              alt={`Generated image for segment ${segmentId}`}
              className='w-full h-20 object-cover rounded border border-gray-700 cursor-pointer'
              onClick={() => onImageClick(imageUrl)}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedImages;
