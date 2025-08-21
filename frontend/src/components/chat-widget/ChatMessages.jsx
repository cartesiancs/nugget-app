import React, { useState, useRef, useEffect } from "react";
import ConceptSelection from "./ConceptSelection";
import ScriptSelection from "./ScriptSelection";
import MediaGeneration from "./MediaGeneration";
import TimelineButton from "./TimelineButton";

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
          ? "🎬 Processing..."
          : hasVideos
          ? "🎥 Generated Videos:"
          : "🎥 Ready to generate videos"}
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

  useEffect(() => {
    // Only scroll if we actually added new messages (not just updated existing ones)
    if (messages.length > lastMessageCount) {
      scrollToBottom();
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount]);

  // Build messages in proper order based on chat flow state
  useEffect(() => {
    const orderedMessages = [];

    // Step 1: Add initial user prompt if we have concepts (meaning the flow started)
    if (chatFlow.currentUserMessage && chatFlow.concepts?.length > 0) {
      orderedMessages.push({
        id: `user-message-${chatFlow.messageCounter}`,
        type: "user",
        content: chatFlow.currentUserMessage,
        timestamp: Date.now() - 4000, // Older timestamp to show first
      });
    }

    // Step 1.5: Add key streaming messages in proper order
    if (chatFlow.streamMessages && chatFlow.streamMessages.length > 0) {
      // Only show important completion messages, not all stream messages
      const importantMessages = chatFlow.streamMessages.filter(streamMsg => 
        streamMsg.type === 'result' && 
        streamMsg.data?.message && 
        (streamMsg.data.message.includes('completed') || 
         streamMsg.data.message.includes('generated') ||
         streamMsg.data.message.includes('success'))
      );
      
      importantMessages.forEach((streamMsg, index) => {
        orderedMessages.push({
          id: `stream-${index}-${streamMsg.timestamp}`,
          type: "system",
          content: `${streamMsg.data.message}`,
          timestamp: new Date(streamMsg.timestamp).getTime() - 3500 + index,
        });
      });
    }

    // Step 2: Add concept selection after user prompt
    if (chatFlow.concepts && chatFlow.concepts.length > 0) {
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
        timestamp: Date.now() - 3000,
      });
    }

    // Step 3: Add script generation message after concept is selected
    if (chatFlow.selectedConcept && (chatFlow.scripts || chatFlow.selectedScript)) {
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
        timestamp: Date.now() - 2000,
      });
    }

    // Step 4: Add image generation section after script is selected
    if (chatFlow.selectedScript && chatFlow.currentStep >= 4) {
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
        timestamp: Date.now() - 1000,
      });
    }

    // Step 5: Add video generation section after images are generated
    if (Object.keys(chatFlow.generatedImages || {}).length > 0 && chatFlow.currentStep >= 5) {
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
        timestamp: Date.now(),
      });
    }

    // Step 6: Add timeline integration when videos are ready
    const canSendTimeline =
      Object.keys(chatFlow.generatedVideos || {}).length > 0 ||
      Object.keys(chatFlow.storedVideosMap || {}).length > 0 ||
      Object.keys(combinedVideosMap || {}).length > 0;

    if (canSendTimeline) {
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
        timestamp: Date.now() + 1000,
      });
    }

    // Only update if there are actual changes
    setMessages(orderedMessages);
  }, [
    chatFlow.currentUserMessage,
    chatFlow.messageCounter,
    chatFlow.concepts,
    chatFlow.selectedConcept,
    chatFlow.scripts,
    chatFlow.selectedScript,
    chatFlow.currentStep,
    chatFlow.generatedImages,
    chatFlow.generatedVideos,
    chatFlow.storedVideosMap,
    chatFlow.addingTimeline,
    chatFlow.streamMessages,
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
                : `max-w-[80%] p-2.5 text-gray-100 rounded-lg`
            }`}
            style={
              message.id !== "concept-request" &&
              message.id !== "script-request" &&
              message.id !== "image-generation" &&
              message.id !== "video-generation" &&
              message.id !== "timeline-integration"
                ? {
                    background: "#18191C80",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }
                : {}
            }
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

      {/* Loading indicator */}
      {chatFlow.loading && (
        <div className='flex justify-start'>
          <div
            className='text-gray-100 rounded-lg p-2.5'
            style={{
              background: "#18191C80",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className='flex items-center space-x-2'>
              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400'></div>
              <span className='text-xs text-gray-100'>
                {chatFlow.isStreaming ? 'Agent is working...' : 'Processing...'}
              </span>
            </div>
          </div>
        </div>
      )}






      {/* Error message */}
      {chatFlow.error && (
        <div className='flex justify-start'>
          <div
            className='text-gray-100 rounded-lg p-2.5 max-w-[80%]'
            style={{
              background: "#18191C80",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
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
          <div 
            className='max-w-[80%] p-2.5 text-gray-100 rounded-lg'
            style={{
              background: "#18191C80",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Agent Working Indicator */}
            {chatFlow.isStreaming && (
              <div className='flex items-center gap-2 mb-3'>
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.1s'}}></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className='text-gray-100'>Agent is working...</span>
              </div>
            )}

            {/* Manual Approval Requests */}
            {chatFlow.pendingApprovals && chatFlow.pendingApprovals.map((approval) => (
              <div key={approval.id} className='mb-3 last:mb-0'>
                <div className='text-gray-100 font-medium mb-2 flex items-center gap-2'>
                  <span>⏳</span>
                  <span>Approval Required</span>
                </div>
                
                <div className='text-gray-300 text-sm mb-3'>
                  {approval.toolName === 'get_web_info' && (
                    <>🔍 I need permission to research web information for your prompt</>
                  )}
                  {approval.toolName === 'generate_concepts_with_approval' && (
                    <>💡 I'm ready to generate 4 content concepts based on the research</>
                  )}
                  {approval.toolName === 'generate_segmentation' && (
                    <>📜 I can now create script segmentation for the selected concept</>
                  )}
                  {approval.toolName === 'generate_image_with_approval' && (
                    <>🖼️ I'm ready to generate images for each script segment</>
                  )}
                </div>
                
                <div className='flex gap-2'>
                  <button
                    onClick={() => chatFlow.approveToolExecution(approval.id)}
                    className='bg-gray-600 hover:bg-gray-700 text-gray-100 px-3 py-1.5 rounded text-sm transition-colors font-medium'
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => chatFlow.rejectToolExecution(approval.id)}
                    className='bg-gray-800 hover:bg-gray-900 text-gray-100 px-3 py-1.5 rounded text-sm transition-colors font-medium'
                  >
                    ❌ Reject
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
