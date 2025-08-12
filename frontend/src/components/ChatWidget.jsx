import React, { useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useChatFlow } from "../hooks/useChatFlow";
import { useTimeline } from "../hooks/useTimeline";
import { projectApi } from "../services/project";
import LoadingSpinner from "./LoadingSpinner";
import CharacterGenerator from "./CharacterGenerator";
import CreditWidget from "./CreditWidget";
import FloatingChatButton from "./chat-widget/FloatingChatButton";
import StepList from "./chat-widget/StepList";
import InputArea from "./chat-widget/InputArea";
import ConceptSelection from "./chat-widget/ConceptSelection";
import ScriptSelection from "./chat-widget/ScriptSelection";
import ModelSelection from "./chat-widget/ModelSelection";
import GenerationProgress from "./chat-widget/GenerationProgress";
import GeneratedImages from "./chat-widget/GeneratedImages";
import GeneratedVideos from "./chat-widget/GeneratedVideos";
import ContentSummary from "./chat-widget/ContentSummary";
import TimelineButton from "./chat-widget/TimelineButton";
import AuthMessages from "./chat-widget/AuthMessages";
import Sidebar from "./chat-widget/Sidebar";
import Modals from "./chat-widget/Modals";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  // Combined videos map for display
  const combinedVideosMap = useMemo(
    () => ({ ...chatFlow.generatedVideos, ...chatFlow.storedVideosMap }),
    [chatFlow.generatedVideos, chatFlow.storedVideosMap],
  );

  // Helper functions
  const canSendTimeline =
    Object.keys(chatFlow.generatedVideos).length > 0 ||
    Object.keys(chatFlow.storedVideosMap).length > 0;

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

  // Project management functions
  const clearProjectLocalStorage = useCallback(() => {
    localStorage.removeItem("project-store-projects");
    localStorage.removeItem("project-store-selectedProject");
    chatFlow.setSelectedProject(null);
  }, [chatFlow]);

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
        clearProjectLocalStorage();
        localStorage.setItem(
          "project-store-selectedProject",
          JSON.stringify(newProject),
        );
        localStorage.setItem(
          "project-store-projects",
          JSON.stringify([newProject]),
        );
        chatFlow.setSelectedProject(newProject);
        chatFlow.resetFlow();
        setCreateModalOpen(false);
      } catch (err) {
        setCreateProjectError(err.message || "Failed to create project.");
      } finally {
        setCreatingProject(false);
      }
    },
    [newProjectName, newProjectDesc, clearProjectLocalStorage, chatFlow],
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

  const SelectedProjectBanner = () => {
    if (!chatFlow.selectedProject) return null;
    return (
      <div className='px-4 py-2 bg-blue-900 text-blue-100 text-sm border-b border-blue-800'>
        Working on:{" "}
        <span className='font-semibold'>{chatFlow.selectedProject.name}</span>
      </div>
    );
  };

  return (
    <div
      className='z-10'
      onClick={() => {
        setShowMenu(false);
        setShowUserMenu(false);
      }}
    >
      {/* Sliding sidebar */}
      <div
        className={`backdrop-blur-xl bg-white/20 dark:bg-gray-800/30 border border-white/30 dark:border-gray-700/40 shadow-lg rounded-2xl transition-transform duration-500 ease-out fixed mb-4 mr-4 bottom-0 right-0 h-[90vh] sm:h-[87vh] w-[90vw] sm:w-[360px] md:w-[25vw] max-w-[600px] text-white transform ${
          open ? "translate-x-0" : "translate-x-full"
        } z-[10000] flex flex-col shadow-2xl`}
      >
        {/* Header */}
        <Sidebar
          open={open}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          showProjectHistory={showProjectHistory}
          setShowProjectHistory={setShowProjectHistory}
          isAuthenticated={isAuthenticated}
          user={user}
          onCharacterGenerator={() => setShowCharacterGenerator(true)}
          onCreateProject={openCreateModal}
          onLogout={logout}
          onClose={() => setOpen(false)}
        />

        {/* Credit Widget Section */}
        {isAuthenticated && (
          <div className='px-3 py-2 bg-gray-900/50 border-b border-gray-800'>
            <CreditWidget />
          </div>
        )}

        {/* Credit Deduction Notification */}
        {chatFlow.creditDeductionMessage && (
          <div className='px-3 py-2 bg-green-900/50 border-b border-green-800'>
            <div className='flex items-center gap-2 text-green-200'>
              <span>💰</span>
              <span className='text-xs'>{chatFlow.creditDeductionMessage}</span>
            </div>
          </div>
        )}

        {/* Project banner */}
        {isAuthenticated && <SelectedProjectBanner />}

        <div className='flex-1 overflow-hidden flex flex-col'>
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
              currentStep={chatFlow.currentStep}
              onScriptSelect={chatFlow.handleScriptSelect}
              selectedScript={chatFlow.selectedScript}
            />

            {/* Model Selection */}
            <ModelSelection
              currentStep={chatFlow.currentStep}
              selectedImageModel={chatFlow.selectedImageModel}
              setSelectedImageModel={chatFlow.setSelectedImageModel}
              selectedVideoModel={chatFlow.selectedVideoModel}
              setSelectedVideoModel={chatFlow.setSelectedVideoModel}
              loading={chatFlow.loading}
            />

            {/* Generation Progress */}
            <GenerationProgress
              generationProgress={chatFlow.generationProgress}
              currentStep={chatFlow.currentStep}
            />

            {/* Generated Images */}
            <GeneratedImages
              generatedImages={chatFlow.generatedImages}
              currentStep={chatFlow.currentStep}
              onImageClick={handleImageClick}
            />

            {/* Generated Videos */}
            <GeneratedVideos
              combinedVideosMap={combinedVideosMap}
              currentStep={chatFlow.currentStep}
              onVideoClick={handleVideoClick}
              onAddSingleVideo={addSingleVideoToTimeline}
            />

            {/* Generated Content Summary */}
            <ContentSummary
              selectedScript={chatFlow.selectedScript}
              currentStep={chatFlow.currentStep}
              generatedImages={chatFlow.generatedImages}
              generatedVideos={chatFlow.generatedVideos}
            />

            {/* Timeline Button */}
            <TimelineButton
              canSendTimeline={canSendTimeline}
              addingTimeline={chatFlow.addingTimeline}
              onSendToTimeline={sendVideosToTimeline}
            />

            {/* Auth/Project Messages */}
            <AuthMessages
              isAuthenticated={isAuthenticated}
              selectedProject={chatFlow.selectedProject}
              onCreateProject={openCreateModal}
            />
          </div>

          {/* Input area */}
          <InputArea
            isAuthenticated={isAuthenticated}
            selectedProject={chatFlow.selectedProject}
            prompt={prompt}
            setPrompt={setPrompt}
            loading={chatFlow.loading}
            currentStep={chatFlow.currentStep}
            handleStepClick={handleStepClick}
          />
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

// Wrapper component to keep the public <ChatWidget /> API small.
// Manages only the "open" state & publish-button visibility then delegates
// all heavy UI / logic to <ChatWidgetSidebar />.
function ChatWidget() {
  const [open, setOpen] = React.useState(false);

  // Hide Electron publish button when the chat is open
  React.useEffect(() => {
    const btn = document.getElementById("publish-button");
    if (btn) {
      btn.style.display = open ? "none" : "";
    }
  }, [open]);

  return (
    <>
      <FloatingChatButton open={open} setOpen={setOpen} />
      <ChatWidgetSidebar open={open} setOpen={setOpen} />
    </>
  );
}

export default ChatWidget;
