import React from "react";
import { Handle } from "@xyflow/react";
import { Scissors, Layers, Split, Merge } from "lucide-react";

function NodeSegment({ isConnectable, selected }) {
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Segment
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[240px] h-[240px] relative transition-all duration-200 ${
          selected ? "ring-2 ring-gray-600" : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
        }}
      >
        {/* Input Handle - Left side */}
        <Handle
          type='target'
          position='left'
          style={{
            background: "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            left: -8,
          }}
          isConnectable={isConnectable}
        />

        {/* Get started with segment */}
        <div className='text-gray-400 text-sm mb-3 font-light'>
          Get started with
        </div>

        {/* Options List */}
        <div className='space-y-2'>
          <div className='flex items-center space-x-2 text-gray-300'>
            <Scissors size={16} className='text-gray-400' />
            <span className='text-xs'>Content Splitting</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Layers size={16} className='text-gray-400' />
            <span className='text-xs'>Layer Management</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Split size={16} className='text-gray-400' />
            <span className='text-xs'>Timeline Division</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Merge size={16} className='text-gray-400' />
            <span className='text-xs'>Segment Merging</span>
          </div>
        </div>

        {/* Output Handle - Right side */}
        <Handle
          type='source'
          position='right'
          style={{
            background: "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            right: -8,
          }}
          isConnectable={isConnectable}
        />
      </div>
    </div>
  );
}

export default NodeSegment;
