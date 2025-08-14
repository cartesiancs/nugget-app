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

  // Set up auto-progression flag
  useEffect(() => {
    window.autoTriggerVideoGeneration = autoProgression;
    return () => {
      delete window.autoTriggerVideoGeneration;
    };
  }, [autoProgression]);

  // Use the passed currentPrompt

  // Generate messages based on current chat flow state
  useEffect(() => {
    const newMessages = [];

    // Show initial user message if we have concepts (means user sent a message)
    if (currentPrompt && chatFlow.concepts && chatFlow.concepts.length > 0) {
      newMessages.push({
        id: "initial-prompt",
        type: "user",
        content: currentPrompt,
        timestamp: Date.now() - 1000,
      });
    }

    // Step 0: Concept Generation
    if (chatFlow.concepts && chatFlow.concepts.length > 0) {
      newMessages.push({
        id: "concept-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              Please choose a concept to get started.
            </div>
          <ConceptSelection
            concepts={chatFlow.concepts}
            currentStep={chatFlow.currentStep}
            onConceptSelect={(concept) => 
              chatFlow.handleConceptSelect(concept, autoProgression, currentPrompt)
            }
            selectedConcept={chatFlow.selectedConcept}
            showAsCards={true}
          />
          </div>
        ),
        timestamp: Date.now(),
      });
    }

    // Step 1: Concept Selection Confirmation
    if (chatFlow.selectedConcept) {
      newMessages.push({
        id: "concept-selected",
        type: "user",
        content: `Selected concept: ${chatFlow.selectedConcept.title}`,
        timestamp: Date.now() + 1,
      });
    }

    // Step 2: Script Generation
    if (chatFlow.scripts) {
      newMessages.push({
        id: "script-request",
        type: "system",
        content: "",
        component: (
          <div>
            <div className="text-white font-bold text-base mb-4">
              Creating scripts based on your selection...
            </div>
            <ScriptSelection
              scripts={chatFlow.scripts}
              currentStep={chatFlow.currentStep}
              onScriptSelect={(script) => 
                chatFlow.handleScriptSelect(script, autoProgression)
              }
              selectedScript={chatFlow.selectedScript}
              showAsCollapsible={true}
            />
          </div>
        ),
        timestamp: Date.now() + 2,
      });
    }

    // Step 3: Script Selection
    if (chatFlow.selectedScript && chatFlow.currentStep >= 3) {
      const scriptOption = chatFlow.scripts?.response1 === chatFlow.selectedScript ? "Script 1" : "Script 2";
      newMessages.push({
        id: "script-selected",
        type: "user",
        content: `Generate image for ${scriptOption}`,
        timestamp: Date.now() + 3,
      });
    }

    // Step 4: Image Generation
    if (chatFlow.currentStep >= 4 && chatFlow.selectedScript) {
      const hasImages = Object.keys(chatFlow.generatedImages).length > 0;
      const isGenerating = chatFlow.loading && chatFlow.currentStep === 4;
      
      newMessages.push({
        id: "image-generation",
        type: "system",
        content: isGenerating ? "Processing..." : hasImages ? "Generated Images:" : "Processing...",
        component: (
          <MediaGeneration
            type="image"
            generatedImages={chatFlow.generatedImages}
            generationProgress={chatFlow.generationProgress}
            currentStep={chatFlow.currentStep}
            onImageClick={onImageClick}
            loading={isGenerating}
          />
        ),
        timestamp: Date.now() + 4,
      });
    }

    // Step 5: Video Generation Request
    if (Object.keys(chatFlow.generatedImages).length > 0 && chatFlow.currentStep >= 5) {
      newMessages.push({
        id: "video-request",
        type: "user",
        content: "Generate video",
        timestamp: Date.now() + 5,
      });

      const hasVideos = Object.keys(combinedVideosMap).length > 0;
      const isGeneratingVideos = chatFlow.loading && chatFlow.currentStep === 5;
      
      newMessages.push({
        id: "video-generation",
        type: "system",
        content: isGeneratingVideos ? "Processing..." : hasVideos ? "Generated Videos:" : "Processing...",
        component: (
          <MediaGeneration
            type="video"
            combinedVideosMap={combinedVideosMap}
            generationProgress={chatFlow.generationProgress}
            currentStep={chatFlow.currentStep}
            onVideoClick={onVideoClick}
            onAddSingleVideo={onAddSingleVideo}
            loading={isGeneratingVideos}
          />
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
        content: "Your videos are ready!",
        component: (
          <TimelineButton
            canSendTimeline={canSendTimeline}
            addingTimeline={chatFlow.addingTimeline}
            onSendToTimeline={sendVideosToTimeline}
            inConversation={true}
          />
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
    combinedVideosMap,
    autoProgression,
    currentPrompt,
  ]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`${
              message.id === "concept-request" || message.id === "script-request"
                ? "w-full p-0" // Full width and no padding/background for concept/script requests
                : `max-w-[80%] p-3 ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`
            } rounded-lg`}
          >
            {message.content && <div className="text-sm">{message.content}</div>}
            {message.component && (
              <div className={message.id === "concept-request" || message.id === "script-request" ? "" : "mt-3"}>
                {message.component}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {chatFlow.loading && (
        <div className="flex justify-start">
          <div className="bg-gray-700 text-gray-100 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">Processing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {chatFlow.error && (
        <div className="flex justify-start">
          <div className="bg-red-600 text-white rounded-lg p-3 max-w-[80%]">
            <div className="text-sm">{chatFlow.error}</div>
            <button
              onClick={() => chatFlow.setError(null)}
              className="mt-2 text-xs text-red-200 hover:text-white underline"
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
