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
  const [selectedImageModel, setSelectedImageModel] = useState(
    chatApi.getDefaultModel("IMAGE"),
  );
  const [selectedVideoModel, setSelectedVideoModel] = useState(
    chatApi.getDefaultModel("VIDEO"),
  );
  const [selectedScriptModel, setSelectedScriptModel] = useState("flash");

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
          console.log('🔄 Project changed, updating selected project:', newSelectedProject);
          
          // Show loading message for project switch
          if (newSelectedProject) {
            setAgentActivity(`🔄 Switching to project: ${newSelectedProject.name}...`);
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
    console.log('🔄 Resetting chat flow state...');
    
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
    setSelectedImageModel(chatApi.getDefaultModel("IMAGE"));
    setSelectedVideoModel(chatApi.getDefaultModel("VIDEO"));
    setSelectedScriptModel("flash");
    
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
    
    console.log('✅ Chat flow state reset complete');
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
          message = formatCreditDeduction("Script Generation", credits, additionalInfo);
          break;
        case "Image Generation":
          if (model) {
            credits = getImageCreditCost(model) * count;
            additionalInfo = `${count} image${count !== 1 ? "s" : ""} using ${model}`;
            message = formatCreditDeduction("Image Generation", credits, additionalInfo);
          } else {
            credits = getImageCreditCost("imagen") * count; // default to imagen
            additionalInfo = `${count} image${count !== 1 ? "s" : ""}`;
            message = formatCreditDeduction("Image Generation", credits, additionalInfo);
          }
          break;
        case "Video Generation":
          if (model) {
            credits = getVideoCreditCost(model, 5) * count; // 5 seconds default
            additionalInfo = `${count} video${count !== 1 ? "s" : ""} using ${model} (5s each)`;
            message = formatCreditDeduction("Video Generation", credits, additionalInfo);
          } else {
            credits = getVideoCreditCost("veo2", 5) * count; // default to veo2
            additionalInfo = `${count} video${count !== 1 ? "s" : ""} (5s each)`;
            message = formatCreditDeduction("Video Generation", credits, additionalInfo);
          }
          break;
        case "Concept Writer Process":
          // This is a combined operation
          credits = getTextCreditCost("web-info") + getTextCreditCost("concept generator");
          additionalInfo = "Web research + 4 concepts";
          message = formatCreditDeduction("Concept Writer Process", credits, additionalInfo);
          break;
        default:
          message = `${credits} credit${credits !== 1 ? "s" : ""} deducted for ${serviceName}`;
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
        console.log("Using script model:", scriptModel, "selectedScriptModel:", selectedScriptModel);
        
        const [res1, res2] = await Promise.all([
          segmentationApi.getSegmentation({
            prompt,
            concept: selectedConcept.title,
            negative_prompt: "",
            project_id: selectedProject?.id,
            model: scriptModel
          }),
          segmentationApi.getSegmentation({
            prompt,
            concept: selectedConcept.title,
            negative_prompt: "",
            project_id: selectedProject?.id,
            model: scriptModel
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
      console.log('🎯 Concept selected:', concept.title);
      setSelectedConcept(concept);
      updateStepStatus(1, "done");
      setCurrentStep(2);
      
      // Add agent message acknowledging concept selection
      setAllUserMessages(prev => [...prev, {
        id: `agent-concept-selected-${Date.now()}`,
        content: `Perfect! I'll now create script segments for "${concept.title}". Let me work on that...`,
        timestamp: Date.now(),
        type: 'system'
      }]);
    },
    [updateStepStatus],
  );

  const handleScriptSelect = useCallback(
    async (script) => {
      console.log('📜 Script selected:', script);
      setSelectedScript(script);
      updateStepStatus(3, "done");
      setCurrentStep(4);
      
      // Add agent message acknowledging script selection
      setAllUserMessages(prev => [...prev, {
        id: `agent-script-selected-${Date.now()}`,
        content: `Excellent choice! I'll now generate images for each segment of your script. This will bring your concept to life visually!`,
        timestamp: Date.now(),
        type: 'system'
      }]);
    },
    [updateStepStatus],
  );

  const loadProjectData = useCallback(async () => {
    if (!selectedProject) return;

    try {
      console.log(`🔄 Loading project data for project: ${selectedProject.name} (ID: ${selectedProject.id})`);
      
      // Reset all states first to ensure clean slate
      resetFlow();
      
      setLoading(true);
      setError(null);

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
        const hasContent = concepts || segments.length > 0 || Object.keys(imagesMap).length > 0 || Object.keys(videosMap).length > 0;
        
        let statusMessage = `📁 Loaded project: ${projectName}`;
        if (hasContent) {
          const contentSummary = [];
          if (concepts) contentSummary.push(`${concepts.length} concepts`);
          if (segments.length > 0) contentSummary.push(`${segments.length} script segments`);
          if (Object.keys(imagesMap).length > 0) contentSummary.push(`${Object.keys(imagesMap).length} images`);
          if (Object.keys(videosMap).length > 0) contentSummary.push(`${Object.keys(videosMap).length} videos`);
          
          if (contentSummary.length > 0) {
            statusMessage += ` - Found: ${contentSummary.join(', ')}`;
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
        setAllUserMessages(prev => [initialMessage, ...prev]);
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
  const startAgentStream = useCallback(async (userInput) => {
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

    console.log('Starting agent stream with prompt:', cleanPrompt);

    setIsStreaming(true);
    setLoading(true);
    setError(null);
    setStreamMessages([]);
    setPendingApprovals([]);
    setAgentActivity("🚀 Initializing agent workflow...");
    setStreamingProgress(null);

    try {
      const response = await agentApi.startAgentRunStream(
        cleanPrompt,
        user?.id,
        'default', // segmentId
        selectedProject.id
      );

      const reader = response.body.getReader();
      setCurrentReader(reader);

      const decoder = new TextDecoder();
      let buffer = '';

      console.log('🔄 Stream reader initialized, starting to read...');

      // Create a better stream processor
      const processStream = async () => {
        try {
          while (true) {
            console.log('📖 Reading stream chunk...');
            
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Stream reading completed');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('📦 Raw chunk received:', chunk);
            
            buffer += chunk;
            
            // Process complete lines immediately
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === '') continue;
              
              console.log('🔍 Processing line:', line);
              
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = line.slice(6).trim();
                  console.log('🧾 JSON data to parse:', jsonData);
                  const data = JSON.parse(jsonData);
                  console.log('✅ Parsed stream message:', data);
                  await handleStreamMessage(data);
                } catch (parseError) {
                  console.error('❌ Error parsing stream message:', parseError, 'Raw line:', line);
                }
              } else if (line.trim()) {
                console.log('⚠️ Non-data line:', line);
              }
            }
            
            // Force immediate processing
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        } catch (error) {
          console.error('❌ Stream processing error:', error);
          throw error;
        }
      };

      await processStream();

    } catch (error) {
      console.error('Error in agent stream:', error);
      setError(error.message || 'Failed to start agent stream');
    } finally {
      setIsStreaming(false);
      setLoading(false);
      setCurrentReader(null);
    }
  }, [selectedProject?.id, user?.id]);

  const handleStreamMessage = useCallback(async (message) => {
    console.log('🔄 Received stream message:', message);
    
    setStreamMessages(prev => {
      console.log('📝 Adding to stream messages. Current count:', prev.length);
      return [...prev, message];
    });

    console.log('🎯 Processing message type:', message.type);

    switch (message.type) {
      case 'log': {
        console.log('📋 Stream log:', message.data.message || message.data);
        // Update agent activity with log message if it contains useful info
        const logMessage = message.data.message || message.data;
        if (typeof logMessage === 'string') {
          setAgentActivity(logMessage);
        }
        break;
      }

      case 'thinking':
        // Agent is thinking/processing
        setAgentActivity(message.data.message || "Agent is analyzing your request...");
        break;

      case 'tool_start': {
        // Tool execution started
        const toolName = message.data.toolName || message.data.tool_name;
        setAgentActivity(getToolStartMessage(toolName));
        setStreamingProgress({ step: toolName, status: 'starting' });
        break;
      }

      case 'tool_progress':
        // Tool execution progress
        setStreamingProgress(prev => ({
          ...prev,
          ...message.data,
          status: 'in_progress'
        }));
        break;

      case 'approval_required': {
        console.log('⏳ APPROVAL REQUIRED - Processing...');
        const { approvalId, toolName, arguments: args, agentName } = message.data;
        
        // Set agent activity to show what approval is needed
        setAgentActivity(getApprovalMessage(toolName));
        
        // Parse arguments if they come as JSON string
        let parsedArgs = args;
        if (typeof args === 'string') {
          try {
            parsedArgs = JSON.parse(args);
          } catch {
            console.error('Failed to parse arguments:', args);
            parsedArgs = {};
          }
        }
        
        console.log('📊 Approval details:', { approvalId, toolName, parsedArgs, agentName });
        
        // Check if this approval already exists to prevent duplicates
        setPendingApprovals(prev => {
          const existingApproval = prev.find(a => a.id === approvalId);
          if (existingApproval) {
            console.log('⚠️ Approval already exists, skipping duplicate:', approvalId);
            return prev;
          }
          
          console.log('📋 Adding to pending approvals. Current count:', prev.length);
          const newApproval = {
            id: approvalId,
            toolName,
            arguments: parsedArgs,
            agentName,
            timestamp: message.timestamp
          };
          console.log('➕ New approval object:', newApproval);
          return [...prev, newApproval];
        });

        // Handle approval based on tool type
        console.log('🔧 Calling handleToolApproval...');
        await handleToolApproval(approvalId, toolName, parsedArgs);
        break;
      }

      case 'result':
        console.log('✅ Tool result received:', message.data);
        setAgentActivity(getToolCompleteMessage(message.data.toolName || 'operation'));
        setStreamingProgress(null); // Clear progress
        await handleToolResult(message.data);
        break;

      case 'completed':
        console.log('🎉 Agent run completed:', message.data);
        setAgentActivity("✅ Task completed successfully!");
        setStreamingProgress(null);
        setIsStreaming(false);
        setLoading(false);
        // Clear activity after a delay
        setTimeout(() => setAgentActivity(null), 3000);
        break;

      case 'error':
        console.error('❌ Stream error:', message.data.message);
        setAgentActivity(`❌ Error: ${message.data.message}`);
        setStreamingProgress(null);
        setError(message.data.message);
        setIsStreaming(false);
        setLoading(false);
        break;

      default:
        console.log('❓ Unknown stream message type:', message.type, message);
    }
  }, []);

  // Helper functions for verbose messaging
  const getToolStartMessage = useCallback((toolName) => {
    switch (toolName) {
      case 'get_web_info':
        return "🔍 Researching web information for your request...";
      case 'generate_concepts_with_approval':
        return "💡 Analyzing research and generating creative concepts...";
      case 'generate_segmentation':
        return "📜 Creating detailed script segments for your concept...";
      case 'generate_image_with_approval':
        return "🎨 Generating images for each script segment...";
      case 'generate_video_with_approval':
        return "🎬 Creating videos from your images...";
      default:
        return `🔄 Starting ${toolName}...`;
    }
  }, []);

  const getApprovalMessage = useCallback((toolName) => {
    switch (toolName) {
      case 'get_web_info':
        return "⏳ Ready to research web information - waiting for your approval";
      case 'generate_concepts_with_approval':
        return "⏳ Ready to generate concepts from research - waiting for your approval";
      case 'generate_segmentation':
        return "⏳ Ready to create script segments - waiting for your approval";
      case 'generate_image_with_approval':
        return "⏳ Ready to generate images - waiting for your approval";
      case 'generate_video_with_approval':
        return "⏳ Ready to generate videos - waiting for your approval";
      default:
        return `⏳ Waiting for approval to proceed with ${toolName}`;
    }
  }, []);

  const getToolCompleteMessage = useCallback((toolName) => {
    switch (toolName) {
      case 'get_web_info':
        return "✅ Web research completed successfully";
      case 'generate_concepts_with_approval':
        return "✅ Concepts generated and ready for selection";
      case 'generate_segmentation':
        return "✅ Script segments created successfully";
      case 'generate_image_with_approval':
        return "✅ Images generated for all segments";
      case 'generate_video_with_approval':
        return "✅ Videos generated successfully";
      default:
        return `✅ ${toolName} completed successfully`;
    }
  }, []);

  const handleToolApproval = useCallback(async (approvalId, toolName, args) => {
    console.log('Tool approval required:', { approvalId, toolName, args });
    // Manual approval required - approval will remain pending until user clicks approve
    console.log('Manual approval needed for:', toolName);
  }, []);

  const handleToolResult = useCallback(async (result) => {
    console.log('🎯 Tool result received:', result);
    console.log('🔍 Result data structure:', {
      hasData: !!result.data,
      dataType: typeof result.data,
      isArray: Array.isArray(result.data),
      keys: result.data ? Object.keys(result.data) : 'no data',
      firstItem: Array.isArray(result.data) ? result.data[0] : 'not array',
      hasResults: !!result.results,
      hasDataResults: !!(result.data && result.data.results),
      dataResultsLength: result.data && result.data.results ? result.data.results.length : 0
    });

    // Update agent activity based on result type
    setAgentActivity("🔄 Processing results and updating interface...");

    console.log('🧪 TESTING: About to check image conditions...');

    // Check for image generation results FIRST (highest priority)
    const imageConditions = {
      hasResults: !!result.results,
      hasDataResults: !!(result.data && result.data.results),
      resultType: typeof result.results,
      dataResultType: typeof (result.data && result.data.results),
      isResultsArray: Array.isArray(result.results),
      isDataResultsArray: Array.isArray(result.data && result.data.results)
    };
    
    console.log('🔍 Checking image generation conditions:', imageConditions);
    
    const condition1 = result.results && Array.isArray(result.results);
    const condition2 = result.data?.results && Array.isArray(result.data.results);
    const finalCondition = condition1 || condition2;
    
    console.log('🧮 Condition evaluation:', {
      condition1: condition1,
      condition2: condition2,
      finalCondition: finalCondition
    });

    if (finalCondition) {
      console.log('✅ IMAGE CONDITION MET - Processing images...');
      
      setAgentActivity("🎨 Processing generated images and creating URLs...");
      
      console.log('🎨 Processing image generation results:', result);
      
      // Use either direct results or nested data.results
      const imageResults = result.results || result.data.results;
      console.log('📋 Image results array:', imageResults.length, 'segments');
      const imagesMap = {};
      const failedSegments = [];
      
      setStreamingProgress({ step: 'image_processing', status: 'processing', total: imageResults.length, current: 0 });
      
      // Process results and convert S3 keys to full URLs
      const imagePromises = imageResults.map(async (item) => {
        if (item.status === 'success' && item.imageData?.s3_key) {
          try {
            console.log(`🔄 Converting S3 key to URL for ${item.segmentId}:`, item.imageData.s3_key);
            // Convert S3 key to full CloudFront URL
            const imageUrl = await s3Api.downloadImage(item.imageData.s3_key);
            console.log(`✅ Generated URL for ${item.segmentId}:`, imageUrl);
            imagesMap[item.segmentId] = imageUrl;
          } catch (error) {
            console.error(`Failed to get image URL for segment ${item.segmentId}:`, error);
            failedSegments.push(item.segmentId);
          }
        } else if (item.status === 'failed') {
          // Failed case - track for retry
          failedSegments.push(item.segmentId);
        }
      });
      
      // Wait for all image URL conversions to complete
      await Promise.allSettled(imagePromises);
      
      console.log('🖼️ Final images map after URL conversion:', imagesMap);
      
      // Update generated images with successful ones
      if (Object.keys(imagesMap).length > 0) {
        setGeneratedImages(prev => {
          const newImages = { ...prev, ...imagesMap };
          console.log('🎯 Setting generated images:', newImages);
          return newImages;
        });
        
        // Add agent message showing image generation completion
        const successCount = Object.keys(imagesMap).length;
        setAllUserMessages(prev => [...prev, {
          id: `agent-images-${Date.now()}`,
          content: `🎨 Perfect! I've generated ${successCount} images for your script segments. You can see them below and proceed to video generation!`,
          timestamp: Date.now(),
          type: 'system'
        }]);

        // Show credit deduction for image generation
        if (successCount > 0) {
          showCreditDeduction("Image Generation", selectedImageModel || "flux-1.1-pro", successCount);
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
      console.log('❌ IMAGE CONDITION NOT MET - Skipping image processing');
      console.log('📊 Detailed analysis:', {
        'result.results exists': !!result.results,
        'result.results type': typeof result.results,
        'result.results isArray': Array.isArray(result.results),
        'result.data exists': !!result.data,
        'result.data.results exists': !!(result.data && result.data.results),
        'result.data.results type': result.data ? typeof result.data.results : 'no data',
        'result.data.results isArray': result.data ? Array.isArray(result.data.results) : false,
        'Full result.data': result.data
      });
    }

    // Update UI based on the tool result
    if (result.data) {
      // Handle concept generation results
      if (result.data.concepts) {
        setAgentActivity("💡 Processing generated concepts and preparing selection...");
        console.log('📝 Setting concepts in UI:', result.data.concepts);
        setConcepts(result.data.concepts);
        updateStepStatus(0, "done");
        setCurrentStep(1);
        
        // Add agent message showing concepts
        setAllUserMessages(prev => [...prev, {
          id: `agent-concepts-${Date.now()}`,
          content: "I've generated 4 video concepts for you! Please select the one you'd like to develop:",
          timestamp: Date.now(),
          type: 'system'
        }]);

        // Show credit deduction for concept generation (includes web-info + concept generation)
        showCreditDeduction("Concept Writer Process");
      }
      
      // Also check if result.data has concept array directly
      if (Array.isArray(result.data) && result.data.length > 0 && result.data[0].title) {
        setAgentActivity("💡 Processing generated concepts and preparing selection...");
        console.log('📝 Setting concepts from array format:', result.data);
        setConcepts(result.data);
        updateStepStatus(0, "done");
        setCurrentStep(1);
        
        // Add agent message showing concepts
        setAllUserMessages(prev => [...prev, {
          id: `agent-concepts-${Date.now()}`,
          content: "I've generated 4 video concepts for you! Please select the one you'd like to develop:",
          timestamp: Date.now(),
          type: 'system'
        }]);

        // Show credit deduction for concept generation (includes web-info + concept generation)
        showCreditDeduction("Concept Writer Process");
      }

      // Handle segmentation results
      if (result.data.segments) {
        setAgentActivity("📜 Processing script segments and preparing for image generation...");
        const script = {
          segments: result.data.segments,
          artStyle: result.data.artStyle || 'realistic',
          concept: result.data.concept || ''
        };
        setSelectedScript(script);
        updateStepStatus(2, "done");
        setCurrentStep(4); // Skip to image generation
        
        // Add agent message showing scripts
        setAllUserMessages(prev => [...prev, {
          id: `agent-scripts-${Date.now()}`,
          content: "I've created script segments for your concept! Please select the script version you prefer:",
          timestamp: Date.now(),
          type: 'system'
        }]);

        // Show credit deduction for script generation
        showCreditDeduction("Script Generation", null, 1);
      }


    }

    // Show credit deduction if applicable
    if (result.message && result.message.includes('completed successfully')) {
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
  }, [updateStepStatus, user?.id, fetchBalance, generatedImages, selectedScript]);

  // Retry failed image generation using chat endpoint
  const retryFailedImageGeneration = useCallback(async (failedSegmentIds) => {
    if (!selectedScript?.segments) return;

    console.log('Retrying failed image generation for segments:', failedSegmentIds);

    try {
      const retryPromises = failedSegmentIds.map(async (segmentId) => {
        const segment = selectedScript.segments.find(seg => seg.id === segmentId);
        if (!segment) return null;

        try {
          const result = await chatApi.generateImage({
            visual_prompt: segment.visual,
            art_style: selectedScript.artStyle || 'realistic',
            segmentId: segment.id,
            project_id: selectedProject?.id,
            model: selectedImageModel || 'flux-1.1-pro',
          });

          if (result.s3_key) {
            const imageUrl = await s3Api.downloadImage(result.s3_key);
            return { segmentId, imageUrl, s3Key: result.s3_key };
          }
          return null;
        } catch (error) {
          console.error(`Failed to retry image generation for segment ${segmentId}:`, error);
          return null;
        }
      });

      const retryResults = await Promise.allSettled(retryPromises);
      const successfulRetries = {};

      retryResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { segmentId, imageUrl } = result.value;
          successfulRetries[segmentId] = imageUrl;
        }
      });

      if (Object.keys(successfulRetries).length > 0) {
        setGeneratedImages(prev => ({ ...prev, ...successfulRetries }));
        console.log('Successfully retried images for segments:', Object.keys(successfulRetries));
      }

    } catch (error) {
      console.error('Error retrying failed image generation:', error);
    }
  }, [selectedScript, selectedProject?.id, selectedImageModel]);

  const stopStream = useCallback(() => {
    if (currentReader) {
      currentReader.cancel();
      setCurrentReader(null);
    }
    setIsStreaming(false);
    setLoading(false);
  }, [currentReader]);

  const approveToolExecution = useCallback(async (approvalId, additionalData = null) => {
    try {
      // Find the approval to get tool context
      const approval = pendingApprovals.find(a => a.id === approvalId);
      let finalAdditionalData = additionalData;

      // Prepare specific data based on tool type
      if (!additionalData && approval) {
        switch (approval.toolName) {
          case 'generate_concepts_with_approval':
            // For concept generation - match DTO exactly
            finalAdditionalData = {
              web_info: approval.arguments?.web_info || null,
              prompt: approval.arguments?.prompt || null,
              projectId: selectedProject?.id || approval.arguments?.projectId || null
            };
            break;

          case 'generate_segmentation':
            // For segmentation - check if concept is selected first
            if (!selectedConcept) {
              setError('Please select a concept first before generating segmentation');
              return;
            }
            // For segmentation - match DTO exactly and ensure we use selected concept
            finalAdditionalData = {
              prompt: approval.arguments?.prompt || null,
              concept: selectedConcept.title,
              negative_prompt: approval.arguments?.negative_prompt || null,
              projectId: selectedProject?.id || approval.arguments?.projectId || null
            };
            console.log('🎯 Using selected concept for segmentation:', selectedConcept.title);
            break;

          case 'generate_image_with_approval':
            // For image generation - match DTO exactly
            finalAdditionalData = {
              segments: selectedScript?.segments || null,
              art_style: selectedScript?.artStyle || approval.arguments?.art_style || 'realistic',
              model: selectedImageModel || approval.arguments?.model || 'flux-1.1-pro',
              projectId: selectedProject?.id || approval.arguments?.projectId || null,
              segmentId: 'default'
            };
            break;

          case 'get_web_info':
            // For web info - match DTO exactly
            finalAdditionalData = {
              prompt: approval.arguments?.prompt || null,
              projectId: selectedProject?.id || approval.arguments?.projectId || null
            };
            break;

          default:
            // For other tools, just pass the basic approval
            finalAdditionalData = null;
        }
      }

      console.log('Approving tool with data:', { approvalId, toolName: approval?.toolName, finalAdditionalData });

      await agentApi.handleApproval(approvalId, true, finalAdditionalData);
      
      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
    } catch (error) {
      console.error('Error approving tool:', error);
      setError('Failed to approve tool execution');
    }
  }, [pendingApprovals, selectedScript, selectedImageModel, selectedProject?.id, selectedConcept]);

  const rejectToolExecution = useCallback(async (approvalId) => {
    try {
      await agentApi.handleApproval(approvalId, false);
      
      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== approvalId));
    } catch (error) {
      console.error('Error rejecting tool:', error);
      setError('Failed to reject tool execution');
    }
  }, []);

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
    selectedScriptModel,
    setSelectedScriptModel,
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
