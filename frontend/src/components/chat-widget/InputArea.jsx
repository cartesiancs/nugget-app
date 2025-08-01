import React from "react";

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
    <div className="p-4 border-t border-white/10 dark:border-gray-700/60">
      <div className="relative">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
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
              if (currentStep === 0) handleStepClick(0);
            }
          }}
          placeholder="Start Creating..."
          className="w-full bg-white/15 dark:bg-gray-700/40 backdrop-blur-sm border border-white/25 dark:border-gray-600/40 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm text-white pl-4 pr-12 py-3 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />

        <button
          type="button"
          className={`absolute top-1/2 right-3 -translate-y-1/2 bg-gradient-to-br from-indigo-500/80 via-purple-500/80 to-pink-500/80 backdrop-blur-sm border border-white/30 dark:border-gray-600/40 shadow-md flex items-center justify-center rounded-full h-9 w-9 transition-opacity duration-150 ${
            loading || !prompt.trim()
              ? "opacity-40 cursor-not-allowed"
              : "hover:scale-105 active:scale-95"
          }`}
          disabled={loading || !prompt.trim()}
          onClick={(e) => {
            e.preventDefault();
            if (currentStep === 0) handleStepClick(0);
          }}
          title="Send"
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
