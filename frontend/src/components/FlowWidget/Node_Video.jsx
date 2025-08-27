import React from "react";
import { Handle } from "@xyflow/react";
import { Video, Play, Film, Camera, PlayCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";

function NodeVideo({ data, isConnectable, selected, onRetry }) {
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.videoUrl || data.url);
  const isLoading = nodeState === 'loading';
  const hasError = nodeState === 'error';

  
  
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Video
        </h1>
      </div>

      <div
        className={`rounded-2xl p-3 w-[280px] min-h-[280px] relative transition-all duration-300 ${
          selected ? (hasError ? "ring-2 ring-red-500" : hasData ? "ring-2 ring-emerald-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: hasError ? "#2d1b1b" : "#1a1a1a",
          border: hasError ? "1px solid #dc2626" : hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasError ? "0 0 20px rgba(220, 38, 38, 0.3)" : selected && hasData ? "0 0 20px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
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
            <div className='w-full h-full flex items-center justify-center'>
              <div className='text-center'>
                <Film size={24} className='text-gray-500 mx-auto mb-2' />
                <span className='text-gray-500 text-xs'>Generating video...</span>
              </div>
            </div>
          </>
        ) : hasError ? (
          // Error state with red styling and retry button
          <>
            <div className='w-full h-full flex flex-col items-center justify-center p-4'>
              <div className='text-center space-y-3'>
                <AlertCircle size={32} className='text-red-400 mx-auto' />
                <div className='text-red-300 text-sm font-medium'>
                  {data.error || 'Internal Server Error'}
                </div>
                <div className='text-red-400/70 text-xs leading-relaxed'>
                  {data.errorDescription || 'Failed to generate video. Please try again.'}
                </div>
                {data.canRetry !== false && (
                  <button
                    onClick={() => onRetry && onRetry(data.id, 'videoNode')}
                    className='w-full bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-2'
                    disabled={data.nodeState === 'loading'}
                  >
                    <RefreshCw size={14} className={data.nodeState === 'loading' ? 'animate-spin' : ''} />
                    <span>Try Again</span>
                  </button>
                )}
              </div>
            </div>
          </>
        ) : hasData ? (
          // Existing/Generated data view - all look the same
          <>
            {/* Full Video Display */}
            <div className='absolute inset-3 rounded-lg overflow-hidden'>
              <video 
                src={data.videoUrl || data.url}
                controls
                className='w-full h-full object-cover rounded-lg'
                style={{ minHeight: '240px' }}
              >
                Your browser does not support the video tag.
              </video>
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
                <span className='text-xs'>Animation</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Film size={16} className='text-gray-400' />
                <span className='text-xs'>Motion Graphics</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <PlayCircle size={16} className='text-gray-400' />
                <span className='text-xs'>Dynamic Content</span>
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

export default NodeVideo;
