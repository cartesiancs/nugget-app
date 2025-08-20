import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { chatApi } from "../../services/chat";

/**
 * AddImageNode props:
 * - data: contains segmentId and segmentData
 * - onCreateNewImage: callback to create new image
 * - onImageGenerated: NEW callback to create image node automatically
 * - creatingImages: Set of segmentIds that are currently creating images
 * - hasExistingImages: boolean indicating if this segment already has images
 */
const AddImageNode = ({
  data,
  onCreateNewImage,
  onImageGenerated, // NEW PROP
  creatingImages,
  hasExistingImages = false,
  id, // Make sure we have the node ID
}) => {
  const isCreating = creatingImages && creatingImages.has(data.segmentId);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("recraft-v3"); // Updated to match your new API
  const [generatedImage, setGeneratedImage] = useState(null); // Store generated image
  const [isGenerating, setIsGenerating] = useState(false); // Loading state for generation
  const textareaRef = useRef(null);
  const nodeRef = useRef(null);

  const handleAddImage = () => {
    if (data.segmentId && data.segmentData && data.segmentData.visual) {
      // If connected to segment, open chat with pre-filled message
      setMessage(data.segmentData.visual);
      setShowChat(true);
    } else if (
      onCreateNewImage &&
      data.segmentId &&
      data.segmentData &&
      !isCreating
    ) {
      onCreateNewImage(data.segmentId, data.segmentData);
    } else {
      // For standalone nodes, just open chat
      setShowChat(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      // Get project ID from localStorage
      let projectId;
      try {
        const storedProject = localStorage.getItem(
          "project-store-selectedProject",
        );
        if (storedProject) {
          const project = JSON.parse(storedProject);
          projectId = project.id;
        }
      } catch (error) {
        console.error("Error parsing project from localStorage:", error);
      }

      if (!projectId) {
        throw new Error("No project selected. Please select a project first.");
      }

      // Generate unique UUID for this image generation
      const timestamp = Date.now();
      const uniqueUuid = data.segmentId
        ? `seg-${data.segmentId}-${timestamp}`
        : `new-image-${timestamp}`;

      console.log("🎨 Generating image with UUID:", uniqueUuid);

      // Generate image using the updated chat API
      const genResponse = await chatApi.generateImage({
        segmentId: data.segmentId,
        visual_prompt: message.trim(),
        art_style:
          data.segmentData?.artStyle ||
          "cinematic photography with soft lighting",
        project_id: projectId,
        model: selectedModel,
      });

      console.log("✅ Image generation successful:", genResponse);

      if (genResponse && (genResponse.s3_key || genResponse.s3Key)) {
        const s3Key = genResponse.s3_key || genResponse.s3Key;
        const imageUrl = `https://ds0fghatf06yb.cloudfront.net/${s3Key}`;
        const imageData = {
          url: imageUrl,
          s3Key: s3Key,
          prompt: message.trim(),
          model: selectedModel,
          id: genResponse.id || `generated-${timestamp}`, // Use response ID or generate one
          uuid: uniqueUuid,
          visualPrompt: message.trim(),
          artStyle:
            data.segmentData?.artStyle ||
            "cinematic photography with soft lighting",
          isPrimary: false, // Generated images are not primary by default
        };

        setGeneratedImage(imageData);

        console.log("🎯 Calling onImageGenerated with:", {
          segmentId: data.segmentId,
          imageData: imageData,
          segmentData: data.segmentData,
          addImageNodeId: id || `add-image-${data.segmentId}`,
        });

        // AUTO-CREATE IMAGE NODE: Call the callback to create ImageNode automatically
        if (onImageGenerated) {
          onImageGenerated({
            segmentId: data.segmentId,
            imageData: imageData,
            segmentData: {
              ...data.segmentData,
              visual: message.trim(), // Use the actual prompt used
              artStyle:
                data.segmentData?.artStyle ||
                "cinematic photography with soft lighting",
            },
            addImageNodeId: id || `add-image-${data.segmentId}`, // Reference to this node for positioning
          });
        } else {
          console.warn("⚠️ onImageGenerated callback not provided!");
        }

        // Show success message and close chat
        setTimeout(() => {
          setMessage("");
          setShowChat(false);
          // Clear generated image preview after a delay to show success
          setTimeout(() => {
            setGeneratedImage(null);
          }, 3000);
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Image generation failed:", error);
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultMessage = () => {
    // Simple return only
    return 'how about "A bird flying on the moon with a red cape"...';
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200);
      textarea.style.height = newHeight + "px";
    }
  }, [message]);

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
  };

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nodeRef.current && !nodeRef.current.contains(event.target)) {
        setShowChat(false);
      }
    };

    if (showChat) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showChat]);

  // Set initial message when chat opens
  useEffect(() => {
    if (
      showChat &&
      data.segmentId &&
      data.segmentData &&
      data.segmentData.visual
    ) {
      // Set the visual text as the actual value in the textbox
      setMessage(data.segmentData.visual);
    }
  }, [showChat, data.segmentId, data.segmentData]);

  return (
    <div className='relative' ref={nodeRef}>
      {/* Main Add Image Node or Generated Image Display */}
      <div
        className='bg-gradient-to-br from-gray-800/90 to-gray-900/95 border border-gray-600/50 rounded-xl p-4 w-56 shadow-lg backdrop-blur-sm relative transition-all duration-200 hover:border-gray-500/70 hover:shadow-2xl group cursor-pointer'
        onClick={() => setShowChat(!showChat)}
      >
        {/* Node Label */}
        <div className='absolute -top-8 left-0 text-sm font-semibold text-gray-300 bg-gray-900/90 px-2 py-1 rounded-md border border-gray-600/30'>
          {generatedImage ? "IMAGE GENERATED" : "ADD IMAGE"}
        </div>

        {/* Loader overlay when creating */}
        {(isCreating || isGenerating) && (
          <div className='absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center backdrop-blur-sm z-10'>
            <div className='text-white text-sm flex items-center gap-2'>
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              {isGenerating ? "Generating..." : "Creating..."}
            </div>
          </div>
        )}

        {generatedImage ? (
          // Show generated image preview and success state
          <div className='text-center space-y-3'>
            <div className='w-full h-32 mx-auto bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-500/30 overflow-hidden'>
              <img
                src={generatedImage.url}
                alt='Generated'
                className='w-full h-full object-cover rounded-lg'
              />
            </div>
            <div>
              <p className='text-green-400 font-medium text-sm mb-1'>
                ✅ Generated Successfully
              </p>
              <p className='text-gray-400 text-xs truncate'>
                {generatedImage.model}: {generatedImage.prompt}
              </p>
              <p className='text-blue-400 text-xs mt-1'>
                🎯 New ImageNode created →
              </p>
            </div>
          </div>
        ) : (
          // Show add image interface
          <div className='text-center space-y-3'>
            <div className='w-16 h-16 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center border border-gray-500/30 group-hover:bg-gray-600/60 transition-all duration-200'>
              <span className='text-2xl text-white'>➕</span>
            </div>
            <div>
              <p className='text-white font-medium text-sm mb-1'>
                {hasExistingImages ? "Add Another" : "Add Image"}
              </p>
              <p className='text-gray-400 text-xs'>Generate new</p>
            </div>
          </div>
        )}

        <div className='text-center mt-3'>
          <span className='text-gray-400 text-xs'>
            {data?.segmentId ? `Scene ${data.segmentId}` : "New Image"}
          </span>
        </div>

        {/* Input handle */}
        <Handle
          type='target'
          position={Position.Left}
          id='input'
          className='w-3 h-3 bg-blue-500 border-2 border-white'
        />

        {/* Output handle */}
        <Handle
          type='source'
          position={Position.Right}
          id='output'
          className='w-3 h-3 bg-blue-500 border-2 border-white'
        />
      </div>

      {/* Built-in Chat Node - using your original ChatNode styling */}
      {showChat && (
        <div
          className='absolute top-full left-1/2 transform -translate-x-1/2 mt-4 rounded-2xl shadow-2xl w-80 p-4 z-50'
          style={{
            background: "linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside chat
        >
          {/* Input Handle for chat */}
          <div
            style={{
              position: "absolute",
              background: "#3b82f6",
              width: 16,
              height: 16,
              border: "3px solid #fff",
              boxShadow: "0 0 12px rgba(59, 130, 246, 0.6)",
              zIndex: 9999,
              top: -8,
              left: "50%",
              transform: "translateX(-50%)",
              borderRadius: "50%",
            }}
          />

          {/* Main Content */}
          <div className='space-y-4'>
            {/* Message Input */}
            <form onSubmit={handleSubmit} className='space-y-3'>
              <div className='relative'>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  placeholder={getDefaultMessage()}
                  disabled={isGenerating}
                  className='w-full text-sm p-0 border-0 focus:outline-none resize-none bg-transparent placeholder-gray-500 text-gray-300 leading-relaxed overflow-hidden disabled:opacity-50'
                  style={{
                    background: "transparent",
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    minHeight: "40px",
                    maxHeight: "200px",
                  }}
                  rows={1}
                />
              </div>

              {/* Controls Row */}
              <div className='flex items-center justify-between'>
                {/* Image Engine Selector */}
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isGenerating}
                  className='text-gray-400 text-xs px-2 py-1 rounded-md focus:outline-none transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50'
                  style={{
                    background: "rgba(28, 28, 28, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 6px center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "10px",
                    paddingRight: "22px",
                    minWidth: "110px",
                  }}
                >
                  <option value='recraft-v3'>Recraft AI v3</option>
                  <option value='imagen'>Google Imagen</option>
                </select>

                {/* Action Icons */}
                <div className='flex items-center gap-0'>
                  {/* Icon 1 - Palette/Color */}
                  <button
                    type='button'
                    disabled={isGenerating}
                    className='p-1 text-gray-500 hover:text-gray-300 transition-colors duration-200 disabled:opacity-50'
                    style={{ background: "transparent" }}
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z'
                      />
                    </svg>
                  </button>

                  {/* Icon 2 - Settings/Options */}
                  <button
                    type='button'
                    disabled={isGenerating}
                    className='p-1 text-gray-500 hover:text-gray-300 transition-colors duration-200 disabled:opacity-50'
                    style={{ background: "transparent" }}
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M4 6h16M4 12h16M4 18h7'
                      />
                    </svg>
                  </button>

                  {/* Icon 3 - Attachment */}
                  <button
                    type='button'
                    disabled={isGenerating}
                    className='p-1 text-gray-500 hover:text-gray-300 transition-colors duration-200 disabled:opacity-50'
                    style={{ background: "transparent" }}
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                      />
                    </svg>
                  </button>

                  {/* Send Button */}
                  <button
                    type='submit'
                    disabled={!message.trim() || isGenerating}
                    className='p-2 rounded-lg transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed ml-1'
                    style={{
                      background:
                        message.trim() && !isGenerating
                          ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                          : "rgba(55, 65, 81, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color:
                        message.trim() && !isGenerating ? "#ffffff" : "#6b7280",
                      width: "32px",
                      height: "32px",
                    }}
                  >
                    {isGenerating ? (
                      <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        style={{ transform: "rotate(45deg)" }}
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Generation Status */}
            {isGenerating && (
              <div className='text-center text-sm text-gray-400 flex items-center justify-center gap-2'>
                <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin'></div>
                Generating with {selectedModel}...
              </div>
            )}

            {generatedImage && (
              <div className='text-center text-sm text-green-400'>
                ✅ Image generated & ImageNode created automatically!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddImageNode;
