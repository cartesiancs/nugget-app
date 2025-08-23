import React from "react";
import { Handle } from "@xyflow/react";
import { Video, Play, Film, Camera, PlayCircle, Loader2, AlertCircle } from "lucide-react";

function NodeVideo({ data, isConnectable, selected }) {
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.videoUrl || data.url);
  const isLoading = nodeState === 'loading';
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
        className={`rounded-2xl p-3 w-[280px] h-[280px] relative transition-all duration-300 ${
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
          // Error state - styled same as existing state
          <>
            <div className='w-full h-full flex items-center justify-center'>
              <div className='text-center'>
                <AlertCircle size={24} className='text-gray-500 mx-auto mb-2' />
                <span className='text-gray-500 text-xs'>Failed to generate</span>
              </div>
            </div>
          </>
        ) : hasData ? (
          // Existing/Generated data view - all look the same
          <>
            {/* Full Video Display */}
            <div className='relative h-full w-full'>
              <video 
                src={data.videoUrl || data.url}
                controls
                className='w-full h-full object-cover rounded-lg'
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


      </div>
    </div>
  );
}

export default NodeVideo;
