import React, { useState, useEffect } from "react";

const VerboseAgentLoader = ({ agentActivity, streamingProgress, streamMessages }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);



  // Get different messages for each activity type
  const getMessagesForActivity = (activity) => {
    if (activity.includes('researching') || activity.includes('web information')) {
      return [
        "Researching web content for your video...",
        "Analyzing trending topics and insights...",
        "Gathering relevant information from sources...",
        "Exploring creative angles and ideas...",
        "Compiling research data for concepts..."
      ];
    }
    if (activity.includes('concept') || activity.includes('generating creative concepts')) {
      return [
        "Creating video concepts...",
        "Brainstorming creative ideas...",
        "Developing unique storylines...",
        "Crafting compelling narratives...",
        "Finalizing concept variations..."
      ];
    }
    if (activity.includes('script') || activity.includes('segmentation')) {
      return [
        "Writing script segments...",
        "Structuring the narrative flow...",
        "Creating visual descriptions...",
        "Crafting engaging dialogue...",
        "Optimizing segment timing..."
      ];
    }
    if (activity.includes('image') || activity.includes('generating images')) {
      return [
        "Generating images...",
        "Creating visual artwork...",
        "Applying artistic styles...",
        "Rendering high-quality visuals...",
        "Processing image variations..."
      ];
    }
    if (activity.includes('video') || activity.includes('creating videos')) {
      return [
        "Creating videos...",
        "Adding motion and animation...",
        "Rendering video sequences...",
        "Processing dynamic content...",
        "Finalizing video segments..."
      ];
    }
    if (activity.includes('approval') || activity.includes('waiting')) {
      return [
        "Ready for your approval",
        "Waiting for your confirmation...",
        "Standing by for next steps..."
      ];
    }
    if (activity.includes('processing results')) {
      return [
        "Processing results...",
        "Organizing generated content...",
        "Preparing final output..."
      ];
    }
    
    return [
      "Working on your request...",
      "Processing your requirements...", 
      "Analyzing your prompt...",
      "Preparing creative content...",
      "Thinking through possibilities...",
      "Crafting your vision..."
    ];
  };

  // Typing animation effect
  useEffect(() => {
    // Get messages for current activity
    const activity = agentActivity?.toLowerCase() || "";
    const messages = getMessagesForActivity(activity);
    const currentMessage = messages[currentMessageIndex % messages.length];

    const typingSpeed = 50; // milliseconds per character
    
    if (typingIndex < currentMessage.length) {
      const timer = setTimeout(() => {
        setTypingText(currentMessage.substring(0, typingIndex + 1));
        setTypingIndex(typingIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    } else {
      // After completing a message, pause then cycle to next message
      const resetTimer = setTimeout(() => {
        setTypingIndex(0);
        setTypingText("");
        setCurrentMessageIndex(prev => prev + 1);
      }, 2000); // 2 second pause before next message
      
      return () => clearTimeout(resetTimer);
    }
  }, [typingIndex, currentMessageIndex, agentActivity]);

  // Reset typing when activity changes
  useEffect(() => {
    setTypingIndex(0);
    setTypingText("");
    setCurrentMessageIndex(0); // Reset to first message for new activity
  }, [agentActivity]);



  return (
    <div className='mb-3'>
      {/* Clean Typing Animation Display */}
      <div className='flex items-center gap-3 mb-3'>
        <div className='flex space-x-1'>
          <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse'></div>
          <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]'></div>
          <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.4s]'></div>
        </div>
        <div className='flex-1'>
          <div className='text-gray-100 text-sm font-medium'>
            {typingText}
            <span className='animate-pulse'>|</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {streamingProgress && streamingProgress.total && streamingProgress.current !== undefined && (
        <div className='mb-3'>
          <div className='flex items-center gap-2 mb-1'>
            <span className='text-xs text-gray-400'>Progress:</span>
            <span className='text-xs text-gray-300'>
              {streamingProgress.current}/{streamingProgress.total}
            </span>
            {streamingProgress.status && (
              <span className='text-xs text-blue-400'>({streamingProgress.status})</span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex-1 bg-gray-700 rounded-full h-1'>
              <div 
                className='bg-blue-400 h-1 rounded-full transition-all duration-300' 
                style={{
                  width: `${(streamingProgress.current / streamingProgress.total) * 100}%`
                }}
              ></div>
            </div>
            <span className='text-xs text-gray-400'>
              {Math.round((streamingProgress.current / streamingProgress.total) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Optional Details (Hidden by Default) */}
      {streamMessages && streamMessages.length > 0 && (
        <div className='border-t border-gray-700 pt-2'>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className='flex items-center gap-2 text-xs text-gray-500 hover:text-gray-400 transition-colors'
          >
            <svg 
              className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>
              {showDetails ? 'Hide' : 'Show'} technical details
            </span>
          </button>

          {showDetails && (
            <div className='bg-gray-800/30 rounded p-2 mt-2 max-h-32 overflow-y-auto'>
              <div className='text-xs text-gray-500 space-y-1'>
                {streamMessages.slice(-5).map((msg, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <span className='text-blue-400 text-xs'>•</span>
                    <span>
                      {typeof msg.data === 'string' 
                        ? msg.data 
                        : msg.data?.message || 'Processing...'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerboseAgentLoader;
