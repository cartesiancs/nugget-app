import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";

function ChatNode({ data, isConnectable }) {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("GPT-4o mini");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && data.onSendMessage) {
      data.onSendMessage(message, data.nodeType, selectedModel);
      setMessage("");
    }
  };

  const getDefaultMessage = () => {
    if (data.nodeType === "textNode") {
      return 'how about "A bird flying on the moon with a red cape"...';
    } else if (
      data.nodeType === "newImageNode" ||
      data.nodeType === "imageNode"
    ) {
      return 'how about "A bird flying on the moon with a red cape"...';
    } else if (
      data.nodeType === "newVideoNode" ||
      data.nodeType === "videoNode"
    ) {
      return 'how about "A bird flying on the moon with a red cape"...';
    }
    return 'how about "A bird flying on the moon with a red cape"...';
  };

  return (
    <div
      className='bg-gray-800/95 rounded-xl shadow-2xl border border-gray-700/70 w-80 p-3'
      style={{
        background:
          "linear-gradient(180deg, rgba(50, 53, 62, 0.9) 0%, rgba(17, 18, 21, 0.95) 100%)",
        border: "1px solid rgba(233, 232, 235, 0.2)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}
    >
      {/* Input Handle - only on top to connect from the node above */}
      <Handle
        type='target'
        position={Position.Top}
        isConnectable={isConnectable}
        style={{
          background: "#3b82f6",
          width: 20,
          height: 20,
          border: "4px solid #fff",
          boxShadow: "0 0 15px rgba(59, 130, 246, 0.8)",
          zIndex: 9999,
          top: -10,
        }}
      />

      {/* Chat Input Area */}
      <div className='space-y-2'>
        {/* Message Input */}
        <form onSubmit={handleSubmit} className='space-y-2'>
          <div className='relative'>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              className='w-full text-gray-300 text-sm p-2 rounded-lg border-0 focus:outline-none focus:border-blue-500 resize-none bg-transparent'
              style={{
                background: "transparent",
                color: "#d1d5db",
              }}
              rows={2}
            />
          </div>

          {/* Bottom Row */}
          <div className='flex items-center justify-between gap-1.5'>
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className='text-gray-300 text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 appearance-none cursor-pointer flex-shrink-0'
              style={{
                background:
                  "linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 0.9) 100%)",
                border: "1px solid rgba(75, 85, 99, 0.3)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                backgroundPosition: "right 6px center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "14px",
                paddingRight: "24px",
                minWidth: "120px",
                maxWidth: "140px",
              }}
            >
              <option value='GPT-4o mini'>GPT-4o mini</option>
              <option value='GPT-4o'>GPT-4o</option>
              <option value='Claude 3.5 Sonnet'>Claude 3.5 Sonnet</option>
              <option value='Gemini Pro'>Gemini Pro</option>
            </select>

            {/* Toolbar Icons */}
            <div className='flex items-center gap-0.5'>
              <button
                type='button'
                className='p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 rounded-lg'
              >
                <svg
                  className='w-3.5 h-3.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z'
                  />
                </svg>
              </button>

              <button
                type='button'
                className='p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 rounded-lg'
              >
                <svg
                  className='w-3.5 h-3.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                  />
                </svg>
              </button>

              <button
                type='button'
                className='p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200 rounded-lg'
              >
                <svg
                  className='w-3.5 h-3.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                  />
                </svg>
              </button>
            </div>

            {/* Send Button */}
            <button
              type='submit'
              disabled={!message.trim()}
              className='p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed flex-shrink-0'
              style={{
                background: message.trim()
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 100%)"
                  : "linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.7) 100%)",
                border: message.trim()
                  ? "1px solid rgba(59, 130, 246, 0.3)"
                  : "1px solid rgba(75, 85, 99, 0.3)",
                boxShadow: message.trim()
                  ? "0 2px 8px rgba(59, 130, 246, 0.25)"
                  : "0 2px 8px rgba(0, 0, 0, 0.15)",
                color: message.trim() ? "#ffffff" : "#9ca3af",
                width: "32px",
                height: "32px",
              }}
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                style={{ transform: "rotate(45deg)" }}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatNode;
