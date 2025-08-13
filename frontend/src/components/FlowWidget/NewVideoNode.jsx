import React from "react";
import { Handle } from "@xyflow/react";

function NewVideoNode({ data, isConnectable, selected }) {
  return (
    <div className={`bg-green-600 rounded-lg p-4 min-w-[120px] min-h-[80px] border-2 border-green-700 shadow-lg relative transition-all duration-200 ${
      selected ? 'ring-4 ring-green-400 ring-opacity-50 shadow-green-500/50' : ''
    }`}>
      {/* Input Handle - Left side */}
      <Handle
        type="target"
        position="left"
        style={{ 
          background: "#059669",
          width: 16,
          height: 16,
          border: '3px solid #fff',
          left: -8
        }}
        isConnectable={isConnectable}
      />

      {/* Node Content */}
      <div className="text-center">
        <div className="text-xs text-green-200 mb-2 font-medium">VIDEO</div>
        <div className="text-white text-sm">
          <div className="w-12 h-12 mx-auto bg-green-500 rounded-lg flex items-center justify-center mb-2">
            <svg
              className="w-6 h-6 text-green-200"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs">New Video</p>
        </div>
      </div>

      {/* Output Handle - Right side */}
      <Handle
        type="source"
        position="right"
        style={{ 
          background: "#059669",
          width: 16,
          height: 16,
          border: '3px solid #fff',
          right: -8
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default NewVideoNode;
