import React, { useState, useEffect } from "react";
import { Handle } from "@xyflow/react";
import { User, Edit3, MessageSquare, Lightbulb } from "lucide-react";

function UserNode({ data, isConnectable, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.userText || "");

  // Update text when data changes
  useEffect(() => {
    if (data.userText && data.userText !== text) {
      setText(data.userText);
    }
  }, [data.userText]);

  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = text && text.trim().length > 0;
  const isNewNode = nodeState === 'new';

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    saveUserText(text);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      saveUserText(text);
    }
  };

  const saveUserText = (newText) => {
    // Save to localStorage with project ID using new structure
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      if (storedProject) {
        const project = JSON.parse(storedProject);
        const userNodeDataKey = `userNodeData-${project.id}`;
        const existingUserNodeData = JSON.parse(localStorage.getItem(userNodeDataKey) || '{}');
        
        const nodeId = data.id || `user-${Date.now()}`;
        existingUserNodeData[nodeId] = {
          projectId: project.id,
          text: newText
        };
        
        localStorage.setItem(userNodeDataKey, JSON.stringify(existingUserNodeData));
        
        // Update node data if onChange callback exists
        if (data.onChange) {
          data.onChange(newText);
        }
      }
    } catch (e) {
      console.error('Error saving user node data:', e);
    }
  };

  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Concept
        </h1>
      </div>

      <div
        className={`rounded-2xl p-4 w-[280px] h-[280px] relative transition-all duration-200 ${
          selected ? (hasData ? "ring-2 ring-blue-500" : "ring-2 ring-gray-600") : ""
        }`}
        style={{
          background: hasData ? "#1a1a2e" : "#1a1a1a",
          border: hasData ? "1px solid #3b82f6" : "1px solid #333",
          boxShadow: selected && hasData ? "0 0 20px rgba(59, 130, 246, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          id="input"
          style={{
            background: hasData ? "#3b82f6" : "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            top: -8,
          }}
          isConnectable={isConnectable}
        />

        {isEditing ? (
          <div className='space-y-4'>
            <div className='flex items-center space-x-2 mb-4'>
              <User size={20} className='text-blue-400' />
              <span className='text-sm font-medium text-blue-400'>Your Input</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className='w-full h-32 bg-gray-800/50 text-white text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-gray-600'
              autoFocus
              placeholder='Enter your concept or idea...'
            />
          </div>
        ) : hasData ? (
          <>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <User size={20} className='text-blue-400' />
                <span className='text-sm font-medium text-blue-400'>Your Input</span>
              </div>
              <Edit3 size={14} className='text-gray-500' />
            </div>

            {/* Content */}
            <div className='text-gray-200 text-sm leading-relaxed'>
              {text}
            </div>
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className='flex flex-col items-center justify-center h-full text-center space-y-4'>
              <User size={32} className='text-gray-500' />
              <div className='space-y-2'>
                <div className='text-gray-400 text-sm font-medium'>Start with your concept</div>
                <div className='text-gray-500 text-xs'>Double-click to add your idea</div>
              </div>
            </div>
          </>
        )}

        {/* Output Handle - Bottom side */}
        <Handle
          type='source'
          position='bottom'
          id="output"
          style={{
            background: hasData ? "#3b82f6" : "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            bottom: -8,
          }}
          isConnectable={isConnectable}
        />
      </div>
    </div>
  );
}

export default UserNode;