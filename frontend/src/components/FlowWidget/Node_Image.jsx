import React from "react";
import { Handle } from "@xyflow/react";
import { Image, Camera, Images, Frame } from "lucide-react";

function NodeImage({ isConnectable, selected }) {
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Image
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

        {/* Get started with image */}
        <div className='text-gray-400 text-sm mb-3 font-light'>
          Get started with
        </div>

        {/* Options List */}
        <div className='space-y-2'>
          <div className='flex items-center space-x-2 text-gray-300'>
            <Camera size={16} className='text-gray-400' />
            <span className='text-xs'>Photo Capture</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Images size={16} className='text-gray-400' />
            <span className='text-xs'>Image Library</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Frame size={16} className='text-gray-400' />
            <span className='text-xs'>Frame Design</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Image size={16} className='text-gray-400' />
            <span className='text-xs'>Visual Content</span>
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

export default NodeImage;
