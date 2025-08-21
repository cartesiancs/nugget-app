import React from "react";
import { Handle } from "@xyflow/react";
import { Video, Play, Film, Camera } from "lucide-react";

function NodeVideo({ isConnectable, selected }) {
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Video
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
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          style={{
            background: "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            top: -8,
          }}
          isConnectable={isConnectable}
        />

        {/* Get started with video */}
        <div className='text-gray-400 text-sm mb-3 font-light'>
          Get started with
        </div>

        {/* Options List */}
        <div className='space-y-2'>
          <div className='flex items-center space-x-2 text-gray-300'>
            <Video size={16} className='text-gray-400' />
            <span className='text-xs'>Video Creation</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Play size={16} className='text-gray-400' />
            <span className='text-xs'>Playback Control</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Film size={16} className='text-gray-400' />
            <span className='text-xs'>Film Production</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Camera size={16} className='text-gray-400' />
            <span className='text-xs'>Camera Work</span>
          </div>
        </div>

        {/* Output Handle - Bottom side */}
        <Handle
          type='source'
          position='bottom'
          style={{
            background: "#3b82f6",
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

export default NodeVideo;
