import React, { useState } from "react";
import { Handle } from "@xyflow/react";

function NewTextNode({ data, isConnectable, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.content || "Text content...");

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Update the node data
    if (data.onChange) {
      data.onChange(text);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (data.onChange) {
        data.onChange(text);
      }
    }
  };

  return (
    <div className={`bg-blue-600 rounded-lg p-4 min-w-[120px] min-h-[80px] border-2 border-blue-700 shadow-lg relative transition-all duration-200 ${
      selected ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-blue-500/50' : ''
    }`}>
      {/* Input Handle - Left side */}
      <Handle
        type="target"
        position="left"
        style={{ 
          background: "#3b82f6",
          width: 16,
          height: 16,
          border: '3px solid #fff',
          left: -8
        }}
        isConnectable={isConnectable}
      />

      {/* Node Content */}
      <div className="text-center">
        <div className="text-xs text-blue-200 mb-2 font-medium">TEXT</div>
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            className="w-full bg-blue-700 text-white text-sm p-2 rounded border border-blue-500 focus:outline-none focus:border-blue-300 resize-none"
            autoFocus
            rows={3}
          />
        ) : (
          <div
            className="text-white text-sm cursor-pointer min-h-[60px] flex items-center justify-center"
            onDoubleClick={handleDoubleClick}
          >
            {text}
          </div>
        )}
      </div>

      {/* Output Handle - Right side */}
      <Handle
        type="source"
        position="right"
        style={{ 
          background: "#3b82f6",
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

export default NewTextNode;
