import React from 'react';

function SegmentList({ segments, onSegmentClick, selectedSegmentId }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400">Segments ({segments.length})</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSegmentClick(segment)}
              className={`p-4 border rounded-lg text-left hover:bg-gray-700 transition-colors
                ${selectedSegmentId === segment.id ? 'border-blue-500 bg-gray-700' : 'border-gray-600'}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-blue-400">Scene {segment.id}</h3>
                  <span className="text-xs text-gray-500">{segment.id}</span>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-1">Visual:</h4>
                  <p className="text-xs text-gray-400 line-clamp-2">{segment.visual}</p>
                </div>
                
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-1">Narration:</h4>
                  <p className="text-xs text-gray-400 line-clamp-2">{segment.narration}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SegmentList; 