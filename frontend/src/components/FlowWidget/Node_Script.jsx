import React from "react";
import { Handle } from "@xyflow/react";
import { FileText, PenTool, BookOpen, Type } from "lucide-react";

function NodeScript({ isConnectable, selected }) {
  return (
    <div className='relative'>
      {/* Title */}
      <div className='mb-4'>
        <h1 className='text-2xl font-light text-gray-500 tracking-wide'>
          Script
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
        {/* Input Handle - Top side */}
        <Handle
          type='target'
          position='top'
          style={{
            background: "#3b82f6",
            width: 16,
            height: 16,
            border: "2px solid #fff",
            top: -8,
          }}
          isConnectable={isConnectable}
        />

        {/* Get started with script */}
        <div className='text-gray-400 text-sm mb-3 font-light'>
          Get started with
        </div>

        {/* Options List */}
        <div className='space-y-2'>
          <div className='flex items-center space-x-2 text-gray-300'>
            <FileText size={16} className='text-gray-400' />
            <span className='text-xs'>Script Writing</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <PenTool size={16} className='text-gray-400' />
            <span className='text-xs'>Creative Writing</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <BookOpen size={16} className='text-gray-400' />
            <span className='text-xs'>Story Development</span>
          </div>

          <div className='flex items-center space-x-2 text-gray-300'>
            <Type size={16} className='text-gray-400' />
            <span className='text-xs'>Content Creation</span>
          </div>
        </div>

        {/* Output Handle - Bottom side */}
        <Handle
          type='source'
          position='bottom'
          style={{
            background: "#3b82f6",
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

export default NodeScript;
