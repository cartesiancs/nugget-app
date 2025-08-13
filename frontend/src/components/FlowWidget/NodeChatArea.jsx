import React, { useState, useEffect } from "react";

function NodeChatArea({ selectedNode, onSendMessage }) {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("GPT-4o mini");
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedNode) {
      // Get the ReactFlow container
      const reactFlowContainer = document.querySelector('.react-flow__viewport');
      if (reactFlowContainer) {
        const containerRect = reactFlowContainer.getBoundingClientRect();
        
        // Calculate the actual position of the node in the viewport
        const nodeX = selectedNode.position.x + containerRect.left;
        const nodeY = selectedNode.position.y + containerRect.top;
        
        // Position the chat area below the node with 5px gap
        const chatAreaX = nodeX - 200; // Center the 400px wide chat area
        const chatAreaY = nodeY + 120 + 5; // Node height + 5px gap
        
        setPosition({ x: chatAreaX, y: chatAreaY });
      }
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && onSendMessage) {
      onSendMessage(message, selectedNode.type, selectedModel);
      setMessage("");
    }
  };

  const getDefaultMessage = () => {
    if (selectedNode.type === 'textNode') {
      return "how about \"A bird flying on the moon with a red cape\"...";
    } else if (selectedNode.type === 'newImageNode' || selectedNode.type === 'imageNode') {
      return "how about \"A bird flying on the moon with a red cape\"...";
    } else if (selectedNode.type === 'newVideoNode' || selectedNode.type === 'videoNode') {
      return "how about \"A bird flying on the moon with a red cape\"...";
    }
    return "how about \"A bird flying on the moon with a red cape\"...";
  };

  return (
    <div className="fixed z-[1001] bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700/50 animate-in fade-in slide-in-from-bottom-2 duration-200"
         style={{
           left: `${position.x}px`,
           top: `${position.y}px`,
           width: '400px'
         }}>
      
      {/* Chat Input Area */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {/* Brain Icon */}
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>

          {/* List Icon */}
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>

          {/* Paperclip Icon */}
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Message Input */}
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getDefaultMessage()}
              className="w-full bg-gray-700 text-white text-sm p-2.5 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-400 resize-none"
              rows={2}
            />
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-gray-700 text-white text-xs p-1.5 rounded border border-gray-600 focus:outline-none focus:border-gray-400"
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
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-1.5 rounded-lg transition-colors text-xs"
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

export default NodeChatArea;
