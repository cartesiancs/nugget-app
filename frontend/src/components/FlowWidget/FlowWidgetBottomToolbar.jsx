import { useState } from "react";
import { assets } from "../../assets/assets";
import Styles from "./Styles";

function FlowWidgetBottomToolbar({ onAddNode, onRefreshLayout }) {
  const [addMenuExpanded, setAddMenuExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState("cursor"); // Track selected tool
  const [stylesOpen, setStylesOpen] = useState(false); // Track styles panel visibility

  const handleToolSelect = (toolName) => {
    setSelectedTool(toolName);
  };

  return (
    <>
      {/* Styles Panel - appears above main toolbar */}
      <Styles 
        isOpen={stylesOpen} 
        onClose={() => {
          setStylesOpen(false);
          setSelectedTool("cursor"); // Reset tool selection when closing
        }} 
      />

      {/* Add Menu Toolbar - appears above main toolbar */}
      {addMenuExpanded && (
        <div className='fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[1002] animate-in fade-in slide-in-from-bottom-2 duration-200'>
          <div
            className='flex items-center gap-2 rounded-2xl px-3 py-2 shadow-2xl'
            style={{ background: "#18191CB2", backdropFilter: "blur(20px)" }}
          >
            {/* Add Concept (User Node) */}
            <img
              src={assets.ConceptIcon}
              onClick={() => {
                onAddNode("user");
                setAddMenuExpanded(false);
              }}
              className='h-8 w-8 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Concept'
              alt='Add Concept'
            />

            {/* Add Script */}
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
              src={assets.SegmentIcon}
              onClick={() => {
                onAddNode("segment");
                setAddMenuExpanded(false);
              }}
              className='h-8 w-8 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
              title='Add Segment'
              alt='Add Segment'
            />
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

          {/* Assets/Grid Tool - Coming Soon */}
          <img
            src={assets.AssettIcon}
            className='h-10 w-10 rounded-xl cursor-not-allowed transition-all duration-200 p-1 opacity-50 hover:opacity-70'
            title='Coming Soon'
            alt='Assets Tool - Coming Soon'
          />

          {/* Separator */}
          <div className='h-6 w-px bg-gray-600/50 mx-1'></div>

          {/* Add/Plus Tool */}
          <img
            src={assets.AddIcon}
            onClick={() => {
              setAddMenuExpanded(!addMenuExpanded);
              // Close styles panel if it's open
              if (stylesOpen) {
                setStylesOpen(false);
                setSelectedTool("cursor");
              }
            }}
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

          {/* Styles Tool (formerly Palette/Color Tool) */}
          <img
            src={assets.PaletteIcon}
            onClick={() => {
              handleToolSelect("palette");
              setStylesOpen(!stylesOpen);
              // Close add menu if it's open
              if (addMenuExpanded) {
                setAddMenuExpanded(false);
              }
            }}
            className={`h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 ${
              selectedTool === "palette" || stylesOpen
                ? "bg-cyan-500/30 shadow-lg shadow-cyan-500/20"
                : "hover:bg-gray-700/50 hover:shadow-md"
            }`}
            title='Styles'
            alt='Styles Tool'
          />

          {/* Brush/Edit Tool - Now functions as Refresh Layout (Click only, not selectable) */}
          <img
            src={assets.BrushIcon}
            onClick={() => {
              // Don't select the tool, just execute the action
              // Instead of full refresh, just refresh project data without losing generated nodes
              if (onRefreshLayout) {
                console.log("🎨 Brush tool clicked - refreshing project data only");
                // This should call refreshProjectData instead of createFlowElements
                onRefreshLayout();
              }
            }}
            className='h-10 w-10 rounded-xl cursor-pointer transition-all duration-200 p-1 hover:bg-gray-700/50 hover:shadow-md'
            title='Refresh Layout - Update with latest project data'
            alt='Refresh Layout Tool'
          />

          {/* Comment/Chat Tool - Coming Soon */}
          <img
            src={assets.CommentIcon}
            className='h-10 w-10 rounded-xl cursor-not-allowed transition-all duration-200 p-1 opacity-50 hover:opacity-70'
            title='Coming Soon'
            alt='Comment Tool - Coming Soon'
          />
        </div>
      </div>
    </>
  );
}

export default FlowWidgetBottomToolbar;
