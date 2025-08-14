import React, { useState } from "react";

const ScriptSelection = ({
  scripts,
  currentStep,
  onScriptSelect,
  selectedScript,
  showAsCollapsible = false,
}) => {
  const [expandedScript, setExpandedScript] = useState(null);

  if (!scripts) return null;

  // Legacy display for step-based UI
  if (!showAsCollapsible && (currentStep !== 2 && currentStep !== 3)) return null;

  const handleScriptClick = (script, scriptNumber) => {
    if (showAsCollapsible) {
      onScriptSelect(script);
    } else {
      onScriptSelect(script);
    }
  };

  const handleExpandClick = (e, scriptNumber) => {
    e.stopPropagation();
    setExpandedScript(expandedScript === scriptNumber ? null : scriptNumber);
  };

  if (showAsCollapsible) {
    return (
      <div className="mt-3 space-y-3">
        {/* Script 1 */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => handleScriptClick(scripts.response1, 1)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm mb-1">
                  Script 1: {scripts.response1.segments?.length || 0} segments
                </div>
                <div className="text-gray-400 text-xs">
                  Art Style: {scripts.response1.artStyle || "Default"}
                </div>
              </div>
              <button
                onClick={(e) => handleExpandClick(e, 1)}
                className="text-blue-400 text-xs hover:text-blue-300 transition-colors ml-4"
              >
                {expandedScript === 1 ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          
          {expandedScript === 1 && scripts.response1.segments && (
            <div className="border-t border-gray-700 bg-gray-900">
              <div className="p-4">
                <div className="text-white text-xs font-medium mb-2">Narration:</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {scripts.response1.segments.map((segment, index) => (
                    <div key={index} className="flex">
                      <div className="text-gray-500 text-xs w-16 flex-shrink-0">
                        Narration {index + 1}:
                      </div>
                      <div className="text-gray-300 text-xs">
                        {segment.narration || segment.visual}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Script 2 */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => handleScriptClick(scripts.response2, 2)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium text-sm mb-1">
                  Script 2: {scripts.response2.segments?.length || 0} segments
                </div>
                <div className="text-gray-400 text-xs">
                  Art Style: {scripts.response2.artStyle || "Default"}
                </div>
              </div>
              <button
                onClick={(e) => handleExpandClick(e, 2)}
                className="text-blue-400 text-xs hover:text-blue-300 transition-colors ml-4"
              >
                {expandedScript === 2 ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>
          
          {expandedScript === 2 && scripts.response2.segments && (
            <div className="border-t border-gray-700 bg-gray-900">
              <div className="p-4">
                <div className="text-white text-xs font-medium mb-2">Narration:</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {scripts.response2.segments.map((segment, index) => (
                    <div key={index} className="flex">
                      <div className="text-gray-500 text-xs w-16 flex-shrink-0">
                        Narration {index + 1}:
                      </div>
                      <div className="text-gray-300 text-xs">
                        {segment.narration || segment.visual}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Legacy step-based display
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
