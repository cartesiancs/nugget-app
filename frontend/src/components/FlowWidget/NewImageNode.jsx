import React from "react";
import { Handle } from "@xyflow/react";

function NewImageNode({ data, isConnectable, selected }) {
  return (
    <div className={`bg-yellow-600 rounded-lg p-4 min-w-[120px] min-h-[80px] border-2 border-yellow-700 shadow-lg relative transition-all duration-200 ${
      selected ? 'ring-4 ring-yellow-400 ring-opacity-50 shadow-yellow-500/50' : ''
    }`}>
      {/* Input Handle - Left side */}
      <Handle
        type="target"
        position="left"
        style={{ 
          background: "#d97706",
          width: 16,
          height: 16,
          border: '3px solid #fff',
          left: -8
        }}
        isConnectable={isConnectable}
      />

      {/* Node Content */}
      <div className="text-center">
        <div className="text-xs text-yellow-200 mb-2 font-medium">IMAGE</div>
        <div className="text-white text-sm">
          <div className="w-12 h-12 mx-auto bg-yellow-500 rounded-lg flex items-center justify-center mb-2">
            <svg
              className="w-6 h-6 text-yellow-200"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-xs">New Image</p>
        </div>
      </div>

      {/* Output Handle - Right side */}
      <Handle
        type="source"
        position="right"
        style={{ 
          background: "#d97706",
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

export default NewImageNode;
