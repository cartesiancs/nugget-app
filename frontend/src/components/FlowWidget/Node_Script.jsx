import React, { useState } from "react";
import { Handle } from "@xyflow/react";
import { FileText, PenTool, BookOpen, Type, Palette, Hash, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

function NodeScript({ data, isConnectable, selected }) {
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.segments || data.artStyle || data.concept || data.content);
  const isLoading = nodeState === 'loading';
  const isGenerated = nodeState === 'generated';
  const hasError = nodeState === 'error';
  const isNew = nodeState === 'new';
  
  // Expandable state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if there's overflow content (for art style only display, we might not need expansion)
  const hasOverflowContent = (data.content && data.content !== 'New script content...') || 
                            (data.segments && data.segments.length > 0);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Script
        </h1>
      </div>

      <div
        className={`rounded-2xl p-4 w-[280px] relative transition-all duration-300 ${
          selected ? (hasData ? "ring-2 ring-blue-500" : "ring-2 ring-gray-600") : ""
        } ${isExpanded ? 'h-auto' : 'h-[280px]'}`}
        style={{
          background: isLoading ? "#1a1a2e" : isGenerated ? "#1a2e1a" : hasError ? "#2e1a1a" : "#1a1a1a",
          border: isLoading ? "1px solid #3b82f6" : isGenerated ? "1px solid #10b981" : hasError ? "1px solid #ef4444" : hasData ? "1px solid #444" : "1px solid #333",
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

        {isLoading ? (
          // Loading state
          <>
            <div className='flex items-center mb-4'>
              <div className='flex items-center space-x-2'>
                <Loader2 size={20} className='text-blue-400 animate-spin' />
                <span className='text-white font-medium'>Generating Script...</span>
              </div>
            </div>
            <div className='flex items-center justify-center py-8'>
              <div className='animate-pulse text-gray-400 text-sm text-center'>
                Creating your script from the concept...<br/>
                <span className='text-xs text-gray-500'>This may take a few moments</span>
              </div>
            </div>
          </>
        ) : hasError ? (
          // Error state
          <>
            <div className='flex items-center mb-4'>
              <div className='flex items-center space-x-2'>
                <AlertCircle size={20} className='text-red-400' />
                <span className='text-white font-medium'>Generation Failed</span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='text-red-300 text-sm'>
                {data.error || 'Failed to generate script'}
              </div>
              <div className='text-xs text-gray-400'>
                {data.content || 'Unable to create script from concept'}
              </div>
              <button className='text-xs text-red-400 hover:text-red-300 underline'>
                Try Again
              </button>
            </div>
          </>
        ) : hasData ? (
          // Existing/Generated data view
          <>
            {/* Script Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <FileText size={20} className={isGenerated ? 'text-green-400' : 'text-blue-400'} />
                <span className='text-white font-medium text-sm'>
                  Script
                </span>
                {isGenerated && (
                  <span className='text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded'>AI</span>
                )}
              </div>
            </div>

            {/* Art Style Only */}
            <div className='mb-3'>
              {data.artStyle ? (
                <div className='p-2 bg-gray-800/30 rounded-lg'>
                  <div className='text-xs text-gray-300 leading-relaxed'>
                    {data.artStyle}
                  </div>
                </div>
              ) : (
                <div className='p-2 bg-gray-800/30 rounded-lg'>
                  <div className='text-xs text-gray-500 italic'>
                    No art style specified
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details when expanded */}
            {isExpanded && (
              <div className='space-y-2 mb-3'>
                {/* Script Content */}
                {data.content && data.content !== 'New script content...' && (
                  <div>
                    <div className='text-xs text-gray-400 mb-1'>Script Content:</div>
                    <div className='p-2 bg-gray-800/30 rounded-lg'>
                      <div className='text-xs text-gray-300 leading-relaxed'>
                        {data.content}
                      </div>
                    </div>
                  </div>
                )}

                
              </div>
            )}

            {/* Script Details */}
            <div className='space-y-3'>
              {/* Script Metadata */}
              {isGenerated && (
                <div className='text-xs text-gray-500 pt-2 border-t border-gray-700 flex justify-end'>
                  <span className='text-green-400'>Connect to segment</span>
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            {hasOverflowContent && (
              <div className='absolute bottom-2 right-2'>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className='text-gray-400 hover:text-white transition-colors p-1 rounded'
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}
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
            background: isLoading ? "#3b82f6" : isGenerated ? "#10b981" : hasError ? "#ef4444" : "#3b82f6",
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
