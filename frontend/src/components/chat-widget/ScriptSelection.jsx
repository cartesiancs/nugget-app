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
      <div className="mt-3 w-full space-y-3">
        {/* Script 1 */}
        <div 
          className="w-full border border-gray-600/40 rounded-lg overflow-hidden hover:border-gray-500/60 transition-all duration-300 cursor-pointer"
          style={{
            background: '#FFFFFF1A',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div 
            className="p-3 flex flex-col relative"
            onClick={() => handleScriptClick(scripts.response1, 1)}
          >
            {/* Dropdown arrow in top right */}
            <button
              onClick={(e) => handleExpandClick(e, 1)}
              className="absolute top-2 right-2 text-gray-400 hover:text-cyan-300 transition-colors p-1"
            >
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${expandedScript === 1 ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Title */}
            <div className="text-white font-bold text-sm mb-2 pr-6">
              Script 1
            </div>

            {/* Segments and Art Style */}
            <div className="space-y-1 mb-2">
              <div className="text-gray-300 text-xs">
                <span className="text-cyan-300">Segments:</span> {scripts.response1.segments?.length || 0}
              </div>
              <div className="text-gray-300 text-xs">
                <span className="text-cyan-300">Art Style:</span> {scripts.response1.artStyle || "Default"}
              </div>
            </div>

            {/* Narration content */}
            <div className="flex-1">
              {expandedScript === 1 ? (
                <div className="text-gray-300 text-xs leading-relaxed">
                  <span className="text-cyan-300">Narration:</span>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {scripts.response1.segments?.map((segment, index) => (
                      <div key={index} className="border-l-2 border-cyan-400/30 pl-2">
                        <div className="text-gray-400 text-xs mb-1">
                          Narration {index + 1}:
                        </div>
                        <div className="text-gray-300 text-xs">
                          {segment.narration || segment.visual}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-gray-300 text-xs leading-relaxed">
                    <span className="text-cyan-300">Narration:</span> {scripts.response1.segments?.[0]?.narration?.substring(0, 80) || scripts.response1.segments?.[0]?.visual?.substring(0, 80) || "No content"}...
                  </div>
                  {/* Blur effect at bottom when collapsed */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(24, 25, 28, 0.8), transparent)'
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Script 2 */}
        <div 
          className="w-full border border-gray-600/40 rounded-lg overflow-hidden hover:border-gray-500/60 transition-all duration-300 cursor-pointer"
          style={{
            background: '#FFFFFF1A',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div 
            className="p-3 flex flex-col relative"
            onClick={() => handleScriptClick(scripts.response2, 2)}
          >
            {/* Dropdown arrow in top right */}
            <button
              onClick={(e) => handleExpandClick(e, 2)}
              className="absolute top-2 right-2 text-gray-400 hover:text-cyan-300 transition-colors p-1"
            >
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${expandedScript === 2 ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Title */}
            <div className="text-white font-bold text-sm mb-2 pr-6">
              Script 2
            </div>

            {/* Segments and Art Style */}
            <div className="space-y-1 mb-2">
              <div className="text-gray-300 text-xs">
                <span className="text-cyan-300">Segments:</span> {scripts.response2.segments?.length || 0}
              </div>
              <div className="text-gray-300 text-xs">
                <span className="text-cyan-300">Art Style:</span> {scripts.response2.artStyle || "Default"}
              </div>
            </div>

            {/* Narration content */}
            <div className="flex-1">
              {expandedScript === 2 ? (
                <div className="text-gray-300 text-xs leading-relaxed">
                  <span className="text-cyan-300">Narration:</span>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {scripts.response2.segments?.map((segment, index) => (
                      <div key={index} className="border-l-2 border-cyan-400/30 pl-2">
                        <div className="text-gray-400 text-xs mb-1">
                          Narration {index + 1}:
                        </div>
                        <div className="text-gray-300 text-xs">
                          {segment.narration || segment.visual}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-gray-300 text-xs leading-relaxed">
                    <span className="text-cyan-300">Narration:</span> {scripts.response2.segments?.[0]?.narration?.substring(0, 80) || scripts.response2.segments?.[0]?.visual?.substring(0, 80) || "No content"}...
                  </div>
                  {/* Blur effect at bottom when collapsed */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(24, 25, 28, 0.8), transparent)'
                    }}
                  ></div>
                </div>
              )}
            </div>
          </div>
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
