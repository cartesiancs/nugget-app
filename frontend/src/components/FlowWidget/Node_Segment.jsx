import React from "react";
import { Handle } from "@xyflow/react";
import { Layers, Clock, Target, Zap, Play } from "lucide-react";

function NodeSegment({ data, isConnectable, selected }) {
  // Check if this is existing data or new/empty state
  const hasData = data && (data.visual || data.narration || data.animation);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Segment
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[280px] min-h-[240px] relative transition-all duration-200 ${
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
            background: hasData ? "#22c55e" : "#3b82f6",
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
            {/* Segment Header */}
            <div className='flex items-center mb-4'>
              <div className='flex items-center space-x-2'>
                <Play size={20} className='text-green-400' />
                <span className='text-white font-medium'>Segment {data.id}</span>
              </div>
            </div>

            {/* Segment Content */}
            <div className='space-y-3'>
              {/* Visual Description */}
              {data.visual && (
                <div>
                  <div className='text-xs text-gray-400 mb-1'>Visual:</div>
                  <div className='text-gray-300 text-sm bg-gray-800/50 rounded p-2 max-h-[60px] overflow-y-auto'>
                    {data.visual}
                  </div>
                </div>
              )}
              
              {/* Narration */}
              {data.narration && (
                <div>
                  <div className='text-xs text-gray-400 mb-1'>Narration:</div>
                  <div className='text-gray-300 text-sm bg-gray-800/50 rounded p-2 max-h-[60px] overflow-y-auto'>
                    {data.narration}
                  </div>
                </div>
              )}

              {/* Animation */}
              {data.animation && (
                <div>
                  <div className='text-xs text-gray-400 mb-1'>Animation:</div>
                  <div className='text-gray-300 text-sm bg-gray-800/50 rounded p-2 max-h-[60px] overflow-y-auto'>
                    {data.animation}
                  </div>
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
            <div className='space-y-2'>
              <div className='flex items-center space-x-2 text-gray-300'>
                <Layers size={16} className='text-gray-400' />
                <span className='text-xs'>Scene Division</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Clock size={16} className='text-gray-400' />
                <span className='text-xs'>Time Management</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Target size={16} className='text-gray-400' />
                <span className='text-xs'>Content Focus</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Zap size={16} className='text-gray-400' />
                <span className='text-xs'>Quick Actions</span>
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
            background: hasData ? "#22c55e" : "#3b82f6",
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

export default NodeSegment;
