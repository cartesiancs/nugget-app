import React, { useState, useEffect, useRef } from "react";

function FlowWidgetSidebar({ selectedNode, onClose, onRegenerate }) {
  const [isOpen, setIsOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [nodeType, setNodeType] = useState("image");
  const [model, setModel] = useState("GPT image");
  const [light, setLight] = useState("Back-lighting");
  const [composition, setComposition] = useState("Golden Ratio");
  const [angle, setAngle] = useState("Mid Shot");
  const [style, setStyle] = useState("Anime");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sidebarRef = useRef(null);
  const dropdownRef = useRef(null);

  // Model data with token usage and time information (same as chat widget)
  const modelData = {
    "gpt-2.5": { label: "Gemini 2.5 Flash", tokens: "5", time: "2" },
    "gemini-flash": { label: "Gemini Flash", tokens: "5", time: "2" },
    "gemini-pro": { label: "Gemini Pro", tokens: "4", time: "4" },
    "recraft-v3": { label: "Recraft", tokens: "1", time: "4" },
    imagen: { label: "Imagen", tokens: "2", time: "2" },
    "gen4_turbo": { label: "RunwayML", tokens: "2.5", time: "3" },
    "kling-v2.1-master": { label: "Kling", tokens: "20", time: "4" },
    "veo3": { label: "veo3", tokens: "37", time: "5" },
  };

  // Get available models based on node type
  const getAvailableModels = () => {
    if (nodeType === "image") {
      return [
        { value: "recraft-v3", label: "Recraft", tokens: "1", time: "4" },
        { value: "imagen", label: "Imagen", tokens: "2", time: "2" },
      ];
    } else if (nodeType === "video") {
      return [
        { value: "gen4_turbo", label: "RunwayML", tokens: "2.5", time: "3" },
        { value: "kling-v2.1-master", label: "Kling", tokens: "20", time: "4" },
        { value: "veo3", label: "veo3", tokens: "37", time: "5" },
      ];
    }
    return [{ value: "GPT-4o mini", label: "GPT-4o mini", tokens: "5", time: "2" }];
  };

  const handleModelSelect = (modelValue) => {
    setModel(modelValue);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          selectedNode.data?.visualPrompt ||
          selectedNode.data?.segmentData?.visual ||
          selectedNode.data?.visual ||
            "A bird flying on the moon with a red cape zooming past an asteroid and uses its laser eyes to destroy the asteroid saving earth with animal people cheering",
        );
      } else if (
        selectedNode.type === "newVideoNode" ||
        selectedNode.type === "videoNode"
      ) {
        setNodeType("video");
        setModel("gen4_turbo");
        setPrompt(
          selectedNode.data?.animationPrompt ||
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
    if (!selectedNode || !onRegenerate) {
      console.error("No selected node or onRegenerate callback");
      return;
    }

    // Create the art style from selected options
    const artStyle = `${style.toLowerCase()}, ${light.toLowerCase()}, ${composition.toLowerCase()}, ${angle.toLowerCase()}`;

    let regenerationParams;

    if (nodeType === "image") {
      regenerationParams = {
        prompt: prompt.trim() || selectedNode.data?.visualPrompt || selectedNode.data?.segmentData?.visual || "Generate a new image",
        model: model,
        artStyle: artStyle,
        light,
        composition,
        angle,
        style,
        nodeType,
        selectedNode
      };
    } else if (nodeType === "video") {
      regenerationParams = {
        prompt: prompt.trim() || selectedNode.data?.animationPrompt || selectedNode.data?.segmentData?.animation || "Generate a new video with smooth cinematic movement",
        model: model,
        artStyle: artStyle,
        light,
        composition,
        angle,
        style,
        nodeType,
        selectedNode
      };
    } else {
      console.error("Unsupported node type for regeneration:", nodeType);
      return;
    }

    console.log("Regenerating with:", regenerationParams);
    
    // Call the regeneration callback
    onRegenerate(regenerationParams);
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
            {/* Custom Model Selector Dropdown */}
            <div className='relative' ref={dropdownRef}>
              <button
                type='button'
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className='text-white rounded-lg focus:outline-none transition-all duration-200 cursor-pointer flex items-center justify-between overflow-hidden'
                style={{
                  width: "150px",
                  height: "32px",
                  fontSize: "14px",
                  fontFamily: "Inter",
                  paddingLeft: "12px",
                  paddingRight: "8px",
                  background: "rgba(17, 18, 21, 0.3)",
                  border: "1px solid rgba(233, 232, 235, 0.1)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span className='truncate text-white text-sm'>
                  {modelData[model]?.label || model}
                </span>
                <svg
                  className={`ml-2 flex-shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  width='10'
                  height='10'
                  viewBox='0 0 20 20'
                  fill='none'
                >
                  <path
                    stroke='#6b7280'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='1.5'
                    d='M6 8l4 4 4-4'
                  />
                </svg>
              </button>

              {/* Custom Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  className='absolute z-50 w-full rounded-lg shadow-lg overflow-hidden'
                  style={{
                    top: "calc(100% + 4px)",
                    background: "rgba(30, 30, 34, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
                    width: "150px",
                  }}
                >
                  {getAvailableModels().map((modelOption) => (
                    <div
                      key={modelOption.value}
                      onClick={() => handleModelSelect(modelOption.value)}
                      className='px-2 py-1.5 cursor-pointer transition-all duration-200 flex flex-col text-xs'
                      style={{
                        background:
                          model === modelOption.value
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background =
                          model === modelOption.value
                            ? "rgba(59, 130, 246, 0.3)"
                            : "rgba(255, 255, 255, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background =
                          model === modelOption.value
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent";
                      }}
                    >
                      <span className='text-gray-200 text-sm font-medium mb-1'>
                        {modelOption.label}
                      </span>
                      <div className='flex items-center space-x-3 text-xs text-gray-400'>
                        <div className='flex items-center space-x-1'>
                          <svg
                            width='12'
                            height='12'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
                              stroke='white'
                              strokeOpacity='0.5'
                              strokeWidth='1.33'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                            <path
                              d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
                              stroke='white'
                              strokeOpacity='0.5'
                              strokeWidth='1.33'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                          <span>{modelOption.tokens}</span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <svg
                            width='12'
                            height='12'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                          >
                            <path
                              d='M7.99984 5.33317V8.54413C7.99984 8.65809 8.05806 8.76416 8.15421 8.82535L9.99984 9.99984M14.0999 7.9999C14.0999 11.3688 11.3688 14.0999 7.9999 14.0999C4.63097 14.0999 1.8999 11.3688 1.8999 7.9999C1.8999 4.63097 4.63097 1.8999 7.9999 1.8999C11.3688 1.8999 14.0999 4.63097 14.0999 7.9999Z'
                              stroke='white'
                              strokeOpacity='0.5'
                              strokeWidth='1.5'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                            />
                          </svg>
                          <span>~{modelOption.time}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <option value='Realistic'>Realistic</option>
                <option value='Cinematic'>Cinematic</option>
                <option value='Artistic'>Artistic</option>
                <option value='Corporate'>Corporate</option>
                <option value='Vintage'>Vintage</option>
                <option value='Mordern'>Mordern</option>
                <option value='Creative'>Creative</option>
                <option value='Brand'>Brand</option>
                
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
