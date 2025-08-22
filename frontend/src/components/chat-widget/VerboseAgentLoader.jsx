import React, { useState } from "react";

const VerboseAgentLoader = ({ agentActivity, streamingProgress, streamMessages }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Function to get current step display name
  const getCurrentStepName = () => {
    if (!agentActivity) return "Agent Processing";
    
    const activity = agentActivity.toLowerCase();
    
    if (activity.includes('researching') || activity.includes('web information')) {
      return "🔍 Web Research Running";
    }
    if (activity.includes('concept') || activity.includes('generating creative concepts')) {
      return "💡 Concept Generation Running";
    }
    if (activity.includes('script') || activity.includes('segmentation')) {
      return "📜 Script Generation Running";
    }
    if (activity.includes('image') || activity.includes('generating images')) {
      return "🎨 Image Generation Running";
    }
    if (activity.includes('video') || activity.includes('creating videos')) {
      return "🎬 Video Generation Running";
    }
    if (activity.includes('approval') || activity.includes('waiting')) {
      return "⏳ Waiting for Approval";
    }
    
    return "🤖 Agent Processing";
  };

  // Function to get verbose step-by-step details for dropdown
  const getVerboseStepDetails = () => {
    if (!agentActivity) return [];
    
    const activity = agentActivity.toLowerCase();
    
    if (activity.includes('researching') || activity.includes('web information')) {
      return [
        "🌐 Analyzing your prompt for key topics and themes",
        "🔍 Searching web sources for relevant information",
        "📊 Processing and filtering search results",
        "💡 Extracting insights for concept development",
        "✅ Compiling research data for next step"
      ];
    }
    
    if (activity.includes('concept') || activity.includes('generating creative concepts')) {
      return [
        "🧠 Analyzing research data and user prompt",
        "💭 Brainstorming multiple creative angles",
        "🎯 Defining tone and style for each concept",
        "📝 Writing detailed concept descriptions",
        "🎨 Crafting compelling titles and goals",
        "✅ Finalizing 4 unique video concepts"
      ];
    }
    
    if (activity.includes('script') || activity.includes('segmentation')) {
      return [
        "📋 Breaking down concept into story structure",
        "🎬 Creating narrative flow and pacing",
        "🖼️ Writing visual descriptions for each segment",
        "🎙️ Crafting narration and dialogue",
        "⚡ Adding animation and transition details",
        "🎨 Defining art style and visual consistency",
        "⏱️ Optimizing timing and segment duration",
        "✅ Finalizing complete script with all segments"
      ];
    }
    
    if (activity.includes('image') || activity.includes('generating images')) {
      return [
        "🎨 Preparing visual prompts for each segment",
        "🖼️ Generating base images with AI models",
        "🎯 Applying art style consistency",
        "🔄 Processing and optimizing image quality",
        "☁️ Uploading images to cloud storage",
        "✅ Linking images to script segments"
      ];
    }
    
    if (activity.includes('video') || activity.includes('creating videos')) {
      return [
        "🎬 Loading base images for animation",
        "⚡ Applying motion and animation effects",
        "🎵 Synchronizing with timing requirements",
        "🔄 Processing video generation requests",
        "📹 Rendering final video segments",
        "☁️ Uploading videos to cloud storage",
        "✅ Preparing videos for timeline integration"
      ];
    }
    
    return ["🤖 Processing your request..."];
  };

  // Function to get step description
  const getStepDescription = () => {
    if (!agentActivity) return "Processing your request...";
    
    const activity = agentActivity.toLowerCase();
    
    if (activity.includes('researching') || activity.includes('web information')) {
      return "Gathering relevant information from web sources to inform content creation";
    }
    if (activity.includes('concept') || activity.includes('generating creative concepts')) {
      return "Creating multiple video concept options based on your prompt and research";
    }
    if (activity.includes('script') || activity.includes('segmentation')) {
      return "Breaking down your concept into detailed script segments with visuals and narration";
    }
    if (activity.includes('image') || activity.includes('generating images')) {
      return "Creating visual content for each script segment using AI image generation";
    }
    if (activity.includes('video') || activity.includes('creating videos')) {
      return "Converting images into dynamic video content with animations";
    }
    if (activity.includes('approval') || activity.includes('waiting')) {
      return "Ready to proceed - waiting for your confirmation to continue";
    }
    
    return agentActivity;
  };

  return (
    <div className='mb-3'>
      {/* Main Step Display */}
      <div className='flex items-center gap-2 mb-2'>
        <div className='flex space-x-1'>
          <div className='w-2 h-2 bg-blue-400 rounded-full animate-bounce'></div>
          <div className='w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]'></div>
          <div className='w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]'></div>
        </div>
        <span className='text-gray-100 font-medium'>{getCurrentStepName()}</span>
      </div>

      {/* Step Description */}
      <div className='text-gray-300 text-sm mb-3'>
        {getStepDescription()}
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

      {/* Expandable Detailed Information */}
      <div className='border-t border-gray-700 pt-2'>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className='flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors mb-2'
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
            {showDetails ? 'Hide' : 'Show'} detailed process 
            {streamMessages && streamMessages.length > 0 && ` (${streamMessages.length} events)`}
          </span>
        </button>

        {showDetails && (
          <div className='bg-gray-800/50 rounded p-3 max-h-48 overflow-y-auto text-xs space-y-3'>
            {/* Verbose Step-by-Step Process */}
            <div>
              <div className='text-cyan-300 font-medium mb-2 flex items-center gap-1'>
                <span>⚙️</span>
                <span>Current Process Steps:</span>
              </div>
              <div className='space-y-1 ml-4'>
                {getVerboseStepDetails().map((step, index) => (
                  <div key={index} className='text-gray-300 flex items-start gap-2'>
                    <span className='text-gray-500 text-xs mt-0.5'>{index + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stream Messages if available */}
            {streamMessages && streamMessages.length > 0 && (
              <div className='border-t border-gray-700 pt-2'>
                <div className='text-blue-300 font-medium mb-2 flex items-center gap-1'>
                  <span>📡</span>
                  <span>Real-time Events:</span>
                </div>
                <div className='space-y-1 ml-4'>
                  {streamMessages.slice(-8).map((msg, index) => (
                    <div key={index} className='text-gray-400 text-xs'>
                      <span className='text-gray-500 mr-2'>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <span className='text-blue-300 mr-2 px-1 bg-blue-900/30 rounded'>[{msg.type}]</span>
                      <span>
                        {typeof msg.data === 'string' 
                          ? msg.data 
                          : msg.data?.message || JSON.stringify(msg.data).substring(0, 80) + '...'
                        }
                      </span>
                    </div>
                  ))}
                </div>
                {streamMessages.length > 8 && (
                  <div className='text-gray-500 text-center mt-2 pt-1 border-t border-gray-700'>
                    ... showing last 8 of {streamMessages.length} events
                  </div>
                )}
              </div>
            )}

            {/* Additional Context */}
            <div className='border-t border-gray-700 pt-2'>
              <div className='text-green-300 font-medium mb-1 flex items-center gap-1'>
                <span>💡</span>
                <span>What's happening:</span>
              </div>
              <div className='text-gray-300 text-xs ml-4'>
                {getStepDescription()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerboseAgentLoader;
