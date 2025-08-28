import React, { useState, useEffect } from "react";
import { Handle } from "@xyflow/react";
import { Layers, Clock, Target, Zap, Play, Hash, Plus, Minus } from "lucide-react";

function NodeSegment({ data, isConnectable, selected, onToggleTextNode, nodes, id, xPos, yPos, positionAbsoluteX, positionAbsoluteY }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if text node exists for this segment node
  useEffect(() => {
    const textNodeExists = nodes && nodes.some(node => 
      node.type === "textNode" && node.data?.parentNodeId === id
    );
    setIsExpanded(textNodeExists);
  }, [nodes, id]);
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.visual || data.narration || data.animation);
  const isLoading = nodeState === 'loading';
  const hasError = nodeState === 'error';
  const isNew = nodeState === 'new';
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Segment
        </h1>
      </div>

      <div
        className={`rounded-2xl p-3 w-[280px] min-h-[280px] relative transition-all duration-300 ${
          selected ? (hasData ? "ring-2 ring-green-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(34, 197, 94, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
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
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Play size={20} className='text-green-400' />
                <span className='text-white font-medium text-sm'>
                  {data.title || `Segment ${data.id}`}
                </span>
              </div>
            </div>
            <div className='space-y-2 mb-2'>
              <div className='text-gray-300 text-xs leading-relaxed'>
                Generating segment...
              </div>
            </div>
          </>
        ) : hasError ? (
          // Error state - styled same as existing state
          <>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Play size={20} className='text-green-400' />
                <span className='text-white font-medium text-sm'>
                  {data.title || `Segment ${data.id}`}
                </span>
              </div>
            </div>
            <div className='space-y-2 mb-2'>
              <div className='text-red-300 text-xs leading-relaxed'>
                {data.error || 'Failed to generate segment'}
              </div>
            </div>
          </>
        ) : hasData ? (
          // Existing data view - all look the same
          <>
            {/* Segment Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Play size={20} className='text-green-400' />
                <span className='text-white font-medium text-sm'>
                  Segemnt 
                </span>
              </div>
            </div>

            {/* Segment Content - Only show narration */}
            <div className='space-y-2 mb-2'>
              {data.narration && (
                <div className='text-gray-300 text-xs leading-relaxed overflow-hidden'>
                  {data.narration.length > 100 ? data.narration.substring(0, 250) + '...' : data.narration}
                </div>
              )}
              
              {!data.narration && (
                <div className='text-gray-400 text-xs italic'>
                  No narration available
                </div>
              )}
            </div>
          </>
        ) : (
          // New/empty state view
          <>
            {/* Get started with segment */}
            <div className='text-gray-400 text-sm mb-3 font-light'>
              Get started with
            </div>

            {/* Options List */}
            <div className='space-y-1.5'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <Play size={14} className='text-gray-400' />
                <span className='text-xs'>Scene Creation</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Layers size={14} className='text-gray-400' />
                <span className='text-xs'>Visual Elements</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Clock size={14} className='text-gray-400' />
                <span className='text-xs'>Timing Control</span>
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
            className='absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center  z-10  border-0'
            onClick={(e) => {
              e.stopPropagation();
              const newExpandedState = !isExpanded;
              setIsExpanded(newExpandedState);
              
              // Get the full segment content - only narration
              let fullContent = '';
              if (data.narration) {
                fullContent = data.narration;
              } else {
                fullContent = 'No narration available';
              }
              
              if (onToggleTextNode) {
                const currentPosition = {
                  xPos: positionAbsoluteX || xPos || 400,
                  yPos: positionAbsoluteY || yPos || 200
                };
                onToggleTextNode(id, 'segmentNode', newExpandedState, fullContent, currentPosition);
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

export default NodeSegment;
