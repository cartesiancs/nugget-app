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

  // Model data with token usage and time information
  const modelData = {
    "gpt-2.5": { label: "Gemini 2.5 Flash", tokens: "5", time: "2" },
    "gemini-flash": { label: "Gemini Flash", tokens: "5", time: "2" },
    "gemini-pro": { label: "Gemini Pro", tokens: "4", time: "4" },
    "recraft-v3": { label: "Recraft", tokens: "1", time: "4" },
    "imagen": { label: "Imagen", tokens: "2", time: "2" },
    "gen4-turbo": { label: "RunwayML", tokens: "2.5", time: "3" },
    "kling-v2.1-master": { label: "Kling", tokens: "20", time: "4" },
  };

  // Get available models based on current step and flow state
  const getAvailableModels = () => {
    // Initial concept generation - only Gemini 2.5 Flash
    if (currentStep === 0 && !chatFlow?.concepts) {
      return [{ value: "gpt-2.5", ...modelData["gpt-2.5"] }];
    }

    // Script generation after concept selection - Flash default, Pro option
    if (
      currentStep === 2 ||
      (chatFlow?.selectedConcept && !chatFlow?.selectedScript)
    ) {
      return [
        { value: "gemini-flash", ...modelData["gemini-flash"] },
        { value: "gemini-pro", ...modelData["gemini-pro"] },
      ];
    }

    // Image generation after script selection - Recraft default, Imagen option
    if (
      currentStep === 4 ||
      (chatFlow?.selectedScript &&
        Object.keys(chatFlow?.generatedImages || {}).length === 0)
    ) {
      return [
        { value: "recraft-v3", ...modelData["recraft-v3"] },
        { value: "imagen", ...modelData["imagen"] },
      ];
    }

    // Video generation after image generation - Runway default, Kling option
    if (
      currentStep === 5 ||
      (Object.keys(chatFlow?.generatedImages || {}).length > 0 &&
        Object.keys(chatFlow?.generatedVideos || {}).length === 0)
    ) {
      return [
        { value: "gen4-turbo", ...modelData["gen4-turbo"] },
        { value: "kling-v2.1-master", ...modelData["kling-v2.1-master"] },
      ];
    }

    // Default models for other cases
    return [{ value: "gpt-2.5", ...modelData["gpt-2.5"] }];
  };

  // Update selected model when available models change
  useEffect(() => {
    const availableModels = getAvailableModels();
    if (availableModels.length > 0) {
      // Set default model based on step - always use the first option (which is the default)
      if (currentStep === 0 && !chatFlow?.concepts) {
        setSelectedModel("gpt-2.5");
      } else if (
        currentStep === 2 ||
        (chatFlow?.selectedConcept && !chatFlow?.selectedScript)
      ) {
        setSelectedModel("gemini-flash"); // Default to Gemini Flash
        // Also ensure the chatFlow has the correct default
        if (chatFlow && chatFlow.setSelectedScriptModel) {
          chatFlow.setSelectedScriptModel("flash");
        }
        console.log("Set default script model to flash for step", currentStep);
      } else if (
        currentStep === 4 ||
        (chatFlow?.selectedScript &&
          Object.keys(chatFlow?.generatedImages || {}).length === 0)
      ) {
        setSelectedModel("recraft-v3"); // Default to Recraft
      } else if (
        currentStep === 5 ||
        (Object.keys(chatFlow?.generatedImages || {}).length > 0 &&
          Object.keys(chatFlow?.generatedVideos || {}).length === 0)
      ) {
        setSelectedModel("gen4-turbo"); // Default to RunwayML
      }
    }
  }, [
    currentStep,
    chatFlow?.concepts,
    chatFlow?.selectedConcept,
    chatFlow?.selectedScript,
    chatFlow?.generatedImages,
    chatFlow?.generatedVideos,
  ]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200); // min 40px, max 200px
      textarea.style.height = newHeight + "px";
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
        else if (
          chatFlow?.selectedScript &&
          Object.keys(chatFlow?.generatedImages || {}).length === 0
        ) {
          stepToExecute = 4;
        }
        // If we have images but no videos, we're at step 5 (video generation)
        else if (
          Object.keys(chatFlow?.generatedImages || {}).length > 0 &&
          Object.keys(chatFlow?.generatedVideos || {}).length === 0
        ) {
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
        chatFlow.setAllUserMessages((prev) => [
          ...prev,
          {
            id: `user-message-${newMessageId}`,
            content: currentPrompt,
            timestamp: Date.now(),
            step: stepToExecute,
          },
        ]);

        handleStepClick(stepToExecute);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className='p-4 border-t border-gray-800'>
        <p className='text-gray-400 text-sm text-center'>
          Sign in to use chat features
        </p>
      </div>
    );
  }

  if (isAuthenticated && !selectedProject) {
    return (
      <div className='p-4 border-t border-gray-800'>
        <p className='text-gray-400 text-sm text-center'>
          Select a project to start creating content
        </p>
      </div>
    );
  }

  // Authenticated + project selected → show input
  return (
    <div className='p-3'>
      <div
        className='rounded-xl shadow-2xl w-full mx-auto p-3'
        style={{
          background: "#18191C80",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Main Content */}
        <div className='space-y-3'>
          {/* Message Input */}
          <form onSubmit={handleSubmit} className='space-y-2'>
            <div className='relative'>
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
                className='w-full text-sm p-0 border-0 focus:outline-none resize-none bg-transparent placeholder-gray-500 text-gray-300 leading-relaxed overflow-hidden'
                style={{
                  background: "transparent",
                  fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
            <div className='flex items-center justify-between'>
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
                      console.log(
                        "User selected Gemini Pro, set script model to 'pro'",
                      );
                    } else if (newModel === "gemini-flash") {
                      chatFlow.setSelectedScriptModel("flash");
                      console.log(
                        "User selected Gemini Flash, set script model to 'flash'",
                      );
                    }
                  }
                }}
                className='text-gray-300 text-xs px-2 py-1 rounded-md focus:outline-none transition-all duration-200 appearance-none cursor-pointer'
                style={{
                  background: "rgba(24, 25, 28, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(5px)",
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 6px center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "10px",
                  paddingRight: "22px",
                  minWidth: "180px", // Increased width to accommodate new content
                }}
                disabled={loading}
              >
                {getAvailableModels().map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label} • {model.tokens} Token • ~{model.time}s
                  </option>
                ))}
              </select>

              {/* Custom styled dropdown (for better visual control) */}
              <div className="relative hidden">
                <div
                  className='text-gray-300 text-xs px-3 py-2 rounded-md cursor-pointer flex items-center justify-between min-w-[200px]'
                  style={{
                    background: "rgba(24, 25, 28, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{modelData[selectedModel]?.label}</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#94E7ED" strokeOpacity="0.5" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z" stroke="#94E7ED" strokeOpacity="0.5" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{modelData[selectedModel]?.tokens}</span>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.99984 5.33317V8.54413C7.99984 8.65809 8.05806 8.76416 8.15421 8.82535L9.99984 9.99984M14.0999 7.9999C14.0999 11.3688 11.3688 14.0999 7.9999 14.0999C4.63097 14.0999 1.8999 11.3688 1.8999 7.9999C1.8999 4.63097 4.63097 1.8999 7.9999 1.8999C11.3688 1.8999 14.0999 4.63097 14.0999 7.9999Z" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>~{modelData[selectedModel]?.time}s</span>
                    </div>
                  </div>
                  <svg width="12" height="12" fill="none" viewBox="0 0 20 20">
                    <path stroke="#6b7280" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4"/>
                  </svg>
                </div>
              </div>

              {/* Action Icons */}
              <div className='flex items-center gap-0'>
                {/* Icon 1 - Palette/Color */}
                <svg
                  width='28'
                  height='28'
                  viewBox='0 0 28 28'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <g clipPath='url(#clip0_640_49397)'>
                    <path
                      d='M7.65648 13.6665C7.84184 10.1861 10.8411 7.49015 14.3215 7.67552C17.7773 7.85957 20.4922 10.5502 20.3466 13.6063C20.2438 15.5369 18.5749 17.0365 16.6442 16.9336C16.0209 16.9004 15.1379 16.6585 14.6132 17.1301C14.2084 17.494 14.1354 18.1786 14.5086 18.5923C15.0541 19.2782 14.5668 20.3806 13.6475 20.3316C10.1671 20.1462 7.47111 17.1469 7.65648 13.6665Z'
                      stroke='#7E7E80'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M10.3188 13.3332C10.3188 12.965 10.6173 12.6665 10.9855 12.6665C11.3537 12.6665 11.6522 12.965 11.6522 13.3332C11.6522 13.7014 11.3537 13.9998 10.9855 13.9998C10.6173 13.9998 10.3188 13.7014 10.3188 13.3332Z'
                      stroke='#7E7E80'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M13.499 10.8416C13.499 10.4734 13.7975 10.175 14.1657 10.175C14.5339 10.175 14.8324 10.4734 14.8324 10.8416C14.8324 11.2098 14.5339 11.5083 14.1657 11.5083C13.7975 11.5083 13.499 11.2098 13.499 10.8416Z'
                      stroke='#7E7E80'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M16.4821 13.3332C16.4821 12.965 16.7806 12.6665 17.1488 12.6665C17.517 12.6665 17.8154 12.965 17.8154 13.3332C17.8154 13.7014 17.517 13.9998 17.1488 13.9998C16.7806 13.9998 16.4821 13.7014 16.4821 13.3332Z'
                      stroke='#7E7E80'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </g>
                  <defs>
                    <clipPath id='clip0_640_49397'>
                      <rect
                        width='16'
                        height='16'
                        fill='white'
                        transform='translate(6 6)'
                      />
                    </clipPath>
                  </defs>
                </svg>

                {/* Icon 2 - Settings/Options */}
                <svg
                  width='28'
                  height='28'
                  viewBox='0 0 28 28'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M8.66699 14H15.0003M8.66699 18H12.667M8.66699 10H19.3337M15.3337 19.3333H15.3403M18.0003 14.6667C17.5753 15.7443 17.1076 16.23 16.0003 16.6667C17.1076 17.1034 17.5753 17.589 18.0003 18.6667C18.4253 17.589 18.8931 17.1034 20.0003 16.6667C18.8931 16.23 18.4253 15.7443 18.0003 14.6667Z'
                    stroke='white'
                    strokeOpacity='0.5'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>

                {/* Icon 3 - Attachment */}
                <svg
                  width='28'
                  height='28'
                  viewBox='0 0 28 28'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M18.9832 14.5208L16.6097 18.6318C15.4862 20.5778 12.9977 21.2446 11.0517 20.121C9.1056 18.9975 8.43883 16.5091 9.56239 14.563L12.953 8.69021C13.7021 7.39283 15.361 6.94832 16.6584 7.69736C17.9558 8.4464 18.4003 10.1053 17.6513 11.4027L14.2606 17.2755C13.8861 17.9242 13.0566 18.1464 12.4079 17.7719C11.7592 17.3974 11.537 16.5679 11.9115 15.9192L14.9631 10.6337'
                    stroke='white'
                    strokeOpacity='0.5'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>

                {/* Send Div (formerly Button) */}
                <div
                  className='p-1 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer ml-1'
                  style={{
                    background:
                      prompt.trim() && !loading
                        ? "linear-gradient(135deg, rgba(6, 182, 212, 0.8) 0%, rgba(14, 165, 233, 0.9) 100%)"
                        : "rgba(55, 65, 81, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(5px)",
                    color: prompt.trim() && !loading ? "#ffffff" : "#6b7280",
                    width: "28px",
                    height: "28px",
                    opacity: !prompt.trim() || loading ? 0.5 : 1,
                    pointerEvents: !prompt.trim() || loading ? "none" : "auto",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 16 16'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M6.35939 9.64061L2.70896 7.64974C1.75627 7.13016 1.76571 5.76045 2.72538 5.26722C5.37188 3.90704 8.18598 2.89704 11.0973 2.26249C11.9332 2.08029 12.8885 1.70889 13.5898 2.41018C14.2911 3.11147 13.9197 4.06683 13.7375 4.90275C13.103 7.81403 12.093 10.6281 10.7328 13.2746C10.2395 14.2343 8.86984 14.2437 8.35026 13.291L6.35939 9.64061ZM6.35939 9.64061L8.56513 7.43487'
                      stroke='white'
                      strokeOpacity='0.5'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}