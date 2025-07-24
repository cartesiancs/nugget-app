import { useState, useEffect } from "react";
import ConfirmationPrompt from "./ConfirmationPrompt";
import SegmentList from "./SegmentList";
import ComparisonView from "./ComparisonView";
import SegmentDetail from "./SegmentDetail";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import { ProjectHistoryDropdown } from "./ProjectHistoryDropdown";
import { webInfoApi } from "../services/web-info";
import { conceptWriterApi } from "../services/concept-writer";
import { segmentationApi } from "../services/segmentationapi";
import { imageApi } from "../services/image";
import { s3Api } from "../services/s3";
import { videoApi } from "../services/video-gen";

function ChatWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [error, setError] = useState(null);
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null); // eslint-disable-line no-unused-vars
  const [askImageConfirm, setAskImageConfirm] = useState(false);
  const [askVideoConfirm, setAskVideoConfirm] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({});
  const [videosReady, setVideosReady] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  const [timelineProgress, setTimelineProgress] = useState({
    expected: 0,
    added: 0,
  });

  const [addingTimeline, setAddingTimeline] = useState(false); // show loader while adding
  const [showProjectHistory, setShowProjectHistory] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      try {
        setStoredVideosMap(
          JSON.parse(localStorage.getItem("segmentVideos") || "{}"),
        );
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (window?.electronAPI?.res?.timeline?.add) {
      window.electronAPI.res.timeline.add((_evt, payload) => {
        setTimelineProgress((prev) => ({
          ...prev,
          added: prev.added + Object.keys(payload || {}).length,
        }));
      });
    }
  }, []);

  // -- Removed legacy "previous flow" block --

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    localStorage.removeItem("segments");
    localStorage.removeItem("segmentImages");
    localStorage.removeItem("segmentVideos");
    setStoredVideosMap({}); // reset cache so button hides until new videos ready

    setLoading(true);
    setError(null);
    setResponses(null);
    setConcepts(null);
    setSelectedConcept(null);

    try {
      console.log("Starting pipeline with web-info...");

      const webInfoResult = await webInfoApi.processWebInfo(prompt);

      console.log("Web-info response:", webInfoResult);

      console.log("Calling concept-writer...");

      const webInfoContent = webInfoResult.choices[0].message.content;
      const conceptsResult = await conceptWriterApi.generateConcepts(
        prompt,
        webInfoContent,
      );

      console.log("Concept-writer response:", conceptsResult);

      setConcepts(conceptsResult.concepts);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(error.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConceptSelect = async (concept) => {
    setSelectedConcept(concept);
    setConcepts(null);
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        segmentationApi.getSegmentation({
          prompt,
          concept: concept.title,
          negative_prompt: "",
        }),
        segmentationApi.getSegmentation({
          prompt,
          concept: concept.title,
          negative_prompt: "",
        }),
      ]);
      setResponses({ response1: res1, response2: res2 });
    } catch (e) {
      setError(e.message || "Segmentation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferResponse = async (option) => {
    const selectedResp =
      option === 1 ? responses?.response1 : responses?.response2;
    console.log("Selected response:", option, selectedResp); // Debug log

    if (!selectedResp) {
      setError("Selected response is not available");
      return;
    }

    // Update UI states immediately
    setSelectedResponse(selectedResp);
    setResponses(null);
    setSelectedSegment(null);

    // store segments and add chat message
    localStorage.setItem("segments", JSON.stringify(selectedResp.segments));

    // Add chat message
    setChatMessages([
      {
        type: "assistant",
        content: `I've selected option ${option} and created ${selectedResp.segments.length} segments. Would you like me to generate images and videos for these segments?`,
      },
    ]);
  };

  const confirmImage = () => {
    setAskImageConfirm(false);
    setChatMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: "Starting image generation for all segments...",
      },
    ]);
    generateImagesSequentially(
      selectedResponse.segments,
      selectedResponse.artStyle || "",
    );
  };

  const confirmVideo = () => {
    setAskVideoConfirm(false);
    setChatMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: "Starting video generation for all segments...",
      },
    ]);
    generateVideosSequentially(
      selectedResponse.segments,
      selectedResponse.artStyle || "",
    );
  };

  const triggerImageGeneration = () => {
    if (selectedResponse && selectedResponse.segments.length > 0) {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Starting image generation for all segments...",
        },
      ]);
      generateImagesSequentially(
        selectedResponse.segments,
        selectedResponse.artStyle || "",
      );
    }
  };

  const triggerVideoGeneration = () => {
    if (selectedResponse && selectedResponse.segments.length > 0) {
      // Check if images exist first
      const segmentsWithImages = selectedResponse.segments.filter(
        (s) => s.imageUrl,
      );
      if (segmentsWithImages.length === 0) {
        setChatMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            content:
              "❌ No images found! Please generate images first before creating videos.",
          },
        ]);
        return;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Starting video generation for all segments...",
        },
      ]);
      generateVideosSequentially(
        selectedResponse.segments,
        selectedResponse.artStyle || "",
      );
    }
  };

  // ---------------- Test helper: send hard-coded videos ----------------
  // Test helper moved to AddTestVideosButton component

  const generateImagesSequentially = async (segments, artStyle) => {
    try {
      setLoading(true);
      setGenerationProgress({});

      const imagesMap = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Update progress
        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "image",
            status: "generating",
            index: i + 1,
            total: segments.length,
          },
        }));

        // Add delay between segments (except first one)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
        }

        try {
          const result = await imageApi.generateImage({
            visual_prompt: segment.visual,
            art_style: artStyle,
            uuid: segment.id,
          });

          if (result.s3_key) {
            // Download image from S3 and create blob URL
            const imageUrl = await s3Api.downloadImage(result.s3_key);
            imagesMap[segment.id] = imageUrl;

            // Store the original S3 key for video generation
            segment.s3Key = result.s3_key;

            // Update progress to completed
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "image",
                status: "completed",
                index: i + 1,
                total: segments.length,
              },
            }));
          }
        } catch (err) {
          console.error(
            `Error generating image for segment ${segment.id}:`,
            err,
          );
          setGenerationProgress((prev) => ({
            ...prev,
            [segment.id]: {
              type: "image",
              status: "error",
              index: i + 1,
              total: segments.length,
              error: err.message,
            },
          }));
        }
      }

      // Save to localStorage with S3 keys
      const segmentsWithData = segments.map((s) => ({
        ...s,
        imageUrl: imagesMap[s.id],
        s3Key: s.s3Key,
      }));
      localStorage.setItem("segmentImages", JSON.stringify(imagesMap));
      localStorage.setItem("segmentData", JSON.stringify(segmentsWithData));

      // Update segments
      setSelectedResponse((prev) => ({ ...prev, segments: segmentsWithData }));

      // Update selected segment if it exists
      if (selectedSegment) {
        const updatedSelectedSegment = segmentsWithData.find(
          (s) => s.id === selectedSegment.id,
        );
        if (updatedSelectedSegment) {
          setSelectedSegment(updatedSelectedSegment);
        }
      } else if (segmentsWithData.length > 0) {
        setSelectedSegment(segmentsWithData[0]);
      }

      // Add completion message without showing all images
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `✅ Image generation completed! I've generated ${
            Object.keys(imagesMap).length
          } images. Click on individual segments to view their content and generate videos.`,
        },
      ]);
    } catch (e) {
      setError(e.message || "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateVideosSequentially = async (segments, artStyle) => {
    try {
      setLoading(true);
      setGenerationProgress({});

      const videosMap = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Skip if no image
        if (!segment.imageUrl) {
          continue;
        }

        // Update progress
        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "video",
            status: "generating",
            index: i + 1,
            total: segments.length,
          },
        }));

        // Add delay between segments (except first one)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay
        }

        try {
          const result = await videoApi.generateVideo({
            animation_prompt: segment.animation || segment.visual,
            art_style: artStyle,
            imageS3Key: segment.s3Key,
            uuid: segment.id,
          });

          if (result.s3Keys && result.s3Keys.length > 0) {
            // Download video from S3 and create blob URL
            const videoUrl = await s3Api.downloadVideo(result.s3Keys[0]);
            videosMap[segment.id] = videoUrl;

            // Update progress to completed
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "completed",
                index: i + 1,
                total: segments.length,
              },
            }));
          }
        } catch (err) {
          console.error(
            `Error generating video for segment ${segment.id}:`,
            err,
          );
          setGenerationProgress((prev) => ({
            ...prev,
            [segment.id]: {
              type: "video",
              status: "error",
              index: i + 1,
              total: segments.length,
              error: err.message,
            },
          }));
        }
      }

      // Save to localStorage with video URLs
      const segmentsWithVideos = segments.map((s) => ({
        ...s,
        videoUrl: videosMap[s.id],
      }));
      localStorage.setItem("segmentVideos", JSON.stringify(videosMap));
      localStorage.setItem("segmentData", JSON.stringify(segmentsWithVideos));

      // Update segments
      setSelectedResponse((prev) => ({
        ...prev,
        segments: segmentsWithVideos,
      }));

      // Update selected segment if it exists
      if (selectedSegment) {
        const updatedSelectedSegment = segmentsWithVideos.find(
          (s) => s.id === selectedSegment.id,
        );
        if (updatedSelectedSegment) {
          setSelectedSegment(updatedSelectedSegment);
        }
      }

      // Determine if all segments now have videos
      const allReady = segmentsWithVideos.every((s) => s.videoUrl);
      setVideosReady(allReady);

      // Add completion message without showing all videos
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `✅ Video generation completed! I've generated ${
            Object.keys(videosMap).length
          } videos. Click on individual segments to view their content.`,
        },
      ]);
    } catch (e) {
      setError(e.message || "Video generation failed");
    } finally {
      setLoading(false);
      setAskVideoConfirm(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  SEND VIDEOS TO TIMELINE                                           */
  /* ------------------------------------------------------------------ */
  const sendVideosToTimeline = async () => {
    if (addingTimeline) return; // guard

    let payload = [];
    if (selectedResponse) {
      payload = selectedResponse.segments
        .filter((s) => s.videoUrl)
        .sort((a, b) => a.id - b.id)
        .map((s) => ({ id: s.id, url: s.videoUrl }));
    }

    if (payload.length === 0) {
      const localVideos = JSON.parse(
        localStorage.getItem("segmentVideos") || "{}",
      );
      payload = Object.entries(localVideos)
        .map(([id, url]) => ({ id: Number(id), url }))
        .sort((a, b) => a.id - b.id);
    }

    if (payload.length === 0) {
      setChatMessages((p) => [
        ...p,
        { type: "assistant", content: "❌ No videos to add." },
      ]);
      return;
    }

    let success = false;
    setAddingTimeline(true);
    try {
      // Prefer path that asks for directory
      const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
      const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
      if (addByUrlFn) {
        console.log("[ChatWidget] Using contextBridge addByUrl", payload);
        if (addByUrlWithDir) {
          console.log(
            "[ChatWidget] Using contextBridge addByUrlWithDir",
            payload,
          );
          await addByUrlWithDir(payload);
        } else {
          await addByUrlFn(payload);
        }
        success = true;
      } else if (window?.electronAPI?.req?.timeline?.addByUrl) {
        console.log(
          "[ChatWidget] Falling back to electronAPI.req.timeline.addByUrl",
          payload,
        );
        if (window.electronAPI.req.timeline.addByUrlWithDir) {
          await window.electronAPI.req.timeline.addByUrlWithDir(payload);
        } else {
          await window.electronAPI.req.timeline.addByUrl(payload);
        }
        success = true;
      } else if (window.require) {
        console.log(
          "[ChatWidget] contextBridge missing, falling back to ipcRenderer.invoke",
          payload,
        );
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", payload);
        success = true;
      } else {
        console.warn(
          "[ChatWidget] Neither window.api nor window.require found – Electron bridge unavailable.",
        );
      }
    } catch (err) {
      console.error("timeline add failed", err);
    }

    if (success) {
      setTimelineProgress({ expected: payload.length, added: 0 });
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `📥 Downloading 0/${payload.length} clips...`,
        },
      ]);
      setChatMessages((prev) => [
        ...prev,
        { type: "assistant", content: "✅ Videos added to timeline!" },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content:
            "❌ Failed to add videos to timeline (bridge unavailable or error). Check console logs.",
        },
      ]);
    }
    setAddingTimeline(false);
  };

  const canSendTimeline =
    videosReady || Object.keys(storedVideosMap).length > 0;

  useEffect(() => {
    if (timelineProgress.expected > 0) {
      if (timelineProgress.added < timelineProgress.expected) {
        setChatMessages((prev) => [
          ...prev.filter((m) => !m.content.startsWith("📥")),
          {
            type: "assistant",
            content: `📥 Downloading ${timelineProgress.added}/${timelineProgress.expected} clips...`,
          },
        ]);
      } else if (timelineProgress.added === timelineProgress.expected) {
        setChatMessages((prev) => [
          ...prev,
          { type: "assistant", content: "✅ All clips added to timeline!" },
        ]);
      }
    }
  }, [timelineProgress]);

  return (
      <div className='z-10'>
        {/* Floating chat button */}
        {!open && (
          <button
            className='fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-700 text-white text-2xl flex items-center justify-center shadow-2xl z-[1001]'
            aria-label='Open chat'
            onClick={() => setOpen(true)}
          >
            💬
          </button>
        )}

        {/* Sliding sidebar - now wider */}
        <div
          className={`fixed top-0 right-0 h-screen w-[80vw] max-w-[1200px] bg-[#0d0d0d] text-white transform transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          } z-[1000] flex flex-col shadow-xl`}
        >
          <div className='flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0 relative'>
            <h2 className='text-lg font-semibold'>Segmentation Assistant</h2>
            <div className='flex items-center gap-3 relative'>
              {isAuthenticated && (
                <>
                  {/* Project History Dropdown (left of clock) */}
                  {showProjectHistory && (
                    <div className='absolute right-12 top-10 z-[1100]'>
                      <ProjectHistoryDropdown
                        onSelect={() => setShowProjectHistory(false)}
                      />
                    </div>
                  )}
                  <button
                    className='text-white text-xl focus:outline-none mr-2 bg-transparent shadow-none border-none p-0 m-0 hover:bg-transparent'
                    title='Project History'
                    onClick={() => setShowProjectHistory((v) => !v)}
                  >
                    <span role='img' aria-label='history'>
                      🕒
                    </span>
                  </button>
                </>
              )}
              {isAuthenticated && user && (
                <div className='flex items-center gap-2'>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt='Profile'
                      className='w-6 h-6 rounded-full border border-gray-600'
                    />
                  ) : (
                    <div className='w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center'>
                      <span className='text-white text-xs font-medium'>
                        {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <span className='text-gray-300 text-sm hidden sm:block'>
                    {user.name || user.email}
                  </span>
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className='px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors'
                  title='Sign Out'
                >
                  Sign Out
                </button>
              )}
              <button
                className='text-white text-xl focus:outline-none'
                aria-label='Close chat'
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>
          {/* Show selected project name if any */}
          {isAuthenticated && (
            <>
              <ProjectLoader />
              <SelectedProjectBanner />
            </>
          )}

          <div className='flex flex-1 overflow-hidden'>
            {/* Left panel - Segment list */}
            {selectedResponse && (
              <div className='w-1/4 border-r border-gray-800 flex flex-col overflow-hidden'>
                <SegmentList
                  segments={selectedResponse.segments}
                  selectedSegmentId={selectedSegment?.id}
                  onSegmentClick={setSelectedSegment}
                />
              </div>
            )}

            {/* Main content area */}
            <div
              className={`flex-1 flex flex-col ${
                selectedResponse ? "w-3/4" : "w-full"
              }`}
            >
              <div className='flex-1 overflow-y-auto'>
                {askImageConfirm && (
                  <ConfirmationPrompt
                    message='Proceed with image generation for all segments?'
                    onConfirm={confirmImage}
                    onCancel={() => setAskImageConfirm(false)}
                    loading={loading}
                  />
                )}
                {askVideoConfirm && (
                  <ConfirmationPrompt
                    message='Proceed with video generation for the generated images?'
                    onConfirm={confirmVideo}
                    onCancel={() => setAskVideoConfirm(false)}
                    loading={loading}
                  />
                )}
                {!askImageConfirm &&
                  !askVideoConfirm &&
                  (loading ? (
                    <LoadingSpinner />
                  ) : error ? (
                    <div className='flex items-center justify-center h-full'>
                      <div className='text-red-400 text-center p-4'>
                        <p>{error}</p>
                        <button
                          onClick={() => setError(null)}
                          className='mt-2 text-sm text-blue-400 hover:text-blue-300'
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ) : selectedResponse ? (
                    <div className='flex flex-col h-full'>
                      {/* Action Bar */}
                      {!loading && (
                        <div className='p-4 border-b border-gray-800 bg-gray-900 flex gap-3'>
                          <button
                            onClick={triggerImageGeneration}
                            className='bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium'
                          >
                            Generate Images
                          </button>
                          <button
                            onClick={triggerVideoGeneration}
                            className={`px-4 py-2 rounded-md font-medium ${
                              selectedResponse.segments.some((s) => s.imageUrl)
                                ? "bg-green-600 hover:bg-green-500 text-white"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}
                            disabled={
                              !selectedResponse.segments.some((s) => s.imageUrl)
                            }
                          >
                            Generate Videos
                          </button>
                          {canSendTimeline && (
                            <button
                              onClick={sendVideosToTimeline}
                              disabled={addingTimeline}
                              className='px-3 py-2 rounded-md font-medium flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50'
                            >
                              {addingTimeline ? (
                                <>
                                  <div className='w-4 h-4'>
                                    <LoadingSpinner />
                                  </div>
                                  <span>Adding…</span>
                                </>
                              ) : (
                                "➕ Add Videos to Timeline"
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Progress Display */}
                      {Object.keys(generationProgress).length > 0 && (
                        <div className='p-4 border-b border-gray-800 bg-gray-900'>
                          <h3 className='text-sm font-semibold text-gray-300 mb-3'>
                            Generation Progress
                          </h3>
                          <div className='space-y-2'>
                            {selectedResponse.segments.map((segment) => {
                              const progress = generationProgress[segment.id];
                              if (!progress) return null;

                              return (
                                <div
                                  key={segment.id}
                                  className='flex items-center justify-between text-sm'
                                >
                                  <div className='flex items-center gap-2'>
                                    <span className='text-gray-400'>
                                      Scene {segment.id}
                                    </span>
                                    <span className='text-xs text-gray-500'>
                                      ({progress.index}/{progress.total})
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    {progress.status === "generating" && (
                                      <>
                                        <div className='w-4 h-4'>
                                          <LoadingSpinner />
                                        </div>
                                        <span className='text-blue-400'>
                                          Generating {progress.type}...
                                        </span>
                                      </>
                                    )}
                                    {progress.status === "completed" && (
                                      <span className='text-green-400'>
                                        ✓ {progress.type} completed
                                      </span>
                                    )}
                                    {progress.status === "error" && (
                                      <span className='text-red-400'>
                                        ✗ {progress.type} failed
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Segment Detail */}
                      <div className='flex-1 overflow-hidden'>
                        <SegmentDetail segment={selectedSegment} />
                      </div>
                    </div>
                  ) : chatMessages.length > 0 ? (
                    <div className='p-4 space-y-4'>
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.type === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-200"
                            }`}
                          >
                            <div>{message.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !isAuthenticated ? (
                    <div className='p-4 space-y-4'>
                      <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
                        <div className='mb-4'>
                          <h3 className='text-lg font-semibold text-white mb-2'>
                            Welcome to Usuals.ai
                          </h3>
                          <p className='text-gray-400 text-sm'>
                            Sign in to access AI-powered video creation features
                          </p>
                        </div>
                        <ChatLoginButton />
                      </div>
                    </div>
                  ) : concepts ? (
                    <div className='p-4'>
                      <h3 className='text-lg font-semibold mb-4 text-white'>
                        Choose a Concept
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {concepts.map((concept, index) => (
                          <div
                            key={index}
                            onClick={() => handleConceptSelect(concept)}
                            className='bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 hover:border-gray-600 transition-colors'
                          >
                            <h4 className='text-white font-medium text-lg mb-2'>
                              {concept.title}
                            </h4>
                            <p className='text-gray-300 text-sm mb-3'>
                              {concept.concept}
                            </p>
                            <div className='flex flex-wrap gap-2'>
                              <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>
                                Tone: {concept.tone}
                              </span>
                              <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>
                                Goal: {concept.goal}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : responses ? (
                    <ComparisonView
                      response1={responses.response1}
                      response2={responses.response2}
                      onPreferResponse={handlePreferResponse}
                    />
                  ) : (
                    <div className='p-4 space-y-4'>
                      <p className='text-gray-400 text-center'>
                        Enter a prompt to start creating your video content
                      </p>
                    </div>
                  ))}
              </div>

              {/* Input area */}
              {isAuthenticated ? (
                <form
                  className='p-4 border-t border-gray-800 bg-gray-900 flex gap-2'
                  onSubmit={handleSubmit}
                >
                  <input
                    type='text'
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (
                        e.nativeEvent &&
                        typeof e.nativeEvent.stopImmediatePropagation ===
                          "function"
                      ) {
                        e.nativeEvent.stopImmediatePropagation();
                      }
                    }}
                    placeholder='Describe your video idea...'
                    className='flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500'
                    disabled={loading}
                  />
                  <button
                    type='submit'
                    className={`rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Processing..." : "Create Video"}
                  </button>
                </form>
              ) : (
                <div className='p-4 border-t border-gray-800 bg-gray-900'>
                  <p className='text-gray-400 text-sm text-center'>
                    Sign in to use chat features
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

export default ChatWidget;