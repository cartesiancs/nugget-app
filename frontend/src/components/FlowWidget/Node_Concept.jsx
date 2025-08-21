import { Handle } from "@xyflow/react";
import { Lightbulb, Sparkles, Zap, Target, MoreHorizontal } from "lucide-react";

function NodeConcept({ data, isConnectable, selected }) {
  // Check if this is existing data or new/empty state
  const hasData = data && (data.content || data.text || data.concept || data.description || data.prompt);
  
  // Debug log to see what data we're getting
  console.log("NodeConcept data:", data, "hasData:", hasData);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Concept
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[300px] min-h-[240px] relative transition-all duration-200 ${
          selected ? (hasData ? "ring-2 ring-purple-500" : "ring-2 ring-gray-600") : ""
        }`}
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
            background: hasData ? "#8b5cf6" : "#3b82f6",
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
            {/* Concept Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <Lightbulb size={20} className='text-purple-400' />
                <span className='text-white font-medium'>{data.title || `Concept ${data.id}`}</span>
              </div>
              <button className='text-gray-400 hover:text-white'>
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Concept Content */}
            <div className='space-y-3'>
              <div className='text-gray-300 text-sm leading-relaxed max-h-[120px] overflow-y-auto'>
                {data.content || data.text || data.concept || data.description || data.prompt || "No concept content available"}
              </div>
              
              {/* Concept Metadata */}
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
            background: hasData ? "#8b5cf6" : "#3b82f6",
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
