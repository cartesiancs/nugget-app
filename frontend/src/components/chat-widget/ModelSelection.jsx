import React from "react";
import ModelSelector from "../ModelSelector";

const ModelSelection = ({
  currentStep,
  selectedImageModel,
  setSelectedImageModel,
  selectedVideoModel,
  setSelectedVideoModel,
  loading,
}) => {
  if (currentStep !== 4 && currentStep !== 5) return null;

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        AI Model Selection:
      </h4>
      <div className='space-y-3'>
        {currentStep === 4 && (
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Image Generation Model:
            </label>
            <ModelSelector
              genType='IMAGE'
              selectedModel={selectedImageModel}
              onModelChange={setSelectedImageModel}
              disabled={loading}
              className='w-full'
            />
          </div>
        )}
        {currentStep === 5 && (
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Video Generation Model:
            </label>
            <ModelSelector
              genType='VIDEO'
              selectedModel={selectedVideoModel}
              onModelChange={setSelectedVideoModel}
              disabled={loading}
              className='w-full'
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelection;
