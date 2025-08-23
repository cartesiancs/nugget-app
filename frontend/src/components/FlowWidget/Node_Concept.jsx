import React, { useState } from "react";
import { Handle } from "@xyflow/react";
import { Lightbulb, Sparkles, Zap, Target, ChevronDown, ChevronUp } from "lucide-react";

function NodeConcept({ data, isConnectable, selected }) {
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.content || data.text || data.concept || data.description || data.prompt || data.userText);
  const isLoading = nodeState === 'loading';
  const hasError = nodeState === 'error';
  
  // Expandable state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get concept content
  const conceptContent = data.content || data.userText || data.text || data.concept || data.description || data.prompt || "No concept content available";
  
  // Check if there's overflow content
  const hasOverflowContent = conceptContent.length > 120;
  
  // Debug log to see what data we're getting
  console.log("NodeConcept data:", data, "hasData:", hasData, "nodeState:", nodeState);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Concept
        </h1>
      </div>

      <div
        className={`rounded-2xl p-4 w-[280px] relative transition-all duration-300 ${
          selected ? (hasData ? "ring-2 ring-purple-500" : "ring-2 ring-gray-600") : ""
        } ${isExpanded ? 'h-auto' : 'h-[280px]'}`}
        style={{
          background: "#1a1a1a",
          border: hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(139, 92, 246, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
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
            <div className='space-y-3'>
              <div className='text-gray-300 text-sm leading-relaxed'>
                Generating concepts...
              </div>
            </div>
          </>
        ) : hasError ? (
          // Error state - styled same as existing state
          <>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Lightbulb size={20} className='text-purple-400' />
                <span className='text-white font-medium text-sm'>
                  {data.title || `Concept ${data.id}`}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='text-gray-300 text-sm leading-relaxed'>
                {data.error || 'Failed to generate concept'}
              </div>
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
            <div className='space-y-3'>
              <div className='text-gray-300 text-sm leading-relaxed'>
                {isExpanded ? conceptContent : `${conceptContent.substring(0, 120)}${conceptContent.length > 120 ? '...' : ''}`}
              </div>
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
            {/* Get started with concept */}
            <div className='text-gray-400 text-sm mb-3 font-light'>
              Get started with
            </div>

            {/* Options List */}
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <Lightbulb size={16} className='text-gray-400' />
                <span className='text-xs'>Brainstorming Ideas</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Sparkles size={16} className='text-gray-400' />
                <span className='text-xs'>Creative Concepts</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Zap size={16} className='text-gray-400' />
                <span className='text-xs'>Innovation Sparks</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Target size={16} className='text-gray-400' />
                <span className='text-xs'>Strategic Vision</span>
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
      </div>
    </div>
  );
}

export default NodeConcept;
