import React, { useState, useRef, useEffect } from "react";
import ConceptSelection from "./ConceptSelection";
import ScriptSelection from "./ScriptSelection";
import MediaGeneration from "./MediaGeneration";
import TimelineButton from "./TimelineButton";
import VerboseAgentLoader from "./VerboseAgentLoader";

// Dynamic image generation component that always shows current state
const ImageGenerationComponent = ({ chatFlow, onImageClick, setPrompt }) => {
  const hasImages = Object.keys(chatFlow.generatedImages || {}).length > 0;
  const isGenerating = chatFlow.loading && chatFlow.currentStep === 4;

  // console.log("ImageGenerationComponent render:", {
  //   hasImages,
  //   isGenerating,
  //   currentStep: chatFlow.currentStep,
  //   generatedImagesCount: Object.keys(chatFlow.generatedImages || {}).length,
  //   loading: chatFlow.loading,
  // });

  return (
    <div>
      <div className='text-gray-100 text-sm mb-4'>
        {hasImages
          ? "🖼️ Generated Images:"
          : isGenerating
          ? "🎨 Generating Images..."
          : "🎨 Ready to generate images"}
      </div>
      <MediaGeneration
        type='image'
        generatedImages={chatFlow.generatedImages || {}}
        generationProgress={chatFlow.generationProgress}
        currentStep={chatFlow.currentStep}
        onImageClick={onImageClick}
        loading={isGenerating}
        onImagesGenerated={() => {
          if (setPrompt && hasImages && !isGenerating) {
            setPrompt("Start generating video");
            console.log("Setting prompt to generate video");
          }
        }}
      />
    </div>
  );
};

// Dynamic video generation component that always shows current state
const VideoGenerationComponent = ({
  chatFlow,
  combinedVideosMap,
  onVideoClick,
  onAddSingleVideo,
}) => {
  const hasVideos = Object.keys(combinedVideosMap || {}).length > 0;
  const isGeneratingVideos = chatFlow.loading && chatFlow.currentStep === 5;

  console.log('VideoGenerationComponent render:', { 
    hasVideos, 
    isGeneratingVideos, 
    currentStep: chatFlow.currentStep, 
    combinedVideosCount: Object.keys(combinedVideosMap || {}).length,
    loading: chatFlow.loading
  });

  return (
    <div>
      <div className='text-gray-100 text-sm mb-4'>
        {isGeneratingVideos
          ? "Processing..."
          : hasVideos
          ? "Generated Videos:"
          : "Ready to generate videos"}
      </div>
      <MediaGeneration
        type='video'
        generatedImages={chatFlow.generatedImages || {}}
        combinedVideosMap={combinedVideosMap || {}}
        generationProgress={chatFlow.generationProgress}
        currentStep={chatFlow.currentStep}
        onVideoClick={onVideoClick}
        onAddSingleVideo={onAddSingleVideo}
        loading={isGeneratingVideos}
      />
    </div>
  );
};

const ChatMessages = ({
  chatFlow,
  onImageClick,
  onVideoClick,
  onAddSingleVideo,
  sendVideosToTimeline,
  combinedVideosMap,
  currentPrompt = "",
  setPrompt, // Add this to control the input
}) => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only auto-scroll when new messages are added, not when existing ones are updated
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [lastVideoCount, setLastVideoCount] = useState(0);

  useEffect(() => {
    // Only scroll if we actually added new messages (not just updated existing ones)
    if (messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount]);

  // Auto-scroll when videos are added or updated
  useEffect(() => {
    const currentVideoCount = Object.keys(combinedVideosMap || {}).length;
    if (currentVideoCount > lastVideoCount) {
      console.log(`🎬 New videos detected (${currentVideoCount} vs ${lastVideoCount}), scrolling to bottom`);
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure content is rendered
      setLastVideoCount(currentVideoCount);
    }
  }, [combinedVideosMap, lastVideoCount]);

  // Listen for custom scroll events (from video completion, etc.)
  useEffect(() => {
    const handleScrollToBottom = (event) => {
      console.log('🔽 Received scroll to bottom event:', event.detail);
      setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure content is rendered
    };

    window.addEventListener('scrollChatToBottom', handleScrollToBottom);
    
    return () => {
      window.removeEventListener('scrollChatToBottom', handleScrollToBottom);
    };
  }, []);

  // Build messages in proper order based on chat flow state and real timestamps
  useEffect(() => {
    const orderedMessages = [];

    // Step 1: Add all real user/system messages from allUserMessages (with real timestamps)
    if (chatFlow.allUserMessages && chatFlow.allUserMessages.length > 0) {
      chatFlow.allUserMessages.forEach(msg => {
        orderedMessages.push({
          id: msg.id,
          type: msg.type || "system",
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
        });
      });
    }

    // Step 2: Add component-based messages with contextual timestamps based on related system messages
    
    // Find concept-related message timestamp
    const conceptMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('generated') && msg.content.includes('concepts')
    );
    
    // Add concept selection component
    if (chatFlow.concepts && chatFlow.concepts.length > 0) {
      const conceptTimestamp = conceptMessage ? conceptMessage.timestamp + 50 : Date.now();
      orderedMessages.push({
        id: "concept-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-gray-100 text-sm mb-4'>
              {chatFlow.selectedConcept
                ? `✅ Selected Concept: "${chatFlow.selectedConcept.title}"`
                : "I've generated 4 video concepts for you! Please choose one to develop:"}
            </div>
            <ConceptSelection
              concepts={chatFlow.concepts}
              currentStep={chatFlow.currentStep}
              onConceptSelect={(concept) => {
                chatFlow.handleConceptSelect(concept, false, currentPrompt);
                if (setPrompt) {
                  setPrompt(`Generate script for ${concept.title}`);
                }
              }}
              selectedConcept={chatFlow.selectedConcept}
              showAsCards={true}
            />
          </div>
        ),
        timestamp: conceptTimestamp,
      });
    }

    // Find script-related message timestamp
    const scriptMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('script segments') || msg.content.includes('create script')
    );

    // Add script selection component
    if (chatFlow.selectedConcept && (chatFlow.scripts || chatFlow.selectedScript)) {
      const scriptTimestamp = scriptMessage ? scriptMessage.timestamp + 50 : 
                              (conceptMessage ? conceptMessage.timestamp + 1000 : Date.now());
      orderedMessages.push({
        id: "script-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-gray-100 text-sm mb-4'>
              {chatFlow.selectedScript
                ? "✅ Script Generated Successfully"
                : "I've created script segments for your concept! Please choose the version you prefer:"}
            </div>
            <ScriptSelection
              scripts={chatFlow.scripts}
              currentStep={chatFlow.currentStep}
              onScriptSelect={(script) => {
                chatFlow.handleScriptSelect(script, false);
                if (setPrompt) {
                  setPrompt(`Start generating images`);
                }
              }}
              selectedScript={chatFlow.selectedScript}
              showAsCollapsible={true}
              isProjectScript={!chatFlow.scripts && !!chatFlow.selectedScript}
            />
          </div>
        ),
        timestamp: scriptTimestamp,
      });
    }

    // Find image-related message timestamp
    const imageMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('generated') && msg.content.includes('images')
    );

    // Add image generation component
    if (chatFlow.selectedScript && chatFlow.currentStep >= 4) {
      const imageTimestamp = imageMessage ? imageMessage.timestamp + 50 : 
                             (scriptMessage ? scriptMessage.timestamp + 1000 : 
                              (conceptMessage ? conceptMessage.timestamp + 2000 : Date.now()));
      orderedMessages.push({
        id: "image-generation",
        type: "system",
        content: "",
        component: (
          <ImageGenerationComponent 
            chatFlow={chatFlow}
            onImageClick={onImageClick}
            setPrompt={setPrompt}
          />
        ),
        timestamp: imageTimestamp,
      });
    }

    // Find video-related message timestamp
    const videoMessage = chatFlow.allUserMessages?.find(msg => 
      msg.content.includes('generated') && msg.content.includes('videos')
    );

    // Add video generation component
    if (Object.keys(chatFlow.generatedImages || {}).length > 0 && chatFlow.currentStep >= 5) {
      const videoTimestamp = videoMessage ? videoMessage.timestamp + 50 : 
                             (imageMessage ? imageMessage.timestamp + 1000 : 
                              (scriptMessage ? scriptMessage.timestamp + 2000 : 
                               (conceptMessage ? conceptMessage.timestamp + 3000 : Date.now())));
      orderedMessages.push({
        id: "video-generation",
        type: "system",
        content: "",
        component: (
          <VideoGenerationComponent
            chatFlow={chatFlow}
            combinedVideosMap={combinedVideosMap}
            onVideoClick={onVideoClick}
            onAddSingleVideo={onAddSingleVideo}
          />
        ),
        timestamp: videoTimestamp,
      });
    }

    // Add timeline integration component
    const canSendTimeline =
      Object.keys(chatFlow.generatedVideos || {}).length > 0 ||
      Object.keys(chatFlow.storedVideosMap || {}).length > 0 ||
      Object.keys(combinedVideosMap || {}).length > 0;

    if (canSendTimeline) {
      const timelineTimestamp = videoMessage ? videoMessage.timestamp + 50 : 
                               (imageMessage ? imageMessage.timestamp + 1000 : 
                                (scriptMessage ? scriptMessage.timestamp + 2000 : 
                                 (conceptMessage ? conceptMessage.timestamp + 4000 : Date.now())));
      orderedMessages.push({
        id: "timeline-integration",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-gray-100 text-sm mb-4'>
              🎬 Your videos are ready!
            </div>
            <TimelineButton
              canSendTimeline={canSendTimeline}
              addingTimeline={chatFlow.addingTimeline}
              onSendToTimeline={sendVideosToTimeline}
              inConversation={true}
            />
          </div>
        ),
        timestamp: timelineTimestamp,
      });
    }

    // Sort all messages by timestamp to ensure chronological order
    const sortedMessages = orderedMessages.sort((a, b) => a.timestamp - b.timestamp);
    
    // Only update if there are actual changes
    setMessages(sortedMessages);
    
    // 🎯 AUTO-SCROLL: If we have new video content, scroll to bottom
    const hasVideos = Object.keys(combinedVideosMap || {}).length > 0;
    if (hasVideos && sortedMessages.some(msg => msg.id === "video-generation" || msg.id === "timeline-integration")) {
      setTimeout(() => {
        scrollToBottom();
      }, 200); // Delay to ensure video components are rendered
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chatFlow.allUserMessages, // Now using real messages with timestamps
    chatFlow.concepts,
    chatFlow.selectedConcept,
    chatFlow.scripts,
    chatFlow.selectedScript,
    chatFlow.currentStep,
    chatFlow.generatedImages,
    chatFlow.generatedVideos,
    chatFlow.storedVideosMap,
    chatFlow.addingTimeline,
    combinedVideosMap,
    currentPrompt,
    setPrompt,
    onImageClick,
    onVideoClick,
    onAddSingleVideo,
    sendVideosToTimeline,
  ]);

  return (
    <div className='flex-1 overflow-y-auto p-3 space-y-3'>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.type === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`${
              message.id === "concept-request" ||
              message.id === "script-request" ||
              message.id === "image-generation" ||
              message.id === "video-generation" ||
              message.id === "timeline-integration"
                ? "w-full p-0" // Full width and no padding/background for component messages
                : `max-w-[80%] p-2.5 text-gray-100 rounded-lg bg-gray-900/50 backdrop-blur-sm `
            }`}
          >
            {message.content && (
              <div className='text-sm'>{message.content}</div>
            )}
            {message.component && (
              <div>
                {message.component}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Simple Loading indicator - only show when NOT streaming */}
      {chatFlow.loading && !chatFlow.isStreaming && (
        <div className='flex justify-start'>
          <div className='text-gray-100 rounded-lg p-2.5 bg-gray-900/50 backdrop-blur-sm border border-white/10'>
            <div className='flex items-center space-x-2'>
              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400'></div>
              <div className='flex flex-col'>
                <span className='text-xs text-gray-100'>
                  {chatFlow.agentActivity || 'Processing...'}
                </span>
                {chatFlow.streamingProgress && (
                  <span className='text-xs text-gray-400 mt-1'>
                    {chatFlow.streamingProgress.step && `Step: ${chatFlow.streamingProgress.step}`}
                    {chatFlow.streamingProgress.progress && ` (${chatFlow.streamingProgress.progress})`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}






      {/* Credit Deduction Notification */}
      {chatFlow.creditDeductionMessage && (
        <div className='flex justify-start'>
          <div className='text-green-100 rounded-lg p-2.5 max-w-[80%] bg-green-500/10 backdrop-blur-sm border border-green-500/30'>
            <div className='flex items-center gap-2 text-xs'>
              <span>💰</span>
              <span>{chatFlow.creditDeductionMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {chatFlow.error && (
        <div className='flex justify-start'>
          <div className='text-gray-100 rounded-lg p-2.5 max-w-[80%] bg-gray-900/50 backdrop-blur-sm'>
            <div className='text-xs'>❌ {chatFlow.error}</div>
            <button
              onClick={() => chatFlow.setError(null)}
              className='mt-1 text-xs text-gray-300 hover:text-gray-100 underline'
            >
              Dismiss
            </button>
          </div>
        </div>
      )}



      {/* Agent Status and Approvals */}
      {(chatFlow.isStreaming || (chatFlow.pendingApprovals && chatFlow.pendingApprovals.length > 0)) && (
        <div className='flex justify-start'>
          <div className='max-w-[80%] p-2.5 text-gray-100 rounded-lg bg-gray-900/50 backdrop-blur-sm '>
            {/* Enhanced Agent Working Indicator - Primary loader during streaming */}
            {chatFlow.isStreaming && (
              <VerboseAgentLoader 
                agentActivity={chatFlow.agentActivity}
                streamingProgress={chatFlow.streamingProgress}
                streamMessages={chatFlow.streamMessages}
              />
            )}

            {/* Manual Approval Requests */}
            {chatFlow.pendingApprovals && chatFlow.pendingApprovals.map((approval) => (
              <div key={approval.id} className='mb-3 last:mb-0'>
                <div className='text-gray-100 font-medium mb-2 flex items-center gap-2'>
                  <span>Approval Required</span>
                </div>
                
                <div className='text-gray-300 text-sm mb-3'>
                  {approval.toolName === 'get_web_info' && (
                    <div>
                      <div className='mb-1'><strong>Web Research Request</strong></div>
                      <div>I need permission to research web information for your prompt. This will help me understand current trends, gather relevant data, and provide more accurate and up-to-date concepts.</div>
                    </div>
                  )}
                  {approval.toolName === 'generate_concepts_with_approval' && (
                    <div>
                      <div className='mb-1'><strong>Concept Generation Ready</strong></div>
                      <div>I'm ready to generate 4 unique content concepts based on the research. Each concept will include a title, description, and creative direction tailored to your request.</div>
                    </div>
                  )}
                  {approval.toolName === 'generate_segmentation' && (
                    <div>
                      <div className='mb-1'><strong>Script Creation Ready</strong></div>
                      <div>I can now create detailed script segmentation for the selected concept. This will break down your content into scenes with visual descriptions, narration, and animation prompts.</div>
                    </div>
                  )}
                  {approval.toolName === 'generate_image_with_approval' && (
                    <div>
                      <div className='mb-1'><strong>Image Generation Ready</strong></div>
                      <div>I'm ready to generate high-quality images for each script segment. This will create visual assets that match your chosen art style and bring your script to life.</div>
                    </div>
                  )}
                  {approval.toolName === 'generate_video_with_approval' && (
                    <div>
                      <div className='mb-1'><strong>Video Generation Ready</strong></div>
                      <div>I'm ready to create dynamic videos from your generated images. This will add motion and animation to transform static images into engaging video content.</div>
                    </div>
                  )}
                </div>
                
                <div className='flex gap-2'>
                  <button
                    onClick={() => chatFlow.approveToolExecution(approval.id)}
                    className='bg-gray-600 hover:bg-gray-700 text-gray-100 px-3 py-1.5 rounded text-sm transition-colors font-medium'
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => chatFlow.rejectToolExecution(approval.id)}
                    className='bg-gray-800 hover:bg-gray-900 text-gray-100 px-3 py-1.5 rounded text-sm transition-colors font-medium'
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
