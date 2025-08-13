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
    <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 w-96 p-4">
      {/* Input Handle - only on top to connect from the node above */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-500 border-2 border-gray-800"
      />

      {/* Node Header - looks like a professional node */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-white text-sm font-medium">AI Chat Assistant</span>
        </div>
        <div className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">Powered by GPT</div>
      </div>

      {/* Chat Input Area */}
      <div className="space-y-3">
        {/* Toolbar Icons */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>

          <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>

          <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              className="w-full bg-gray-700 text-white text-sm p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            >
              <option value="GPT-4o mini">GPT-4o mini</option>
              <option value="GPT-4o">GPT-4o</option>
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              <option value="Gemini Pro">Gemini Pro</option>
            </select>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatNode;
