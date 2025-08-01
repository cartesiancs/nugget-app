import React from "react";

/**
 * Floating button that opens the chat sidebar.
 * Rendered only when the sidebar (open state) is false.
 */
export default function FloatingChatButton({ open, setOpen }) {
  if (open) return null;

  return (
    <button
      className="shadow-lg fixed top-2/4 right-8 transform translate-y-12 px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2 shadow-2xl z-[10001] backdrop-blur-lg border border-white/20 dark:border-gray-600/40 bg-gradient-to-tr from-gray-700/90 to-gray-800/90 dark:from-gray-700/90 dark:to-gray-800/90 transition-all duration-200 ease-in-out"
      aria-label="Open chat"
      onClick={() => setOpen(true)}
    >
      <span className="text-gray-300">✨</span>
      <span className="text-gray-300 font-medium">Chat</span>
    </button>
  );
}
