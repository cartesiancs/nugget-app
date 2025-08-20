import React, { useState, useRef, useEffect } from "react";
import ConceptSelection from "./ConceptSelection";
import ScriptSelection from "./ScriptSelection";
import MediaGeneration from "./MediaGeneration";
import TimelineButton from "./TimelineButton";

// Dynamic image generation component that always shows current state
const ImageGenerationComponent = ({ chatFlow, onImageClick, setPrompt }) => {
  const hasImages = Object.keys(chatFlow.generatedImages || {}).length > 0;
  const isGenerating = chatFlow.loading && chatFlow.currentStep === 4;

  console.log("ImageGenerationComponent render:", {
    hasImages,
    isGenerating,
    currentStep: chatFlow.currentStep,
    generatedImagesCount: Object.keys(chatFlow.generatedImages || {}).length,
    loading: chatFlow.loading,
  });

  return (
    <div>
      <div className='text-white font-bold text-base mb-4'>
        {hasImages
          ? "Generated Images:"
          : isGenerating
          ? "Generating Images..."
          : "Ready to generate images"}
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
      <div className='text-white font-bold text-base mb-4'>
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
  timeline,
  onImageClick,
  onVideoClick,
  onAddSingleVideo,
  sendVideosToTimeline,
  combinedVideosMap,
  autoProgression = false,
  currentPrompt = "",
  setPrompt, // Add this to control the input
  onSendMessage, // Add this to handle message sending
}) => {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [processedSteps, setProcessedSteps] = useState(new Set());

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

  // Initialize messages when component mounts
  useEffect(() => {
    if (
      currentPrompt &&
      chatFlow.concepts &&
      chatFlow.concepts.length > 0 &&
      messages.length === 0
    ) {
      setMessages([
        {
          id: "initial-prompt",
          type: "user",
          content: currentPrompt,
          timestamp: Date.now() - 1000,
        },
      ]);
    }
  }, [currentPrompt, chatFlow.concepts, messages.length]);

  // Remove the force re-render that was causing issues

  // Add new messages based on chat flow changes
  useEffect(() => {
    const newMessages = [];
    let hasChanges = false;

    // Debug logging
    console.log("ChatMessages useEffect triggered:", {
      concepts: chatFlow.concepts?.length,
      selectedConcept: chatFlow.selectedConcept,
      scripts: chatFlow.scripts?.length,
      selectedScript: chatFlow.selectedScript,
      generatedImages: Object.keys(chatFlow.generatedImages || {}).length,
      generatedVideos: Object.keys(chatFlow.generatedVideos || {}).length,
      combinedVideosMap: Object.keys(combinedVideosMap || {}).length,
      currentStep: chatFlow.currentStep,
      loading: chatFlow.loading,
    });

    // Add current user message when it's new
    if (
      chatFlow.currentUserMessage &&
      !processedSteps.has(`user-${chatFlow.messageCounter}`)
    ) {
      newMessages.push({
        id: `user-message-${chatFlow.messageCounter}`,
        type: "user",
        content: chatFlow.currentUserMessage,
        timestamp: Date.now(),
      });
      setProcessedSteps(
        (prev) => new Set([...prev, `user-${chatFlow.messageCounter}`]),
      );
      hasChanges = true;
    }

    // Add concept selection if not already processed
    if (
      chatFlow.concepts &&
      chatFlow.concepts.length > 0 &&
      !processedSteps.has("concepts")
    ) {
      newMessages.push({
        id: "concept-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-white font-bold text-base mb-4'>
              {chatFlow.selectedConcept
                ? "Selected Concept:"
                : "Please choose a concept to get started."}
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
        timestamp: Date.now(),
      });
      setProcessedSteps((prev) => new Set([...prev, "concepts"]));
      hasChanges = true;
    }

    if (
      (chatFlow.scripts || chatFlow.selectedScript) &&
      !processedSteps.has("scripts")
    ) {
      newMessages.push({
        id: "script-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className='text-white font-bold text-base mb-4'>
              {chatFlow.selectedScript
                ? "Project Script:"
                : "Generated Scripts - Please choose one:"}
            </div>
            <ScriptSelection
              scripts={chatFlow.scripts}
              currentStep={chatFlow.currentStep}
              onScriptSelect={(script) => {
                chatFlow.handleScriptSelect(script, false);
                if (setPrompt) {
                  setPrompt(`Start generating image`);
                }
              }}
              selectedScript={chatFlow.selectedScript}
              showAsCollapsible={true}
              isProjectScript={!chatFlow.scripts && !!chatFlow.selectedScript}
            />
          </div>
        ),
        timestamp: Date.now(),
      });
      setProcessedSteps((prev) => new Set([...prev, "scripts"]));
      hasChanges = true;
    }

    if (hasChanges) {
      setMessages((prevMessages) => [...prevMessages, ...newMessages]);
    }
  }, [
    chatFlow.concepts,
    chatFlow.selectedConcept,
    chatFlow.scripts,
    chatFlow.selectedScript,
    chatFlow.generatedImages,
    chatFlow.generatedVideos,
    chatFlow.storedVideosMap,
    chatFlow.currentStep,
    chatFlow.loading,
    chatFlow.generationProgress,
    chatFlow.currentUserMessage,
    chatFlow.messageCounter,
    combinedVideosMap,
    processedSteps,
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
              message.id === "project-script-info"
                ? "w-full p-0" // Full width and no padding/background for media messages
                : `max-w-[80%] p-2.5 ${
                    message.type === "user"
                      ? "text-white rounded-lg"
                      : "text-gray-100 rounded-lg"
                  }`
            }`}
            style={
              message.id !== "concept-request" &&
              message.id !== "script-request" &&
              message.id !== "project-script-info"
                ? {
                    background:
                      message.type === "user" ? "#18191C80" : "#18191C80",
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
              <div
                className={
                  message.id === "concept-request" ||
                  message.id === "script-request" ||
                  message.id === "project-script-info"
                    ? ""
                    : "mt-3"
                }
              >
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
              <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400'></div>
              <span className='text-xs'>Processing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Image Generation - Always shows current state */}
      {chatFlow.currentStep >= 4 && chatFlow.selectedScript && (
        <div className="flex justify-start">
          <div className="w-full p-0">
            <ImageGenerationComponent 
              chatFlow={chatFlow}
              onImageClick={onImageClick}
              setPrompt={setPrompt}
            />
          </div>
        </div>
      )}

      {/* Dynamic Video Generation - Always shows current state */}
      {Object.keys(chatFlow.generatedImages || {}).length > 0 && chatFlow.currentStep >= 5 && (
        <div className="flex justify-start">
          <div className="w-full p-0">
            <VideoGenerationComponent
              chatFlow={chatFlow}
              combinedVideosMap={combinedVideosMap}
              onVideoClick={onVideoClick}
              onAddSingleVideo={onAddSingleVideo}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {chatFlow.error && (
        <div className='flex justify-start'>
          <div
            className='text-white rounded-lg p-2.5 max-w-[80%]'
            style={{
              background:
                "linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className='text-xs'>{chatFlow.error}</div>
            <button
              onClick={() => chatFlow.setError(null)}
              className='mt-1 text-xs text-red-200 hover:text-white underline'
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Timeline Integration - Always at the bottom */}
      {(() => {
        const canSendTimeline =
          Object.keys(chatFlow.generatedVideos || {}).length > 0 ||
          Object.keys(chatFlow.storedVideosMap || {}).length > 0 ||
          Object.keys(combinedVideosMap || {}).length > 0;

        if (canSendTimeline) {
          return (
            <div className='flex justify-start'>
              <div className='w-full p-0'>
                <div className='text-white font-bold text-base mb-4'>
                  Your videos are ready!
                </div>
                <TimelineButton
                  canSendTimeline={canSendTimeline}
                  addingTimeline={chatFlow.addingTimeline}
                  onSendToTimeline={sendVideosToTimeline}
                  inConversation={true}
                />
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
