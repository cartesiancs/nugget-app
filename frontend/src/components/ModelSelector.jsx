import React, { useState } from 'react';
import { chatApi } from '../services/chat';

const ModelSelector = ({ 
  genType, 
  selectedModel, 
  onModelChange, 
  disabled = false,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableModels = chatApi.getAvailableModels(genType);

  const handleModelSelect = (modelKey) => {
    onModelChange(modelKey);
    setIsOpen(false);
  };

  const selectedModelInfo = availableModels[selectedModel];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-gray-700 border border-gray-600 rounded-md 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 cursor-pointer'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              {selectedModelInfo?.name || 'Select Model'}
            </div>
            <div className="text-xs text-gray-400">
              {selectedModelInfo?.provider || ''}
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
          <div className="py-1">
            {Object.entries(availableModels).map(([modelKey, modelInfo]) => (
              <button
                key={modelKey}
                onClick={() => handleModelSelect(modelKey)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none
                  ${selectedModel === modelKey ? 'bg-blue-600 text-white' : 'text-gray-300'}
                `}
              >
                <div className="text-sm font-medium">{modelInfo.name}</div>
                <div className="text-xs text-gray-400">{modelInfo.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {genType === 'IMAGE' && modelInfo.imageSize && `Size: ${modelInfo.imageSize}`}
                  {genType === 'VIDEO' && modelInfo.duration && `Duration: ${modelInfo.duration}`}
                  {genType === 'VIDEO' && modelInfo.resolution && ` • Resolution: ${modelInfo.resolution}`}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector; 