import React, { useState, useRef, useEffect } from "react";
import ConceptSelection from "./ConceptSelection";
import ScriptSelection from "./ScriptSelection";
import MediaGeneration from "./MediaGeneration";
import TimelineButton from "./TimelineButton";

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

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Remove auto-progression - user controls all steps manually

  // Use the passed currentPrompt

  // Generate messages based on current chat flow state
  useEffect(() => {
    const newMessages = [];

    // Show initial user message if we have concepts (means user sent initial message) and no other messages
    if (currentPrompt && chatFlow.concepts && chatFlow.concepts.length > 0 && (!chatFlow.allUserMessages || chatFlow.allUserMessages.length === 0)) {
      newMessages.push({
        id: "initial-prompt",
        type: "user",
        content: currentPrompt,
        timestamp: Date.now() - 1000,
      });
    }
    
    // Show project script info if loaded from project (not from user generation)
    if (chatFlow.selectedScript && chatFlow.selectedScript.segments && !chatFlow.scripts && chatFlow.allUserMessages && chatFlow.allUserMessages.length > 0) {
      newMessages.push({
        id: "project-script-info",
        type: "system",
        content: `Project script loaded with ${chatFlow.selectedScript.segments.length} segments`,
        timestamp: Date.now() - 100,
      });
    }
    
    // Show all user messages in chronological order
    if (chatFlow.allUserMessages && chatFlow.allUserMessages.length > 0) {
      chatFlow.allUserMessages.forEach((userMsg) => {
        newMessages.push({
          id: userMsg.id,
          type: "user",
          content: userMsg.content,
          timestamp: userMsg.timestamp,
        });
      });
    }
    
    // Show current user message immediately when they send it (if not already in allUserMessages)
    if (chatFlow.currentUserMessage && (!chatFlow.allUserMessages || !chatFlow.allUserMessages.find(msg => msg.content === chatFlow.currentUserMessage))) {
      newMessages.push({
        id: `current-user-message-${chatFlow.messageCounter}`,
        type: "user",
        content: chatFlow.currentUserMessage,
        timestamp: Date.now() - 500,
      });
    }

    // Step 0: Concept Generation - always show concepts once generated
    if (chatFlow.concepts && chatFlow.concepts.length > 0) {
      newMessages.push({
        id: "concept-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              {chatFlow.selectedConcept ? "Selected Concept:" : "Please choose a concept to get started."}
            </div>
            <ConceptSelection
              concepts={chatFlow.concepts}
              currentStep={chatFlow.currentStep}
              onConceptSelect={(concept) => {
                chatFlow.handleConceptSelect(concept, false, currentPrompt); // Never auto-progress
                // Auto-populate input for script generation
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
    }

    // Show script generation user message when user manually sends it
    if (chatFlow.currentUserMessage && chatFlow.selectedConcept && chatFlow.currentStep === 2) {
      // Check if this is a script generation request
      const isScriptRequest = chatFlow.currentUserMessage.toLowerCase().includes('script') || 
                             chatFlow.currentUserMessage.toLowerCase().includes('generate') ||
                             chatFlow.currentUserMessage.toLowerCase().includes('segmentation');
      
      if (isScriptRequest) {
        newMessages.push({
          id: "script-generation-request",
          type: "user", 
          content: chatFlow.currentUserMessage,
          timestamp: Date.now() + 1.5,
        });
      }
    }

    // Step 2: Script Generation - show scripts if they exist (either from API or newly generated)
    console.log("Script display check:", {
      hasScripts: !!chatFlow.scripts,
      hasSelectedScript: !!chatFlow.selectedScript,
      selectedScriptSegments: chatFlow.selectedScript?.segments,
      currentStep: chatFlow.currentStep,
      selectedScriptKeys: chatFlow.selectedScript ? Object.keys(chatFlow.selectedScript) : null
    });
    
    if (chatFlow.scripts || chatFlow.selectedScript) {
      newMessages.push({
        id: "script-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              {chatFlow.selectedScript ? "Project Script:" : "Generated Scripts - Please choose one:"}
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
        timestamp: Date.now() + 1,
      });
    } else if (chatFlow.loading && chatFlow.currentStep === 2) {
      // Show loading state for script generation
      newMessages.push({
        id: "script-loading",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              Generating Scripts...
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
              <span>Creating script and segmentation...</span>
            </div>
          </div>
        ),
        timestamp: Date.now() + 1.8,
      });
    }

    // Show image generation user message only when user manually sends it
    if (chatFlow.currentUserMessage && chatFlow.selectedScript && Object.keys(chatFlow.generatedImages || {}).length === 0 && chatFlow.loading && chatFlow.currentStep === 4) {
      newMessages.push({
        id: "image-generation-request",
        type: "user",
        content: chatFlow.currentUserMessage,
        timestamp: Date.now() + 3.5,
      });
    }

    // Step 4: Image Generation - show existing images or generation interface
    if (chatFlow.currentStep >= 4 && chatFlow.selectedScript) {
      const hasImages = Object.keys(chatFlow.generatedImages).length > 0;
      const isGenerating = chatFlow.loading && chatFlow.currentStep === 4;
      
      newMessages.push({
        id: "image-generation",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              {hasImages ? "Generated Images:" : isGenerating ? "Generating Images..." : "Image Generation"}
            </div>
            <MediaGeneration
              type="image"
              generatedImages={chatFlow.generatedImages}
              generationProgress={chatFlow.generationProgress}
              currentStep={chatFlow.currentStep}
              onImageClick={onImageClick}
              loading={isGenerating}
              onImagesGenerated={() => {
                // Auto-populate input for video generation
                if (setPrompt && hasImages && !isGenerating) {
                  setPrompt("Start generating video");
                }
              }}
            />
          </div>
        ),
        timestamp: Date.now() + 4,
      });
    }

    // Show video generation user message only when user manually sends it
    if (chatFlow.currentUserMessage && Object.keys(chatFlow.generatedImages || {}).length > 0 && Object.keys(chatFlow.generatedVideos || {}).length === 0 && chatFlow.loading && chatFlow.currentStep === 5) {
      newMessages.push({
        id: "video-generation-request",
        type: "user",
        content: chatFlow.currentUserMessage,
        timestamp: Date.now() + 4.5,
      });
    }

    // Step 5: Video Generation - show existing videos or generation interface
    if (Object.keys(chatFlow.generatedImages).length > 0 && chatFlow.currentStep >= 5) {
      const hasVideos = Object.keys(combinedVideosMap).length > 0;
      const isGeneratingVideos = chatFlow.loading && chatFlow.currentStep === 5;
      
      newMessages.push({
        id: "video-generation",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              {isGeneratingVideos ? "Processing..." : hasVideos ? "Generated Videos:" : "Video Generation"}
            </div>
            <MediaGeneration
              type="video"
              combinedVideosMap={combinedVideosMap}
              generationProgress={chatFlow.generationProgress}
              currentStep={chatFlow.currentStep}
              onVideoClick={onVideoClick}
              onAddSingleVideo={onAddSingleVideo}
              loading={isGeneratingVideos}
            />
          </div>
        ),
        timestamp: Date.now() + 6,
      });
    }

    // Timeline Integration
    const canSendTimeline = Object.keys(chatFlow.generatedVideos).length > 0 || Object.keys(chatFlow.storedVideosMap).length > 0;
    if (canSendTimeline) {
      newMessages.push({
        id: "timeline-ready",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              Your videos are ready!
            </div>
            <TimelineButton
              canSendTimeline={canSendTimeline}
              addingTimeline={chatFlow.addingTimeline}
              onSendToTimeline={sendVideosToTimeline}
              inConversation={true}
            />
          </div>
        ),
        timestamp: Date.now() + 7,
      });
    }

    setMessages(newMessages);
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
    chatFlow.allUserMessages,
    combinedVideosMap,
    autoProgression,
    currentPrompt,
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${
              message.id === "concept-request" || message.id === "script-request" || message.id === "image-generation" || message.id === "video-generation" || message.id === "timeline-ready" || message.id === "project-script-info" || message.id === "script-loading"
                ? "w-full p-0" // Full width and no padding/background for media messages
                : `max-w-[80%] p-2.5 ${
                    message.type === "user"
                      ? "text-white rounded-lg"
                      : "text-gray-100 rounded-lg"
                  }`
            }`}
            style={
              message.id !== "concept-request" && message.id !== "script-request" && message.id !== "image-generation" && message.id !== "video-generation" && message.id !== "timeline-ready" && message.id !== "project-script-info" && message.id !== "script-loading"
                ? {
                    background: message.type === "user" 
                      ? '#18191C80'
                      : '#18191C80',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }
                : {}
            }
          >
            {message.content && <div className="text-sm">{message.content}</div>}
            {message.component && (
              <div className={message.id === "concept-request" || message.id === "script-request" || message.id === "image-generation" || message.id === "video-generation" || message.id === "timeline-ready" || message.id === "project-script-info" || message.id === "script-loading" ? "" : "mt-3"}>
                {message.component}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {chatFlow.loading && (
        <div className="flex justify-start">
          <div 
            className="text-gray-100 rounded-lg p-2.5"
            style={{
              background: '#18191C80',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-400"></div>
              <span className="text-xs">Processing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {chatFlow.error && (
        <div className="flex justify-start">
          <div 
            className="text-white rounded-lg p-2.5 max-w-[80%]"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.9) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="text-xs">{chatFlow.error}</div>
            <button
              onClick={() => chatFlow.setError(null)}
              className="mt-1 text-xs text-red-200 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
