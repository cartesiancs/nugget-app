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
    if (data.nodeType === 'textNode') {
      return "how about \"A bird flying on the moon with a red cape\"...";
    } else if (data.nodeType === 'newImageNode' || data.nodeType === 'imageNode') {
      return "how about \"A bird flying on the moon with a red cape\"...";
    } else if (data.nodeType === 'newVideoNode' || data.nodeType === 'videoNode') {
      return "how about \"A bird flying on the moon with a red cape\"...";
    }
    return "how about \"A bird flying on the moon with a red cape\"...";
  };

  return (
    <div 
      className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 w-80 p-3"
      style={{
        background: "linear-gradient(180.01deg, rgba(50, 53, 62, 0.17) 0.01%, rgba(17, 18, 21, 0.2) 109.75%)",
        border: "1px solid",
        borderImage: "linear-gradient(180deg, rgba(17, 18, 21, 0.1) 0%, rgba(233, 232, 235, 0.04) 100%) 1",
        backdropFilter: "blur(20px)"
      }}
    >
      {/* Input Handle - only on top to connect from the node above */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{
          background: "#3b82f6",
          width: 20,
          height: 20,
          border: '4px solid #fff',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
          zIndex: 9999,
          top: -10
        }}
      />

      {/* Chat Input Area */}
      <div className="space-y-2">
        {/* Message Input */}
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              className="w-full bg-gray-700 text-gray-300 text-sm p-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="GPT-4o mini">GPT-4o mini</option>
              <option value="GPT-4o">GPT-4o</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              <option value="Gemini Pro">Gemini Pro</option>
            </select>

            {/* Toolbar Icons */}
            <div className="flex items-center gap-1">
              <button className="p-1 text-gray-400 hover:text-white transition-colors rounded">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </button>

              <button className="p-1 text-gray-400 hover:text-white transition-colors rounded">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>

              <button className="p-1 text-gray-400 hover:text-white transition-colors rounded">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-gray-300 px-2 py-1 rounded transition-colors text-xs flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatNode;
