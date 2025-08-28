import React, { useState, useEffect } from "react";
import { Handle } from "@xyflow/react";
import { FileText, PenTool, BookOpen, Type, Palette, Hash, Loader2, AlertCircle, RefreshCw, Plus, Minus } from "lucide-react";

function NodeScript({ data, isConnectable, selected, onRetry, onToggleTextNode, nodes, id, xPos, yPos, positionAbsoluteX, positionAbsoluteY }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if text node exists for this script node
  useEffect(() => {
    const textNodeExists = nodes && nodes.some(node => 
      node.type === "textNode" && node.data?.parentNodeId === id
    );
    setIsExpanded(textNodeExists);
  }, [nodes, id]);
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.segments || data.artStyle || data.concept || (data.content && data.content !== 'New script content...'));
  const isLoading = nodeState === 'loading';
  const hasError = nodeState === 'error';
  const isNew = nodeState === 'new';
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Script
        </h1>
      </div>

      <div
        className={`rounded-2xl p-3 w-[280px] min-h-[280px] relative transition-all duration-300 ${
          selected ? (hasError ? "ring-2 ring-red-500" : hasData ? "ring-2 ring-blue-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: hasError ? "#2d1b1b" : "#1a1a1a",
          border: hasError ? "1px solid #dc2626" : hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasError ? "0 0 20px rgba(220, 38, 38, 0.3)" : selected && hasData ? "0 0 20px rgba(59, 130, 246, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
          transition: "all 0.3s ease-in-out",
        }}
      >
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          id="input"
          style={{
            background: "#ffffff",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            top: -8,
          }}
          isConnectable={isConnectable}
        />

        {isLoading ? (
          // Loading state - styled same as existing state
          <>
            <div className='flex items-center mb-4'>
              <div className='flex items-center space-x-2'>
                <FileText size={20} className='text-blue-400' />
                <span className='text-white font-medium text-sm'>
                  Script
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='text-gray-300 text-xs leading-relaxed'>
                Generating script...
              </div>
            </div>
          </>
        ) : hasError ? (
          // Error state with red styling and retry button
          <>
            <div className='flex items-center mb-4'>
              <div className='flex items-center space-x-2'>
                <AlertCircle size={20} className='text-red-400' />
                <span className='text-red-200 font-medium text-sm'>
                  Script
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='text-red-300 text-xs font-medium'>
                {data.error || 'Internal Server Error'}
              </div>
              <div className='text-red-400/70 text-xs leading-relaxed'>
                {data.errorDescription || 'Failed to generate script. Please try again.'}
              </div>
              {data.canRetry !== false && (
                <button
                  onClick={() => onRetry && onRetry(data.id, 'scriptNode')}
                  className='mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2'
                  disabled={data.nodeState === 'loading'}
                >
                  <RefreshCw size={14} className={data.nodeState === 'loading' ? 'animate-spin' : ''} />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          </>
        ) : hasData ? (
          // Existing/Generated data view - all look the same
          <>
            {/* Script Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <FileText size={20} className='text-blue-400' />
                <span className='text-white font-medium text-sm'>
                  Script
                </span>
              </div>
            </div>

            {/* Script Content */}
            <div className='space-y-2'>
              {data.content && data.content !== 'New script content...' && (
                <div className='text-gray-300 text-xs leading-relaxed overflow-hidden'>
                  {data.content.length > 100 ? data.content.substring(0, 300) + '...' : data.content}
                </div>
              )}

              {data.segments && Array.isArray(data.segments) && data.segments.length > 0 && (
                <div>
                  <div className='text-xs text-gray-400 mb-1'>Segments: {data.segments.length}</div>
                  <div className='text-gray-300 text-xs leading-relaxed overflow-hidden'>
                    {data.segments[0]?.narration ? 
                      (data.segments[0].narration.length > 80 ? 
                        data.segments[0].narration.substring(0, 280) + '...' : 
                        data.segments[0].narration
                      ) : 'No narration available'
                    }
                  </div>
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
            <div className='space-y-1.5'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <FileText size={14} className='text-gray-400' />
                <span className='text-xs'>Script Writing</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <PenTool size={14} className='text-gray-400' />
                <span className='text-xs'>Story Development</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <BookOpen size={14} className='text-gray-400' />
                <span className='text-xs'>Content Planning</span>
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
            background: "#ffffff",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            bottom: -8,
          }}
          isConnectable={isConnectable}
        />

        {/* Plus/Minus Button - Bottom Right */}
        {hasData && (
          <button
            className='absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center z-10 border-0'
            onClick={(e) => {
              e.stopPropagation();
              const newExpandedState = !isExpanded;
              setIsExpanded(newExpandedState);
              
              // Get the full script content - only narration
              let fullContent = '';
              if (data.content && data.content !== 'New script content...') {
                fullContent = data.content;
              } else if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
                fullContent = data.segments.map((segment, index) => 
                  `Segment ${index + 1}:\n${segment.narration || 'No narration'}`
                ).join('\n\n---\n\n');
              }
              
              if (onToggleTextNode) {
                const currentPosition = {
                  xPos: positionAbsoluteX || xPos || 400,
                  yPos: positionAbsoluteY || yPos || 200
                };
                onToggleTextNode(id, 'scriptNode', newExpandedState, fullContent, currentPosition);
              }
            }}
            title={isExpanded ? "Hide full text" : "Show full text"}
          >
            {isExpanded ? "-" : "+"}
          </button>
        )}
      </div>
    </div>
  );
}

export default NodeScript;
