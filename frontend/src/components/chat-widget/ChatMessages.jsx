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
  const [processedSteps, setProcessedSteps] = useState(new Set());

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize messages when component mounts
  useEffect(() => {
    if (currentPrompt && chatFlow.concepts && chatFlow.concepts.length > 0 && messages.length === 0) {
      setMessages([{
        id: "initial-prompt",
        type: "user",
        content: currentPrompt,
        timestamp: Date.now() - 1000,
      }]);
    }
  }, [currentPrompt, chatFlow.concepts, messages.length]);

  // Add new messages based on chat flow changes
  useEffect(() => {
    const newMessages = [];
    let hasChanges = false;

    // Add current user message when it's new
    if (chatFlow.currentUserMessage && !processedSteps.has(`user-${chatFlow.messageCounter}`)) {
      newMessages.push({
        id: `user-message-${chatFlow.messageCounter}`,
        type: "user",
        content: chatFlow.currentUserMessage,
        timestamp: Date.now(),
      });
      setProcessedSteps(prev => new Set([...prev, `user-${chatFlow.messageCounter}`]));
      hasChanges = true;
    }

    // Add concept selection if not already processed
    if (chatFlow.concepts && chatFlow.concepts.length > 0 && !processedSteps.has('concepts')) {
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
      setProcessedSteps(prev => new Set([...prev, 'concepts']));
      hasChanges = true;
    }

    // Add project script info if loaded from project
    // if (chatFlow.selectedScript && chatFlow.selectedScript.segments && !chatFlow.scripts && !processedSteps.has('project-script')) {
    //   newMessages.push({
    //     id: "project-script-info",
    //     type: "system",
    //     content: `Project script loaded with ${chatFlow.selectedScript.segments.length} segments`,
    //     timestamp: Date.now(),
    //   });
    //   setProcessedSteps(prev => new Set([...prev, 'project-script']));
    //   hasChanges = true;
    // }

    // Add script selection if not already processed
    if ((chatFlow.scripts || chatFlow.selectedScript) && !processedSteps.has('scripts')) {
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
        timestamp: Date.now(),
      });
      setProcessedSteps(prev => new Set([...prev, 'scripts']));
      hasChanges = true;
    }

    // Add image generation if not already processed
    if (chatFlow.currentStep >= 4 && chatFlow.selectedScript && !processedSteps.has('images')) {
      const hasImages = Object.keys(chatFlow.generatedImages).length > 0;
      const isGenerating = chatFlow.loading && chatFlow.currentStep === 4;
      
      newMessages.push({
        id: "image-generation",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              {hasImages ? "Generated Images:" : isGenerating ? "Generating Images..." : ""}
            </div>
            <MediaGeneration
              type="image"
              generatedImages={chatFlow.generatedImages}
              generationProgress={chatFlow.generationProgress}
              currentStep={chatFlow.currentStep}
              onImageClick={onImageClick}
              loading={isGenerating}
              onImagesGenerated={() => {
                if (setPrompt && hasImages && !isGenerating) {
                  setPrompt("Start generating video");
                }
              }}
            />
          </div>
        ),
        timestamp: Date.now(),
      });
      setProcessedSteps(prev => new Set([...prev, 'images']));
      hasChanges = true;
    }

    // Add video generation if not already processed
    if (Object.keys(chatFlow.generatedImages).length > 0 && chatFlow.currentStep >= 5 && !processedSteps.has('videos')) {
      const hasVideos = Object.keys(combinedVideosMap).length > 0;
      const isGeneratingVideos = chatFlow.loading && chatFlow.currentStep === 5;
      
      newMessages.push({
        id: "video-generation",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              {isGeneratingVideos ? "Processing..." : hasVideos ? "Generated Videos:" : ""}
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
        timestamp: Date.now(),
      });
      setProcessedSteps(prev => new Set([...prev, 'videos']));
      hasChanges = true;
    }

    // Add timeline integration if not already processed
    const canSendTimeline = Object.keys(chatFlow.generatedVideos).length > 0 || Object.keys(chatFlow.storedVideosMap).length > 0;
    if (canSendTimeline && !processedSteps.has('timeline')) {
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
        timestamp: Date.now(),
      });
      setProcessedSteps(prev => new Set([...prev, 'timeline']));
      hasChanges = true;
    }

    // Append new messages to existing ones
    if (hasChanges) {
      setMessages(prevMessages => [...prevMessages, ...newMessages]);
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
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${
              message.id === "concept-request" || message.id === "script-request" || message.id === "image-generation" || message.id === "video-generation" || message.id === "timeline-ready" || message.id === "project-script-info"
                ? "w-full p-0" // Full width and no padding/background for media messages
                : `max-w-[80%] p-2.5 ${
                    message.type === "user"
                      ? "text-white rounded-lg"
                      : "text-gray-100 rounded-lg"
                  }`
            }`}
            style={
              message.id !== "concept-request" && message.id !== "script-request" && message.id !== "image-generation" && message.id !== "video-generation" && message.id !== "timeline-ready" && message.id !== "project-script-info"
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
              <div className={message.id === "concept-request" || message.id === "script-request" || message.id === "image-generation" || message.id === "video-generation" || message.id === "timeline-ready" || message.id === "project-script-info" ? "" : "mt-3"}>
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
