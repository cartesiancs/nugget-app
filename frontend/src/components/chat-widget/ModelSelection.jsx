import React from "react";
import ModelSelector from "../ModelSelector";

const ModelSelection = ({
  currentStep,
  selectedScriptModel,
  setSelectedScriptModel,
  selectedImageModel,
  setSelectedImageModel,
  selectedVideoModel,
  setSelectedVideoModel,
}) => {
  // Show model selection for generation steps
  // Don't show for concept selection step (step 1) and script selection step (step 3)
  if (currentStep === 1 || currentStep === 3) return null;

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        AI Model Selection:
      </h4>
      <div className='space-y-3'>
        {currentStep === 0 && (
          <div className='p-3 bg-gray-800/50 rounded-lg border border-gray-700'>
            <label className='block text-xs text-gray-400 mb-1'>
              Concept Generation Model:
            </label>
            <div className='text-sm text-cyan-300 font-medium'>Gemini 2.0 Flash</div>
            <div className='text-xs text-gray-500'>Fixed model for concept generation</div>
          </div>
        )}
        {currentStep === 2 && (
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Script Generation Model:
            </label>
            <ModelSelector
              genType='TEXT'
              selectedModel={selectedScriptModel}
              onModelChange={setSelectedScriptModel}
              disabled={false}
              className='w-full'
            />
          </div>
        )}
        {currentStep === 4 && (
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Image Generation Model:
            </label>
            <ModelSelector
              genType='IMAGE'
              selectedModel={selectedImageModel}
              onModelChange={setSelectedImageModel}
              disabled={false}
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
              disabled={false}
              className='w-full'
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelection;
