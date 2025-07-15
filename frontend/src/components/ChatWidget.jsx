import { useState } from "react";
import {
  segmentationApi,
  imageApi,
  videoApi,
  webInfoApi,
  conceptWriterApi,
  s3Api,
} from "../services/api";
import ConfirmationPrompt from "./ConfirmationPrompt";
import SegmentList from "./SegmentList";
import ComparisonView from "./ComparisonView";
import SegmentDetail from "./SegmentDetail";
import LoadingSpinner from "./LoadingSpinner";

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [error, setError] = useState(null);
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [askImageConfirm, setAskImageConfirm] = useState(false);
  const [askVideoConfirm, setAskVideoConfirm] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({});
  const [chatMessages, setChatMessages] = useState([]);

  //previous flow

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!prompt.trim() || loading) return;

  //   localStorage.removeItem('segments');
  //   localStorage.removeItem('segmentImages');

  //   setLoading(true);
  //   setError(null);
  //   setResponses(null); // Reset responses

  //   try {
  //     console.log('Sending parallel requests...'); // Debug log

  //     // Make two parallel requests
  //     const results = await Promise.all([
  //       segmentationApi.getSegmentation(prompt),
  //       segmentationApi.getSegmentation(prompt)
  //     ]);

  //     console.log('Received both responses:', results); // Debug log

  //     // Validate responses
  //     if (!results[0] || !results[1]) {
  //       throw new Error('One or both responses are empty');
  //     }

  //     setResponses({
  //       response1: results[0],
  //       response2: results[1]
  //     });

  //     console.log('Set responses state:', {
  //       response1: results[0],
  //       response2: results[1]
  //     }); // Debug log

  //     setSelectedResponse(null);
  //     setSelectedSegment(null);
  //   } catch (error) {
  //     console.error('Error in handleSubmit:', error);
  //     setError(error.message || 'Failed to generate segments. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handlePreferResponse = async (option) => {
  //   const selectedResp = option === 1 ? responses?.response1 : responses?.response2;
  //   console.log('Selected response:', option, selectedResp); // Debug log

  //   if (!selectedResp) {
  //     setError('Selected response is not available');
  //     return;
  //   }

  //   // Update UI states immediately
  //   setSelectedResponse(selectedResp);
  //   setResponses(null);
  //   setSelectedSegment(null);

  //   try {
  //     // Save segments to localStorage for later use
  //     localStorage.setItem('segments', JSON.stringify(selectedResp.segments));

  //     // Trigger image generation for every segment in parallel
  //     setLoading(true);

  //     const imageResults = await Promise.all(
  //       selectedResp.segments.map((segment) => imageApi.generateImage(segment.visual))
  //     );

  //     const imagesMap = {};
  //     selectedResp.segments.forEach((segment, idx) => {
  //       const res = imageResults[idx];
  //       const url = res?.images?.[0]?.url;
  //       if (url) {
  //         imagesMap[segment.id] = url;
  //       }
  //     });

  //     // Persist generated image URLs in localStorage
  //     localStorage.setItem('segmentImages', JSON.stringify(imagesMap));

  //     console.log('Image generation completed for all segments', imagesMap);

  //     // Generate videos for all segments using their respective images
  //     const videoResults = await Promise.all(
  //       selectedResp.segments.map((segment) => {
  //         const imageUrl = imagesMap[segment.id];
  //         if (!imageUrl) return null;
  //         return videoApi.generateVideo(
  //           segment.visual,
  //           imageUrl,
  //           segment.narration
  //         );
  //       })
  //     );

  //     const videosMap = {};
  //     selectedResp.segments.forEach((segment, idx) => {
  //       const res = videoResults[idx];
  //       const url = res?.video?.url;
  //       if (url) {
  //         videosMap[segment.id] = url;
  //       }
  //     });

  //     // Persist video URLs in localStorage
  //     localStorage.setItem('segmentVideos', JSON.stringify(videosMap));

  //     console.log('Video generation completed for all segments', videosMap);

  //     // Attach generated URLs to the selected response for immediate UI use
  //     const updatedSegments = selectedResp.segments.map((segment) => ({
  //       ...segment,
  //       imageUrl: imagesMap[segment.id],
  //       videoUrl: videosMap[segment.id],
  //     }));

  //     setSelectedResponse({ ...selectedResp, segments: updatedSegments });

  //     // Select the first segment
  //     if (updatedSegments.length > 0) {
  //       setSelectedSegment(updatedSegments[0]);
  //     }
  //   } catch (err) {
  //     console.error('Error during generation:', err);
  //     setError(err.message || 'Failed to generate content. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    localStorage.removeItem("segments");
    localStorage.removeItem("segmentImages");

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
        webInfoContent
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
      selectedResponse.artStyle || ""
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
      selectedResponse.artStyle || ""
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
        selectedResponse.artStyle || ""
      );
    }
  };

  const triggerVideoGeneration = () => {
    if (selectedResponse && selectedResponse.segments.length > 0) {
      // Check if images exist first
      const segmentsWithImages = selectedResponse.segments.filter(
        (s) => s.imageUrl
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
        selectedResponse.artStyle || ""
      );
    }
  };

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
            err
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

      // Select first segment and add completion message
      if (segmentsWithData.length > 0) {
        setSelectedSegment(segmentsWithData[0]);
      }

      // Add completion message without showing all images
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `✅ Image generation completed! I've generated ${Object.keys(imagesMap).length} images. Click on individual segments to view their content and generate videos.`
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
            err
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

      // Add completion message without showing all videos
      setChatMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `✅ Video generation completed! I've generated ${Object.keys(videosMap).length} videos. Click on individual segments to view their content.`
        },
      ]);
    } catch (e) {
      setError(e.message || "Video generation failed");
    } finally {
      setLoading(false);
      setAskVideoConfirm(false);
    }
  };

  return (
    <div className="z-10">
      {/* Floating chat button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-700 text-white text-2xl flex items-center justify-center shadow-2xl z-[1001]"
          aria-label="Open chat"
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
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0">
          <h2 className="text-lg font-semibold">Segmentation Assistant</h2>
          <button
            className="text-white text-xl focus:outline-none"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Segment list */}
          {selectedResponse && (
            <div className="w-1/4 border-r border-gray-800 flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto">
              {askImageConfirm && (
                <ConfirmationPrompt
                  message="Proceed with image generation for all segments?"
                  onConfirm={confirmImage}
                  onCancel={() => setAskImageConfirm(false)}
                  loading={loading}
                />
              )}
              {askVideoConfirm && (
                <ConfirmationPrompt
                  message="Proceed with video generation for the generated images?"
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
                  <div className="flex items-center justify-center h-full">
                    <div className="text-red-400 text-center p-4">
                      <p>{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : selectedResponse && chatMessages.length === 0 ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-400 mb-2">
                        Ready to Generate Content
                      </h3>
                      <p className="text-gray-300 mb-4">
                        I've created {selectedResponse.segments.length} segments
                        for your content. Would you like me to generate images
                        and videos?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={triggerImageGeneration}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium"
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
                          Generate Videos{" "}
                          {!selectedResponse.segments.some((s) => s.imageUrl) &&
                            "(Images Required)"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : chatMessages.length > 0 ? (
                  <div className="p-4 space-y-4">
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
                          {message.images && message.images.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.images.map((imageUrl, imgIndex) => (
                                <img 
                                  key={imgIndex}
                                  src={imageUrl} 
                                  alt={`Generated image ${imgIndex + 1}`}
                                  className="rounded-lg max-w-full h-auto max-h-48 object-cover"
                                />
                              ))}
                            </div>
                          )}
                          {message.videos && message.videos.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.videos.map((videoUrl, vidIndex) => (
                                <video 
                                  key={vidIndex}
                                  src={videoUrl} 
                                  controls
                                  className="rounded-lg max-w-full h-auto max-h-48"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {selectedResponse && !loading && (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          Actions
                        </h3>
                        <div className="flex gap-3">
                          <button
                            onClick={triggerImageGeneration}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium"
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
                            Generate Videos{" "}
                            {!selectedResponse.segments.some(
                              (s) => s.imageUrl
                            ) && "(Images Required)"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : concepts ? (
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4 text-white">
                      Choose a Concept
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {concepts.map((concept, index) => (
                        <div
                          key={index}
                          onClick={() => handleConceptSelect(concept)}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 hover:border-gray-600 transition-colors"
                        >
                          <h4 className="text-white font-medium text-lg mb-2">
                            {concept.title}
                          </h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {concept.concept}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                              Tone: {concept.tone}
                            </span>
                            <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
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
                ) : selectedResponse ? (
                  <div className="flex flex-col h-full">
                    {/* Progress Display */}
                    {Object.keys(generationProgress).length > 0 && (
                      <div className="p-4 border-b border-gray-800 bg-gray-900">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3">
                          Generation Progress
                        </h3>
                        <div className="space-y-2">
                          {selectedResponse.segments.map((segment) => {
                            const progress = generationProgress[segment.id];
                            if (!progress) return null;

                            return (
                              <div
                                key={segment.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400">
                                    Scene {segment.id}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({progress.index}/{progress.total})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {progress.status === "generating" && (
                                    <>
                                      <div className="w-4 h-4">
                                        <LoadingSpinner />
                                      </div>
                                      <span className="text-blue-400">
                                        Generating {progress.type}...
                                      </span>
                                    </>
                                  )}
                                  {progress.status === "completed" && (
                                    <span className="text-green-400">
                                      ✓ {progress.type} completed
                                    </span>
                                  )}
                                  {progress.status === "error" && (
                                    <span className="text-red-400">
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
                    <div className="flex-1 overflow-hidden">
                      <SegmentDetail segment={selectedSegment} />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-gray-400">
                    Enter a prompt to start the pipeline (web-info → concept
                    selection → segmentation).
                  </div>
                ))}
            </div>

            {/* Input area */}
            <form
              className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (
                    e.nativeEvent &&
                    typeof e.nativeEvent.stopImmediatePropagation === "function"
                  ) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                }}
                placeholder="Enter your prompt to start the pipeline..."
                className="flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                className={`rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Processing..." : "Start Pipeline"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget;
