import React, { useState, useEffect } from "react";
import { Handle } from "@xyflow/react";
import { User, Edit3, MessageSquare, Lightbulb, Target, ChevronDown, ChevronUp } from "lucide-react";

function UserNode({ data, isConnectable, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.userText || "");
  const [isExpanded, setIsExpanded] = useState(false);

  // Update text when data changes
  useEffect(() => {
    if (data.userText && data.userText !== text) {
      setText(data.userText);
    }
  }, [data.userText]);

  // Check node state and data
  const nodeState = data?.nodeState || 'new';
  const hasData = text && text.trim().length > 0;
  
  // Get concept content
  const conceptContent = text || "No user input available";
  
  // Check if there's overflow content
  const hasOverflowContent = conceptContent.length > 120;

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
          User
        </h1>
      </div>

      <div
        className={`rounded-2xl p-4 w-[280px] h-[280px] relative transition-all duration-300 ${
          selected ? "ring-2 ring-purple-500" : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          boxShadow: selected ? "0 0 20px rgba(139, 92, 246, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.5)",
        }}
        onDoubleClick={handleDoubleClick}
      >


        {isEditing ? (
          <div className='space-y-4'>
            <div className='flex items-center space-x-2 mb-4'>
              <User size={20} className='text-purple-400' />
              <span className='text-sm font-medium text-purple-400'>Your Input</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className='w-full h-32 text-white text-sm p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none border border-gray-600'
              style={{ backgroundColor: "#1a1a1a" }}
              autoFocus
              placeholder='Enter your concept or idea...'
            />
          </div>
        ) : hasData ? (
          <>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-2'>
                <User size={20} className='text-purple-400' />
                <span className='text-sm font-medium text-white'>Your Input</span>
              </div>
            </div>

            {/* Content */}
            <div className='p-2 rounded-lg' style={{ backgroundColor: "#1a1a1a" }}>
              <div className='text-gray-300 text-xs leading-relaxed'>
                {text}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className='flex flex-col items-center justify-center h-full text-center space-y-4'>
              <User size={32} className='text-gray-500' />
              <div className='space-y-2'>
                <div className='text-gray-400 text-sm font-medium'>Start with your concept</div>
                <div className='text-gray-500 text-xs'>Click to add your idea</div>
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
            background: "#ffffff",
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