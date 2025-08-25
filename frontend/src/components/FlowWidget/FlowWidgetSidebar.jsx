import React, { useState, useEffect, useRef } from "react";

function FlowWidgetSidebar({ selectedNode, onClose }) {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [nodeType, setNodeType] = useState("image");
  const [model, setModel] = useState("GPT image");
  const [light, setLight] = useState("Back-lighting");
  const [composition, setComposition] = useState("Golden Ratio");
  const [angle, setAngle] = useState("Mid Shot");
  const [style, setStyle] = useState("Anime");

  const sidebarRef = useRef(null);

  useEffect(() => {
    if (selectedNode) {
      setIsOpen(true);
      // Set default values based on node type
      if (selectedNode.type === "textNode") {
        setNodeType("text");
        setModel("GPT-4o mini");
        setPrompt(selectedNode.data?.content || "New text content...");
      } else if (
        selectedNode.type === "newImageNode" ||
        selectedNode.type === "imageNode"
      ) {
        setNodeType("image");
        setModel("recraft-v3");
        setPrompt(
          selectedNode.data?.segmentData?.visual ||
          selectedNode.data?.visual ||
            "A bird flying on the moon with a red cape zooming past an asteroid and uses its laser eyes to destroy the asteroid saving earth with animal people cheering",
        );
      } else if (
        selectedNode.type === "newVideoNode" ||
        selectedNode.type === "videoNode"
      ) {
        setNodeType("video");
        setModel("gen4-turbo");
        setPrompt(
          selectedNode.data?.segmentData?.animation ||
          selectedNode.data?.animation ||
            "A bird flying on the moon with a red cape zooming past an asteroid and uses its laser eyes to destroy the asteroid saving earth with animal people cheering",
        );
      }
    }
  }, [selectedNode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!selectedNode || !isOpen) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleRegenerate = () => {
    // TODO: Implement regeneration logic
    console.log("Regenerating with:", {
      prompt,
      nodeType,
      model,
      light,
      composition,
      angle,
      style,
    });
  };

  const handleRandomise = () => {
    // TODO: Implement randomization logic
    console.log("Randomizing settings");
  };

  const handleExport = () => {
    // TODO: Implement export logic
    console.log("Exporting node");
  };

  const handleAddToTimeline = () => {
    // Add the selected video to timeline
    if (!selectedNode) {
      console.error("No node selected");
      return;
    }
    
    if (selectedNode.type !== "videoNode") {
      console.error("Selected node is not a video node");
      return;
    }
    
    if (!selectedNode.data?.videoUrl) {
      console.error("No video URL found for the selected node. Node data:", selectedNode.data);
      return;
    }

    console.log("🎬 Adding video to timeline:", {
      videoUrl: selectedNode.data.videoUrl,
      videoId: selectedNode.data.videoId,
      segmentId: selectedNode.data.segmentId,
      nodeId: selectedNode.id
    });
    
    // Dispatch custom event to add video to timeline
    window.dispatchEvent(new CustomEvent("addVideoToTimeline", {
      detail: {
        videoUrl: selectedNode.data.videoUrl,
        videoId: selectedNode.data.videoId,
        segmentId: selectedNode.data.segmentId,
        nodeId: selectedNode.id
      }
    }));
    
    console.log("✅ Add to timeline event dispatched successfully!");
  };



  return (
    <div
      ref={sidebarRef}
      className='fixed left-4 top-20 bottom-4 rounded-xl shadow-2xl z-[1000] animate-in slide-in-from-left duration-300'
      style={{
        width: "320px",
        maxHeight: "calc(86vh - 6rem)",
        background:
          "linear-gradient(180.01deg, rgba(50, 53, 62, 0.17) 0.01%, rgba(17, 18, 21, 0.2) 109.75%)",
        border: "1px solid",
        borderImage:
          "linear-gradient(180deg, rgba(17, 18, 21, 0.1) 0%, rgba(233, 232, 235, 0.04) 100%) 1",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className='flex items-center justify-between p-3'>
        <h3 className='text-white font-medium text-xl'>Properties</h3>
      </div>

      {/* Content */}
      <div
        className='p-4 space-y-4'
        style={{ height: "calc(100% - 80px)", overflowY: "auto" }}
      >
        {/* Prompt Section */}
        <div className='space-y-3'>
          <h4
            className='text-white font-medium'
            style={{
              fontFamily: "Inter",
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            Prompt
          </h4>
          <div style={{ width: "100%", height: "80px" }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className='w-full h-full text-white rounded-lg p-3 resize-none focus:outline-none'
              style={{
                fontSize: "14px",
                fontFamily: "Inter",
                background:"linear-gradient(180.01deg, rgba(50, 53, 62, 0.17) 0.01%, rgba(17, 18, 21, 0.2) 109.75%)",
                border: "none", 
                backdropFilter: "blur(10px)",
              }}
              placeholder='Enter your prompt here...'
            />
          </div>
        </div>

        {/* Settings */}
        <div className='space-y-4'>
          {/* Node Type */}
          <div className='flex items-center justify-between'>
            <label
              className='text-white'
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Node Type
            </label>
            <span
              className='text-white font-medium '
              style={{ fontSize: "14px", fontFamily: "Inter" }}
            >
              {nodeType}
            </span>
          </div>

          {/* Model */}
          <div className='flex items-center justify-between'>
            <label
              className='text-white'
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Model
            </label>
            <div className='relative'>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className='text-white rounded-lg focus:outline-none appearance-none cursor-pointer'
                style={{
                  width: "150px",
                  height: "32px",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  paddingLeft: "12px",
                  paddingRight: "32px",
                  background: "rgba(17, 18, 21, 0.5)",
                  border: "1px solid rgba(233, 232, 235, 0.2)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                }}
              >
                {nodeType === "image" ? (
                  <>
                    <option
                      value='recraft-v3'
                      style={{ background: "#1a1a1a", color: "white" }}
                    >
                      Recraft (4s)
                    </option>
                    <option
                      value='imagen'
                      style={{ background: "#1a1a1a", color: "white" }}
                    >
                      Imagen (2s)
                    </option>
                  </>
                ) : nodeType === "video" ? (
                  <>
                    <option
                      value='gen4-turbo'
                      style={{ background: "#1a1a1a", color: "white" }}
                    >
                      RunwayML (3s)
                    </option>
                    <option
                      value='kling-v2.1-master'
                      style={{ background: "#1a1a1a", color: "white" }}
                    >
                      Kling (4s)
                    </option>
                  </>
                ) : (
                  <option
                    value='GPT-4o mini'
                    style={{ background: "#1a1a1a", color: "white" }}
                  >
                    GPT-4o mini
                  </option>
                )}
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Light */}
          <div className='flex items-center justify-between'>
            <label
              className='text-white'
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Light
            </label>
            <div className='relative'>
              <select
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className='text-white rounded-lg focus:outline-none appearance-none cursor-pointer pr-8'
                style={{
                  width: "150px",
                  height: "32px",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  paddingLeft: "12px",
                  paddingRight: "32px",
                  background: "rgba(17, 18, 21, 0.3)",
                  border: "1px solid rgba(233, 232, 235, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <option value='Back-lighting'>Back-lighting</option>
                <option value='Front-lighting'>Front-lighting</option>
                <option value='Side-lighting'>Side-lighting</option>
                <option value='Natural'>Natural</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Composition */}
          <div className='flex items-center justify-between'>
            <label
              className='text-white'
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Composition
            </label>
            <div className='relative'>
              <select
                value={composition}
                onChange={(e) => setComposition(e.target.value)}
                className='text-white rounded-lg focus:outline-none appearance-none cursor-pointer pr-8'
                style={{
                  width: "150px",
                  height: "32px",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  paddingLeft: "12px",
                  paddingRight: "32px",
                  background: "rgba(17, 18, 21, 0.3)",
                  border: "1px solid rgba(233, 232, 235, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <option value='Golden Ratio'>Golden Ratio</option>
                <option value='Rule of Thirds'>Rule of Thirds</option>
                <option value='Symmetrical'>Symmetrical</option>
                <option value='Asymmetrical'>Asymmetrical</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Angle */}
          <div className='flex items-center justify-between'>
            <label
              className='text-white'
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Angle
            </label>
            <div className='relative'>
              <select
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className='text-white rounded-lg focus:outline-none appearance-none cursor-pointer pr-8'
                style={{
                  width: "150px",
                  height: "32px",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  paddingLeft: "12px",
                  paddingRight: "32px",
                  background: "rgba(17, 18, 21, 0.3)",
                  border: "1px solid rgba(233, 232, 235, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <option value='Mid Shot'>Mid Shot</option>
                <option value='Close Up'>Close Up</option>
                <option value='Wide Shot'>Wide Shot</option>
                <option value='Low Angle'>Low Angle</option>
                <option value='High Angle'>High Angle</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Style */}
          <div className='flex items-center justify-between'>
            <label
              className='text-white'
              style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontSize: "14px",
                lineHeight: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              Style
            </label>
            <div className='relative'>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className='text-white rounded-lg focus:outline-none appearance-none cursor-pointer pr-8'
                style={{
                  width: "150px",
                  height: "32px",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  paddingLeft: "12px",
                  paddingRight: "32px",
                  background: "rgba(17, 18, 21, 0.3)",
                  border: "1px solid rgba(233, 232, 235, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <option value='Anime'>Anime</option>
                <option value='Realistic'>Realistic</option>
                <option value='Cartoon'>Cartoon</option>
                <option value='Abstract'>Abstract</option>
                <option value='Photographic'>Photographic</option>
              </select>
              <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>


        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 pt-2'>
          <button
            onClick={handleRegenerate}
            className='flex-1 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium text-xs hover:opacity-80'
            style={{
              background: "rgba(233, 232, 235, 0.1)",
              border: "1px solid rgba(233, 232, 235, 0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <svg
              className='w-3 h-3'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Regenerate
          </button>

          <button
            onClick={handleRandomise}
            className='flex-1 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium text-xs hover:opacity-80'
            style={{
              background: "rgba(17, 18, 21, 0.3)",
              border: "1px solid rgba(233, 232, 235, 0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <svg
              className='w-3 h-3'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
              />
            </svg>
            Randomise
          </button>
        </div>

        {/* Conditional Export/Add to Timeline Section */}
        {selectedNode.type === "videoNode" && (
          <div className='flex items-center justify-between pt-2'>
            <span className='text-white font-medium text-sm'>Add to Timeline</span>
            <button
              onClick={handleAddToTimeline}
              className='text-white hover:text-gray-300 p-2 rounded-lg transition-colors hover:opacity-80'
              style={{
                background: "rgba(17, 18, 21, 0.2)",
                border: "1px solid rgba(233, 232, 235, 0.1)",
              }}
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 4v16m8-8H4'
                />
              </svg>
            </button>
          </div>
        )}
        {/* For image nodes, don't show any export section */}
      </div>
    </div>
  );
}

export default FlowWidgetSidebar;
