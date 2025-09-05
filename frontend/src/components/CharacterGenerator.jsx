import { useState, useRef, useEffect } from "react";
import { characterGenApi } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import { CLOUDFRONT_URL, CDN_BASE_URL } from "../config/baseurl.js";

function CharacterGenerator({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("generate"); // "generate", "characters", or "videos"
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [characterConfig, setCharacterConfig] = useState({
    visualPrompt: "",
    artStyle: "fantasy digital art, detailed, vibrant colors",
    name: "",
    description: ""
  });
  const [videoConfig, setVideoConfig] = useState({
    animationPrompt: "",
    artStyle: "fantasy digital art, detailed, vibrant colors"
  });
  const [selectedCharacterForVideo, setSelectedCharacterForVideo] = useState(null);
  const [generatedVideos, setGeneratedVideos] = useState([]);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState([]);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const loadCharacters = async () => {
    setLoadingCharacters(true);
    setError(null);
    try {
      const response = await characterGenApi.getAllCharacters();
      console.log('Characters API response:', response);
      if (response.success && response.characters) {
        console.log('Characters data:', response.characters);
        setCharacters(response.characters);
      }
    } catch (err) {
      setError(`Failed to load characters: ${err.message}`);
    } finally {
      setLoadingCharacters(false);
    }
  };

  const handleGenerateVideo = async (character) => {
    if (!videoConfig.animationPrompt.trim()) {
      setError("Please enter an animation prompt");
      return;
    }

    setIsGeneratingVideo(true);
    setError(null);
    setSelectedCharacterForVideo(character);

    // Debug: Log character data structure
    console.log('Character data for video generation:', {
      id: character.id,
      name: character.name,
      finalCharacterS3Key: character.finalCharacterS3Key,
      final_character_s3_key: character.final_character_s3_key,
      final_character_url: character.final_character_url,
      spriteSheetS3Key: character.spriteSheetS3Key,
      sprite_sheet_s3_key: character.sprite_sheet_s3_key,
      sprite_sheet_url: character.sprite_sheet_url
    });

    try {
      console.log('Starting manual video generation for character:', character);
      console.log('Video config:', videoConfig);
      
      const videoResult = await characterGenApi.generateVideo({
        animation_prompt: videoConfig.animationPrompt,
        art_style: videoConfig.artStyle,
        imageS3Key: character.finalCharacterS3Key,
        uuid: `${character.id}-video-${Date.now()}`,
        projectId: "default" // You can make this configurable if needed
      });

      if (videoResult.success) {
        setError(null);
        // Store the generated video info
        setGeneratedVideos(prev => [...prev, {
          id: videoResult.s3Keys?.[0] || videoResult.model,
          characterId: character.id,
          characterName: character.name,
          animationPrompt: videoConfig.animationPrompt,
          artStyle: videoConfig.artStyle,
          status: 'generating',
          timestamp: new Date().toISOString(),
          model: videoResult.model,
          totalVideos: videoResult.totalVideos
        }]);
        alert(`Video generation started! Model: ${videoResult.model}, Total Videos: ${videoResult.totalVideos}`);
      }
    } catch (err) {
      setError(`Video generation failed: ${err.message}`);
    } finally {
      setIsGeneratingVideo(false);
      setSelectedCharacterForVideo(null);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "characters") {
      loadCharacters();
    }
  }, [isOpen, activeTab]);

  // Cleanup file preview URLs when component unmounts
  useEffect(() => {
    return () => {
      filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviewUrls]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length !== 6) {
      setError("Please select exactly 6 images");
      return;
    }
    setSelectedFiles(files);
    setError(null);
    
    // Create preview URLs for selected files
    const urls = files.map(file => URL.createObjectURL(file));
    setFilePreviewUrls(urls);
  };

  const handleGenerate = async () => {
    if (selectedFiles.length !== 6) {
      setError("Please select exactly 6 images");
      return;
    }

    if (!characterConfig.visualPrompt.trim()) {
      setError("Please enter a visual prompt");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Step 1: Generate UUID and get presigned URLs (10%)
      setProgress(10);
      const uuid = generateUUID();
      const { keys, putUrls } = await characterGenApi.getPresignedUrls({ uuid });

      // Step 2: Upload images (30%)
      setProgress(30);
      const uploadPromises = selectedFiles.map(async (file, index) => {
        await characterGenApi.uploadImageToS3(file, putUrls[index]);
      });
      await Promise.all(uploadPromises);

      // Step 3: Start character generation (50%)
      setProgress(50);
      const characterData = {
        visual_prompt: characterConfig.visualPrompt,
        art_style: characterConfig.artStyle,
        uuid: uuid,
        reference_images: keys,
        name: characterConfig.name || "Generated Character",
        description: characterConfig.description || "AI-generated character"
      };

      const generationResult = await characterGenApi.startCharacterGeneration(characterData);

      // Step 4: Complete (100%)
      setProgress(100);
      setResult(generationResult);

      // Step 5: Automatically generate video from the final character
      if (generationResult.success && generationResult.video_generation_ready) {
        try {
          console.log('Starting automatic video generation for character:', generationResult.character_id);
          const videoResult = await characterGenApi.generateVideo({
            animation_prompt: "The character moves naturally with confidence and grace",
            art_style: characterConfig.artStyle,
            imageS3Key: generationResult.finalCharacterS3Key,
            uuid: `${generationResult.character_id}-video`,
            projectId: "default" // You can make this configurable if needed
          });

          console.log('Video generation result:', videoResult);

          if (videoResult.success) {
            setGeneratedVideos(prev => [...prev, {
              id: videoResult.s3Keys?.[0] || videoResult.model,
              characterId: generationResult.character_id,
              characterName: characterConfig.name || "Generated Character",
              animationPrompt: "The character moves naturally with confidence and grace",
              artStyle: characterConfig.artStyle,
              status: 'generating',
              timestamp: new Date().toISOString(),
              model: videoResult.model,
              totalVideos: videoResult.totalVideos
            }]);
            console.log('Video added to generated videos list');
          }
        } catch (videoErr) {
          console.error('Video generation failed:', videoErr);
          // Don't show error to user since character generation was successful
        }
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setFilePreviewUrls([]);
    setCharacterConfig({
      visualPrompt: "",
      artStyle: "fantasy digital art, detailed, vibrant colors",
      name: "",
      description: ""
    });
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1002]">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Character Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 font-medium ${
              activeTab === "generate"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Generate New
          </button>
          <button
            onClick={() => setActiveTab("characters")}
            className={`px-4 py-2 font-medium ${
              activeTab === "characters"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            My Characters
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2 font-medium ${
              activeTab === "videos"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Generated Videos ({generatedVideos.length})
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === "generate" && (
          <>
            {result ? (
              <div className="space-y-4">
                                  <div className="text-center">
                    <div className="text-green-400 text-lg font-semibold mb-2">
                      Character Generated Successfully!
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p><strong>Character ID:</strong> {result.character_id}</p>
                      <p><strong>Model:</strong> {result.model}</p>
                      {result.video_generation_ready && (
                        <div className="text-green-400">
                          <p>✅ Video generation ready!</p>
                          <p className="text-yellow-400 text-xs mt-1">🎬 Video generation started automatically</p>
                        </div>
                      )}
                    </div>
                  </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Sprite Sheet
                    </label>
                    <img
                      src={result.sprite_sheet_url || `${CLOUDFRONT_URL}/${result.spriteSheetS3Key}`}
                      alt="Sprite Sheet"
                      className="w-full h-48 object-contain rounded border border-gray-700 bg-gray-800"
                      onError={(e) => {
                        e.target.src = `${CDN_BASE_URL}/${result.spriteSheetS3Key}`;
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Final Character
                    </label>
                    <img
                      src={result.final_character_url || `${CLOUDFRONT_URL}/${result.finalCharacterS3Key}`}
                      alt="Final Character"
                      className="w-full h-48 object-contain rounded border border-gray-700 bg-gray-800"
                      onError={(e) => {
                        e.target.src = `${CDN_BASE_URL}/${result.finalCharacterS3Key}`;
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Generate Another
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("characters");
                      loadCharacters();
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-medium"
                  >
                    View All Characters
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload 6 Reference Images
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                    disabled={isGenerating}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-400 mb-2">
                        Selected {selectedFiles.length}/6 images
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {filePreviewUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-600"
                            />
                            <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visual Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Visual Prompt *
                  </label>
                  <textarea
                    value={characterConfig.visualPrompt}
                    onChange={(e) => setCharacterConfig(prev => ({ ...prev, visualPrompt: e.target.value }))}
                    placeholder="Describe your character (e.g., A brave warrior with golden armour and flowing red cape)"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows="3"
                    disabled={isGenerating}
                  />
                </div>

                {/* Art Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Art Style
                  </label>
                  <input
                    type="text"
                    value={characterConfig.artStyle}
                    onChange={(e) => setCharacterConfig(prev => ({ ...prev, artStyle: e.target.value }))}
                    placeholder="fantasy digital art, detailed, vibrant colors"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={isGenerating}
                  />
                </div>

                {/* Character Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={characterConfig.name}
                    onChange={(e) => setCharacterConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Golden Warrior"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={isGenerating}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={characterConfig.description}
                    onChange={(e) => setCharacterConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Legendary hero with mystical powers"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows="2"
                    disabled={isGenerating}
                  />
                </div>

                {/* Progress */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Generating character...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedFiles.length !== 6 || !characterConfig.visualPrompt.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4">
                          <LoadingSpinner />
                        </div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      "Generate Character"
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Characters Tab */}
        {activeTab === "characters" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">My Characters</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => console.log('Characters data:', characters)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                >
                  Debug Data
                </button>
                <button
                  onClick={() => setActiveTab("generate")}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                >
                  Generate New
                </button>
              </div>
            </div>
            
            {loadingCharacters ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-300">Loading characters...</span>
              </div>
            ) : characters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No characters found</p>
                <button
                  onClick={() => setActiveTab("generate")}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium"
                >
                  Generate Your First Character
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map((character) => (
                    <div
                      key={character.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-lg">
                          {character.name || "Unnamed Character"}
                        </h3>
                        {character.video_generation_ready && (
                          <span className="text-green-400 text-xs">🎬 Video Ready</span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <p className="text-gray-300 text-sm">
                          {character.description || "No description"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          <strong>Style:</strong> {character.artStyle || "Default"}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        {(() => {
                          const imageUrl = character.final_character_url || 
                            (character.finalCharacterS3Key && `${CLOUDFRONT_URL}/${character.finalCharacterS3Key}`);
                          
                          return imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={character.name || "Character"}
                              className="w-full h-32 object-contain rounded border border-gray-600 bg-gray-700"
                              onError={(e) => {
                                if (character.finalCharacterS3Key) {
                                  e.target.src = `${CDN_BASE_URL}/${character.finalCharacterS3Key}`;
                                } else {
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">No image available</span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCharacterForVideo(character);
                            setVideoConfig({
                              animationPrompt: "",
                              artStyle: character.artStyle || "fantasy digital art, detailed, vibrant colors"
                            });
                          }}
                          disabled={isGeneratingVideo}
                          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
                        >
                          {isGeneratingVideo && selectedCharacterForVideo?.id === character.id ? (
                            <>
                              <div className="w-3 h-3">
                                <LoadingSpinner />
                              </div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <span>🎬</span>
                              <span>Generate Video</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("generate");
                            setCharacterConfig({
                              visualPrompt: character.visualPrompt || "",
                              artStyle: character.artStyle || "fantasy digital art, detailed, vibrant colors",
                              name: character.name || "",
                              description: character.description || ""
                            });
                          }}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video Generation Modal */}
                {selectedCharacterForVideo && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1003]">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Generate Video for {selectedCharacterForVideo.name || "Character"}
                        </h3>
                        <button
                          onClick={() => setSelectedCharacterForVideo(null)}
                          className="text-gray-400 hover:text-white text-xl"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Animation Prompt *
                          </label>
                          <textarea
                            value={videoConfig.animationPrompt}
                            onChange={(e) => setVideoConfig(prev => ({ ...prev, animationPrompt: e.target.value }))}
                            placeholder="The warrior walks forward with confidence, sword raised high"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            rows="3"
                            disabled={isGeneratingVideo}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Art Style
                          </label>
                          <input
                            type="text"
                            value={videoConfig.artStyle}
                            onChange={(e) => setVideoConfig(prev => ({ ...prev, artStyle: e.target.value }))}
                            placeholder="fantasy digital art, detailed, vibrant colors"
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            disabled={isGeneratingVideo}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerateVideo(selectedCharacterForVideo)}
                            disabled={isGeneratingVideo || !videoConfig.animationPrompt.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium"
                          >
                            {isGeneratingVideo ? "Generating..." : "Generate Video"}
                          </button>
                          <button
                            onClick={() => setSelectedCharacterForVideo(null)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded font-medium"
                            disabled={isGeneratingVideo}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Generated Videos</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => console.log('Generated videos:', generatedVideos)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                >
                  Debug
                </button>
                <button
                  onClick={() => setActiveTab("characters")}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                >
                  Generate More
                </button>
              </div>
            </div>
            
            {generatedVideos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No videos generated yet</p>
                <button
                  onClick={() => setActiveTab("characters")}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-medium"
                >
                  Generate Videos from Characters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">
                          Video for {video.characterName || "Character"}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          video.status === 'generating' 
                            ? 'bg-yellow-600 text-yellow-100' 
                            : 'bg-green-600 text-green-100'
                        }`}>
                          {video.status === 'generating' ? '🔄 Generating' : '✅ Complete'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <p className="text-gray-300 text-sm">
                          <strong>Animation:</strong> {video.animationPrompt}
                        </p>
                        <p className="text-gray-400 text-xs">
                          <strong>Style:</strong> {video.artStyle}
                        </p>
                        <p className="text-gray-400 text-xs">
                          <strong>Model:</strong> {video.model || 'Unknown'}
                        </p>
                        <p className="text-gray-400 text-xs">
                          <strong>Videos:</strong> {video.totalVideos || 1}
                        </p>
                        <p className="text-gray-400 text-xs">
                          <strong>Created:</strong> {new Date(video.timestamp).toLocaleString()}
                        </p>
                      </div>

                      {video.status === 'generating' && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <div className="w-4 h-4">
                            <LoadingSpinner />
                          </div>
                          <span>Video generation in progress...</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterGenerator; 