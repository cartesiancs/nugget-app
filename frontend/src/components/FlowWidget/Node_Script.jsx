import React from "react";
import { Handle } from "@xyflow/react";
import { FileText, PenTool, BookOpen, Type, MoreHorizontal, Palette, Hash } from "lucide-react";

function NodeScript({ data, isConnectable, selected }) {
  // Check if this is existing data or new/empty state
  const hasData = data && (data.segments || data.artStyle || data.concept);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Script
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[320px] min-h-[240px] relative transition-all duration-200 ${
          selected ? (hasData ? "ring-2 ring-blue-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(59, 130, 246, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          id="input"
          style={{
            background: hasData ? "#3b82f6" : "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            top: -8,
          }}
          isConnectable={isConnectable}
        />

        {hasData ? (
          // Existing data view
          <>
            {/* Script Header */}
            <div className='flex items-center mb-4'>
              <div className='flex items-center space-x-2'>
                <FileText size={20} className='text-blue-400' />
                <span className='text-white font-medium'>{data.title || `Script ${data.id}`}</span>
              </div>
            </div>

            {/* Script Details */}
            <div className='space-y-3'>
              {/* Art Style */}
              {data.artStyle && (
                <div className='flex items-center space-x-2'>
                  <Palette size={16} className='text-gray-400' />
                  <span className='text-xs text-gray-300'>{data.artStyle}</span>
                </div>
              )}

              {/* Concept Reference */}
              {data.concept && (
                <div className='text-xs text-gray-400 bg-gray-800/50 rounded p-2'>
                  <strong>Concept:</strong> {data.concept}
                </div>
              )}

              {/* Segments Count */}
              {data.segments && (
                <div className='flex items-center space-x-2'>
                  <Hash size={16} className='text-gray-400' />
                  <span className='text-xs text-gray-300'>
                    {data.segments.length} segment{data.segments.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Script Metadata */}
              {data.createdAt && (
                <div className='text-xs text-gray-500 pt-2 border-t border-gray-700'>
                  Created: {new Date(data.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </>
        ) : (
          // New/empty state view
          <>
            {/* Get started with script */}
            <div className='text-gray-400 text-sm mb-3 font-light'>
              Get started with
            </div>

            {/* Options List */}
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <FileText size={16} className='text-gray-400' />
                <span className='text-xs'>Script Writing</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <PenTool size={16} className='text-gray-400' />
                <span className='text-xs'>Creative Writing</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <BookOpen size={16} className='text-gray-400' />
                <span className='text-xs'>Story Development</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Type size={16} className='text-gray-400' />
                <span className='text-xs'>Content Creation</span>
              </div>
            </div>
          </>
        )}

        {/* Output Handle - Bottom side */}
        <Handle
          type='source'
          position='bottom'
          id="output"
          style={{
            background: hasData ? "#3b82f6" : "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            bottom: -8,
          }}
          isConnectable={isConnectable}
        />
      </div>
    </div>
  );
}

export default NodeScript;
