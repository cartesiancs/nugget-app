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
}) {
  const [selectedModel, setSelectedModel] = useState("GPT-4o mini");
  const textareaRef = useRef(null);

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
      // For conversational flow, always start with step 0 (concept generation)
      // The ChatMessages component will handle the flow progression
      handleStepClick(0);
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
    <div className="p-4">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-4xl mx-auto p-4"
        style={{
          background: "linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Main Content */}
        <div className="space-y-4">
          {/* Message Input */}
          <form onSubmit={handleSubmit} className="space-y-3">
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
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-gray-400 text-xs px-2 py-1 rounded-md focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                style={{
                  background: "rgba(28, 28, 28, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 6px center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "10px",
                  paddingRight: "22px",
                  minWidth: "110px",
                }}
                disabled={loading}
              >
                <option value="GPT-4o mini">GPT-4o mini</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                <option value="Gemini Pro">Gemini Pro</option>
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
                      ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                      : "rgba(55, 65, 81, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: prompt.trim() && !loading ? "#ffffff" : "#6b7280",
                    width: "32px",
                    height: "32px",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleStepClick(0);
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