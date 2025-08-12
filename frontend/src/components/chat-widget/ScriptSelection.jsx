import React from "react";

const ScriptSelection = ({
  scripts,
  currentStep,
  onScriptSelect,
  selectedScript,
}) => {
  if (!scripts || (currentStep !== 2 && currentStep !== 3)) return null;

  return (
    <div className='mb-4'>
      <h4 className='text-sm font-semibold text-white mb-2'>
        Choose a Script:
      </h4>
      <div className='space-y-2'>
        <button
          onClick={() => onScriptSelect(scripts.response1)}
          className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
        >
          <div className='text-white font-medium text-sm mb-1'>
            Script Option 1
          </div>
          <div className='text-gray-300 text-xs'>
            {scripts.response1.segments.length} segments
          </div>
        </button>
        <button
          onClick={() => onScriptSelect(scripts.response2)}
          className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
        >
          <div className='text-white font-medium text-sm mb-1'>
            Script Option 2
          </div>
          <div className='text-gray-300 text-xs'>
            {scripts.response2.segments.length} segments
          </div>
        </button>
      </div>

      {/* Show selected script when step 3 is clicked */}
      {selectedScript && currentStep === 3 && (
        <div className='mt-4'>
          <h4 className='text-sm font-semibold text-white mb-2'>
            Selected Script:
          </h4>
          <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
            <div className='text-white font-medium text-sm mb-1'>
              Script with {selectedScript.segments.length} segments
            </div>
            <div className='text-gray-300 text-xs mb-2'>
              Art Style: {selectedScript.artStyle || "Default"}
            </div>
            <div className='space-y-1'>
              {selectedScript.segments.slice(0, 3).map((segment, index) => (
                <div key={index} className='text-gray-400 text-xs'>
                  Segment {segment.id}: {segment.visual.substring(0, 50)}...
                </div>
              ))}
              {selectedScript.segments.length > 3 && (
                <div className='text-gray-500 text-xs'>
                  ... and {selectedScript.segments.length - 3} more segments
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptSelection;
