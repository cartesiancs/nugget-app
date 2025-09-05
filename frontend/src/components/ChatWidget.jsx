import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useChatFlow } from "../hooks/chatWidget/useChatFlow";
import { useTimeline } from "../hooks/useTimeline";
import { useProjectStore } from "../store/useProjectStore";
import { projectApi } from "../services/project";
import LoadingSpinner from "./LoadingSpinner";
import CharacterGenerator from "./CharacterGenerator";
import StepList from "./chat-widget/StepList";
import InputArea from "./chat-widget/InputArea";
import ConceptSelection from "./chat-widget/ConceptSelection";
import ScriptSelection from "./chat-widget/ScriptSelection";
import TimelineButton from "./chat-widget/TimelineButton";
import AuthMessages from "./chat-widget/AuthMessages";
import Sidebar from "./chat-widget/Sidebar";
import Modals from "./chat-widget/Modals";
import ChatMessages from "./chat-widget/ChatMessages";

function ChatWidgetSidebar({ open, setOpen }) {
  const { isAuthenticated, logout, user } = useAuth();
  const chatFlow = useChatFlow();
  const timeline = useTimeline();

  // UI states
  const [prompt, setPrompt] = useState("");
  const [showProjectHistory, setShowProjectHistory] = useState(false);
  const [showCharacterGenerator, setShowCharacterGenerator] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [collapseSteps, setCollapseSteps] = useState(true);
  const [useConversationalFlow, setUseConversationalFlow] = useState(true);
  const nameInputRef = useRef(null);

  // Modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState(null);
  const [showRedoModal, setShowRedoModal] = useState(false);
  const [redoStepId, setRedoStepId] = useState(null);
  const [redoImageModel, setRedoImageModel] = useState(
    chatFlow.selectedImageModel,
  );
  const [redoVideoModel, setRedoVideoModel] = useState(
    chatFlow.selectedVideoModel,
  );

  const steps = [
    { id: 0, name: "Concept Writer", description: "Generate video concepts" },
    {
      id: 1,
      name: "Choose Concept",
      description: "Select your preferred concept",
    },
    {
      id: 2,
      name: "Script Generation",
      description: "Generate script segments",
    },
    {
      id: 3,
      name: "Choose Script",
      description: "Select your preferred script",
    },
    {
      id: 4,
      name: "Image Generation",
      description: "Generate images for segments",
    },
    {
      id: 5,
      name: "Video Generation",
      description: "Generate videos from images",
    },
  ];

  // Force re-render state for videos
  const [videoUpdateTrigger, setVideoUpdateTrigger] = useState(0);

  // Listen for custom video update events
  useEffect(() => {
    const handleVideosUpdated = (event) => {
      console.log('🔔 Received videosUpdated event:', event.detail);
      setVideoUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('videosUpdated', handleVideosUpdated);
    return () => window.removeEventListener('videosUpdated', handleVideosUpdated);
  }, []);

  // Listen for chat interface prompt events
  useEffect(() => {
    const handleOpenChatWithPrompt = (event) => {
      console.log('🎯 ChatWidget received openChatWithPrompt event:', event.detail);
      const { project, prompt, autoStart } = event.detail;
      
      if (project && chatFlow) {
        // Set the project if not already selected
        if (!chatFlow.selectedProject || chatFlow.selectedProject.id !== project.id) {
          console.log('🔄 Setting selected project to:', project);
          chatFlow.setSelectedProject(project);
        }
        
        // If we have a prompt and should auto-start, set the prompt and trigger the flow
        if (autoStart && prompt && prompt.trim()) {
          console.log('🚀 Auto-starting chat flow with prompt:', prompt);
          setPrompt(prompt.trim());
          
          // Start the agent stream with the prompt
          setTimeout(() => {
            if (chatFlow.startAgentStream) {
              console.log('▶️ Starting agent stream...');
              chatFlow.startAgentStream(prompt.trim());
            }
          }, 100); // Small delay to ensure everything is set up
        }
        
        // Open the chat sidebar if it's not already open
        if (!open) {
          console.log('📂 Opening chat sidebar');
          setOpen(true);
        }
      }
    };

    const handleProjectSelected = (event) => {
      console.log('🔔 ChatWidget received projectSelected event:', event.detail);
      const { project, startChat } = event.detail;
      
      if (project && chatFlow) {
        // Set the project
        if (!chatFlow.selectedProject || chatFlow.selectedProject.id !== project.id) {
          console.log('🔄 Setting selected project to:', project);
          chatFlow.setSelectedProject(project);
        }
        
        // Open chat if requested
        if (startChat && !open) {
          console.log('📂 Opening chat sidebar for project');
          setOpen(true);
        }
      }
    };

    window.addEventListener('openChatWithPrompt', handleOpenChatWithPrompt);
    window.addEventListener('projectSelected', handleProjectSelected);
    
    return () => {
      window.removeEventListener('openChatWithPrompt', handleOpenChatWithPrompt);
      window.removeEventListener('projectSelected', handleProjectSelected);
    };
  }, [chatFlow, open, setOpen]);

  // Combined videos map for display - maintain order by sorting
  const combinedVideosMap = useMemo(
    () => {
      // Combine both maps
      const combined = { ...chatFlow.generatedVideos, ...chatFlow.storedVideosMap };
      
      // Create a sorted version to maintain consistent order
      const sortedEntries = Object.entries(combined).sort(([a], [b]) => {
        // Extract numeric part from segment IDs more robustly
        const extractNumericId = (id) => {
          const str = String(id);
          // Handle formats like "seg-5", "5", "segment-5", etc.
          const match = str.match(/(?:seg(?:ment)?-?)?(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        };
        
        const numA = extractNumericId(a);
        const numB = extractNumericId(b);
        
        // If both have valid numeric IDs, sort by number
        if (numA > 0 && numB > 0) {
          return numA - numB;
        }
        
        // If only one has a valid numeric ID, prioritize it
        if (numA > 0) return -1;
        if (numB > 0) return 1;
        
        // If neither has a valid numeric ID, sort alphabetically
        return String(a).localeCompare(String(b));
      });
      
      const sortedCombined = Object.fromEntries(sortedEntries);
      
      console.log('🔄 Combined videos map updated (sorted):', {
        generatedVideos: chatFlow.generatedVideos,
        storedVideosMap: chatFlow.storedVideosMap,
        combined: sortedCombined,
        sortedKeys: Object.keys(sortedCombined),
        trigger: videoUpdateTrigger
      });
      return sortedCombined;
    },
    [chatFlow.generatedVideos, chatFlow.storedVideosMap, videoUpdateTrigger],
  );

  // Helper functions
  const canSendTimeline =
    (Object.keys(chatFlow.generatedVideos).length > 0 ||
    Object.keys(chatFlow.storedVideosMap).length > 0) &&
    chatFlow.videoGenerationComplete;

  const getStepIcon = useCallback(
    (stepId) => {
      const status = chatFlow.stepStatus[stepId];
      if (status === "loading") return "⏳";
      if (status === "done") return "✅";
      if (status === "pending" && stepId === chatFlow.currentStep) return "▶️";
      return "⏸️";
    },
    [chatFlow.stepStatus, chatFlow.currentStep],
  );

  const isStepDisabled = useCallback(
    (stepId) => {
      if (chatFlow.loading) return true;
      if (stepId === 0) return false; // First step is always enabled
      if (stepId === 1) return !chatFlow.concepts;
      if (stepId === 2) return !chatFlow.selectedConcept;
      if (stepId === 3)
        return !chatFlow.selectedScript || !chatFlow.selectedScript.segments;
      if (stepId === 4)
        return !chatFlow.selectedScript || !chatFlow.selectedScript.segments;
      if (stepId === 5)
        return Object.keys(chatFlow.generatedImages).length === 0;
      return true;
    },
    [
      chatFlow.loading,
      chatFlow.concepts,
      chatFlow.selectedConcept,
      chatFlow.selectedScript,
      chatFlow.generatedImages,
    ],
  );

  const handleStepClick = useCallback(
    async (stepId) => {
      if (isStepDisabled(stepId) || chatFlow.loading) return;

      chatFlow.setCurrentStep(stepId);

      // Only run the step if it's not already done
      if (chatFlow.stepStatus[stepId] !== "done") {
        switch (stepId) {
          case 0:
            await chatFlow.runConceptWriter(prompt);
            break;
          case 2:
            await chatFlow.runScriptGeneration(prompt);
            break;
          case 4:
            await chatFlow.runImageGeneration();
            break;
          case 5:
            await chatFlow.runVideoGeneration();
            break;
        }
      }
    },
    [isStepDisabled, chatFlow, prompt],
  );

  const handleRedoStep = useCallback(
    async (stepId) => {
      if (chatFlow.loading) return;

      // For steps that need model selection, show modal
      if (stepId === 4 || stepId === 5) {
        setRedoStepId(stepId);
        setRedoImageModel(chatFlow.selectedImageModel);
        setRedoVideoModel(chatFlow.selectedVideoModel);
        setShowRedoModal(true);
        return;
      }

      // For other steps, run immediately
      chatFlow.setCurrentStep(stepId);

      switch (stepId) {
        case 0:
          await chatFlow.runConceptWriter(prompt);
          break;
        case 2:
          await chatFlow.runScriptGeneration(prompt);
          break;
      }
    },
    [chatFlow, prompt],
  );

  const handleRedoWithModel = useCallback(async () => {
    if (chatFlow.loading || !redoStepId) return;

    setShowRedoModal(false);
    chatFlow.setCurrentStep(redoStepId);

    // Update the main model selections with the redo selections
    if (redoStepId === 4) {
      chatFlow.setSelectedImageModel(redoImageModel);
    } else if (redoStepId === 5) {
      chatFlow.setSelectedVideoModel(redoVideoModel);
    }

    switch (redoStepId) {
      case 4:
        await chatFlow.runImageGeneration();
        break;
      case 5:
        await chatFlow.runVideoGeneration();
        break;
    }

    setRedoStepId(null);
  }, [chatFlow, redoStepId, redoImageModel, redoVideoModel]);

  

  const openCreateModal = useCallback(() => {
    setNewProjectName("");
    setNewProjectDesc("");
    setCreateProjectError(null);
    setCreateModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setCreateProjectError(null);
  }, []);

  const handleCreateProjectModal = useCallback(
    async (e) => {
      e.preventDefault();
      setCreateProjectError(null);
      if (!newProjectName.trim()) {
        setCreateProjectError("Project name is required.");
        return;
      }
      setCreatingProject(true);
      try {
        const newProject = await projectApi.createProject({
          name: newProjectName,
          description: newProjectDesc,
        });
        
        // Use Zustand store to manage projects
        const { addProject, setSelectedProject } = useProjectStore.getState();
        addProject(newProject);
        setSelectedProject(newProject);
        
        chatFlow.setSelectedProject(newProject);
        chatFlow.resetFlow();
        setCreateModalOpen(false);
        
        // Dispatch event to notify FlowWidget about new project creation
        window.dispatchEvent(new CustomEvent('newProjectCreated', { 
          detail: { project: newProject } 
        }));
      } catch (err) {
        setCreateProjectError(err.message || "Failed to create project.");
      } finally {
        setCreatingProject(false);
      }
    },
    [newProjectName, newProjectDesc, chatFlow],
  );

  // Timeline functions
  const sendVideosToTimeline = useCallback(async () => {
    if (chatFlow.addingTimeline) return;

    chatFlow.setAddingTimeline(true);
    const success = await timeline.sendVideosToTimeline(
      chatFlow.selectedScript,
      combinedVideosMap,
      chatFlow.setError,
    );
    chatFlow.setAddingTimeline(false);
  }, [chatFlow, timeline, combinedVideosMap]);

  const addSingleVideoToTimeline = useCallback(
    async (segmentId) => {
      if (chatFlow.addingTimeline) return;

      chatFlow.setAddingTimeline(true);
      const success = await timeline.addSingleVideoToTimeline(
        segmentId,
        combinedVideosMap,
        chatFlow.setError,
      );
      chatFlow.setAddingTimeline(false);
    },
    [chatFlow, timeline, combinedVideosMap],
  );

  // Modal handlers
  const handleImageClick = useCallback((imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  }, []);

  const handleVideoClick = useCallback((videoUrl) => {
    setModalVideoUrl(videoUrl);
    setShowVideoModal(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    setModalImageUrl(null);
  }, []);

  const closeVideoModal = useCallback(() => {
    setShowVideoModal(false);
    setModalVideoUrl(null);
  }, []);

  const closeRedoModal = useCallback(() => {
    setShowRedoModal(false);
  }, []);

  

  return (
    <div
      className='z-10'
      onClick={() => {
        setShowMenu(false);
      }}
    >
      {/* Sliding sidebar */}
      <div

        className={`backdrop-blur-sm border-0 border-gray-600/30 shadow-lg rounded-xl ease-out fixed bottom-4 right-4 text-white transform transition-transform duration-500 ${

          open ? "translate-x-0" : "translate-x-full"
        } z-[10000] flex flex-col shadow-2xl`}
        style={{
          background: 'linear-gradient(179.99deg, rgba(233, 232, 235, 0.14) 0.01%, rgba(24, 25, 28, 0.2) 79.99%)',
          width: 'calc(30% - 20px)',
          height: 'calc(106vh - 200px)',
          right: open ? '10px' : '-100%',
          top: '110px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <Sidebar
          open={open}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          showProjectHistory={showProjectHistory}
          setShowProjectHistory={setShowProjectHistory}
          isAuthenticated={isAuthenticated}
          user={user}
          onCharacterGenerator={() => setShowCharacterGenerator(true)}
          onCreateProject={openCreateModal}
          onLogout={logout}
          onClose={() => setOpen(false)}
          useConversationalFlow={useConversationalFlow}
          setUseConversationalFlow={setUseConversationalFlow}
        />

        {/* Credit Widget Section */}
        {/* {isAuthenticated && (
          <div className='px-3 py-2 bg-gray-900/50 border-b border-gray-800'>
            <CreditWidget />
          </div>
        )} */}

        {/* Credit Deduction Notification */}
        {/* {chatFlow.creditDeductionMessage && (
          <div className='px-3 py-2 bg-green-900/50 border-b border-green-800'>
            <div className='flex items-center gap-2 text-green-200'>
              <span>💰</span>
              <span className='text-xs'>{chatFlow.creditDeductionMessage}</span>
            </div>
          </div>
        )} */}

        {/* Project banner */}
        {/* {isAuthenticated && <SelectedProjectBanner />} */}

        <div className='flex-1 overflow-hidden flex flex-col'>
          {useConversationalFlow ? (
            /* Hybrid Flow - StepList + Chat */
            <>
              {/* StepList at top */}
              <StepList
                steps={steps}
                stepStatus={chatFlow.stepStatus}
                currentStep={chatFlow.currentStep}
                loading={chatFlow.loading}
                collapseSteps={collapseSteps}
                setCollapseSteps={setCollapseSteps}
                isStepDisabled={isStepDisabled}
                getStepIcon={getStepIcon}
                handleStepClick={handleStepClick}
                handleRedoStep={handleRedoStep}
                setCurrentStep={chatFlow.setCurrentStep}
              />

              {/* Chat Messages */}
              <ChatMessages
                chatFlow={chatFlow}
                onImageClick={handleImageClick}
                onVideoClick={handleVideoClick}
                onAddSingleVideo={addSingleVideoToTimeline}
                sendVideosToTimeline={sendVideosToTimeline}
                combinedVideosMap={combinedVideosMap}
                currentPrompt={prompt}
              />

              {/* Input area */}
              <InputArea
                isAuthenticated={isAuthenticated}
                selectedProject={chatFlow.selectedProject}
                prompt={prompt}
                setPrompt={setPrompt}
                loading={chatFlow.loading}
                currentStep={chatFlow.currentStep}
                handleStepClick={handleStepClick}
                chatFlow={chatFlow}
              />
            </>
          ) : (
            /* Legacy Step-based Flow */
            <>
              {/* 6 Steps */}
              <StepList
                steps={steps}
                stepStatus={chatFlow.stepStatus}
                currentStep={chatFlow.currentStep}
                loading={chatFlow.loading}
                collapseSteps={collapseSteps}
                setCollapseSteps={setCollapseSteps}
                isStepDisabled={isStepDisabled}
                getStepIcon={getStepIcon}
                handleStepClick={handleStepClick}
                handleRedoStep={handleRedoStep}
                setCurrentStep={chatFlow.setCurrentStep}
              />

              {/* Content Area */}
              <div className='flex-1 overflow-y-auto p-4'>
                {chatFlow.error && (
                  <div className='mb-4 p-3 bg-red-900 text-red-100 rounded text-sm'>
                    {chatFlow.error}
                    <button
                      onClick={() => chatFlow.setError(null)}
                      className='ml-2 text-red-300 hover:text-red-100'
                    >
                      ✕
                    </button>
                  </div>
                )}

                {chatFlow.loading && (
                  <div className='flex items-center justify-center py-8'>
                    <LoadingSpinner />
                    <span className='ml-2 text-gray-300'>Processing...</span>
                  </div>
                )}

                {/* Concepts Selection */}
                <ConceptSelection
                  concepts={chatFlow.concepts}
                  currentStep={chatFlow.currentStep}
                  onConceptSelect={chatFlow.handleConceptSelect}
                  selectedConcept={chatFlow.selectedConcept}
                />

                {/* Scripts Selection */}
                <ScriptSelection
                  scripts={chatFlow.scripts}
                  onScriptSelect={chatFlow.handleScriptSelect}
                  selectedScript={chatFlow.selectedScript}
                  isProjectScript={!chatFlow.scripts && !!chatFlow.selectedScript}
                  selectedSegmentationId={(!chatFlow.scripts && !!chatFlow.selectedScript) ? 'project-script' : null}
                />



                {/* Auth/Project Messages */}
                 <AuthMessages
                   isAuthenticated={isAuthenticated}
                   selectedProject={chatFlow.selectedProject}
                   onCreateProject={openCreateModal}
                 />
               </div>

               {/* Timeline Button - Positioned just above input area */}
               {canSendTimeline && (
                 <div className=' px-4 py-2 border-t border-gray-800'>
                   <TimelineButton
                     canSendTimeline={canSendTimeline}
                     addingTimeline={chatFlow.addingTimeline}
                     onSendToTimeline={sendVideosToTimeline}
                   />
                 </div>
               )}

               {/* Input area */}
               <InputArea
                 isAuthenticated={isAuthenticated}
                 selectedProject={chatFlow.selectedProject}
                 prompt={prompt}
                 setPrompt={setPrompt}
                 loading={chatFlow.loading}
                 currentStep={chatFlow.currentStep}
                 handleStepClick={handleStepClick}
                 chatFlow={chatFlow}
               />
            </>
          )}
        </div>
      </div>

      {/* Character Generator Modal */}
      <CharacterGenerator
        isOpen={showCharacterGenerator}
        onClose={() => setShowCharacterGenerator(false)}
      />

      {/* All Modals */}
      <Modals
        showImageModal={showImageModal}
        modalImageUrl={modalImageUrl}
        onCloseImageModal={closeImageModal}
        showVideoModal={showVideoModal}
        modalVideoUrl={modalVideoUrl}
        onCloseVideoModal={closeVideoModal}
        showRedoModal={showRedoModal}
        redoStepId={redoStepId}
        redoImageModel={redoImageModel}
        setRedoImageModel={setRedoImageModel}
        redoVideoModel={redoVideoModel}
        setRedoVideoModel={setRedoVideoModel}
        loading={chatFlow.loading}
        onRedoWithModel={handleRedoWithModel}
        onCloseRedoModal={closeRedoModal}
        createModalOpen={createModalOpen}
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        newProjectDesc={newProjectDesc}
        setNewProjectDesc={setNewProjectDesc}
        createProjectError={createProjectError}
        creatingProject={creatingProject}
        nameInputRef={nameInputRef}
        onCreateProject={handleCreateProjectModal}
        onCloseCreateModal={closeCreateModal}
      />
    </div>
  );
}

function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  
  // Get auth data to expose globally
  const { isAuthenticated, logout, user } = useAuth();

  // Expose chat control functions and auth data globally
  React.useEffect(() => {
    window.openChat = () => setOpen(true);
    window.closeChat = () => setOpen(false);
    window.toggleChat = () => setOpen(prev => !prev);
    window.isChatOpen = () => open;
    window.getChatAuthData = () => ({ isAuthenticated, user, logout });

    // Cleanup on unmount
    return () => {
      delete window.openChat;
      delete window.closeChat;
      delete window.toggleChat;
      delete window.isChatOpen;
      delete window.getChatAuthData;
    };
  }, [open, isAuthenticated, user, logout]);

  // Keep publish button visible when chat is open (removed hiding logic)
  React.useEffect(() => {
    // Publish button remains visible
  }, [open]);

  // Handle right panel layout when chat opens/closes
  React.useEffect(() => {
    if (typeof window.toggleRightPanel === 'function') {
      window.toggleRightPanel(open);
    } else {
      console.warn('toggleRightPanel function not available on window');
    }

    // Set data-open attribute on the chat widget element for external monitoring
    const chatWidget = document.querySelector('react-chat-widget');
    if (chatWidget) {
      chatWidget.setAttribute('data-open', open ? 'true' : 'false');
    }

    // Keep layout buttons visible (removed hiding logic)
  }, [open]);

  return (
    <>
      <ChatWidgetSidebar open={open} setOpen={setOpen} />
    </>
  );
}

export default ChatWidget;
