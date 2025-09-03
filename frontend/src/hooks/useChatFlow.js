import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useProjectStore } from "../store/useProjectStore";
import { useAgentStreaming } from "./useAgentStreaming";
import { useCreditManagement } from "./useCreditManagement";
import { useModelSelection } from "./useModelSelection";
import { useTimelineIntegration } from "./useTimelineIntegration";
import { useRetryLogic } from "./useRetryLogic";
import { webInfoApi } from "../services/web-info";
import { conceptWriterApi } from "../services/concept-writer";
import { segmentationApi } from "../services/segmentationapi";
import { chatApi } from "../services/chat";
import { s3Api } from "../services/s3";
import { projectApi } from "../services/project";

export const useChatFlow = () => {
  const { isAuthenticated, user } = useAuth();
  const { fetchBalance } = useProjectStore();

  // Use specialized hooks
  const agentStreaming = useAgentStreaming();
  const creditManagement = useCreditManagement(user);
  const modelSelection = useModelSelection();
  const timelineIntegration = useTimelineIntegration();
  const retryLogic = useRetryLogic();

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
            agentStreaming.setAgentActivity?.(
              `🔄 Switching to project: ${newSelectedProject.name}...`,
            );
            setTimeout(() => agentStreaming.setAgentActivity?.(null), 3000);
          }

          setSelectedProject(newSelectedProject);

          if (newSelectedProject) {
            timelineIntegration.setStoredVideosMap(
              JSON.parse(localStorage.getItem(`project-store-videos`) || "{}"),
            );
          } else {
            timelineIntegration.setStoredVideosMap(
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
  }, [selectedProject?.id, agentStreaming, timelineIntegration]);

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
      Object.keys(timelineIntegration.storedVideosMap).length > 0 ||
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
    timelineIntegration.storedVideosMap,
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
    modelSelection.resetModelsToDefaults();

    // Reset loading and error states
    setLoading(false);
    setError(null);

    // Reset specialized hook states
    timelineIntegration.resetTimelineStates();

    console.log("✅ Chat flow state reset complete");
  }, [modelSelection, timelineIntegration]);

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
        creditManagement.showCreditDeduction("Concept Writer Process");

        setConcepts(conceptsResult.concepts);
        updateStepStatus(0, "done");
        setCurrentStep(1);

        // Clear user message after concepts are generated
        timelineIntegration.setCurrentUserMessage("");
      } catch (error) {
        console.error("Error in concept writer:", error);
        creditManagement.showRequestFailed("Concept Generation");
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
      updateStepStatus,
      creditManagement,
      timelineIntegration,
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
        const scriptModel = modelSelection.selectedScriptModel || "flash";
        console.log(
          "Using script model:",
          scriptModel,
          "selectedScriptModel:",
          modelSelection.selectedScriptModel,
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
        creditManagement.showCreditDeduction("Script Generation", null, 2);
        setScripts({ response1: res1, response2: res2 });
        updateStepStatus(2, "done");
        setCurrentStep(3);

        // Clear user message after scripts are generated
        timelineIntegration.setCurrentUserMessage("");
      } catch (error) {
        console.error("Error in script generation:", error);
        creditManagement.showRequestFailed("Script Generation");
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
      creditManagement,
      timelineIntegration,
      modelSelection,
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
          model: modelSelection.selectedImageModel,
        });
        try {
          const result = await chatApi.generateImage({
            visual_prompt: segment.visual,
            art_style: artStyle,
            segmentId: segment.id,
            project_id: selectedProject?.id,
            model: modelSelection.selectedImageModel,
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
      creditManagement.showCreditDeduction(
        "Image Generation",
        modelSelection.selectedImageModel,
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
      timelineIntegration.setCurrentUserMessage("");

      // No auto-trigger - user must manually select model and send
    } catch (error) {
      console.error("Error in image generation:", error);
      creditManagement.showRequestFailed("Image Generation");
      setError(error.message || "Failed to generate images. Please try again.");
      updateStepStatus(4, "pending");
    } finally {
      setLoading(false);
    }
  }, [
    selectedScript,
    selectedProject?.id,
    updateStepStatus,
    creditManagement,
    timelineIntegration,
    modelSelection,
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
            model: modelSelection.selectedVideoModel,
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
        creditManagement.showCreditDeduction(
          "Video Generation",
          modelSelection.selectedVideoModel,
          totalValidSegments,
        );
      }

      setGeneratedVideos(videosMap);

      updateStepStatus(5, "done");

      // Clear user message after videos are generated
      timelineIntegration.setCurrentUserMessage("");
    } catch (error) {
      console.error("Error in video generation:", error);
      creditManagement.showRequestFailed("Video Generation");
      setError(error.message || "Failed to generate videos. Please try again.");
      updateStepStatus(5, "pending");
    } finally {
      setLoading(false);
    }
  }, [
    generatedImages,
    selectedScript,
    selectedProject?.id,
    updateStepStatus,
    creditManagement,
    timelineIntegration,
    modelSelection,
  ]);

  const handleConceptSelect = useCallback(
    async (concept) => {
      console.log("🎯 Concept selected:", concept.title);
      setSelectedConcept(concept);
      updateStepStatus(1, "done");
      setCurrentStep(2);

      // Add agent message acknowledging concept selection
      timelineIntegration.setAllUserMessages((prev) => [
        ...prev,
        {
          id: `agent-concept-selected-${Date.now()}`,
          content: `Perfect! I'll now create script segments for "${concept.title}". Let me work on that...`,
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    },
    [updateStepStatus, timelineIntegration],
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
      timelineIntegration.setAllUserMessages((prev) => [
        ...prev,
        {
          id: `agent-script-selected-${Date.now()}`,
          content: `Excellent choice! I'll now generate images for each segment of your script. This will bring your concept to life visually!`,
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    },
    [updateStepStatus, timelineIntegration],
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
        timelineIntegration.setStoredVideosMap(videosMap);

        // If we have videos, move to step 5 (video generation completed)
        if (Object.keys(videosMap).length > 0) {
          setCurrentStep(5);
        }
      } else {
        console.log("No videos found in API response");
        setGeneratedVideos({});
        timelineIntegration.setStoredVideosMap({});
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
        timelineIntegration.setAllUserMessages((prev) => [initialMessage, ...prev]);
      }

      console.log("Project data loading completed");
    } catch (error) {
      console.error("Error loading project data from API:", error);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
    }, [selectedProject?.id, resetFlow, timelineIntegration]); // Include resetFlow dependency

  // Handle streaming tool results (concepts, scripts, images, videos)
  const handleToolResult = useCallback(
    async (result) => {
      console.log('🎯 handleToolResult called with:', result);
      
      // Handle concept generation results
      if (result.data && result.data.concepts) {
        console.log('📝 Setting concepts from streaming result:', result.data.concepts);
        setConcepts(result.data.concepts);
        updateStepStatus(0, "done");
        setCurrentStep(1);
        
        // Add agent message showing concepts
        timelineIntegration.setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-concepts-${Date.now()}`,
            content: `I've generated ${result.data.concepts.length} video concepts for you! Please select the one you'd like to develop:`,
            timestamp: Date.now(),
            type: "system",
          },
        ]);
        
        // Show credit deduction for concept generation
        creditManagement.showCreditDeduction("Concept Writer Process");
      }
      
      // Also check if result.data has concept array directly
      if (
        Array.isArray(result.data) &&
        result.data.length > 0 &&
        result.data[0].title
      ) {
        console.log('📝 Setting concepts from array format:', result.data);
        setConcepts(result.data);
        updateStepStatus(0, "done");
        setCurrentStep(1);
        
        // Add agent message showing concepts
        timelineIntegration.setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-concepts-${Date.now()}`,
            content: "I've generated 4 video concepts for you! Please select the one you'd like to develop:",
            timestamp: Date.now(),
            type: "system",
          },
        ]);
        
        // Show credit deduction for concept generation
        creditManagement.showCreditDeduction("Concept Writer Process");
      }
      
      // Handle segmentation results
      if (result.data && result.data.segments) {
        // Create script object from the segments data
        const script = {
          segments: result.data.segments,
          artStyle: result.data.artStyle || "realistic",
          concept: result.data.concept || "",
        };
        
        // Set scripts for user selection (create two scripts for selection)
        setScripts({ 
          response1: script, 
          response2: { ...script, artStyle: script.artStyle + " (Alternative)" }
        });
        
        updateStepStatus(2, "done");
        setCurrentStep(3); // Go to script selection step
        
        // Show credit deduction for script generation
        creditManagement.showCreditDeduction("Script Generation", null, 1);
      }
      
      console.log('✅ handleToolResult completed');
    },
    [
      setConcepts,
      updateStepStatus,
      setCurrentStep,
      timelineIntegration,
      creditManagement,
      setScripts,
    ],
  );

  // Enhanced startAgentStream that includes all necessary callbacks
  const startAgentStreamWithCallbacks = useCallback(
    async (userInput) => {
      const callbacks = {
        setAllUserMessages: timelineIntegration.setAllUserMessages,
        setGeneratedImages,
        setGeneratedVideos,
        setStoredVideosMap: timelineIntegration.setStoredVideosMap,
        selectedProject,
        handleToolResult,
      };
      
      return agentStreaming.startAgentStream(
        userInput,
        user,
      selectedProject,
        setError,
        setLoading,
        timelineIntegration.setAllUserMessages,
        callbacks,
      );
    },
    [agentStreaming, user, selectedProject, timelineIntegration, setGeneratedImages, setGeneratedVideos, handleToolResult],
  );

  // Enhanced approval functions that include all necessary parameters
    const approveToolExecutionWithCallbacks = useCallback(
    async (approvalId, additionalData = null) => {
      console.log('🔧 approveToolExecutionWithCallbacks called with:', { approvalId, additionalData });
      return agentStreaming.approveToolExecution(
        approvalId,
        additionalData,
        user,
        selectedProject,
        selectedConcept,
        selectedScript,
        generatedImages,
        modelSelection.selectedConceptModel,
        modelSelection.selectedScriptModel,
        modelSelection.selectedImageModel,
        modelSelection.selectedVideoModel,
        timelineIntegration.setAllUserMessages,
        setError,
      );
    },
    [
      agentStreaming,
      user,
      selectedProject,
      selectedConcept,
      selectedScript,
      generatedImages,
      modelSelection,
      timelineIntegration,
      setError,
    ],
  );

  const rejectToolExecutionWithCallbacks = useCallback(
    async (approvalId) => {
      return agentStreaming.rejectToolExecution(
        approvalId,
        user,
        setError,
      );
    },
    [agentStreaming, user, setError],
  );

  return {
    // Core States
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

    // Specialized hook states
    ...modelSelection,
    ...creditManagement,
    ...timelineIntegration,
    ...agentStreaming,

    // Core Actions
    resetFlow,
    updateStepStatus,
    runConceptWriter,
    runScriptGeneration,
    runImageGeneration,
    runVideoGeneration,
    handleConceptSelect,
    handleScriptSelect,
    loadProjectData,

    // Enhanced streaming and approval actions
    startAgentStream: startAgentStreamWithCallbacks,
    approveToolExecution: approveToolExecutionWithCallbacks,
    rejectToolExecution: rejectToolExecutionWithCallbacks,
  };
};
