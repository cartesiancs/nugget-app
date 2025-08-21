import { useState } from "react";
import { assets } from "../../assets/assets";

function FlowWidgetBottomToolbar({ onAddNode }) {
  const [addMenuExpanded, setAddMenuExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState("cursor"); // Track selected tool

  const handleToolSelect = (toolName) => {
    setSelectedTool(toolName);
  };

  return (
    <>
      {/* Add Menu Toolbar - appears above main toolbar */}
      {addMenuExpanded && (
        <div className='fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[1002] animate-in fade-in slide-in-from-bottom-2 duration-200'>
          <div
            className='flex items-center gap-2 rounded-2xl px-3 py-2 shadow-2xl'
            style={{ background: "#18191CB2", backdropFilter: "blur(20px)" }}
          >
            {/* Add Image */}
            <img
              src={assets.ImageIcon}
              onClick={() => {
                onAddNode("image");
                setAddMenuExpanded(false);
              }}
              className='h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Image'
              alt='Add Image'
            />

            {/* Add Video */}
            <img
              src={assets.VideoIcon}
              onClick={() => {
                onAddNode("video");
                setAddMenuExpanded(false);
              }}
              className='h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Video'
              alt='Add Video'
            />

            {/* Add Script (Text) */}
            <img
              src={assets.TextIcon}
              onClick={() => {
                onAddNode("script");
                setAddMenuExpanded(false);
              }}
              className='h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Script'
              alt='Add Script'
            />

            {/* Add Segment */}
            <img
              src={assets.AssettIcon}
              onClick={() => {
                onAddNode("segment");
                setAddMenuExpanded(false);
              }}
              className='h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Segment'
              alt='Add Segment'
            />

            {/* Add Concept */}
            <img
              src={assets.BrushIcon}
              onClick={() => {
                onAddNode("concept");
                setAddMenuExpanded(false);
              }}
              className='h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Concept'
              alt='Add Concept'
            />
          </div>
        </div>
      )}

      {/* Main Floating Bottom Toolbar */}
      <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1001]'>
        <div
          className='flex items-center gap-2 rounded-2xl px-3 py-2 shadow-2xl'
          style={{ background: "#18191CB2", backdropFilter: "blur(20px)" }}
        >
          {/* Cursor/Select Tool */}
          <img
            src={assets.CursorIcon}
            onClick={() => handleToolSelect("cursor")}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "cursor"
                ? "bg-cyan-500/50 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Select Tool'
            alt='Cursor Tool'
          />

          {/* Hand/Pan Tool */}
          <img
            src={assets.HandIcon}
            onClick={() => handleToolSelect("hand")}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "hand"
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Hand Tool'
            alt='Hand Tool'
          />

          {/* Assets/Grid Tool */}
          <img
            src={assets.AssettIcon}
            onClick={() => handleToolSelect("assets")}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "assets"
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Assets'
            alt='Assets Tool'
          />

          {/* Separator */}
          <div className='h-6 w-px bg-gray-600/50 mx-1'></div>

          {/* Add/Plus Tool */}
          <img
            src={assets.AddIcon}
            onClick={() => setAddMenuExpanded(!addMenuExpanded)}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              addMenuExpanded
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20 "
                : "hover:bg-gray-700/50"
            }`}
            title='Add Elements'
            alt='Add Tool'
          />

          {/* Separator */}
          <div className='h-6 w-px bg-gray-600/50 mx-1'></div>

          {/* Palette/Color Tool */}
          <img
            src={assets.PaletteIcon}
            onClick={() => handleToolSelect("palette")}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "palette"
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Color Palette'
            alt='Palette Tool'
          />

          {/* Brush/Edit Tool */}
          <img
            src={assets.BrushIcon}
            onClick={() => handleToolSelect("brush")}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "brush"
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Brush Tool'
            alt='Brush Tool'
          />

          {/* Comment/Chat Tool */}
          <img
            src={assets.CommentIcon}
            onClick={() => handleToolSelect("comment")}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "comment"
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Comments'
            alt='Comment Tool'
          />
        </div>
      </div>
    </>
  );
}

export default FlowWidgetBottomToolbar;
