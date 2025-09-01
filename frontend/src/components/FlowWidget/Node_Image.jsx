
import React from "react";
import { Handle } from "@xyflow/react";
import { Image, Camera, Images, Frame, Loader2, AlertCircle, RefreshCw, Download, Maximize2 } from "lucide-react";

function NodeImage({ data, isConnectable, selected, onRetry, onImageClick }) {
  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = data && (data.imageUrl || data.url);
  const isLoading = nodeState === 'loading';
  const hasError = nodeState === 'error';

  // Download functionality
  const handleDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image_${data.id || 'node'}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Enlarge functionality
  const handleEnlarge = (imageUrl) => {
    if (onImageClick) {
      onImageClick(imageUrl);
    }
  };
  
  
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Image
        </h1>
      </div>

      <div
        className={`rounded-2xl p-3 w-[280px] min-h-[280px] relative transition-all duration-300 ${
          selected ? (hasError ? "ring-2 ring-red-500" : hasData ? "ring-2 ring-orange-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: hasError ? "#2d1b1b" : "#1a1a1a",
          border: hasError ? "1px solid #dc2626" : hasData ? "1px solid #444" : "1px solid #333",
          boxShadow: selected && hasError ? "0 0 20px rgba(220, 38, 38, 0.3)" : selected && hasData ? "0 0 20px rgba(249, 115, 22, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
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
          // Loading state - centered content
          <>
            <div className='w-full h-full flex items-center justify-center min-h-[240px]'>
              <div className='text-center'>
                <Camera size={24} className='text-gray-500 mx-auto mb-2' />
                <span className='text-gray-500 text-xs'>Generating image...</span>
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
                  {data.errorDescription || 'Failed to generate image. Please try again.'}
                </div>
                {data.canRetry !== false && (
                  <button
                    onClick={() => onRetry && onRetry(data.id, 'imageNode')}
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
            {/* Full Image Display */}
            <div className='relative w-full h-[240px]'>
              <img
                src={data.imageUrl || data.url}
                alt="Generated content"
                className='w-full h-full object-cover rounded-lg'
              />
              
              {/* Floating Action Toolbar */}
              <div className='absolute bottom-2 right-2'>
                <div
                  className='flex items-center space-x-1 px-2 py-1 rounded-lg'
                  style={{
                    background: '#18191C33',
                    backdropFilter: "blur(40px)",
                  }}
                >
                  {/* Download Icon */}
                  <Download
                    size={16}
                    className='cursor-pointer text-white/50 hover:text-white/80 transition-colors'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(data.imageUrl || data.url);
                    }}
                  />

                  {/* Enlarge Icon */}
                  <Maximize2
                    size={16}
                    className='cursor-pointer text-white/50 hover:text-white/80 transition-colors'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnlarge(data.imageUrl || data.url);
                    }}
                  />
                </div>
              </div>
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
                <Image size={16} className='text-gray-400' />
                <span className='text-xs'>Visual Creation</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Camera size={16} className='text-gray-400' />
                <span className='text-xs'>Photo Generation</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Images size={16} className='text-gray-400' />
                <span className='text-xs'>Art Creation</span>
              </div>

              <div className='flex items-center space-x-2 text-gray-300'>
                <Frame size={16} className='text-gray-400' />
                <span className='text-xs'>Design Elements</span>
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

export default NodeImage;
