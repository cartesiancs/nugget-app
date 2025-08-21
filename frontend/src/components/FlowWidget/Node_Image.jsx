import React from "react";
import { Handle } from "@xyflow/react";
import { Image, Camera, Images, Frame, Star } from "lucide-react";

function NodeImage({ data, isConnectable, selected }) {
  // Check if this is existing data or new/empty state
  const hasData = data && (data.imageUrl || data.url);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Image
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[260px] min-h-[280px] relative transition-all duration-200 ${
          selected ? (hasData ? "ring-2 ring-orange-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(249, 115, 22, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          id="input"
          style={{
            background: hasData ? "#f97316" : "#3b82f6",
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
            {/* Image Header */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <Image size={20} className='text-orange-400' />
                <span className='text-white font-medium'>Image {data.imageId || data.id}</span>
              </div>
              {data.isPrimary && (
                <Star size={16} className='text-yellow-400 fill-current' />
              )}
            </div>

            {/* Image Preview */}
            <div className='mb-3'>
              <img 
                src={data.imageUrl || data.url} 
                alt="Generated"
                className='w-full h-32 object-cover rounded-lg bg-gray-800'
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className='w-full h-32 bg-gray-800 rounded-lg hidden items-center justify-center'
                style={{display: 'none'}}
              >
                <span className='text-gray-500 text-xs'>Image unavailable</span>
              </div>
            </div>

            {/* Image Details */}
            <div className='space-y-2'>
              {data.segmentData?.visual && (
                <div>
                  <div className='text-xs text-gray-400 mb-1'>Prompt:</div>
                  <div className='text-gray-300 text-xs bg-gray-800/50 rounded p-2 max-h-[40px] overflow-y-auto'>
                    {data.segmentData.visual}
                  </div>
                </div>
              )}
              
              {data.segmentData?.artStyle && (
                <div className='text-xs text-gray-400'>
                  Style: {data.segmentData.artStyle}
                </div>
              )}
            </div>
          </>
        ) : (
          // New/empty state view
          <>
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
          </>
        )}

        {/* Output Handle - Bottom side */}
        <Handle
          type='source'
          position='bottom'
          id="output"
          style={{
            background: hasData ? "#f97316" : "#3b82f6",
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

export default NodeImage;
