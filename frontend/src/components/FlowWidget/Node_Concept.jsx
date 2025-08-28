import React, { useState, useEffect } from "react";
import { Handle } from "@xyflow/react";
import { Lightbulb, Sparkles, Zap, Target, RefreshCw, AlertCircle, Plus, Minus } from "lucide-react";

function NodeConcept({ data, isConnectable, selected, onRetry, onToggleTextNode, nodes, id, xPos, yPos, positionAbsoluteX, positionAbsoluteY }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if text node exists for this concept node
  useEffect(() => {
    const textNodeExists = nodes && nodes.some(node => 
      node.type === "textNode" && node.data?.parentNodeId === id
    );
    setIsExpanded(textNodeExists);
  }, [nodes, id]);
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.content || data.text || data.concept || data.description || data.prompt || data.userText);
  const isLoading = nodeState === 'loading';
  const hasError = nodeState === 'error';
  
  // Debug removed for production
  
  // Get concept content
  const conceptContent = data.content || data.userText || data.text || data.concept || data.description || data.prompt || "No concept content available";
  
  // Debug log to see what data we're getting (removed for production)
  // console.log("NodeConcept data:", data, "hasData:", hasData, "nodeState:", nodeState);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Concept
        </h1>
      </div>

      <div
        className={`rounded-2xl p-3 w-[280px] min-h-[280px] relative transition-all duration-300 ${
          selected ? (hasError ? "ring-2 ring-red-500" : hasData ? "ring-2 ring-purple-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: hasError ? "#2d1b1b" : "#1a1a1a",
          border: hasError ? "1px solid #dc2626" : hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasError ? "0 0 20px rgba(220, 38, 38, 0.3)" : selected && hasData ? "0 0 20px rgba(139, 92, 246, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
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
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Lightbulb size={20} className='text-purple-400' />
                <span className='text-white font-medium text-sm'>
                  {data.title || `Concept ${data.id}`}
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='text-gray-300 text-xs leading-relaxed'>
                Generating concepts...
              </div>
            </div>
          </>
        ) : hasError ? (
          // Error state with red styling and retry button
          <>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <AlertCircle size={20} className='text-red-400' />
                <span className='text-red-200 font-medium text-sm'>
                  {data.title || `Concept ${data.id}`}
                </span>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='text-red-300 text-xs font-medium'>
                {data.error || 'Internal Server Error'}
              </div>
              <div className='text-red-400/70 text-xs leading-relaxed'>
                {data.errorDescription || 'Failed to generate concept. Please try again.'}
              </div>
              {data.canRetry !== false && (
                <button
                  onClick={() => onRetry && onRetry(data.id, 'conceptNode')}
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
            {/* Concept Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Lightbulb size={20} className='text-purple-400' />
                <span className='text-white font-medium text-sm'>
                  {data.title || `Concept ${data.id}`}
                </span>
              </div>
            </div>

            {/* Concept Content */}
            <div className='space-y-2'>
              <div className='text-gray-300 text-xs leading-relaxed overflow-hidden'>
                {conceptContent.length > 120 ? conceptContent.substring(0, 350) + '...' : conceptContent}
              </div>
            </div>
          </>
        ) : (
          // New/empty state view
          <>
            {/* Get started with concept */}
            <div className='text-gray-400 text-sm mb-3 font-light'>
              Get started with
            </div>

            {/* Options List */}
            <div className='space-y-1.5'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <Lightbulb size={14} className='text-gray-400' />
                <span className='text-xs'>Brainstorming</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Sparkles size={14} className='text-gray-400' />
                <span className='text-xs'>Creative Ideas</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Zap size={14} className='text-gray-400' />
                <span className='text-xs'>Innovation</span>
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
            className='absolute bottom-2 border-0 right-2 w-8 h-8 flex items-center justify-center z-10 '
            onClick={(e) => {
              e.stopPropagation();
              // Button clicked - toggle text node
              
              const newExpandedState = !isExpanded;
              setIsExpanded(newExpandedState);
              
              if (onToggleTextNode) {
                // Pass the node ID, type, expanded state, content, and position directly
                const currentPosition = {
                  xPos: positionAbsoluteX || xPos || 400,
                  yPos: positionAbsoluteY || yPos || 200
                };
                onToggleTextNode(id, 'conceptNode', newExpandedState, conceptContent, currentPosition);
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

export default NodeConcept;

