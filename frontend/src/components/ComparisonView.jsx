import React from 'react';

function SegmentPreview({ segment }) {
  // Extract visual and audio descriptions
  const visualDesc = segment.visual;
  const audioDesc = segment.narration;

  return (
    <div className="border border-gray-600 rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="text-lg font-bold text-blue-400">Scene {segment.id}</h4>
        <span className="text-xs text-gray-500">{segment.id}</span>
      </div>
      
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-300">Visual Description:</h5>
        <p className="text-sm text-gray-400 line-clamp-4">{visualDesc}</p>
      </div>
      
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-300">Narration:</h5>
        <div className="space-y-2">
          {audioDesc.split(/VISUAL:|AUDIO:/).filter(Boolean).map((part, index) => (
            <p key={index} className="text-sm text-gray-400">{part.trim()}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonView({ response1, response2, onPreferResponse }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Option 1</h3>
            <button
              onClick={() => onPreferResponse(1)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-medium"
            >
              Prefer This Version
            </button>
          </div>
          
          <div className="space-y-4">
            {response1.segments.map((segment) => (
              <SegmentPreview key={segment.id} segment={segment} />
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Option 2</h3>
            <button
              onClick={() => onPreferResponse(2)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm font-medium"
            >
              Prefer This Version
            </button>
          </div>
          
          <div className="space-y-4">
            {response2.segments.map((segment) => (
              <SegmentPreview key={segment.id} segment={segment} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonView; 