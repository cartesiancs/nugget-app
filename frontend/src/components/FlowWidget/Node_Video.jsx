import React from "react";
import { Handle } from "@xyflow/react";
import { Video, Play, Film, Camera, PlayCircle } from "lucide-react";

function NodeVideo({ data, isConnectable, selected }) {
  // Check if this is existing data or new/empty state
  const hasData = data && (data.videoUrl || data.url);
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Video
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[280px] min-h-[320px] relative transition-all duration-200 ${
          selected ? (hasData ? "ring-2 ring-emerald-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          id="input"
          style={{
            background: hasData ? "#10b981" : "#3b82f6",
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
            {/* Video Header */}
            <div className='flex items-center mb-3'>
              <div className='flex items-center space-x-2'>
                <PlayCircle size={20} className='text-emerald-400' />
                <span className='text-white font-medium'>Video {data.videoId || data.id}</span>
              </div>
            </div>

            {/* Video Preview */}
            <div className='mb-3'>
              <video 
                src={data.videoUrl || data.url} 
                className='w-full h-36 object-cover rounded-lg bg-gray-800'
                controls
                muted
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className='w-full h-36 bg-gray-800 rounded-lg hidden items-center justify-center'
                style={{display: 'none'}}
              >
                <span className='text-gray-500 text-xs'>Video unavailable</span>
              </div>
            </div>

            {/* Video Details */}
            <div className='space-y-2'>
              {data.segmentData?.animation && (
                <div>
                  <div className='text-xs text-gray-400 mb-1'>Animation:</div>
                  <div className='text-gray-300 text-xs bg-gray-800/50 rounded p-2 max-h-[40px] overflow-y-auto'>
                    {data.segmentData.animation}
                  </div>
                </div>
              )}
              
              {data.segmentData?.artStyle && (
                <div className='text-xs text-gray-400'>
                  Style: {data.segmentData.artStyle}
                </div>
              )}

              {data.segmentId && data.imageId && (
                <div className='text-xs text-gray-400'>
                  From: Segment {data.segmentId}, Image {data.imageId}
                </div>
              )}
            </div>
          </>
        ) : (
          // New/empty state view
          <>
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
          </>
        )}

        {/* Output Handle - Bottom side */}
        <Handle
          type='source'
          position='bottom'
          id="output"
          style={{
            background: hasData ? "#10b981" : "#3b82f6",
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
