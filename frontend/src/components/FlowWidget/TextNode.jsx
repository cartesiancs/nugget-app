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
    <div
      className={`rounded-xl p-2 w-[240px] h-[240px] relative overflow-visible transition-all duration-200 ${
        selected ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-blue-500/50' : ''
      }`}
      style={{
        background: "linear-gradient(180deg, rgba(50, 53, 62, 0.9) 0%, rgba(17, 18, 21, 0.95) 100%)",
        border: "1px solid rgba(233, 232, 235, 0.2)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Input Handle - Left side */}
      <Handle
        type="target"
        position="left"
        style={{ 
          background: "#3b82f6",
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
          zIndex: 9999,
          left: -10
        }}
        isConnectable={isConnectable}
      />

      {/* Node Content */}
      <div 
        className="text-center w-[220px] h-[220px] rounded-lg mx-auto p-2"
        style={{
          background: "rgba(17, 18, 21, 0.8)",
          border: "1px solid rgba(233, 232, 235, 0.15)",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.2)"
        }}
      >
        <div className="text-sm text-blue-200 mb-1 font-medium">TEXT</div>
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            className="w-full h-[190px] bg-gray-800 text-white text-sm p-2 rounded border border-gray-700 focus:outline-none focus:border-gray-500 resize-none"
            autoFocus
            rows={8}
          />
        ) : (
          <div
            className="text-white text-sm cursor-pointer h-[190px] flex items-center justify-center overflow-auto whitespace-pre-wrap break-words text-left w-full p-2"
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
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
          zIndex: 9999,
          right: -10
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default NewTextNode;
