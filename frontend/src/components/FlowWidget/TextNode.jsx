import React, { useState } from "react";
import { Handle } from "@xyflow/react";
import { Edit3, Music, Image, Shuffle } from "lucide-react";

function NewTextNode({ data, isConnectable, selected, onChatClick }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.content || "Text content...");

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // Update the node data
    if (data.onChange) {
      data.onChange(text);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (data.onChange) {
        data.onChange(text);
      }
    }
  };

  const handleChatClick = () => {
    if (onChatClick) {
      onChatClick(data.id || `text-${Date.now()}`, "textNode");
    }
  };

  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Text
        </h1>
      </div>

      <div
        className={`rounded-2xl p-6 w-[240px] h-[240px] relative transition-all duration-200 ${
          selected ? "ring-2 ring-gray-600" : ""
        }`}
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
        }}
      >
        {/* Input Handle - Left side */}
        <Handle
          type='target'
          position='left'
          style={{
            background: "#ffffff",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            left: -8,
          }}
          isConnectable={isConnectable}
        />

        {/* Get started with text */}
        <div className='text-gray-400 text-sm mb-3 font-light'>
          Get started with
        </div>

        {/* Options List */}
        <div className='space-y-2'>
          <div className='flex items-center space-x-2 text-gray-300'>
            <Edit3 size={16} className='text-gray-400' />
            <span className='text-xs'>Writing a Script</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Music size={16} className='text-gray-400' />
            <span className='text-xs'>Writing Lyrics</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Image size={16} className='text-gray-400' />
            <span className='text-xs'>Describe an image</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Shuffle size={16} className='text-gray-400' />
            <span className='text-xs'>Combine Ideas</span>
          </div>
        </div>

        {/* Hidden editable content for functionality */}
        {isEditing && (
          <div className='absolute inset-0 bg-gray-900 rounded-2xl p-4 z-10'>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
              className='w-full h-full bg-transparent text-white text-sm p-2 focus:outline-none resize-none'
              autoFocus
              placeholder='Enter your text content...'
            />
          </div>
        )}

        {/* Output Handle - Right side */}
        <Handle
          type='source'
          position='right'
          style={{
            background: "#ffffff",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            right: -8,
          }}
          isConnectable={isConnectable}
        />
      </div>
    </div>
  );
}

export default NewTextNode;