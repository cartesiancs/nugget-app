import React from "react";
import { createPortal } from "react-dom";
import ModelSelector from "../ModelSelector";

const Modals = ({
  // Image modal
  showImageModal,
  modalImageUrl,
  onCloseImageModal,

  // Video modal
  showVideoModal,
  modalVideoUrl,
  onCloseVideoModal,

  // Redo modal
  showRedoModal,
  redoStepId,
  redoImageModel,
  setRedoImageModel,
  redoVideoModel,
  setRedoVideoModel,
  loading,
  onRedoWithModel,
  onCloseRedoModal,

  // Create project modal
  createModalOpen,
  newProjectName,
  setNewProjectName,
  newProjectDesc,
  setNewProjectDesc,
  createProjectError,
  creatingProject,
  nameInputRef,
  onCreateProject,
  onCloseCreateModal,
}) => {
  return (
    <>
      {/* Image preview modal */}
      {showImageModal &&
        modalImageUrl &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]'
            onClick={onCloseImageModal}
          >
            <img
              src={modalImageUrl}
              alt='Preview'
              className='max-w-full max-h-full rounded shadow-lg'
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className='absolute top-4 right-4 text-white text-2xl'
              onClick={onCloseImageModal}
            >
              ✕
            </button>
          </div>,
          document.body,
        )}

      {/* Video preview modal */}
      {showVideoModal &&
        modalVideoUrl &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10003]'
            onClick={onCloseVideoModal}
          >
            <video
              src={modalVideoUrl}
              controls
              autoPlay
              className='max-w-full max-h-full rounded shadow-lg'
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className='absolute top-4 right-4 text-white text-2xl'
              onClick={onCloseVideoModal}
            >
              ✕
            </button>
          </div>,
          document.body,
        )}

      {/* Redo modal with model selection */}
      {showRedoModal &&
        createPortal(
          <div
            className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]'
            onClick={onCloseRedoModal}
          >
            <div
              className='bg-gray-800 p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4 relative'
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-lg font-semibold text-white mb-2'>
                Redo {redoStepId === 4 ? "Image" : "Video"} Generation
              </h3>
              <p className='text-gray-300 text-sm'>
                Choose a different AI model for regeneration:
              </p>

              {redoStepId === 4 && (
                <div>
                  <label className='block text-xs text-gray-300 mb-1'>
                    Image Generation Model
                  </label>
                  <ModelSelector
                    genType='IMAGE'
                    selectedModel={redoImageModel}
                    onModelChange={setRedoImageModel}
                    disabled={loading}
                    className='w-full'
                  />
                </div>
              )}

              {redoStepId === 5 && (
                <div>
                  <label className='block text-xs text-gray-300 mb-1'>
                    Video Generation Model
                  </label>
                  <ModelSelector
                    genType='VIDEO'
                    selectedModel={redoVideoModel}
                    onModelChange={setRedoVideoModel}
                    disabled={loading}
                    className='w-full'
                  />
                </div>
              )}

              <div className='flex gap-3 mt-4'>
                <button
                  type='button'
                  className='flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-4 py-2'
                  onClick={onCloseRedoModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2'
                  onClick={onRedoWithModel}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Redo Generation"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Create Project Modal */}
      {createModalOpen &&
        createPortal(
          <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]'>
            <form
              onSubmit={onCreateProject}
              className='bg-gray-800 p-4 rounded-lg shadow-lg w-96 flex flex-col gap-3 relative'
            >
              <h3 className='text-lg font-semibold text-white mb-2'>
                Create New Project
              </h3>
              <label className='text-xs text-gray-300 mb-1'>Project Name</label>
              <input
                ref={nameInputRef}
                className='p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none'
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={creatingProject}
                required
                autoFocus
              />
              <label className='text-xs text-gray-300 mb-1'>
                Description (optional)
              </label>
              <textarea
                className='p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none resize-y min-h-[60px] max-h-[300px]'
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                disabled={creatingProject}
                rows={4}
                style={{ minHeight: 60 }}
              />
              {createProjectError && (
                <div className='text-xs text-red-400'>{createProjectError}</div>
              )}
              <div className='flex gap-2 mt-2'>
                <button
                  type='button'
                  className='flex-1 bg-gray-600 hover:bg-gray-500 text-white rounded px-2 py-1'
                  onClick={onCloseCreateModal}
                  disabled={creatingProject}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 bg-green-600 hover:bg-green-500 text-white rounded px-2 py-1'
                  disabled={creatingProject || !newProjectName.trim()}
                >
                  {creatingProject ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Modals;
