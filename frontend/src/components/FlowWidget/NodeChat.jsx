import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { chatApi } from "../../services/chat";
import ModelSelector from "../ModelSelector";
import LoadingSpinner from "../LoadingSpinner";

const NodeChat = ({ nodeId, nodeType, isOpen, onClose, onSendMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (!nodeType) return "recraft-v3";
    const genType = nodeType === "image" ? "IMAGE" : nodeType === "video" ? "VIDEO" : "IMAGE";
    return chatApi.getDefaultModel(genType) || "recraft-v3";
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when node changes
  useEffect(() => {
    if (isOpen && nodeId && nodeType) {
      setMessages([
        {
          id: 1,
          type: "assistant",
          content: `Hello! I'm here to help you with this ${nodeType}. What would you like to do?`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      
      // Update selected model based on node type
      const genType = nodeType === "image" ? "IMAGE" : nodeType === "video" ? "VIDEO" : "IMAGE";
      const defaultModel = chatApi.getDefaultModel(genType);
      if (defaultModel) {
        setSelectedModel(defaultModel);
      }
    }
  }, [isOpen, nodeId, nodeType]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the parent's onSendMessage callback
      if (onSendMessage) {
        await onSendMessage(inputMessage, nodeType, selectedModel);
      }

      // Add a simple response for now
      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: `I understand you want to work with this ${nodeType || 'node'}. I'll process your request: "${inputMessage}"`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'a':
          // Select all text
          e.preventDefault();
          if (textareaRef.current) {
            textareaRef.current.select();
            textareaRef.current.setSelectionRange(0, textareaRef.current.value.length);
          }
          break;
        case 'x':
          // Cut text
          e.preventDefault();
          if (textareaRef.current && textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const selectedText = inputMessage.substring(start, end);
            
            // Copy to clipboard
            navigator.clipboard.writeText(selectedText).then(() => {
              // Remove selected text
              const newMessage = inputMessage.substring(0, start) + inputMessage.substring(end);
              setInputMessage(newMessage);
              
              // Set cursor position
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.setSelectionRange(start, start);
                }
              }, 0);
            }).catch(err => {
              console.error('Failed to copy text: ', err);
              // Fallback: just remove the text
              const newMessage = inputMessage.substring(0, start) + inputMessage.substring(end);
              setInputMessage(newMessage);
            });
          }
          break;
        case 'v':
          // Paste text - let default behavior handle this
          break;
        default:
          break;
      }
    }
    
    // Handle Enter key for sending message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-[800px] h-[600px] max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Chat with {nodeType ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : 'Node'}
            </h3>
            <p className="text-sm text-gray-400">ID: {nodeId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            AI Model
          </label>
          <ModelSelector
            genType={nodeType === "image" ? "IMAGE" : nodeType === "video" ? "VIDEO" : "IMAGE"}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : message.isError
                    ? "bg-red-600 text-white"
                    : "bg-gray-700 text-gray-200"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <LoadingSpinner />
                  <span className="text-gray-300 text-sm">Processing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask me about this ${nodeType || 'node'}...`}
              className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NodeChat;
