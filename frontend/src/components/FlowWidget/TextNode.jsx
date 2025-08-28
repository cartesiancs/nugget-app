import React from "react";
import { Handle } from "@xyflow/react";
import { X } from "lucide-react";

function TextNode({ data, isConnectable, selected }) {
  const { parentNodeId, parentNodeType, fullText, onClose } = data;
  
  // Get the appropriate styling based on parent node type
  const getNodeStyle = () => {
    switch (parentNodeType) {
      case 'conceptNode':
        return {
          borderColor: '#8b5cf6', // purple
          ringColor: selected ? 'ring-purple-500' : '',
          headerColor: 'text-purple-400'
        };
      case 'scriptNode':
        return {
          borderColor: '#3b82f6', // blue
          ringColor: selected ? 'ring-blue-500' : '',
          headerColor: 'text-blue-400'
        };
      case 'segmentNode':
        return {
          borderColor: '#22c55e', // green
          ringColor: selected ? 'ring-green-500' : '',
          headerColor: 'text-green-400'
        };
      default:
        return {
          borderColor: '#6b7280', // gray
          ringColor: selected ? 'ring-gray-500' : '',
          headerColor: 'text-gray-400'
        };
    }
  };

  const style = getNodeStyle();
  
  // Get node type display name
  const getNodeTypeName = () => {
    switch (parentNodeType) {
      case 'conceptNode':
        return 'Concept';
      case 'scriptNode':
        return 'Script';
      case 'segmentNode':
        return 'Segment';
      default:
        return 'Text';
    }
  };

  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          {getNodeTypeName()} Text
        </h1>
      </div>

      <div
        className={`rounded-2xl p-4 w-[400px] min-h-[200px] relative transition-all duration-300 ${style.ringColor}`}
        style={{
          background: "#1a1a1a",
          border: `1px solid ${style.borderColor}`,
          boxShadow: selected ? `0 0 20px ${style.borderColor}33` : "0 4px 12px rgba(0, 0, 0, 0.5)",
          transition: "all 0.3s ease-in-out",
          height: "auto", // Allow auto height
        }}
      >
        {/* Header with close button */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <span className={`font-medium text-sm ${style.headerColor}`}>
              Full {getNodeTypeName()} Content
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose && onClose();
            }}
            className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-700/50 transition-colors'
            title="Close text view"
          >
            <X size={16} className='text-gray-400 hover:text-white' />
          </button>
        </div>

        {/* Full text content */}
        <div className='pr-2'>
          <div className='text-gray-300 text-sm leading-relaxed whitespace-pre-wrap'>
            {fullText || 'No content available'}
          </div>
        </div>

        {/* Handles for React Flow (optional - text nodes don't need connections) */}
        <Handle
          type='target'
          position='right'
          style={{ opacity: 0 }}
          isConnectable={false}
        />
      </div>
    </div>
  );
}

export default TextNode;