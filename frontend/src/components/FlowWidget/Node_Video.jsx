import React from "react";
import { Handle } from "@xyflow/react";
import { Video, Play, Film, Camera, PlayCircle, Loader2, AlertCircle } from "lucide-react";

function NodeVideo({ data, isConnectable, selected }) {
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.videoUrl || data.url);
  const isLoading = nodeState === 'loading';
  const isGenerated = nodeState === 'generated';
  const hasError = nodeState === 'error';
  const isNew = nodeState === 'new';
  
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
          background: isLoading ? "#1a2e1a" : isGenerated ? "#1a2e2e" : hasError ? "#2e1a1a" : "#1a1a1a",
          border: isLoading ? "1px solid #10b981" : isGenerated ? "1px solid #10b981" : hasError ? "1px solid #ef4444" : hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          id="input"
          style={{
            background: isLoading ? "#10b981" : isGenerated ? "#10b981" : hasError ? "#ef4444" : hasData ? "#10b981" : "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            top: -8,
          }}
          isConnectable={isConnectable}
        />

        {isLoading ? (
          // Loading state
          <>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <Loader2 size={20} className='text-emerald-400 animate-spin' />
                <span className='text-white font-medium text-sm'>Generating Video...</span>
              </div>
            </div>
            <div className='mb-3'>
              <div className='w-full h-36 bg-gray-800/50 rounded-lg flex items-center justify-center animate-pulse'>
                <div className='text-center'>
                  <Film size={24} className='text-gray-500 mx-auto mb-2' />
                  <span className='text-gray-500 text-xs'>Creating video...</span>
                </div>
              </div>
            </div>
            <div className='text-xs text-gray-400 text-center'>
              {data.content || 'Processing animation from image...'}
            </div>
          </>
        ) : hasError ? (
          // Error state
          <>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <AlertCircle size={20} className='text-red-400' />
                <span className='text-white font-medium text-sm'>Generation Failed</span>
              </div>
            </div>
            <div className='mb-3'>
              <div className='w-full h-36 bg-red-900/20 rounded-lg flex items-center justify-center border border-red-500/30'>
                <div className='text-center'>
                  <AlertCircle size={24} className='text-red-400 mx-auto mb-2' />
                  <span className='text-red-400 text-xs'>Failed to generate</span>
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='text-red-300 text-xs'>
                {data.error || 'Video generation failed'}
              </div>
              <button className='text-xs text-red-400 hover:text-red-300 underline'>
                Try Again
              </button>
            </div>
          </>
        ) : hasData ? (
          // Existing/Generated data view
          <>
            {/* Video Header */}
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center space-x-2'>
                <PlayCircle size={20} className='text-emerald-400' />
                <span className='text-white font-medium text-sm'>
                  Video
                </span>
                {isGenerated && (
                  <span className='text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded'>AI</span>
                )}
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
              {isGenerated && (
                <div className='text-xs text-gray-500 pt-1 border-t border-gray-700'>
                  <span className='text-emerald-400'>Ready for timeline</span>
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
            background: isLoading ? "#10b981" : isGenerated ? "#10b981" : hasError ? "#ef4444" : hasData ? "#10b981" : "#3b82f6",
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
