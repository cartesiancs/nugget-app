import React, { useState, useRef, useEffect } from "react";

/**
 * Bottom input bar that lets the user enter the main prompt and kick-off the flow.
 */
export default function InputArea({
  isAuthenticated,
  selectedProject,
  prompt,
  setPrompt,
  loading,
  currentStep,
  handleStepClick,
  chatFlow, // Add chatFlow to determine available models
}) {
  const [selectedModel, setSelectedModel] = useState("GPT-4o mini");
  const textareaRef = useRef(null);

  // Get available models based on current step and flow state
  const getAvailableModels = () => {
    // Initial concept generation - only Gemini 2.5 Flash
    if (currentStep === 0 && !chatFlow?.concepts) {
      return [{ value: "gpt-2.5", label: "Gemini 2.5 Flash" }];
    }
    
    // Script generation after concept selection - Flash default, Pro option
    if (currentStep === 2 || (chatFlow?.selectedConcept && !chatFlow?.selectedScript)) {
      return [
        { value: "gemini-flash", label: "Gemini Flash" },
        { value: "gemini-pro", label: "Gemini Pro" }
      ];
    }
    
    // Image generation after script selection - Recraft default, Imagen option
    if (currentStep === 4 || (chatFlow?.selectedScript && Object.keys(chatFlow?.generatedImages || {}).length === 0)) {
      return [
        { value: "recraft-v3", label: "Recraft" },
        { value: "imagen", label: "Imagen" }
      ];
    }
    
    // Video generation after image generation - Runway default, Kling option
    if (currentStep === 5 || (Object.keys(chatFlow?.generatedImages || {}).length > 0 && Object.keys(chatFlow?.generatedVideos || {}).length === 0)) {
      return [
        { value: "gen4-turbo", label: "RunwayML" },
        { value: "kling-v2.1-master", label: "Kling" }
      ];
    }
    
    // Default models for other cases
    return [
      { value: "GPT-4o mini", label: "GPT-4o mini" },
      { value: "GPT-4o", label: "GPT-4o" },
      { value: "Claude 3.5 Sonnet", label: "Claude 3.5 Sonnet" },
      { value: "Gemini Pro", label: "Gemini Pro" }
    ];
  };

  // Update selected model when available models change
  useEffect(() => {
    const availableModels = getAvailableModels();
    if (availableModels.length > 0) {
      // Set default model based on step - always use the first option (which is the default)
      if (currentStep === 0 && !chatFlow?.concepts) {
        setSelectedModel("gpt-2.5");
      } else if (currentStep === 2 || (chatFlow?.selectedConcept && !chatFlow?.selectedScript)) {
        setSelectedModel("gemini-flash"); // Default to Gemini Flash
        // Also ensure the chatFlow has the correct default
        if (chatFlow && chatFlow.setSelectedScriptModel) {
          chatFlow.setSelectedScriptModel("flash");
        }
        console.log("Set default script model to flash for step", currentStep);
      } else if (currentStep === 4 || (chatFlow?.selectedScript && Object.keys(chatFlow?.generatedImages || {}).length === 0)) {
        setSelectedModel("recraft-v3"); // Default to Recraft
      } else if (currentStep === 5 || (Object.keys(chatFlow?.generatedImages || {}).length > 0 && Object.keys(chatFlow?.generatedVideos || {}).length === 0)) {
        setSelectedModel("gen4-turbo"); // Default to RunwayML
      }
    }
  }, [currentStep, chatFlow?.concepts, chatFlow?.selectedConcept, chatFlow?.selectedScript, chatFlow?.generatedImages, chatFlow?.generatedVideos]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200); // min 40px, max 200px
      textarea.style.height = newHeight + 'px';
    }
  }, [prompt]);

  const handleTextareaChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      // Store the current prompt before clearing
      const currentPrompt = prompt.trim();
      
      // Clear input immediately using state management
      setPrompt("");
      
      // Pass the selected model to the appropriate step
      // Store the model in chatFlow for use by generation functions
      if (chatFlow) {
        // Map model values to the correct format for each step
        if (selectedModel === "recraft-v3" || selectedModel === "imagen") {
          chatFlow.setSelectedImageModel(selectedModel);
        } else if (selectedModel === "gen4-turbo") {
          chatFlow.setSelectedVideoModel("gen4-turbo");
        } else if (selectedModel === "kling-v2.1-master") {
          chatFlow.setSelectedVideoModel(selectedModel);
        }
        
        // Determine which step to execute based on current state
        let stepToExecute = 0;
        
        // If we have concepts but no selected concept, we're at step 0 (concept generation)
        if (!chatFlow?.concepts) {
          stepToExecute = 0;
        }
        // If we have selected concept but no scripts, we're at step 2 (script generation)  
        else if (chatFlow?.selectedConcept && !chatFlow?.selectedScript) {
          stepToExecute = 2;
        }
        // If we have selected script but no images, we're at step 4 (image generation)
        else if (chatFlow?.selectedScript && Object.keys(chatFlow?.generatedImages || {}).length === 0) {
          stepToExecute = 4;
        }
        // If we have images but no videos, we're at step 5 (video generation)
        else if (Object.keys(chatFlow?.generatedImages || {}).length > 0 && Object.keys(chatFlow?.generatedVideos || {}).length === 0) {
          stepToExecute = 5;
        }
        
        // Store the script generation model for segmentation API - use what user actually selected
        if (selectedModel === "gemini-pro") {
          chatFlow.setSelectedScriptModel("pro");
        } else if (selectedModel === "gemini-flash") {
          chatFlow.setSelectedScriptModel("flash");
        }
        
        // Store the current user message for immediate display with unique counter
        const newMessageId = chatFlow.messageCounter + 1;
        chatFlow.setMessageCounter(newMessageId);
        chatFlow.setCurrentUserMessage(currentPrompt);
        
        // Add to all user messages array
        chatFlow.setAllUserMessages(prev => [
          ...prev,
          {
            id: `user-message-${newMessageId}`,
            content: currentPrompt,
            timestamp: Date.now(),
            step: stepToExecute
          }
        ]);
        
        handleStepClick(stepToExecute);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-400 text-sm text-center">
          Sign in to use chat features
        </p>
      </div>
    );
  }

  if (isAuthenticated && !selectedProject) {
    return (
      <div className="p-4 border-t border-gray-800">
        <p className="text-gray-400 text-sm text-center">
          Select a project to start creating content
        </p>
      </div>
    );
  }

  // Authenticated + project selected → show input
  return (
    <div className="p-3">
      <div
        className="rounded-xl shadow-2xl w-full mx-auto p-3"
        style={{
          background: '#18191C80',
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: 'blur(10px)',
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Main Content */}
        <div className="space-y-3">
          {/* Message Input */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (
                    e.nativeEvent &&
                    typeof e.nativeEvent.stopImmediatePropagation === "function"
                  ) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    prompt.trim() &&
                    !loading
                  ) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder='how about "A bird flying on the moon with a red cape"...'
                className="w-full text-sm p-0 border-0 focus:outline-none resize-none bg-transparent placeholder-gray-500 text-gray-300 leading-relaxed overflow-hidden"
                style={{
                  background: "transparent",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  minHeight: "40px",
                  maxHeight: "200px",
                }}
                rows={1}
                disabled={loading}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) => {
                  const newModel = e.target.value;
                  setSelectedModel(newModel);
                  
                  // Update chatFlow immediately when model changes
                  if (chatFlow) {
                    if (newModel === "recraft-v3" || newModel === "imagen") {
                      chatFlow.setSelectedImageModel(newModel);
                    } else if (newModel === "gen4-turbo") {
                      chatFlow.setSelectedVideoModel("gen4-turbo");
                    } else if (newModel === "kling-v2.1-master") {
                      chatFlow.setSelectedVideoModel(newModel);
                    } else if (newModel === "gemini-pro") {
                      chatFlow.setSelectedScriptModel("pro");
                      console.log("User selected Gemini Pro, set script model to 'pro'");
                    } else if (newModel === "gemini-flash") {
                      chatFlow.setSelectedScriptModel("flash");
                      console.log("User selected Gemini Flash, set script model to 'flash'");
                    }
                  }
                }}
                className="text-gray-300 text-xs px-2 py-1 rounded-md focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                style={{
                  background: "rgba(24, 25, 28, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: 'blur(5px)',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 6px center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "10px",
                  paddingRight: "22px",
                  minWidth: "100px",
                }}
                disabled={loading}
              >
                {getAvailableModels().map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>

              {/* Action Icons */}
              <div className="flex items-center gap-0">
                {/* Icon 1 - Palette/Color */}
                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  style={{ background: "transparent" }}
                  disabled={loading}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                    />
                  </svg>
                </button>

                {/* Icon 2 - Settings/Options */}
                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  style={{ background: "transparent" }}
                  disabled={loading}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </button>

                {/* Icon 3 - Attachment */}
                <button
                  type="button"
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors duration-200"
                  style={{ background: "transparent" }}
                  disabled={loading}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!prompt.trim() || loading}
                  className="p-2 rounded-lg transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed ml-1"
                  style={{
                    background: prompt.trim() && !loading
                      ? "linear-gradient(135deg, rgba(6, 182, 212, 0.8) 0%, rgba(14, 165, 233, 0.9) 100%)"
                      : "rgba(55, 65, 81, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: 'blur(5px)',
                    color: prompt.trim() && !loading ? "#ffffff" : "#6b7280",
                    width: "28px",
                    height: "28px",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ transform: "rotate(45deg)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}