import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useProjectStore } from "../store/useProjectStore";
import { webInfoApi } from "../services/web-info";
import { conceptWriterApi } from "../services/concept-writer";
import { segmentationApi } from "../services/segmentationapi";
import { chatApi } from "../services/chat";
import { s3Api } from "../services/s3";
import { projectApi } from "../services/project";
import { agentApi } from "../services/agent";

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
  const [selectedConceptModel, setSelectedConceptModel] = useState(
    chatApi.getDefaultModel("TEXT"),
  );
  const [selectedScriptModel, setSelectedScriptModel] = useState(
    chatApi.getDefaultModel("TEXT"),
  );
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
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [messageCounter, setMessageCounter] = useState(0);
  const [allUserMessages, setAllUserMessages] = useState([]);
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

  // Streaming states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMessages, setStreamMessages] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [currentReader, setCurrentReader] = useState(null);
  const [agentActivity, setAgentActivity] = useState(null); // Current agent activity description
  const [streamingProgress, setStreamingProgress] = useState(null); // Progress information

  // Listen to localStorage changes for project selection
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("project-store-selectedProject");
        const newSelectedProject = stored ? JSON.parse(stored) : null;

        // Only update if the project actually changed
        if (newSelectedProject?.id !== selectedProject?.id) {
          console.log(
            "🔄 Project changed, updating selected project:",
            newSelectedProject,
          );

          // Show loading message for project switch
          if (newSelectedProject) {
            setAgentActivity(
              `🔄 Switching to project: ${newSelectedProject.name}...`,
            );
            setTimeout(() => setAgentActivity(null), 3000);
          }

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
        }
      } catch (e) {
        console.error(e);
      }
    };

    // Check for changes immediately on mount
    handleStorage();

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleStorage);

    // Also listen for a custom event we'll dispatch when project changes in same tab
    window.addEventListener("projectChanged", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("projectChanged", handleStorage);
    };
  }, [selectedProject?.id]);

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
      Object.keys(storedVideosMap).length > 0 ||
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
    storedVideosMap,
  ]);

  const resetFlow = useCallback(() => {
    console.log("🔄 Resetting chat flow state...");

    // Reset flow states
    setCurrentStep(0);
    setStepStatus({
      0: "pending",
      1: "pending",
      2: "pending",
      3: "pending",
      4: "pending",
      5: "pending",
    });

    // Reset content states
    setConcepts(null);
    setSelectedConcept(null);
    setScripts(null);
    setSelectedScript(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setGenerationProgress({});

    // Reset model selections to defaults
    setSelectedConceptModel(chatApi.getDefaultModel("TEXT"));
    setSelectedScriptModel(chatApi.getDefaultModel("TEXT"));
    setSelectedImageModel(chatApi.getDefaultModel("IMAGE"));
    setSelectedVideoModel(chatApi.getDefaultModel("VIDEO"));

    // Reset loading and error states
    setLoading(false);
    setError(null);

    // Reset streaming states
    setIsStreaming(false);
    setStreamMessages([]);
    setPendingApprovals([]);
    setCurrentReader(null);
    setAgentActivity(null);
    setStreamingProgress(null);

    // Reset timeline states
    setAddingTimeline(false);
    setCurrentUserMessage("");
    setMessageCounter(0);
    setAllUserMessages([]);

    // Reset credit deduction message
    setCreditDeductionMessage(null);

    console.log("✅ Chat flow state reset complete");
  }, []);

  // Helper function to show credit deduction after successful API response
  const showCreditDeduction = useCallback(
    (serviceName, model = null, count = 1) => {
      let credits = 0;
      let message = "";
      let additionalInfo = "";

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
          additionalInfo = count > 1 ? `${count} scripts` : "1 script";
          message = formatCreditDeduction(
            "Script Generation",
            credits,
            additionalInfo,
          );
          break;
        case "Image Generation":
          if (model) {
            credits = getImageCreditCost(model) * count;
            additionalInfo = `${count} image${
              count !== 1 ? "s" : ""
            } using ${model}`;
            message = formatCreditDeduction(
              "Image Generation",
              credits,
              additionalInfo,
            );
          } else {
            credits = getImageCreditCost("imagen") * count; // default to imagen
            additionalInfo = `${count} image${count !== 1 ? "s" : ""}`;
            message = formatCreditDeduction(
              "Image Generation",
              credits,
              additionalInfo,
            );
          }
          break;
        case "Video Generation":
          if (model) {
            credits = getVideoCreditCost(model, 5) * count; // 5 seconds default
            additionalInfo = `${count} video${
              count !== 1 ? "s" : ""
            } using ${model} (5s each)`;
            message = formatCreditDeduction(
              "Video Generation",
              credits,
              additionalInfo,
            );
          } else {
            credits = getVideoCreditCost("veo2", 5) * count; // default to veo2
            additionalInfo = `${count} video${
              count !== 1 ? "s" : ""
            } (5s each)`;
            message = formatCreditDeduction(
              "Video Generation",
              credits,
              additionalInfo,
            );
          }
          break;
        case "Concept Writer Process":
          // This is a combined operation
          credits =
            getTextCreditCost("web-info") +
            getTextCreditCost("concept generator");
          additionalInfo = "Web research + 4 concepts";
          message = formatCreditDeduction(
            "Concept Writer Process",
            credits,
            additionalInfo,
          );
          break;
        default:
          message = `${credits} credit${
            credits !== 1 ? "s" : ""
          } deducted for ${serviceName}`;
      }

      setCreditDeductionMessage(message);
      setTimeout(() => setCreditDeductionMessage(null), 5000); // Clear after 5 seconds

      // Refresh balance immediately and also with a slight delay to ensure backend processing is complete
      if (user?.id) {
        fetchBalance(user.id);
        // Also refresh after a short delay to ensure any backend processing is complete
        setTimeout(() => {
          fetchBalance(user.id);
        }, 1000);
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

      // Don't clear user message immediately - let it stay visible during processing

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
        showCreditDeduction("Concept Writer Process");

        setConcepts(conceptsResult.concepts);
        updateStepStatus(0, "done");
        setCurrentStep(1);

        // Clear user message after concepts are generated
        setCurrentUserMessage("");
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

      // Don't clear user message immediately - let it stay visible during processing

      try {
        const scriptModel = selectedScriptModel || "flash"; // Use the model from InputArea or default to "flash"
        console.log(
          "Using script model:",
          scriptModel,
          "selectedScriptModel:",
          selectedScriptModel,
        );

        const [res1, res2] = await Promise.all([
          segmentationApi.getSegmentation({
            prompt,
            concept: selectedConcept.title,
            negative_prompt: "",
            project_id: selectedProject?.id,
            model: scriptModel,
          }),
          segmentationApi.getSegmentation({
            prompt: `${prompt} (alternative approach)`,
            concept: selectedConcept.title,
            negative_prompt: "avoid repetition, be creative",
            project_id: selectedProject?.id,
            model: scriptModel,
          }),
        ]);

        // Show credit deduction after successful API responses
        showCreditDeduction("Script Generation", null, 2);
        setScripts({ response1: res1, response2: res2 });
        updateStepStatus(2, "done");
        setCurrentStep(3);

        // Clear user message after scripts are generated
        setCurrentUserMessage("");
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

    // Don't clear user message immediately - let it stay visible during processing

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

        console.log("Image generation request:", {
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

          console.log("Image generation response:", result);

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

      // Clear user message after images are generated
      setCurrentUserMessage("");

      // No auto-trigger - user must manually select model and send
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

    // Don't clear user message immediately - let it stay visible during processing

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

      // Clear user message after videos are generated
      setCurrentUserMessage("");
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
    async (concept) => {
      console.log("🎯 Concept selected:", concept.title);
      setSelectedConcept(concept);
      updateStepStatus(1, "done");
      setCurrentStep(2);

      // Add agent message acknowledging concept selection
      setAllUserMessages((prev) => [
        ...prev,
        {
          id: `agent-concept-selected-${Date.now()}`,
          content: `Perfect! I'll now create script segments for "${concept.title}". Let me work on that...`,
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    },
    [updateStepStatus],
  );

  const handleScriptSelect = useCallback(
    async (script, cardId) => {
      console.log("📜 Script selected:", script, "from card:", cardId);
      
      // Add cardId to the selected script for proper identification
      const scriptWithCardId = {
        ...script,
        cardId: cardId
      };
      
      setSelectedScript(scriptWithCardId);
      updateStepStatus(3, "done");
      setCurrentStep(4);

      // Add agent message acknowledging script selection
      setAllUserMessages((prev) => [
        ...prev,
        {
          id: `agent-script-selected-${Date.now()}`,
          content: `Excellent choice! I'll now generate images for each segment of your script. This will bring your concept to life visually!`,
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    },
    [updateStepStatus],
  );

  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      console.log(
        `🔄 Loading project data for project: ${selectedProject.name} (ID: ${selectedProject.id})`,
      );

      // Don't call resetFlow() here as it clears all state before we can restore it
      // Instead, only reset specific states that need to be cleared
      setLoading(true);
      setError(null);
      setCurrentStep(0);
      setStepStatus({
        0: "pending",
        1: "pending", 
        2: "pending",
        3: "pending",
        4: "pending",
        5: "pending",
      });

      console.log(`📡 Fetching project data from API...`);

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

        // If we have concepts, set the first one as selected and move to step 1
        if (projectConcepts.data.length > 0) {
          setSelectedConcept(projectConcepts.data[0]);
          setCurrentStep(1);
        }
      } else {
        console.log("No concepts found in API response");
        setConcepts(null);
        setSelectedConcept(null);
        setCurrentStep(0);
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

          // Create two scripts from the existing data for history display
          // This ensures users see 2 scripts: one selected and one alternative
          const existingScript = {
            segments,
            artStyle: firstSegmentation.artStyle,
            concept: firstSegmentation.concept,
          };
          
          setScripts({
            response1: existingScript,
            response2: { ...existingScript, artStyle: existingScript.artStyle + " (Alternative)" }
          });

          // If we have a script, move to step 3 (script selection completed)
          setCurrentStep(3);
        } else {
          console.log("No segments found in segmentation data");
          setSelectedScript(null);
        }
      } else {
        console.log("No segmentations found in API response");
        setSelectedScript(null);
      }

      // Set images if available - map to segments properly
      let imagesMap = {};
      if (
        projectImages &&
        projectImages.success &&
        Array.isArray(projectImages.data) &&
        projectImages.data.length > 0
      ) {
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

        // If we have images, move to step 4 (image generation completed)
        if (Object.keys(imagesMap).length > 0) {
          setCurrentStep(4);
        }
      } else {
        console.log("No images found in API response");
        setGeneratedImages({});
      }

      // Set videos if available - map to segments properly (supports new videoFiles array)
      let videosMap = {};
      if (
        projectVideos &&
        projectVideos.success &&
        Array.isArray(projectVideos.data) &&
        projectVideos.data.length > 0
      ) {
        // Sort videos by segment ID first
        const sortedVideos = projectVideos.data
          .filter((video) => video.uuid)
          .sort((a, b) => {
            const aSegId = Number(a.uuid.replace(/^seg-/, ""));
            const bSegId = Number(b.uuid.replace(/^seg-/, ""));
            return aSegId - bSegId;
          });

        sortedVideos.forEach((video) => {
          // Extract segmentId from uuid (e.g., "seg-5" → "5")
          const segmentId = video.uuid.replace(/^seg-/, "");
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

        // If we have videos, move to step 5 (video generation completed)
        if (Object.keys(videosMap).length > 0) {
          setCurrentStep(5);
        }
      } else {
        console.log("No videos found in API response");
        setGeneratedVideos({});
        setStoredVideosMap({});
      }

      // Reset other states
      setScripts(null);

      // Add initial project state message to chat
      if (projectDetails && projectDetails.success) {
        const projectName = projectDetails.data?.name || "Project";
        const hasContent =
          concepts ||
          segments.length > 0 ||
          Object.keys(imagesMap).length > 0 ||
          Object.keys(videosMap).length > 0;

        let statusMessage = `📁 Loaded project: ${projectName}`;
        if (hasContent) {
          const contentSummary = [];
          if (concepts) contentSummary.push(`${concepts.length} concepts`);
          if (segments.length > 0)
            contentSummary.push(`${segments.length} script segments`);
          if (Object.keys(imagesMap).length > 0)
            contentSummary.push(`${Object.keys(imagesMap).length} images`);
          if (Object.keys(videosMap).length > 0)
            contentSummary.push(`${Object.keys(videosMap).length} videos`);

          if (contentSummary.length > 0) {
            statusMessage += ` - Found: ${contentSummary.join(", ")}`;
          }
        } else {
          statusMessage += ` - Ready to start creating content!`;
        }

        const initialMessage = {
          id: `project-loaded-${Date.now()}`,
          type: "system",
          content: statusMessage,
          timestamp: Date.now(),
        };
        setAllUserMessages((prev) => [initialMessage, ...prev]);
      }

      console.log("Project data loading completed");
    } catch (error) {
      console.error("Error loading project data from API:", error);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.id, resetFlow]); // Include resetFlow dependency

  // Streaming functions
  const startAgentStream = useCallback(
    async (userInput) => {
      if (!userInput || !userInput.trim()) {
        setError("Please enter a prompt first");
        return;
      }

      if (!selectedProject?.id) {
        setError("Please select a project first");
        return;
      }

      // Ensure prompt is a string and not empty
      const cleanPrompt = String(userInput).trim();
      if (!cleanPrompt) {
        setError("Please enter a valid prompt");
        return;
      }

      console.log("Starting agent stream with prompt:", cleanPrompt);

      setIsStreaming(true);
      setLoading(true);
      setError(null);
      setStreamMessages([]);
      setPendingApprovals([]);
      setAgentActivity("Initializing agent workflow...");
      setStreamingProgress(null);

      // Add initial verbose messages to chat
      setAllUserMessages((prev) => [
        ...prev,
        {
          id: `agent-init-${Date.now()}`,
          content:
            "Initializing agent workflow - Setting up processing pipeline...",
          timestamp: Date.now(),
          type: "system",
        },
      ]);

      try {
        const response = await agentApi.startAgentRunStream(
          cleanPrompt,
          user?.id,
          "default", // segmentId
          selectedProject.id,
        );

        const reader = response.body.getReader();
        setCurrentReader(reader);

        const decoder = new TextDecoder();
        let buffer = "";

        // Create a better stream processor
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Process complete lines immediately
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.trim() === "") continue;

                if (line.startsWith("data: ")) {
                  try {
                    const jsonData = line.slice(6).trim();
                    const data = JSON.parse(jsonData);
                    await handleStreamMessage(data);
                  } catch (parseError) {
                    console.error("Error parsing stream message:", parseError);
                  }
                }
              }

              // Force immediate processing
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          } catch (error) {
            console.error("Stream processing error:", error);
            throw error;
          }
        };

        await processStream();
      } catch (error) {
        console.error("Error in agent stream:", error);
        setError(error.message || "Failed to start agent stream");
      } finally {
        setIsStreaming(false);
        setLoading(false);
        setCurrentReader(null);
      }
    },
    [selectedProject?.id, user?.id],
  );

  // Handle individual image completion from log messages
  const handleIndividualImageCompletion = useCallback(
    async (segmentId, s3Key, imageData) => {
      try {
        console.log(
          `Processing individual image completion for segment ${segmentId}`,
        );

        // Convert S3 key to CloudFront URL
        const imageUrl = await s3Api.downloadImage(s3Key);
        console.log(`Generated image URL for segment ${segmentId}:`, imageUrl);

        // Update generated images immediately
        setGeneratedImages((prev) => {
          const newImages = { ...prev, [segmentId]: imageUrl };
          console.log("Updated generated images (individual):", newImages);
          return newImages;
        });

        // Update agent activity
        setAgentActivity(`Image completed for segment ${segmentId}`);
      } catch (error) {
        console.error(
          `Failed to process image for segment ${segmentId}:`,
          error,
        );

        // Add error message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `image-error-${segmentId}-${Date.now()}`,
            content: `Failed to process image for segment ${segmentId}`,
            timestamp: Date.now(),
            type: "error",
          },
        ]);
      }
    },
    [s3Api],
  );

  // Handle individual video completion from log messages
  const handleIndividualVideoCompletion = useCallback(
    async (segmentId, s3Key, videoData) => {
      try {
        console.log(
          `Processing individual video completion for segment ${segmentId}`,
        );

        // Convert S3 key to CloudFront URL
        const videoUrl = await s3Api.downloadVideo(s3Key);
        console.log(`Generated video URL for segment ${segmentId}:`, videoUrl);

        // Update generated videos immediately
        setGeneratedVideos((prev) => {
          const newVideos = { ...prev, [segmentId]: videoUrl };
          console.log("Updated generated videos (individual):", newVideos);
          return newVideos;
        });

        // Update stored videos map for timeline
        setStoredVideosMap((prev) => {
          const updatedMap = { ...prev, [segmentId]: videoUrl };

          // Save to localStorage for persistence
          if (selectedProject) {
            localStorage.setItem(
              `project-store-videos`,
              JSON.stringify(updatedMap),
            );
          } else {
            localStorage.setItem("segmentVideos", JSON.stringify(updatedMap));
          }
          return updatedMap;
        });

        // Update agent activity
        setAgentActivity(`Video completed for segment ${segmentId}`);

        // 🎯 TRIGGER CHAT SCROLL: Dispatch event to trigger chat scroll to bottom
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("scrollChatToBottom", {
              detail: {
                reason: "video_completed",
                segmentId: segmentId,
                timestamp: Date.now(),
              },
            }),
          );
        }, 200); // Delay to ensure video UI components are updated

        // Dispatch event for individual video completion (for UI updates only)
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("individualVideoCompleted", {
              detail: {
                segmentId,
                videoUrl,
                timestamp: Date.now(),
              },
            }),
          );
        }, 100);
      } catch (error) {
        console.error(
          `Failed to process video for segment ${segmentId}:`,
          error,
        );

        // Add error message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `video-error-${segmentId}-${Date.now()}`,
            content: `Failed to process video for segment ${segmentId}`,
            timestamp: Date.now(),
            type: "error",
          },
        ]);
      }
    },
    [selectedProject, s3Api],
  );

  const handleStreamMessage = useCallback(async (message) => {
    setStreamMessages((prev) => [...prev, message]);

    switch (message.type) {
      case "log": {
        // Update agent activity with log message if it contains useful info
        const logMessage = message.data.message || message.data;

        // Handle individual image completion in log messages (similar to videos)
        if (message.data?.ImageData?.s3_key && message.data?.segmentId) {
          console.log("Individual image completed:", message.data.ImageData);
          const segmentId = message.data.segmentId;
          const s3Key = message.data.ImageData.s3_key;

          // Process individual image completion
          handleIndividualImageCompletion(
            segmentId,
            s3Key,
            message.data.ImageData,
          );
        }

        // Handle individual video completion in log messages
        if (message.data?.VideoData?.s3_key && message.data?.segmentId) {
          console.log("Individual video completed:", message.data.VideoData);
          const segmentId = message.data.segmentId;
          const s3Key = message.data.VideoData.s3_key;

          // Process individual video completion
          handleIndividualVideoCompletion(
            segmentId,
            s3Key,
            message.data.VideoData,
          );
        }

        // 🎯 CHECK FOR IMAGE BATCH COMPLETION: Look for completion summary messages
        if (
          typeof logMessage === "string" &&
          logMessage.includes("Image generation") &&
          logMessage.includes("completed:")
        ) {
          console.log("Image batch completion detected:", logMessage);

          // Extract counts from message like "Image generation completed: 5 success, 0 failed"
          const successMatch = logMessage.match(/(\d+)\s+success/);
          const successCount = successMatch ? parseInt(successMatch[1]) : 0;

          if (successCount > 0) {
            console.log(`Detected ${successCount} images completed`);

            // Add message about image completion
            setAllUserMessages((prev) => [
              ...prev,
              {
                id: `agent-images-batch-${Date.now()}`,
                content: `Image generation complete! Generated ${successCount} images successfully.`,
                timestamp: Date.now(),
                type: "system",
              },
            ]);
          }
        }

        // 🎯 CHECK FOR VIDEO BATCH COMPLETION: Look for completion summary messages
        if (
          typeof logMessage === "string" &&
          logMessage.includes("Video generation") &&
          logMessage.includes("completed:")
        ) {
          console.log("Video batch completion detected:", logMessage);

          // Extract counts from message like "Video generation completed: 3 success, 0 failed"
          const successMatch = logMessage.match(/(\d+)\s+success/);
          const successCount = successMatch ? parseInt(successMatch[1]) : 0;

          if (successCount > 0) {
            console.log(
              `Detected ${successCount} videos completed`,
            );

            // Add message about video completion (without auto-append)
            setAllUserMessages((prev) => [
              ...prev,
              {
                id: `agent-videos-complete-${Date.now()}`,
                content: `Video generation complete! ${successCount} videos are ready for timeline.`,
                timestamp: Date.now(),
                type: "system",
              },
            ]);

            // 🎯 TRIGGER CHAT SCROLL: Scroll to bottom to show completion message
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("scrollChatToBottom", {
                  detail: {
                    reason: "video_batch_completed",
                    successCount: successCount,
                    timestamp: Date.now(),
                  },
                }),
              );
            }, 100); // Small delay to ensure message is rendered
          }
        }
        if (typeof logMessage === "string") {
          setAgentActivity(logMessage);
        }
        break;
      }

      case "thinking": {
        // Agent is thinking/processing
        const thinkingMessage =
          message.data.message || "Agent is analyzing your request...";
        setAgentActivity(thinkingMessage);

        break;
      }

      case "tool_start": {
        // Tool execution started
        const toolName = message.data.toolName || message.data.tool_name;
        const startMessage = getToolStartMessage(toolName);
        setAgentActivity(startMessage);
        setStreamingProgress({ step: toolName, status: "starting" });

        break;
      }

      case "tool_progress":
        // Tool execution progress
        setStreamingProgress((prev) => ({
          ...prev,
          ...message.data,
          status: "in_progress",
        }));

        // Add progress updates to chat
        if (message.data.message) {
        }
        break;

      case "approval_required": {
        const {
          approvalId,
          toolName,
          arguments: args,
          agentName,
        } = message.data;

        // Set agent activity to show what approval is needed
        const approvalMessage = getApprovalMessage(toolName);
        setAgentActivity(approvalMessage);

        // Parse arguments if they come as JSON string
        let parsedArgs = args;
        if (typeof args === "string") {
          try {
            parsedArgs = JSON.parse(args);
          } catch {
            parsedArgs = {};
          }
        }

        // Check if this approval already exists to prevent duplicates
        setPendingApprovals((prev) => {
          const existingApproval = prev.find((a) => a.id === approvalId);
          if (existingApproval) {
            return prev;
          }

          const newApproval = {
            id: approvalId,
            toolName,
            arguments: parsedArgs,
            agentName,
            timestamp: message.timestamp,
          };
          return [...prev, newApproval];
        });

        // Handle approval based on tool type
        await handleToolApproval(approvalId, toolName, parsedArgs);
        break;
      }

      case "result": {
        const completeMessage = getToolCompleteMessage(
          message.data.toolName || "operation",
        );
        setAgentActivity(completeMessage);
        setStreamingProgress(null); // Clear progress

        // Add completion message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-complete-${Date.now()}`,
            content: completeMessage,
            timestamp: Date.now(),
            type: "system",
          },
        ]);

        await handleToolResult(message.data);
        break;
      }

      case "completed": {
        const taskCompleteMessage = "Task completed successfully!";
        setAgentActivity(taskCompleteMessage);
        setStreamingProgress(null);
        setIsStreaming(false);
        setLoading(false);

        // Add final completion message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-task-complete-${Date.now()}`,
            content: taskCompleteMessage,
            timestamp: Date.now(),
            type: "system",
          },
        ]);

        // Clear activity after a delay
        setTimeout(() => setAgentActivity(null), 3000);
        break;
      }

      case "error": {
        const errorMessage = `Error: ${message.data.message}`;
        setAgentActivity(errorMessage);
        setStreamingProgress(null);
        setError(message.data.message);
        setIsStreaming(false);
        setLoading(false);

        // Add error message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-error-${Date.now()}`,
            content: errorMessage,
            timestamp: Date.now(),
            type: "system",
          },
        ]);
        break;
      }

      default:
        // Unknown message type - silently ignore
        break;
    }
  }, []);

  // Helper functions for verbose messaging
  const getToolStartMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Researching web information - Gathering relevant content and insights for your video concept";
      case "generate_concepts_with_approval":
        return "Concept generation running - Analyzing research data and creating multiple creative video concepts";
      case "generate_segmentation":
        return "Script generation running - Breaking down your concept into detailed segments with visuals and narration";
      case "generate_image_with_approval":
        return "Image generation running - Creating visual content for each script segment using AI";
      case "generate_video_with_approval":
        return "Video generation running - Converting images into dynamic video content with animations";
      default:
        return `Agent processing - ${toolName}`;
    }
  }, []);

  const getApprovalMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Web research approval - Ready to gather relevant information for your video concept";
      case "generate_concepts_with_approval":
        return "Concept generation approval - Ready to create multiple video concepts from research data";
      case "generate_segmentation":
        return "Script generation approval - Ready to break down your concept into detailed segments";
      case "generate_image_with_approval":
        return "Image generation approval - Ready to create visual content for each script segment";
      case "generate_video_with_approval":
        return "Video generation approval - Ready to convert images into dynamic video content";
      default:
        return `Approval required - ${toolName}`;
    }
  }, []);

  const getToolCompleteMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Web research completed - Information gathered and processed for concept creation";
      case "generate_concepts_with_approval":
        return "Concept generation completed - Multiple video concepts created and ready for selection";
      case "generate_segmentation":
        return "Script generation completed - Detailed segments with visuals and narration ready";
      case "generate_image_with_approval":
        return "Image generation completed - Visual content created for all script segments";
      case "generate_video_with_approval":
        return "Video generation completed - Dynamic video content ready for timeline";
      default:
        return `${toolName} completed successfully`;
    }
  }, []);

  const getToolApprovalConfirmationMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Starting web research to gather relevant information";
      case "generate_concepts_with_approval":
        return "Starting concept generation to create video ideas";
      case "generate_segmentation":
        return "Starting script generation to create detailed segments";
      case "generate_image_with_approval":
        return "Starting image generation for visual content";
      case "generate_video_with_approval":
        return "Starting video generation to create dynamic content";
      default:
        return `Starting ${toolName} process`;
    }
  }, []);

  const handleToolApproval = useCallback(async (approvalId, toolName, args) => {
    console.log("Tool approval required:", { approvalId, toolName, args });
    // Manual approval required - approval will remain pending until user clicks approve
    console.log("Manual approval needed for:", toolName);
  }, []);

  const handleToolResult = useCallback(
    async (result) => {
      console.log("Tool result received:", result);
      console.log("Result data structure:", {
        hasData: !!result.data,
        dataType: typeof result.data,
        isArray: Array.isArray(result.data),
        keys: result.data ? Object.keys(result.data) : "no data",
        firstItem: Array.isArray(result.data) ? result.data[0] : "not array",
        hasResults: !!result.results,
        hasDataResults: !!(result.data && result.data.results),
        dataResultsLength:
          result.data && result.data.results ? result.data.results.length : 0,
      });

      // Update agent activity based on result type
      setAgentActivity("Processing results and updating interface...");

      console.log("TESTING: About to check image conditions...");

      // Check for image generation results FIRST (highest priority)
      const imageConditions = {
        hasResults: !!result.results,
        hasDataResults: !!(result.data && result.data.results),
        resultType: typeof result.results,
        dataResultType: typeof (result.data && result.data.results),
        isResultsArray: Array.isArray(result.results),
        isDataResultsArray: Array.isArray(result.data && result.data.results),
      };

      console.log("Checking image generation conditions:", imageConditions);

      const condition1 = result.results && Array.isArray(result.results);
      const condition2 =
        result.data?.results && Array.isArray(result.data.results);
      const finalCondition = condition1 || condition2;

      console.log("Condition evaluation:", {
        condition1: condition1,
        condition2: condition2,
        finalCondition: finalCondition,
      });

      if (finalCondition) {
        console.log("✅ IMAGE CONDITION MET - Processing images...");

        setAgentActivity("Processing generated images and creating URLs...");

        console.log("🎨 Processing image generation results:", result);

        // Use either direct results or nested data.results
        const imageResults = result.results || result.data.results;
        console.log("📋 Image results array:", imageResults.length, "segments");
        const imagesMap = {};
        const failedSegments = [];

        setStreamingProgress({
          step: "image_processing",
          status: "processing",
          total: imageResults.length,
          current: 0,
        });

        // Process results and convert S3 keys to full URLs
        const imagePromises = imageResults.map(async (item) => {
          if (item.status === "success" && item.imageData?.s3_key) {
            try {
              console.log(
                `🔄 Converting S3 key to URL for ${item.segmentId}:`,
                item.imageData.s3_key,
              );

              // Convert S3 key to full CloudFront URL
              const imageUrl = await s3Api.downloadImage(item.imageData.s3_key);
              console.log(`✅ Generated URL for ${item.segmentId}:`, imageUrl);
              imagesMap[item.segmentId] = imageUrl;
            } catch (error) {
              console.error(
                `Failed to get image URL for segment ${item.segmentId}:`,
                error,
              );
              failedSegments.push(item.segmentId);
            }
          } else if (item.status === "failed") {
            // Failed case - track for retry
            failedSegments.push(item.segmentId);
          }
        });

        // Wait for all image URL conversions to complete
        await Promise.allSettled(imagePromises);

        console.log("🖼️ Final images map after URL conversion:", imagesMap);

        // Update generated images with successful ones
        if (Object.keys(imagesMap).length > 0) {
          setGeneratedImages((prev) => {
            const newImages = { ...prev, ...imagesMap };
            console.log("🎯 Setting generated images:", newImages);
            return newImages;
          });

          // Add agent message showing image generation completion
          const successCount = Object.keys(imagesMap).length;
          setAllUserMessages((prev) => [
            ...prev,
            {
              id: `agent-images-${Date.now()}`,
              content: `Perfect! I've generated ${successCount} images for your script segments. You can see them below and proceed to video generation!`,
              timestamp: Date.now(),
              type: "system",
            },
          ]);

          // Show credit deduction for image generation
          if (successCount > 0) {
            showCreditDeduction(
              "Image Generation",
              selectedImageModel || "flux-1.1-pro",
              successCount,
            );
          }
        }

        // Handle failed segments with retry via chat endpoint
        if (failedSegments.length > 0 && selectedScript?.segments) {
          await retryFailedImageGeneration(failedSegments);
        }

        // If we have any images (successful or retried), mark step as done
        const totalImages = { ...generatedImages, ...imagesMap };
        if (Object.keys(totalImages).length > 0) {
          updateStepStatus(4, "done");
          setCurrentStep(5);
        }

        // Return early to avoid processing other conditions
        return;
      } else {
        console.log(
          "❌ IMAGE CONDITION NOT MET - Checking video conditions...",
        );

        // Check for video generation results in multiple possible formats
        const videoConditions = {
          hasVideoResults: !!(
            result.videoResults && Array.isArray(result.videoResults)
          ),
          hasDataVideoResults: !!(
            result.data &&
            result.data.videoResults &&
            Array.isArray(result.data.videoResults)
          ),
          hasResults: !!result.results,
          hasDataResults: !!(result.data && result.data.results),
          hasVideos: !!(result.videos && Array.isArray(result.videos)),
          hasDataVideos: !!(
            result.data &&
            result.data.videos &&
            Array.isArray(result.data.videos)
          ),
          toolName: result.toolName || (result.data && result.data.toolName),
        };

        console.log(
          "🔍 Checking video generation conditions:",
          videoConditions,
        );
        console.log("🔍 Full result structure for video detection:", {
          resultKeys: Object.keys(result),
          dataKeys: result.data ? Object.keys(result.data) : null,
          toolName: result.toolName,
          hasArrayResults: Array.isArray(result.results),
          hasArrayDataResults: result.data
            ? Array.isArray(result.data.results)
            : false,
          resultType: typeof result.results,
          dataResultType: result.data ? typeof result.data.results : null,
        });

        // Check for video results in different possible locations
        const videoResults =
          result.videoResults ||
          (result.data && result.data.videoResults) ||
          result.videos ||
          (result.data && result.data.videos) ||
          null;

        // Also check if this is a video tool result based on tool name or message content
        const isVideoToolResult =
          (result.toolName && result.toolName.includes("video")) ||
          (result.data &&
            result.data.toolName &&
            result.data.toolName.includes("video")) ||
          (result.message && result.message.includes("Video generation")) ||
          (result.data &&
            result.data.message &&
            result.data.message.includes("Video generation"));

        // Check if results array contains video-like data (has videoData property)
        const hasVideoDataInResults =
          (result.results &&
            Array.isArray(result.results) &&
            result.results.some((item) => item.videoData)) ||
          (result.data?.results &&
            Array.isArray(result.data.results) &&
            result.data.results.some((item) => item.videoData));

        console.log("🎬 Video detection results:", {
          videoResults: !!videoResults,
          videoResultsLength: videoResults ? videoResults.length : 0,
          isVideoToolResult,
          hasVideoDataInResults,
          actualVideoResults: videoResults,
          messageContent:
            result.message || (result.data && result.data.message),
        });

        // Check if this is a video result - either dedicated videoResults or tool-based detection
        const isVideoResult =
          (videoResults && Array.isArray(videoResults)) ||
          (isVideoToolResult &&
            result.results &&
            Array.isArray(result.results)) ||
          (isVideoToolResult &&
            result.data?.results &&
            Array.isArray(result.data.results)) ||
          // Also check if it's a video tool result with the specific success/results structure
          (result.toolName === "generate_video_with_approval" &&
            result.results &&
            Array.isArray(result.results)) ||
          // Check if results array contains videoData (most reliable indicator)
          hasVideoDataInResults;

        if (isVideoResult) {
          console.log("✅ VIDEO CONDITION MET - Processing videos...");

          setAgentActivity("Processing generated videos and creating URLs...");

          // Add detailed video processing message to chat
          setAllUserMessages((prev) => [
            ...prev,
            {
              id: `agent-video-processing-${Date.now()}`,
              content:
                "🎬 Video generation successful! Converting S3 keys to downloadable URLs...",
              timestamp: Date.now(),
              type: "system",
            },
          ]);

          // Use videoResults if available, otherwise fall back to results array for video tools or videoData detection
          const actualVideoResults =
            videoResults ||
            (isVideoToolResult
              ? result.results || result.data?.results
              : null) ||
            (hasVideoDataInResults
              ? result.results || result.data?.results
              : null);

          console.log(
            "🎬 Processing video generation results:",
            actualVideoResults,
          );

          const videosMap = {};
          const failedVideoSegments = [];

          setStreamingProgress({
            step: "video_processing",
            status: "processing",
            total: actualVideoResults.length,
            current: 0,
          });

          // Process video results and convert S3 keys to full URLs
          const videoPromises = actualVideoResults.map(async (item) => {
            console.log("🎬 Processing video result item:", item);

            // Handle the exact backend format: { segmentId, status: 'success', videoData: response.data }
            const hasVideoData = item.status === "success" && item.videoData;
            const segmentId = item.segmentId || item.id || item.uuid;

            if (hasVideoData && segmentId) {
              try {
                // The videoData contains the full response from /chat endpoint
                // Look for s3_key in various possible locations within videoData
                const s3Key =
                  item.videoData.s3_key ||
                  item.videoData.s3Keys?.[0] ||
                  (item.videoData.data && item.videoData.data.s3_key) ||
                  (item.videoData.data && item.videoData.data.s3Keys?.[0]);

                console.log(
                  `🔄 Converting S3 key to URL for video ${segmentId}:`,
                  s3Key,
                );
                console.log("🔍 Full videoData structure:", item.videoData);

                if (s3Key) {
                  // Add individual video processing message
                  setAllUserMessages((prev) => [
                    ...prev,
                    {
                      id: `agent-video-${segmentId}-${Date.now()}`,
                      content: `🎬 Processing video for segment ${segmentId} - Converting to downloadable URL...`,
                      timestamp: Date.now(),
                      type: "system",
                    },
                  ]);

                  // Convert S3 key to full CloudFront URL
                  const videoUrl = await s3Api.downloadVideo(s3Key);
                  console.log(
                    `✅ Generated video URL for ${segmentId}:`,
                    videoUrl,
                  );
                  videosMap[segmentId] = videoUrl;
                } else {
                  console.warn(
                    `No S3 key found in videoData for segment ${segmentId}:`,
                    item.videoData,
                  );
                  failedVideoSegments.push(segmentId);
                }
              } catch (error) {
                console.error(
                  `Failed to get video URL for segment ${segmentId}:`,
                  error,
                );
                failedVideoSegments.push(segmentId);
              }
            } else if (item.status === "failed") {
              // Failed case - track for retry
              failedVideoSegments.push(segmentId);
              console.warn(
                `Video generation failed for segment ${segmentId}:`,
                item.error,
              );
            } else {
              console.warn("Unexpected video result format:", item);
              console.warn(
                'Expected: { segmentId, status: "success", videoData: {...} }',
              );
            }
          });

          // Wait for all video URL conversions to complete
          await Promise.allSettled(videoPromises);

          console.log("🎬 Final videos map after URL conversion:", videosMap);

          // Update generated videos with successful ones
          if (Object.keys(videosMap).length > 0) {
            console.log("🎯 About to update video states with:", videosMap);

            setGeneratedVideos((prev) => {
              const newVideos = { ...prev, ...videosMap };
              console.log(
                "🎯 Setting generated videos - prev:",
                prev,
                "new:",
                newVideos,
              );
              return newVideos;
            });

            // Update stored videos map for timeline
            setStoredVideosMap((prev) => {
              const updatedMap = { ...prev, ...videosMap };
              console.log(
                "🎯 Setting stored videos map - prev:",
                prev,
                "new:",
                updatedMap,
              );

              // Save to localStorage for persistence
              if (selectedProject) {
                localStorage.setItem(
                  `project-store-videos`,
                  JSON.stringify(updatedMap),
                );
                console.log(
                  "💾 Saved videos to localStorage for project:",
                  selectedProject.id,
                );
              } else {
                localStorage.setItem(
                  "segmentVideos",
                  JSON.stringify(updatedMap),
                );
                console.log("💾 Saved videos to localStorage (no project)");
              }
              return updatedMap;
            });

            // Force a small delay and then trigger a custom event to ensure UI updates
            setTimeout(() => {
              console.log(
                "🔔 Dispatching videosUpdated event to trigger UI refresh",
              );
              window.dispatchEvent(
                new CustomEvent("videosUpdated", {
                  detail: { videos: videosMap, timestamp: Date.now() },
                }),
              );
            }, 100);

            // Add agent message showing video generation completion
            const successCount = Object.keys(videosMap).length;
            setAllUserMessages((prev) => [
              ...prev,
              {
                id: `agent-videos-${Date.now()}`,
                content: `🎬 Fantastic! I've generated ${successCount} videos from your images. Your content is now ready for the timeline!`,
                timestamp: Date.now(),
                type: "system",
              },
            ]);

            // Show credit deduction for video generation
            if (successCount > 0) {
              showCreditDeduction(
                "Video Generation",
                selectedVideoModel || "gen4_turbo",
                successCount,
              );
            }
          }

          // Handle failed video segments (could implement retry logic here if needed)
          if (failedVideoSegments.length > 0) {
            console.warn("Some video segments failed:", failedVideoSegments);
            // Could add retry logic here similar to image generation
          }

          // If we have any videos, mark step as done
          const totalVideos = { ...generatedVideos, ...videosMap };
          if (Object.keys(totalVideos).length > 0) {
            updateStepStatus(5, "done");
            // Stay on current step or could advance to a completion step
          }

          // Return early to avoid processing other conditions
          return;
        } else {
          console.log(
            "❌ VIDEO CONDITION NOT MET - Checking other result types...",
          );
          console.log("📊 Detailed analysis:", {
            "result.results exists": !!result.results,
            "result.results type": typeof result.results,
            "result.results isArray": Array.isArray(result.results),
            "result.data exists": !!result.data,
            "result.data.results exists": !!(
              result.data && result.data.results
            ),
            "result.data.results type": result.data
              ? typeof result.data.results
              : "no data",
            "result.data.results isArray": result.data
              ? Array.isArray(result.data.results)
              : false,
            "result.videoResults exists": !!result.videoResults,
            "result.data.videoResults exists": !!(
              result.data && result.data.videoResults
            ),
            "Full result.data": result.data,
          });
        }
      }

      // Update UI based on the tool result
      if (result.data) {
        // Handle concept generation results
        if (result.data.concepts) {
          setAgentActivity(
            "Processing generated concepts and preparing selection...",
          );
          console.log("📝 Setting concepts in UI:", result.data.concepts);

          setConcepts(result.data.concepts);
          updateStepStatus(0, "done");
          setCurrentStep(1);

          // Add agent message showing concepts
          setAllUserMessages((prev) => [
            ...prev,
            {
              id: `agent-concepts-${Date.now() + 3}`,
              content: `I've generated ${result.data.concepts.length} video concepts for you! Please select the one you'd like to develop:`,
              timestamp: Date.now() + 3,
              type: "system",
            },
          ]);

          // Show credit deduction for concept generation (includes web-info + concept generation)
          showCreditDeduction("Concept Writer Process");
        }

        // Also check if result.data has concept array directly
        if (
          Array.isArray(result.data) &&
          result.data.length > 0 &&
          result.data[0].title
        ) {
          setAgentActivity(
            "Processing generated concepts and preparing selection...",
          );
          console.log("📝 Setting concepts from array format:", result.data);
          setConcepts(result.data);
          updateStepStatus(0, "done");
          setCurrentStep(1);

          // Add agent message showing concepts
          setAllUserMessages((prev) => [
            ...prev,
            {
              id: `agent-concepts-${Date.now()}`,
              content:
                "I've generated 4 video concepts for you! Please select the one you'd like to develop:",
              timestamp: Date.now(),
              type: "system",
            },
          ]);

          // Show credit deduction for concept generation (includes web-info + concept generation)
          showCreditDeduction("Concept Writer Process");
        }

        // Handle segmentation results - but don't auto-select, let user choose
        if (result.data.segments) {
          setAgentActivity(
            "Script generation completed. Please select your preferred script...",
          );

          // Create script object from the segments data
          const script = {
            segments: result.data.segments,
            artStyle: result.data.artStyle || "realistic",
            concept: result.data.concept || "",
          };

          // Set scripts for user selection (create two scripts for selection)
          // For now, we'll use the same script for both, but this can be enhanced
          // to generate two different scripts if the streaming API provides them
          setScripts({ 
            response1: script, 
            response2: { ...script, artStyle: script.artStyle + " (Alternative)" }
          });
          
          updateStepStatus(2, "done");
          setCurrentStep(3); // Go to script selection step

          // Show credit deduction for script generation
          showCreditDeduction("Script Generation", null, 1);
        }
      }

      // Show credit deduction if applicable
      if (result.message && result.message.includes("completed successfully")) {
        // Refresh balance
        if (user?.id) {
          fetchBalance(user.id);
        }
      }

      // Clear activity after processing (with delay to let user see the final status)
      setTimeout(() => {
        setAgentActivity(null);
        setStreamingProgress(null);
      }, 2000);
    },
    [
      updateStepStatus,
      user?.id,
      fetchBalance,
      generatedImages,
      generatedVideos,
      selectedScript,
      selectedVideoModel,
      selectedProject,
      showCreditDeduction,
    ],
  );

  // Retry failed image generation using chat endpoint
  const retryFailedImageGeneration = useCallback(
    async (failedSegmentIds) => {
      if (!selectedScript?.segments) return;

      console.log(
        "Retrying failed image generation for segments:",
        failedSegmentIds,
      );

      try {
        const retryPromises = failedSegmentIds.map(async (segmentId) => {
          const segment = selectedScript.segments.find(
            (seg) => seg.id === segmentId,
          );
          if (!segment) return null;

          try {
            const result = await chatApi.generateImage({
              visual_prompt: segment.visual,
              art_style: selectedScript.artStyle || "realistic",
              segmentId: segment.id,
              project_id: selectedProject?.id,
              model: selectedImageModel || "flux-1.1-pro",
            });

            if (result.s3_key) {
              const imageUrl = await s3Api.downloadImage(result.s3_key);
              return { segmentId, imageUrl, s3Key: result.s3_key };
            }
            return null;
          } catch (error) {
            console.error(
              `Failed to retry image generation for segment ${segmentId}:`,
              error,
            );
            return null;
          }
        });

        const retryResults = await Promise.allSettled(retryPromises);
        const successfulRetries = {};

        retryResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            const { segmentId, imageUrl } = result.value;
            successfulRetries[segmentId] = imageUrl;
          }
        });

        if (Object.keys(successfulRetries).length > 0) {
          setGeneratedImages((prev) => ({ ...prev, ...successfulRetries }));
          console.log(
            "Successfully retried images for segments:",
            Object.keys(successfulRetries),
          );
        }
      } catch (error) {
        console.error("Error retrying failed image generation:", error);
      }
    },
    [selectedScript, selectedProject?.id, selectedImageModel],
  );

  const stopStream = useCallback(() => {
    if (currentReader) {
      currentReader.cancel();
      setCurrentReader(null);
    }
    setIsStreaming(false);
    setLoading(false);
  }, [currentReader]);

  const approveToolExecution = useCallback(
    async (approvalId, additionalData = null) => {
      try {
        // Find the approval to get tool context
        const approval = pendingApprovals.find((a) => a.id === approvalId);
        let finalAdditionalData = additionalData;

        // Add approval confirmation message to chat
        if (approval) {
          setAllUserMessages((prev) => [
            ...prev,
            {
              id: `user-approval-${Date.now()}`,
              content: `Approved: ${getToolApprovalConfirmationMessage(
                approval.toolName,
              )}`,
              timestamp: Date.now(),
              type: "user",
            },
          ]);
        }

        // Prepare specific data based on tool type
        if (!additionalData && approval) {
          switch (approval.toolName) {
            case "generate_concepts_with_approval":
              // For concept generation - match DTO exactly
              finalAdditionalData = {
                web_info: approval.arguments?.web_info || null,
                prompt: approval.arguments?.prompt || null,
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
                model:
                  selectedConceptModel ||
                  approval.arguments?.model ||
                  "gemini-2.0-flash-exp",
              };
              break;

            case "generate_segmentation": {
              // For segmentation - check if concept is selected first
              if (!selectedConcept) {
                setError(
                  "Please select a concept first before generating segmentation",
                );
                return;
              }
              // For segmentation - match DTO exactly and ensure we use selected concept
              // Map frontend model names to backend expected values
              const mapScriptModelToBackend = (frontendModel) => {
                if (frontendModel === "gemini-pro") {
                  return "pro";
                }
                return "flash"; // Default for gemini-2.0-flash-exp, gemini-flash, etc.
              };

              finalAdditionalData = {
                prompt: approval.arguments?.prompt || null,
                concept: selectedConcept.title,
                negative_prompt: approval.arguments?.negative_prompt || null,
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
                model: mapScriptModelToBackend(
                  selectedScriptModel ||
                    approval.arguments?.model ||
                    "gemini-2.0-flash-exp",
                ),
              };
              console.log(
                "🎯 Using selected concept for segmentation:",
                selectedConcept.title,
              );
              console.log(
                "🎯 Using script model for segmentation:",
                selectedScriptModel,
              );
              break;
            }

            case "generate_image_with_approval":
              // For image generation - match DTO exactly
              finalAdditionalData = {
                segments: selectedScript?.segments || null,
                art_style:
                  selectedScript?.artStyle ||
                  approval.arguments?.art_style ||
                  "realistic",
                model:
                  selectedImageModel ||
                  approval.arguments?.model ||
                  "flux-1.1-pro",
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
                segmentId: "default",
              };
              break;

            case "get_web_info":
              // For web info - match DTO exactly
              finalAdditionalData = {
                prompt: approval.arguments?.prompt || null,
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
              };
              break;

            case "generate_video_with_approval": {
              // For video generation - check if we have images and script first
              if (
                !selectedScript?.segments ||
                Object.keys(generatedImages).length === 0
              ) {
                setError(
                  "Please ensure images are generated first before generating videos",
                );
                return;
              }

              // Prepare segments with imageS3Key from generated images
              const videoSegments = selectedScript.segments
                .filter((segment) => generatedImages[segment.id]) // Only segments with images
                .map((segment) => {
                  // Extract S3 key from CloudFront URL
                  const imageUrl = generatedImages[segment.id];
                  let imageS3Key = null;

                  if (imageUrl && imageUrl.includes("cloudfront.net/")) {
                    const urlParts = imageUrl.split("cloudfront.net/");
                    if (urlParts.length > 1) {
                      imageS3Key = urlParts[1];
                    }
                  }

                  return {
                    id: segment.id,
                    animation_prompt: segment.animation || segment.visual,
                    imageS3Key: imageS3Key,
                  };
                });

              finalAdditionalData = {
                segments: videoSegments,
                art_style:
                  selectedScript?.artStyle ||
                  approval.arguments?.art_style ||
                  "realistic",
                model:
                  selectedVideoModel ||
                  approval.arguments?.model ||
                  "gen4_turbo",
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
              };
              console.log(
                "🎬 Prepared video generation data:",
                finalAdditionalData,
              );
              break;
            }

            default:
              // For other tools, just pass the basic approval
              finalAdditionalData = null;
          }
        }

        console.log("Approving tool with data:", {
          approvalId,
          toolName: approval?.toolName,
          finalAdditionalData,
          currentModels: {
            concept: selectedConceptModel,
            script: selectedScriptModel,
            image: selectedImageModel,
            video: selectedVideoModel,
          },
        });

        await agentApi.handleApproval(
          approvalId,
          true,
          user?.id,
          finalAdditionalData,
        );

        // Remove from pending approvals
        setPendingApprovals((prev) =>
          prev.filter((approval) => approval.id !== approvalId),
        );
      } catch (error) {
        console.error("Error approving tool:", error);
        setError("Failed to approve tool execution");
      }
    },
    [
      pendingApprovals,
      selectedScript,
      selectedConceptModel,
      selectedScriptModel,
      selectedImageModel,
      selectedVideoModel,
      selectedProject?.id,
      selectedConcept,
      generatedImages,
      user?.id,
    ],
  );

  const rejectToolExecution = useCallback(
    async (approvalId) => {
      try {
        await agentApi.handleApproval(approvalId, false, user?.id);

        // Remove from pending approvals
        setPendingApprovals((prev) =>
          prev.filter((approval) => approval.id !== approvalId),
        );
      } catch (error) {
        console.error("Error rejecting tool:", error);
        setError("Failed to reject tool execution");
      }
    },
    [user?.id],
  );

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
    selectedConceptModel,
    setSelectedConceptModel,
    selectedScriptModel,
    setSelectedScriptModel,
    selectedImageModel,
    setSelectedImageModel,
    selectedVideoModel,
    setSelectedVideoModel,
    creditDeductionMessage,
    addingTimeline,
    setAddingTimeline,
    currentUserMessage,
    setCurrentUserMessage,
    messageCounter,
    setMessageCounter,
    allUserMessages,
    setAllUserMessages,
    storedVideosMap,

    // Streaming states
    isStreaming,
    streamMessages,
    pendingApprovals,
    agentActivity,
    streamingProgress,

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

    // Streaming actions
    startAgentStream,
    stopStream,
    approveToolExecution,
    rejectToolExecution,
  };
};
