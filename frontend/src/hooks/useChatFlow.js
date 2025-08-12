import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useProjectStore } from "../store/useProjectStore";
import { webInfoApi } from "../services/web-info";
import { conceptWriterApi } from "../services/concept-writer";
import { segmentationApi } from "../services/segmentationapi";
import { chatApi } from "../services/chat";
import { s3Api } from "../services/s3";
import { projectApi } from "../services/project";
import {
  getTextCreditCost,
  getImageCreditCost,
  getVideoCreditCost,
  formatCreditDeduction,
} from "../lib/pricing";

export const useChatFlow = () => {
  const { isAuthenticated, user } = useAuth();
  const { fetchBalance } = useProjectStore();

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Project states
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });

  // Flow states
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({
    0: "pending", // concept writer
    1: "pending", // user chooses concept
    2: "pending", // script generation
    3: "pending", // user chooses script
    4: "pending", // image generation
    5: "pending", // video generation
  });

  // Content states
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});
  const [generationProgress, setGenerationProgress] = useState({});

  // Model selection states
  const [selectedImageModel, setSelectedImageModel] = useState(
    chatApi.getDefaultModel("IMAGE"),
  );
  const [selectedVideoModel, setSelectedVideoModel] = useState(
    chatApi.getDefaultModel("VIDEO"),
  );

  // Credit deduction notification state
  const [creditDeductionMessage, setCreditDeductionMessage] = useState(null);

  // Timeline states
  const [addingTimeline, setAddingTimeline] = useState(false);
  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      const stored = localStorage.getItem("project-store-selectedProject");
      if (stored) {
        const _project = JSON.parse(stored);
        return JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      }
      return JSON.parse(localStorage.getItem("segmentVideos") || "{}");
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  // Listen to localStorage changes for project selection
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("project-store-selectedProject");
        const newSelectedProject = stored ? JSON.parse(stored) : null;
        setSelectedProject(newSelectedProject);

        if (newSelectedProject) {
          setStoredVideosMap(
            JSON.parse(localStorage.getItem(`project-store-videos`) || "{}"),
          );
        } else {
          setStoredVideosMap(
            JSON.parse(localStorage.getItem("segmentVideos") || "{}"),
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Load credit balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchBalance(user.id);
    }
  }, [isAuthenticated, user?.id, fetchBalance]);

  // Load project data when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    } else {
      resetFlow();
    }
  }, [selectedProject?.id]); // Only depend on project ID to avoid infinite loops

  // Update step status based on current data
  useEffect(() => {
    if (!selectedProject) return;

    const newStepStatus = { ...stepStatus };

    // Step 0: Concept Writer - check if concepts exist
    if (concepts && concepts.length > 0) {
      newStepStatus[0] = "done";
    } else {
      newStepStatus[0] = "pending";
    }

    // Step 1: Choose Concept - check if concept is selected
    if (selectedConcept) {
      newStepStatus[1] = "done";
    } else {
      newStepStatus[1] = "pending";
    }

    // Step 2: Script Generation - check if scripts exist
    if (
      selectedScript &&
      selectedScript.segments &&
      selectedScript.segments.length > 0
    ) {
      newStepStatus[2] = "done";
    } else {
      newStepStatus[2] = "pending";
    }

    // Step 3: Choose Script - check if script is selected
    if (
      selectedScript &&
      selectedScript.segments &&
      selectedScript.segments.length > 0
    ) {
      newStepStatus[3] = "done";
    } else {
      newStepStatus[3] = "pending";
    }

    // Step 4: Image Generation - check if images exist (from API or generation)
    const hasImages =
      Object.keys(generatedImages).length > 0 ||
      selectedScript?.segments?.some(
        (seg) => seg.s3Key || seg.image_s3_key || seg.imageS3Key,
      );
    if (hasImages) {
      newStepStatus[4] = "done";
    } else {
      newStepStatus[4] = "pending";
    }

    // Step 5: Video Generation - check if videos exist (from API or generation)
    const hasVideos =
      Object.keys(generatedVideos).length > 0 ||
      selectedScript?.segments?.some((seg) => seg.videoUrl || seg.video_url);
    if (hasVideos) {
      newStepStatus[5] = "done";
    } else {
      newStepStatus[5] = "pending";
    }

    setStepStatus(newStepStatus);
  }, [
    selectedProject?.id,
    concepts,
    selectedConcept,
    scripts,
    selectedScript,
    generatedImages,
    generatedVideos,
  ]);

  const resetFlow = useCallback(() => {
    setCurrentStep(0);
    setStepStatus({
      0: "pending",
      1: "pending",
      2: "pending",
      3: "pending",
      4: "pending",
      5: "pending",
    });
    setConcepts(null);
    setSelectedConcept(null);
    setScripts(null);
    setSelectedScript(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setGenerationProgress({});
    // Reset model selections to defaults
    setSelectedImageModel(chatApi.getDefaultModel("IMAGE"));
    setSelectedVideoModel(chatApi.getDefaultModel("VIDEO"));
  }, []);

  // Helper function to show credit deduction after successful API response
  const showCreditDeduction = useCallback(
    (serviceName, model = null, count = 1) => {
      let credits = 0;
      let message = "";

      switch (serviceName) {
        case "Web Info Processing":
          credits = getTextCreditCost("web-info");
          message = formatCreditDeduction("Web Info Processing", credits);
          break;
        case "Concept Generation":
          credits = getTextCreditCost("concept generator");
          message = formatCreditDeduction("Concept Generation", credits);
          break;
        case "Script Generation":
          credits = getTextCreditCost("script & segmentation") * count;
          message = formatCreditDeduction("Script Generation", credits);
          break;
        case "Image Generation":
          if (model) {
            credits = getImageCreditCost(model) * count;
            message = formatCreditDeduction(
              `Image Generation (${model})`,
              credits,
            );
          } else {
            credits = getImageCreditCost("imagen") * count; // default to imagen
            message = formatCreditDeduction("Image Generation", credits);
          }
          break;
        case "Video Generation":
          if (model) {
            credits = getVideoCreditCost(model, 5) * count; // 8 seconds default
            message = formatCreditDeduction(
              `Video Generation (${model})`,
              credits,
            );
          } else {
            credits = getVideoCreditCost("veo2", 5) * count; // default to veo2
            message = formatCreditDeduction("Video Generation", credits);
          }
          break;
        default:
          message = `Credit deducted for ${serviceName}`;
      }

      setCreditDeductionMessage(message);
      setTimeout(() => setCreditDeductionMessage(null), 3000); // Clear after 3 seconds

      // Refresh balance if user is authenticated
      if (user?.id) {
        fetchBalance(user.id);
      }
    },
    [user?.id, fetchBalance],
  );

  // Helper function to show request failure message
  const showRequestFailed = useCallback((serviceName = null) => {
    const message = serviceName
      ? `${serviceName} request failed`
      : "Request failed";
    setCreditDeductionMessage(message);
    setTimeout(() => setCreditDeductionMessage(null), 3000);
  }, []);

  const updateStepStatus = useCallback((stepId, status) => {
    setStepStatus((prev) => ({
      ...prev,
      [stepId]: status,
    }));
  }, []);

  const runConceptWriter = useCallback(
    async (prompt) => {
      if (!prompt.trim()) {
        setError("Please enter a prompt first");
        return;
      }

      setLoading(true);
      setError(null);
      updateStepStatus(0, "loading");

      try {
        console.log("Starting pipeline with web-info...");
        const webInfoResult = await webInfoApi.processWebInfo(
          prompt,
          selectedProject?.id,
        );
        console.log("Web-info response:", webInfoResult);

        console.log("Calling concept-writer...");
        const webInfoContent = webInfoResult.choices[0].message.content;
        const conceptsResult = await conceptWriterApi.generateConcepts(
          prompt,
          webInfoContent,
          selectedProject?.id,
        );

        console.log("Concept-writer response:", conceptsResult);

        // Show combined credit deduction for both API calls (web-info + concept generation)
        const webInfoCredits = getTextCreditCost("web-info");
        const conceptCredits = getTextCreditCost("concept generator");
        const totalCredits = webInfoCredits + conceptCredits;
        const message = formatCreditDeduction(
          "Concept Writer Process",
          totalCredits,
        );

        setCreditDeductionMessage(message);
        setTimeout(() => setCreditDeductionMessage(null), 3000);

        // Refresh balance if user is authenticated
        if (user?.id) {
          fetchBalance(user.id);
        }

        setConcepts(conceptsResult.concepts);
        updateStepStatus(0, "done");
        setCurrentStep(1);
      } catch (error) {
        console.error("Error in concept writer:", error);
        showRequestFailed("Concept Generation");
        setError(
          error.message || "Failed to generate concepts. Please try again.",
        );
        updateStepStatus(0, "pending");
      } finally {
        setLoading(false);
      }
    },
    [
      selectedProject?.id,
      user?.id,
      fetchBalance,
      updateStepStatus,
      showRequestFailed,
    ],
  );

  const runScriptGeneration = useCallback(
    async (prompt) => {
      if (!selectedConcept) {
        setError("Please select a concept first");
        return;
      }

      setLoading(true);
      setError(null);
      updateStepStatus(2, "loading");

      try {
        const [res1, res2] = await Promise.all([
          segmentationApi.getSegmentation({
            prompt,
            concept: selectedConcept.title,
            negative_prompt: "",
            project_id: selectedProject?.id,
          }),
          segmentationApi.getSegmentation({
            prompt,
            concept: selectedConcept.title,
            negative_prompt: "",
            project_id: selectedProject?.id,
          }),
        ]);

        // Show credit deduction after successful API responses
        showCreditDeduction("Script Generation", null, 2);
        setScripts({ response1: res1, response2: res2 });
        updateStepStatus(2, "done");
        setCurrentStep(3);
      } catch (error) {
        console.error("Error in script generation:", error);
        showRequestFailed("Script Generation");
        setError(
          error.message || "Failed to generate scripts. Please try again.",
        );
        updateStepStatus(2, "pending");
      } finally {
        setLoading(false);
      }
    },
    [
      selectedConcept,
      selectedProject?.id,
      updateStepStatus,
      showCreditDeduction,
      showRequestFailed,
    ],
  );

  const runImageGeneration = useCallback(async () => {
    if (!selectedScript) {
      setError("Please select a script first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(4, "loading");
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const imagesMap = {};

      console.log(segments);

      // Create parallel promises for all segments
      const imagePromises = segments.map(async (segment, index) => {
        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "image",
            status: "generating",
            index: index + 1,
            total: segments.length,
          },
        }));

        console.log({
          visual_prompt: segment.visual,
          art_style: artStyle,
          uuid: segment.id,
          project_id: selectedProject?.id,
          model: selectedImageModel,
        });
        try {
          const result = await chatApi.generateImage({
            visual_prompt: segment.visual,
            art_style: artStyle,
            segmentId: segment.id,
            project_id: selectedProject?.id,
            model: selectedImageModel,
          });

          if (result.s3_key) {
            const imageUrl = await s3Api.downloadImage(result.s3_key);
            imagesMap[segment.id] = imageUrl;
            segment.s3Key = result.s3_key;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "image",
                status: "completed",
                index: index + 1,
                total: segments.length,
              },
            }));

            return { segmentId: segment.id, imageUrl, s3Key: result.s3_key };
          } else {
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "image",
                status: "error",
                index: index + 1,
                total: segments.length,
                error: "No image key returned from API",
              },
            }));
            return null;
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
              index: index + 1,
              total: segments.length,
              error: err.message,
            },
          }));
          return null;
        }
      });

      // Wait for all image generation requests to complete
      await Promise.allSettled(imagePromises);

      // Show credit deduction after successful generation for all segments
      const totalSegments = segments.length;
      showCreditDeduction(
        "Image Generation",
        selectedImageModel,
        totalSegments,
      );

      // Update segments with s3Key for video generation
      const segmentsWithS3Key = segments.map((segment) => ({
        ...segment,
        s3Key: segment.s3Key,
      }));

      setGeneratedImages(imagesMap);

      // Update selectedScript with the segments that now have s3Key
      setSelectedScript((prev) => ({
        ...prev,
        segments: segmentsWithS3Key,
      }));

      updateStepStatus(4, "done");
      setCurrentStep(5);
    } catch (error) {
      console.error("Error in image generation:", error);
      showRequestFailed("Image Generation");
      setError(error.message || "Failed to generate images. Please try again.");
      updateStepStatus(4, "pending");
    } finally {
      setLoading(false);
    }
  }, [
    selectedScript,
    selectedProject?.id,
    selectedImageModel,
    updateStepStatus,
    showCreditDeduction,
    showRequestFailed,
  ]);

  const runVideoGeneration = useCallback(async () => {
    // Check if we have any images available from the API response
    if (Object.keys(generatedImages).length === 0) {
      setError("Please generate images first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(5, "loading");
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const videosMap = {};

      // Count valid segments (those with images)
      const validSegments = segments.filter((segment) => {
        const segmentIdVariants = [
          segment.id,
          `seg-${segment.id}`,
          segment.segmentId,
          segment.uuid,
        ];
        return segmentIdVariants.some((id) => generatedImages[id]);
      });

      // Create parallel promises for all valid segments
      const videoPromises = validSegments.map(async (segment, index) => {
        // Check if this segment has an image in the generatedImages map
        // Try different segment ID formats to match with generatedImages
        const segmentIdVariants = [
          segment.id,
          `seg-${segment.id}`,
          segment.segmentId,
          segment.uuid,
        ];

        const matchingImageKey = segmentIdVariants.find(
          (id) => generatedImages[id],
        );
        if (!matchingImageKey) {
          console.log(
            `Skipping segment ${segment.id} - no image available. Tried IDs:`,
            segmentIdVariants,
          );
          return null;
        }

        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "video",
            status: "generating",
            index: index + 1,
            total: validSegments.length,
          },
        }));

        try {
          // Extract s3Key from the image URL in generatedImages
          const imageUrl = generatedImages[matchingImageKey];
          let imageS3Key = null;

          if (imageUrl && imageUrl.includes("cloudfront.net/")) {
            // Extract s3Key from CloudFront URL
            const urlParts = imageUrl.split("cloudfront.net/");
            if (urlParts.length > 1) {
              imageS3Key = urlParts[1];
            }
          }

          console.log(
            `Generating video for segment ${segment.id} with imageS3Key: ${imageS3Key}`,
          );
          const result = await chatApi.generateVideo({
            animation_prompt: segment.animation || segment.visual,
            art_style: artStyle,
            image_s3_key: imageS3Key,
            segmentId: segment.id,
            project_id: selectedProject?.id,
            model: selectedVideoModel,
          });

          console.log(
            `Video generation result for segment ${segment.id}:`,
            result,
          );

          if (result.s3_key) {
            const videoUrl = await s3Api.downloadVideo(result.s3_key);
            videosMap[segment.id] = videoUrl;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "completed",
                index: index + 1,
                total: validSegments.length,
              },
            }));

            return { segmentId: segment.id, videoUrl };
          } else {
            console.warn(`No s3_key returned for segment ${segment.id}`);
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "error",
                index: index + 1,
                total: validSegments.length,
                error: "No video key returned from API",
              },
            }));
            return null;
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
              index: index + 1,
              total: validSegments.length,
              error: err.message,
            },
          }));
          return null;
        }
      });

      // Wait for all video generation requests to complete
      await Promise.allSettled(videoPromises);

      // Show credit deduction after successful generation for valid segments
      const totalValidSegments = validSegments.length;
      if (totalValidSegments > 0) {
        showCreditDeduction(
          "Video Generation",
          selectedVideoModel,
          totalValidSegments,
        );
      }

      setGeneratedVideos(videosMap);

      updateStepStatus(5, "done");
    } catch (error) {
      console.error("Error in video generation:", error);
      showRequestFailed("Video Generation");
      setError(error.message || "Failed to generate videos. Please try again.");
      updateStepStatus(5, "pending");
    } finally {
      setLoading(false);
    }
  }, [
    generatedImages,
    selectedScript,
    selectedProject?.id,
    selectedVideoModel,
    updateStepStatus,
    showCreditDeduction,
    showRequestFailed,
  ]);

  const handleConceptSelect = useCallback(
    (concept) => {
      setSelectedConcept(concept);
      updateStepStatus(1, "done");
      setCurrentStep(2);
    },
    [updateStepStatus],
  );

  const handleScriptSelect = useCallback(
    (script) => {
      setSelectedScript(script);
      updateStepStatus(3, "done");
      setCurrentStep(4);
    },
    [updateStepStatus],
  );

  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`Loading project data for project ID: ${selectedProject.id}`);

      // Fetch project details and all related data from API
      const [
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations,
      ] = await Promise.all([
        projectApi.getProjectById(selectedProject.id),
        projectApi.getProjectConcepts(selectedProject.id, {
          page: 1,
          limit: 50,
        }),
        projectApi.getProjectImages(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectVideos(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectSegmentations(selectedProject.id, {
          page: 1,
          limit: 50,
        }),
      ]);

      console.log("Raw API responses:", {
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations,
      });

      // Set concepts if available
      if (
        projectConcepts &&
        projectConcepts.success &&
        projectConcepts.data &&
        projectConcepts.data.length > 0
      ) {
        console.log("Setting concepts:", projectConcepts.data);
        setConcepts(projectConcepts.data);
      } else {
        console.log("No concepts found in API response");
        setConcepts(null);
      }

      // Set segments/scripts if available first (we need this to map images/videos correctly)
      let segments = [];
      if (
        projectSegmentations &&
        projectSegmentations.success &&
        projectSegmentations.data &&
        projectSegmentations.data.length > 0
      ) {
        // Take the first segmentation (script) and extract its segments
        const firstSegmentation = projectSegmentations.data[0];
        if (
          firstSegmentation.segments &&
          firstSegmentation.segments.length > 0
        ) {
          segments = firstSegmentation.segments.map((seg) => ({
            id: seg.segmentId || seg.id,
            visual: seg.visual,
            animation: seg.animation,
            narration: seg.narration,
            s3Key: seg.s3Key || seg.image_s3_key || seg.imageS3Key,
            imageUrl: seg.imageUrl || seg.image_url,
            videoUrl: seg.videoUrl || seg.video_url,
          }));

          console.log("Setting selected script with segments:", segments);
          setSelectedScript({
            segments,
            artStyle: firstSegmentation.artStyle,
            concept: firstSegmentation.concept,
          });
        } else {
          console.log("No segments found in segmentation data");
          setSelectedScript(null);
        }
      } else {
        console.log("No segmentations found in API response");
        setSelectedScript(null);
      }

      // Set images if available - map to segments properly
      if (
        projectImages &&
        projectImages.success &&
        Array.isArray(projectImages.data) &&
        projectImages.data.length > 0
      ) {
        const imagesMap = {};
        projectImages.data.forEach((img) => {
          const segmentId =
            img.uuid || img.segment_id || img.segmentId || img.id;
          if (!segmentId) return;

          // Support old s3Key as well as new imageS3Key / imageS3key
          const key =
            img.s3Key || img.imageS3Key || img.imageS3key || img.image_s3_key;
          const imageUrl = key
            ? `https://ds0fghatf06yb.cloudfront.net/${key}`
            : img.url || img.imageUrl;
          if (imageUrl) {
            imagesMap[segmentId] = imageUrl;

            // update segment data so we can reuse for video generation
            const segment = segments.find((seg) => seg.id == segmentId);
            if (segment && !segment.s3Key) {
              segment.s3Key = key;
            }
          }
        });
        console.log("Setting generated images:", imagesMap);
        setGeneratedImages(imagesMap);
      } else {
        console.log("No images found in API response");
        setGeneratedImages({});
      }

      // Set videos if available - map to segments properly (supports new videoFiles array)
      if (
        projectVideos &&
        projectVideos.success &&
        Array.isArray(projectVideos.data) &&
        projectVideos.data.length > 0
      ) {
        const videosMap = {};
        projectVideos.data.forEach((video) => {
          const segmentId =
            video.uuid || video.segment_id || video.segmentId || video.id;
          if (!segmentId) return;

          let videoKey = null;
          if (Array.isArray(video.s3Keys) && video.s3Keys.length > 0) {
            videoKey = video.s3Keys[0];
          } else if (
            Array.isArray(video.videoFiles) &&
            video.videoFiles.length > 0
          ) {
            videoKey = video.videoFiles[0].s3Key;
          }

          const videoUrl = videoKey
            ? `https://ds0fghatf06yb.cloudfront.net/${videoKey}`
            : video.url || null;
          if (videoUrl) {
            videosMap[segmentId] = videoUrl;
          }
        });
        console.log("Setting generated videos:", videosMap);
        setGeneratedVideos(videosMap);
        setStoredVideosMap(videosMap);
      } else {
        console.log("No videos found in API response");
        setGeneratedVideos({});
        setStoredVideosMap({});
      }

      // Reset other states
      setSelectedConcept(null);
      setScripts(null);

      console.log("Project data loading completed");
    } catch (error) {
      console.error("Error loading project data from API:", error);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id]); // Only depend on project ID

  return {
    // States
    loading,
    error,
    setError,
    selectedProject,
    setSelectedProject,
    currentStep,
    setCurrentStep,
    stepStatus,
    concepts,
    selectedConcept,
    scripts,
    selectedScript,
    generatedImages,
    generatedVideos,
    generationProgress,
    selectedImageModel,
    setSelectedImageModel,
    selectedVideoModel,
    setSelectedVideoModel,
    creditDeductionMessage,
    addingTimeline,
    setAddingTimeline,
    storedVideosMap,

    // Actions
    resetFlow,
    updateStepStatus,
    runConceptWriter,
    runScriptGeneration,
    runImageGeneration,
    runVideoGeneration,
    handleConceptSelect,
    handleScriptSelect,
    loadProjectData,
    showCreditDeduction,
    showRequestFailed,
  };
};
