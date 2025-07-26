import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import LoadingSpinner from "./LoadingSpinner";
import CharacterGenerator from "./CharacterGenerator";
import { useAuth } from "../hooks/useAuth";
import ChatLoginButton from "./ChatLoginButton";
import { ProjectHistoryDropdown } from "./ProjectHistoryDropdown";
import { webInfoApi } from "../services/web-info";
import { conceptWriterApi } from "../services/concept-writer";
import { segmentationApi } from "../services/segmentationapi";
import { imageApi } from "../services/image";
import { s3Api } from "../services/s3";
import { videoApi } from "../services/video-gen";
import { projectApi } from "../services/project";

function ChatWidget() {
  const { isAuthenticated, logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      const stored = localStorage.getItem('project-store-selectedProject');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
  const [storedVideosMap, setStoredVideosMap] = useState(() => {
    try {
      const stored = localStorage.getItem('project-store-selectedProject');
      if (stored) {
        const project = JSON.parse(stored);
        return JSON.parse(localStorage.getItem(`project-store-videos`) || "{}");
      }
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

  const [addingTimeline, setAddingTimeline] = useState(false);
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const nameInputRef = useRef(null);

  // New 6-step flow states
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({
    0: 'pending', // concept writer
    1: 'pending', // user chooses concept
    2: 'pending', // script generation
    3: 'pending', // user chooses script
    4: 'pending', // image generation
    5: 'pending', // video generation
  });
  
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [scripts, setScripts] = useState(null);
  const [selectedScript, setSelectedScript] = useState(null);
  const [generatedImages, setGeneratedImages] = useState({});
  const [generatedVideos, setGeneratedVideos] = useState({});
  const [generationProgress, setGenerationProgress] = useState({});

  const steps = [
    { id: 0, name: 'Concept Writer', description: 'Generate video concepts' },
    { id: 1, name: 'Choose Concept', description: 'Select your preferred concept' },
    { id: 2, name: 'Script Generation', description: 'Generate script segments' },
    { id: 3, name: 'Choose Script', description: 'Select your preferred script' },
    { id: 4, name: 'Image Generation', description: 'Generate images for segments' },
    { id: 5, name: 'Video Generation', description: 'Generate videos from images' },
  ];

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('project-store-selectedProject');
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

  // Load project data when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    } else {
      resetFlow();
    }
  }, [selectedProject]);


  // Update step status based on current data
  useEffect(() => {
    if (!selectedProject) return;
    
    const newStepStatus = { ...stepStatus };
    
    // Step 0: Concept Writer - check if concepts exist
    if (concepts && concepts.length > 0) {
      newStepStatus[0] = 'done';
    } else {
      newStepStatus[0] = 'pending';
    }
    
    // Step 1: Choose Concept - check if concept is selected
    if (selectedConcept) {
      newStepStatus[1] = 'done';
    } else {
      newStepStatus[1] = 'pending';
    }
    
    // Step 2: Script Generation - check if scripts exist
    if (selectedScript && selectedScript.segments && selectedScript.segments.length > 0) {
      newStepStatus[2] = 'done';
    } else {
      newStepStatus[2] = 'pending';
    }
    
    // Step 3: Choose Script - check if script is selected
    if (selectedScript && selectedScript.segments && selectedScript.segments.length > 0) {
      newStepStatus[3] = 'done';
    } else {
      newStepStatus[3] = 'pending';
    }
    
    // Step 4: Image Generation - check if images exist (from API or generation)
    const hasImages = Object.keys(generatedImages).length > 0 || 
                     (selectedScript?.segments?.some(seg => seg.s3Key || seg.image_s3_key || seg.imageS3Key));
    if (hasImages) {
      newStepStatus[4] = 'done';
    } else {
      newStepStatus[4] = 'pending';
    }
    
    // Step 5: Video Generation - check if videos exist (from API or generation)
    const hasVideos = Object.keys(generatedVideos).length > 0 || 
                     (selectedScript?.segments?.some(seg => seg.videoUrl || seg.video_url));
    if (hasVideos) {
      newStepStatus[5] = 'done';
    } else {
      newStepStatus[5] = 'pending';
    }
    
    // Debug logging for step status updates
    if (hasImages || hasVideos) {
      console.log('Step status update:', {
        concepts: concepts?.length || 0,
        selectedConcept: !!selectedConcept,
        selectedScript: !!selectedScript,
        selectedScriptSegments: selectedScript?.segments?.length || 0,
        images: Object.keys(generatedImages).length,
        videos: Object.keys(generatedVideos).length,
        hasImages,
        hasVideos,
        newStepStatus
      });
    }
    
    setStepStatus(newStepStatus);
  }, [selectedProject, concepts, selectedConcept, scripts, selectedScript, generatedImages, generatedVideos]);

  const resetFlow = () => {
    setCurrentStep(0);
    setStepStatus({
      0: 'pending',
      1: 'pending',
      2: 'pending',
      3: 'pending',
      4: 'pending',
      5: 'pending',
    });
    setConcepts(null);
    setSelectedConcept(null);
    setScripts(null);
    setSelectedScript(null);
    setGeneratedImages({});
    setGeneratedVideos({});
    setGenerationProgress({});
  };

  const updateStepStatus = (stepId, status) => {
    setStepStatus(prev => ({
      ...prev,
      [stepId]: status
    }));
  };

  const getStepIcon = (stepId) => {
    const status = stepStatus[stepId];
    let icon;
    
    if (status === 'loading') {
      icon = '⏳';
    } else if (status === 'done') {
      icon = '✅';
    } else if (status === 'pending' && stepId === currentStep) {
      icon = '▶️';
    } else {
      icon = '⏸️';
    }
    
    return icon;
  };

  const isStepDisabled = (stepId) => {
    if (loading) return true;
    if (stepId === 0) return false; // First step is always enabled
    if (stepId === 1) return !concepts;
    if (stepId === 2) return !selectedConcept;
    if (stepId === 3) return !selectedScript || !selectedScript.segments;
    if (stepId === 4) return !selectedScript || !selectedScript.segments;
    if (stepId === 5) return Object.keys(generatedImages).length === 0;
    return true;
  };

  const handleStepClick = async (stepId) => {
    if (isStepDisabled(stepId) || loading) return;
    
    setCurrentStep(stepId);
    
    // Only run the step if it's not already done
    if (stepStatus[stepId] !== 'done') {
      switch (stepId) {
        case 0:
          await runConceptWriter();
          break;
        case 2:
          await runScriptGeneration();
          break;
        case 4:
          await runImageGeneration();
          break;
        case 5:
          await runVideoGeneration();
          break;
      }
    }
  };

  const handleRedoStep = async (stepId) => {
    if (loading) return;
    
    setCurrentStep(stepId);
    
    switch (stepId) {
      case 0:
        await runConceptWriter();
        break;
      case 2:
        await runScriptGeneration();
        break;
      case 4:
        await runImageGeneration();
        break;
      case 5:
        await runVideoGeneration();
        break;
    }
  };

  const runConceptWriter = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(0, 'loading');

    try {
      console.log("Starting pipeline with web-info...");
      const webInfoResult = await webInfoApi.processWebInfo(prompt, selectedProject?.id);
      console.log("Web-info response:", webInfoResult);

      console.log("Calling concept-writer...");
      const webInfoContent = webInfoResult.choices[0].message.content;
      const conceptsResult = await conceptWriterApi.generateConcepts(
        prompt,
        webInfoContent,
        selectedProject?.id,
      );

      console.log("Concept-writer response:", conceptsResult);
      setConcepts(conceptsResult.concepts);
      updateStepStatus(0, 'done');
      setCurrentStep(1);
    } catch (error) {
      console.error("Error in concept writer:", error);
      setError(error.message || "Failed to generate concepts. Please try again.");
      updateStepStatus(0, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runScriptGeneration = async () => {
    if (!selectedConcept) {
      setError("Please select a concept first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(2, 'loading');

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
      
      setScripts({ response1: res1, response2: res2 });
      updateStepStatus(2, 'done');
      setCurrentStep(3);
    } catch (error) {
      console.error("Error in script generation:", error);
      setError(error.message || "Failed to generate scripts. Please try again.");
      updateStepStatus(2, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runImageGeneration = async () => {
    if (!selectedScript) {
      setError("Please select a script first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(4, 'loading');
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const imagesMap = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "image",
            status: "generating",
            index: i + 1,
            total: segments.length,
          },
        }));

        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        try {
          const result = await imageApi.generateImage({
            visual_prompt: segment.visual,
            art_style: artStyle,
            uuid: segment.id,
            project_id: selectedProject?.id,
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
                index: i + 1,
                total: segments.length,
              },
            }));
          }
        } catch (err) {
          console.error(`Error generating image for segment ${segment.id}:`, err);
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

      // Update segments with s3Key for video generation
      const segmentsWithS3Key = segments.map(segment => ({
        ...segment,
        s3Key: segment.s3Key
      }));

      setGeneratedImages(imagesMap);
      
      // Update selectedScript with the segments that now have s3Key
      setSelectedScript(prev => ({
        ...prev,
        segments: segmentsWithS3Key
      }));

      updateStepStatus(4, 'done');
      setCurrentStep(5);
    } catch (error) {
      console.error("Error in image generation:", error);
      setError(error.message || "Failed to generate images. Please try again.");
      updateStepStatus(4, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const runVideoGeneration = async () => {
    // Check if we have any images available from the API response
    if (Object.keys(generatedImages).length === 0) {
      setError("Please generate images first");
      return;
    }

    setLoading(true);
    setError(null);
    updateStepStatus(5, 'loading');
    setGenerationProgress({});

    try {
      const segments = selectedScript.segments;
      const artStyle = selectedScript.artStyle || "";
      const videosMap = {};

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Check if this segment has an image in the generatedImages map
        // Try different segment ID formats to match with generatedImages
        const segmentIdVariants = [
          segment.id,
          `seg-${segment.id}`,
          segment.segmentId,
          segment.uuid
        ];
        
        const matchingImageKey = segmentIdVariants.find(id => generatedImages[id]);
        if (!matchingImageKey) {
          console.log(`Skipping segment ${segment.id} - no image available. Tried IDs:`, segmentIdVariants);
          continue;
        }

        setGenerationProgress((prev) => ({
          ...prev,
          [segment.id]: {
            type: "video",
            status: "generating",
            index: i + 1,
            total: segments.length,
          },
        }));

        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        try {
          // Extract s3Key from the image URL in generatedImages
          const imageUrl = generatedImages[matchingImageKey];
          let imageS3Key = null;
          
          if (imageUrl && imageUrl.includes('cloudfront.net/')) {
            // Extract s3Key from CloudFront URL
            const urlParts = imageUrl.split('cloudfront.net/');
            if (urlParts.length > 1) {
              imageS3Key = urlParts[1];
            }
          }
          
          console.log(`Generating video for segment ${segment.id} with imageS3Key: ${imageS3Key}`);
          const result = await videoApi.generateVideo({
            animation_prompt: segment.animation || segment.visual,
            art_style: artStyle,
            imageS3Key: imageS3Key,
            uuid: segment.id,
            project_id: selectedProject?.id,
          });

          console.log(`Video generation result for segment ${segment.id}:`, result);

          if (result.s3Keys && result.s3Keys.length > 0) {
            const videoUrl = await s3Api.downloadVideo(result.s3Keys[0]);
            videosMap[segment.id] = videoUrl;

            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "completed",
                index: i + 1,
                total: segments.length,
              },
            }));
          } else {
            console.warn(`No s3Keys returned for segment ${segment.id}`);
            setGenerationProgress((prev) => ({
              ...prev,
              [segment.id]: {
                type: "video",
                status: "error",
                index: i + 1,
                total: segments.length,
                error: "No video keys returned from API",
              },
            }));
          }
        } catch (err) {
          console.error(`Error generating video for segment ${segment.id}:`, err);
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

      setGeneratedVideos(videosMap);

      updateStepStatus(5, 'done');
    } catch (error) {
      console.error("Error in video generation:", error);
      setError(error.message || "Failed to generate videos. Please try again.");
      updateStepStatus(5, 'pending');
    } finally {
      setLoading(false);
    }
  };

  const handleConceptSelect = (concept) => {
    setSelectedConcept(concept);
    updateStepStatus(1, 'done');
    setCurrentStep(2);
  };

  const handleScriptSelect = (script) => {
    setSelectedScript(script);
    updateStepStatus(3, 'done');
    setCurrentStep(4);
  };

  const sendVideosToTimeline = async () => {
    if (addingTimeline) return;

    let payload = [];
    if (selectedScript) {
      payload = selectedScript.segments
        .filter((s) => generatedVideos[s.id])
        .sort((a, b) => a.id - b.id)
        .map((s) => ({ id: s.id, url: generatedVideos[s.id] }));
    }

    if (payload.length === 0) {
      let localVideos = {};
      if (selectedProject) {
        localVideos = JSON.parse(
          localStorage.getItem(`project-store-videos-${selectedProject.id}`) || "{}",
        );
      } else {
        localVideos = JSON.parse(
          localStorage.getItem("segmentVideos") || "{}",
        );
      }
      payload = Object.entries(localVideos)
        .map(([id, url]) => ({ id: Number(id), url }))
        .sort((a, b) => a.id - b.id);
    }

    if (payload.length === 0) {
      setError("No videos to add.");
      return;
    }

    let success = false;
    setAddingTimeline(true);
    try {
      const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
      const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
      if (addByUrlFn) {
        if (addByUrlWithDir) {
          await addByUrlWithDir(payload);
        } else {
          await addByUrlFn(payload);
        }
        success = true;
      } else if (window?.electronAPI?.req?.timeline?.addByUrl) {
        if (window.electronAPI.req.timeline.addByUrlWithDir) {
          await window.electronAPI.req.timeline.addByUrlWithDir(payload);
        } else {
          await window.electronAPI.req.timeline.addByUrl(payload);
        }
        success = true;
      } else if (window.require) {
        const { ipcRenderer } = window.require("electron");
        await ipcRenderer.invoke("extension:timeline:addByUrlWithDir", payload);
        success = true;
      }
    } catch (err) {
      console.error("timeline add failed", err);
    }

    if (success) {
      setTimelineProgress({ expected: payload.length, added: 0 });
    } else {
      setError("Failed to add videos to timeline.");
    }
    setAddingTimeline(false);
  };

  const canSendTimeline = Object.keys(generatedVideos).length > 0 || Object.keys(storedVideosMap).length > 0;

  // Helper functions for project management
  const clearProjectLocalStorage = () => {
    // Clear project selection from localStorage
    localStorage.removeItem('project-store-projects');
    localStorage.removeItem('project-store-selectedProject');
    setSelectedProject(null);
  };

  const loadProjectData = async () => {
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
        projectSegmentations
      ] = await Promise.all([
        projectApi.getProjectById(selectedProject.id),
        projectApi.getProjectConcepts(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectImages(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectVideos(selectedProject.id, { page: 1, limit: 50 }),
        projectApi.getProjectSegmentations(selectedProject.id, { page: 1, limit: 50 })
      ]);
      
      console.log('Raw API responses:', {
        projectDetails,
        projectConcepts,
        projectImages,
        projectVideos,
        projectSegmentations
      });
      
      // Set concepts if available
      if (projectConcepts && projectConcepts.success && projectConcepts.data && projectConcepts.data.length > 0) {
        console.log('Setting concepts:', projectConcepts.data);
        setConcepts(projectConcepts.data);
      } else {
        console.log('No concepts found in API response');
        setConcepts(null);
      }
      
      // Set segments/scripts if available first (we need this to map images/videos correctly)
      let segments = [];
      if (projectSegmentations && projectSegmentations.success && projectSegmentations.data && projectSegmentations.data.length > 0) {
        // Take the first segmentation (script) and extract its segments
        const firstSegmentation = projectSegmentations.data[0];
        if (firstSegmentation.segments && firstSegmentation.segments.length > 0) {
          segments = firstSegmentation.segments.map(seg => ({
            id: seg.segmentId || seg.id,
            visual: seg.visual,
            animation: seg.animation,
            narration: seg.narration,
            s3Key: seg.s3Key || seg.image_s3_key || seg.imageS3Key,
            imageUrl: seg.imageUrl || seg.image_url,
            videoUrl: seg.videoUrl || seg.video_url
          }));
          
          console.log('Setting selected script with segments:', segments);
          setSelectedScript({ 
            segments,
            artStyle: firstSegmentation.artStyle,
            concept: firstSegmentation.concept
          });
        } else {
          console.log('No segments found in segmentation data');
          setSelectedScript(null);
        }
      } else {
        console.log('No segmentations found in API response');
        setSelectedScript(null);
      }

      // Set images if available - map to segments properly
      if (projectImages && projectImages.success && projectImages.data && projectImages.data.length > 0) {
        const imagesMap = {};
        projectImages.data.forEach(img => {
          // Try to find the matching segment by various ID fields
          const segmentId = img.uuid || img.segment_id || img.segmentId || img.id;
          if (segmentId) {
            // For images, we need to construct the URL from s3Key using CloudFront
            const imageUrl = img.s3Key ? `https://ds0fghatf06yb.cloudfront.net/${img.s3Key}` : img.url;
            imagesMap[segmentId] = imageUrl;
            
            // Also update the corresponding segment with the s3Key if not already set
            const segment = segments.find(seg => seg.id == segmentId);
            if (segment && !segment.s3Key) {
              segment.s3Key = img.s3Key;
            }
          }
        });
        console.log('Setting generated images:', imagesMap);
        setGeneratedImages(imagesMap);
      } else {
        console.log('No images found in API response');
        setGeneratedImages({});
      }
      
      // Set videos if available - map to segments properly
      if (projectVideos && projectVideos.success && projectVideos.data && projectVideos.data.length > 0) {
        const videosMap = {};
        projectVideos.data.forEach(video => {
          // Try to find the matching segment by various ID fields
          const segmentId = video.uuid || video.segment_id || video.segmentId || video.id;
          if (segmentId) {
            // For videos, we need to construct the URL from s3Keys using CloudFront
            const videoUrl = video.s3Keys && video.s3Keys.length > 0 
              ? `https://ds0fghatf06yb.cloudfront.net/${video.s3Keys[0]}` 
              : video.url;
            videosMap[segmentId] = videoUrl;
          }
        });
        console.log('Setting generated videos:', videosMap);
        setGeneratedVideos(videosMap);
        setStoredVideosMap(videosMap);
      } else {
        console.log('No videos found in API response');
        setGeneratedVideos({});
        setStoredVideosMap({});
      }
      
      // Reset other states
      setSelectedConcept(null);
      setScripts(null);
      
      console.log('Project data loading completed');
      
    } catch (error) {
      console.error("Error loading project data from API:", error);
      setError("Failed to load project data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setNewProjectName("");
    setNewProjectDesc("");
    setCreateProjectError(null);
    setCreateModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateProjectError(null);
  };

  const handleCreateProjectModal = async (e) => {
    e.preventDefault();
    setCreateProjectError(null);
    if (!newProjectName.trim()) {
      setCreateProjectError("Project name is required.");
      return;
    }
    setCreatingProject(true);
    try {
      const newProject = await projectApi.createProject({ name: newProjectName, description: newProjectDesc });
      clearProjectLocalStorage();
      localStorage.setItem('project-store-selectedProject', JSON.stringify(newProject));
      localStorage.setItem('project-store-projects', JSON.stringify([newProject]));
      setSelectedProject(newProject);
      resetFlow();
      setCreateModalOpen(false);
    } catch (err) {
      setCreateProjectError(err.message || 'Failed to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const SelectedProjectBanner = () => {
    if (!selectedProject) return null;
    return (
      <div className="px-4 py-2 bg-blue-900 text-blue-100 text-sm border-b border-blue-800">
        Working on: <span className="font-semibold">{selectedProject.name}</span>
      </div>
    );
  };

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

      {/* Sliding sidebar */}
      <div
        className={`z-10 fixed rounded-xl mb-4 mr-4 bottom-0 right-0 h-[87vh] w-[25vw] max-w-[600px] text-white transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[1000] flex flex-col shadow-xl`}
        style={{
          background: 'linear-gradient(180.02deg, rgba(233, 232, 235, 0.14) 0.02%, rgba(86, 86, 88, 0.17) 67.61%, rgba(17, 18, 21, 0.2) 135.2%)',
          backdropFilter: 'blur(80px)'
        }}
      >
        {/* Header */}
        <div className='flex justify-between items-center p-4 border-b border-gray-800 sticky top-0 relative'>
          <div className='flex items-center gap-3 relative'>
            {isAuthenticated && (
              <>
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
                  <span role='img' aria-label='history'>🕒</span>
                </button>
                <button
                  onClick={() => setShowCharacterGenerator(true)}
                  className='px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-1'
                  title='Generate Character'
                >
                  <span>👤</span>
                  <span className='hidden sm:inline'>Character</span>
                </button>
                {isAuthenticated && (
                  <button
                    onClick={openCreateModal}
                    className={`ml-2 px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white font-medium ${creatingProject ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={creatingProject}
                  >
                    {creatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                )}
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
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
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
        
        {/* Project banner */}
        {isAuthenticated && <SelectedProjectBanner />}

        <div className='flex-1 overflow-hidden flex flex-col'>
          {/* 6 Steps */}
          <div className='p-4 border-b border-gray-800'>
            <h3 className='text-sm font-semibold text-gray-300 mb-3'>Video Creation Steps</h3>
            <div className='space-y-2'>
              {steps.map((step) => {
                const icon = getStepIcon(step.id);
                const isDisabled = isStepDisabled(step.id) || loading;
                const isCurrent = currentStep === step.id;
                
                return (
                  <div
                    key={step.id}
                    className={`w-full flex items-center gap-3 p-2 rounded text-left transition-colors ${
                      isDisabled
                        ? 'text-gray-500 cursor-not-allowed'
                        : 'text-white hover:bg-gray-800'
                    } ${isCurrent ? 'bg-gray-800' : ''}`}
                  >
                    <span className='text-lg'>{icon}</span>
                    <div className='flex-1'>
                      <div className='text-sm font-medium'>{step.name}</div>
                      <div className='text-xs text-gray-400'>{step.description}</div>
                    </div>
                    {stepStatus[step.id] === 'done' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedoStep(step.id);
                        }}
                        className='px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors'
                        title='Redo this step'
                      >
                        Redo
                      </button>
                    )}
                    {stepStatus[step.id] !== 'done' && !isDisabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStepClick(step.id);
                        }}
                        className='px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors'
                        title='Run this step'
                      >
                        Run
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-y-auto p-4'>
            {error && (
              <div className='mb-4 p-3 bg-red-900 text-red-100 rounded text-sm'>
                {error}
                <button
                  onClick={() => setError(null)}
                  className='ml-2 text-red-300 hover:text-red-100'
                >
                  ✕
                </button>
              </div>
            )}

            {loading && (
              <div className='flex items-center justify-center py-8'>
                <LoadingSpinner />
                <span className='ml-2 text-gray-300'>Processing...</span>
              </div>
            )}

            {/* Concepts Selection */}
            {concepts && currentStep === 1 && stepStatus[1] === 'pending' && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Choose a Concept:</h4>
                <div className='space-y-2'>
                  {concepts.map((concept, index) => (
                    <button
                      key={index}
                      onClick={() => handleConceptSelect(concept)}
                      className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
                    >
                      <div className='text-white font-medium text-sm mb-1'>{concept.title}</div>
                      <div className='text-gray-300 text-xs mb-2'>{concept.concept}</div>
                      <div className='flex flex-wrap gap-1'>
                        <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>Tone: {concept.tone}</span>
                        <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>Goal: {concept.goal}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scripts Selection */}
            {scripts && currentStep === 3 && stepStatus[3] === 'pending' && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Choose a Script:</h4>
                <div className='space-y-2'>
                  <button
                    onClick={() => handleScriptSelect(scripts.response1)}
                    className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
                  >
                    <div className='text-white font-medium text-sm mb-1'>Script Option 1</div>
                    <div className='text-gray-300 text-xs'>{scripts.response1.segments.length} segments</div>
                  </button>
                  <button
                    onClick={() => handleScriptSelect(scripts.response2)}
                    className='w-full p-3 bg-gray-800 border border-gray-700 rounded text-left hover:bg-gray-700 hover:border-gray-600 transition-colors'
                  >
                    <div className='text-white font-medium text-sm mb-1'>Script Option 2</div>
                    <div className='text-gray-300 text-xs'>{scripts.response2.segments.length} segments</div>
                  </button>
                </div>
              </div>
            )}

            {/* Show selected concept when step 1 is clicked */}
            {selectedConcept && currentStep === 1 && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Selected Concept:</h4>
                <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
                  <div className='text-white font-medium text-sm mb-1'>{selectedConcept.title}</div>
                  <div className='text-gray-300 text-xs mb-2'>{selectedConcept.concept}</div>
                  <div className='flex flex-wrap gap-1'>
                    <span className='px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded'>Tone: {selectedConcept.tone}</span>
                    <span className='px-2 py-1 bg-green-600 text-green-100 text-xs rounded'>Goal: {selectedConcept.goal}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Show selected script when step 3 is clicked */}
            {selectedScript && currentStep === 3 && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Selected Script:</h4>
                <div className='p-3 bg-gray-800 border border-gray-700 rounded'>
                  <div className='text-white font-medium text-sm mb-1'>Script with {selectedScript.segments.length} segments</div>
                  <div className='text-gray-300 text-xs mb-2'>Art Style: {selectedScript.artStyle || 'Default'}</div>
                  <div className='space-y-1'>
                    {selectedScript.segments.slice(0, 3).map((segment, index) => (
                      <div key={index} className='text-gray-400 text-xs'>
                        Segment {segment.id}: {segment.visual.substring(0, 50)}...
                      </div>
                    ))}
                    {selectedScript.segments.length > 3 && (
                      <div className='text-gray-500 text-xs'>... and {selectedScript.segments.length - 3} more segments</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generation Progress - show when any generation step is active */}
            {Object.keys(generationProgress).length > 0 && (currentStep === 4 || currentStep === 5) && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Generation Progress:</h4>
                <div className='space-y-2'>
                  {Object.entries(generationProgress).map(([segmentId, progress]) => (
                    <div key={segmentId} className='flex items-center justify-between p-2 bg-gray-800 rounded'>
                      <span className='text-gray-300 text-xs'>Segment {segmentId}</span>
                      <div className='flex items-center gap-2'>
                        {progress.status === "generating" && (
                          <>
                            <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                            <span className='text-blue-400 text-xs'>Generating {progress.type}...</span>
                          </>
                        )}
                        {progress.status === "completed" && (
                          <span className='text-green-400 text-xs'>✓ {progress.type} completed</span>
                        )}
                        {progress.status === "error" && (
                          <span className='text-red-400 text-xs'>✗ {progress.type} failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Images - show when step 4 is clicked */}
            {Object.keys(generatedImages).length > 0 && currentStep === 4 && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Generated Images:</h4>
                <div className='grid grid-cols-2 gap-2'>
                  {Object.entries(generatedImages).map(([segmentId, imageUrl]) => (
                    <div key={segmentId} className='relative group'>
                      <img
                        src={imageUrl}
                        alt={`Generated image for segment ${segmentId}`}
                        className='w-full h-20 object-cover rounded border border-gray-700'
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
                        <span className='text-white text-xs opacity-0 group-hover:opacity-100'>Segment {segmentId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Videos - show when step 5 is clicked */}
            {Object.keys(generatedVideos).length > 0 && currentStep === 5 && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Generated Videos:</h4>
                <div className='grid grid-cols-2 gap-2'>
                  {Object.entries(generatedVideos).map(([segmentId, videoUrl]) => (
                    <div key={segmentId} className='relative group'>
                      <video
                        src={videoUrl}
                        className='w-full h-20 object-cover rounded border border-gray-700'
                        muted
                        loop
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center'>
                        <span className='text-white text-xs opacity-0 group-hover:opacity-100'>Segment {segmentId}</span>
                      </div>
                      <div className='absolute top-1 right-1 bg-black bg-opacity-70 rounded px-1'>
                        <span className='text-white text-xs'>▶</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Content Summary - show when step 4 or 5 is clicked */}
            {selectedScript && (currentStep === 4 || currentStep === 5) && (
              <div className='mb-4'>
                <h4 className='text-sm font-semibold text-white mb-2'>Generated Content:</h4>
                <div className='space-y-2'>
                  <div className='text-xs text-gray-400'>
                    Segments: {selectedScript.segments.length}
                  </div>
                  {Object.keys(generatedImages).length > 0 && (
                    <div className='text-xs text-gray-400'>
                      Images: {Object.keys(generatedImages).length}/{selectedScript.segments.length}
                    </div>
                  )}
                  {Object.keys(generatedVideos).length > 0 && (
                    <div className='text-xs text-gray-400'>
                      Videos: {Object.keys(generatedVideos).length}/{selectedScript.segments.length}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Button */}
            {canSendTimeline && (
              <div className='mb-4'>
                <button
                  onClick={sendVideosToTimeline}
                  disabled={addingTimeline}
                  className='w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2'
                >
                  {addingTimeline ? (
                    <>
                      <div className='w-4 h-4'><LoadingSpinner /></div>
                      <span>Adding to Timeline...</span>
                    </>
                  ) : (
                    <>
                      <span>➕</span>
                      <span>Add Videos to Timeline</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Auth/Project Messages */}
            {!isAuthenticated && (
              <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
                <div className='mb-4'>
                  <h3 className='text-lg font-semibold text-white mb-2'>Welcome to Usuals.ai</h3>
                  <p className='text-gray-400 text-sm'>Sign in to access AI-powered video creation features</p>
                </div>
                <ChatLoginButton />
              </div>
            )}

            {isAuthenticated && !selectedProject && (
              <div className='text-center p-6 bg-gray-800 border border-gray-700 rounded-lg'>
                <div className='mb-4'>
                  <h3 className='text-lg font-semibold text-white mb-2'>No Project Selected</h3>
                  <p className='text-gray-400 text-sm'>Please create or select a project to start creating video content</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className='bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-medium'
                >
                  Create New Project
                </button>
              </div>
            )}
          </div>

          {/* Input area */}
          {isAuthenticated && selectedProject ? (
            <div className='p-4 border-t border-gray-800'>
              <div className='relative flex flex-col items-center'>
                <input
                  type='text'
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === "function") {
                      e.nativeEvent.stopImmediatePropagation();
                    }
                  }}
                  placeholder='Start Creating...'
                  className='w-full flex-1 rounded-md bg-gray-800 text-white px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500'
                  disabled={loading}
                />
                <div className='self-end flex items-center gap-2'>
                  <button
                    type='button'
                    className={`text-gray-400 hover:text-gray-300 p-1 ${
                      loading || !prompt.trim() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={loading || !prompt.trim()}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentStep === 0) handleStepClick(0);
                    }}
                    title='Send'
                  >
                    <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z' />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='p-4 border-t border-gray-800'>
              <p className='text-gray-400 text-sm text-center'>
                {!isAuthenticated ? 'Sign in to use chat features' : 'Select a project to start creating content'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Character Generator Modal */}
      <CharacterGenerator
        isOpen={showCharacterGenerator}
        onClose={() => setShowCharacterGenerator(false)}
      />

      {/* Create Project Modal */}
      {createModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
          <form onSubmit={handleCreateProjectModal} className="bg-gray-800 p-4 rounded-lg shadow-lg w-96 flex flex-col gap-3 relative">
            <h3 className="text-lg font-semibold text-white mb-2">Create New Project</h3>
            <label className="text-xs text-gray-300 mb-1">Project Name</label>
            <input
              ref={nameInputRef}
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              disabled={creatingProject}
              required
              autoFocus
            />
            <label className="text-xs text-gray-300 mb-1">Description (optional)</label>
            <textarea
              className="p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none resize-y min-h-[60px] max-h-[300px]"
              value={newProjectDesc}
              onChange={e => setNewProjectDesc(e.target.value)}
              disabled={creatingProject}
              rows={4}
              style={{ minHeight: 60 }}
            />
            {createProjectError && <div className="text-xs text-red-400">{createProjectError}</div>}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1"
                onClick={closeCreateModal}
                disabled={creatingProject}
              >Cancel</button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1"
                disabled={creatingProject || !newProjectName.trim()}
              >{creatingProject ? "Creating..." : "Create"}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ChatWidget;