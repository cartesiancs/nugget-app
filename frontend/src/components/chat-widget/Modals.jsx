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
  // Add styles to document head for themed dropdowns
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .themed-select-wrapper select {
        background: #FFFFFF0D !important;
        backdrop-filter: blur(10px) !important;
        border: 0 !important;
        border-radius: 12px !important;
        color: white !important;
        padding: 8px 12px !important;
        font-size: 14px !important;
        outline: none !important;
        width: 100% !important;
      }
      
      .themed-select-wrapper select:focus {
        background: #FFFFFF1A !important;
      }
      
      .themed-select-wrapper select option {
        background: #18191C !important;
        color: white !important;
        padding: 8px !important;
      }
      
      .themed-dropdown {
        background: #18191C !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid #FFFFFF1A !important;
        border-radius: 12px !important;
        z-index: 10004 !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
        position: absolute !important;
      }
      
      .themed-dropdown div {
        color: white !important;
        background: transparent !important;
      }
      
      .themed-dropdown div:hover {
        background: #FFFFFF0D !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

      {/* Redo modal with model selection - Themed */}
      {showRedoModal &&
        createPortal(
          <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]'>
            <div
              className='p-4 rounded-xl shadow-lg w-96 flex flex-col gap-3 relative border-0'
              style={{
                background: '#18191C',
                backdropFilter: 'blur(10px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className='text-lg font-semibold text-white mb-2'>
                Redo {redoStepId === 4 ? "Image" : "Video"} Generation
              </h3>
              <p className='text-xs font-semibold text-white mb-2'>
                Choose a different AI model for regeneration:
              </p>

              {redoStepId === 4 && (
                <div className='relative z-10'>
                  <label className='text-xs font-semibold text-white mb-2 block'>
                    Image Generation Model
                  </label>
                  <div className='themed-select-wrapper'>
                    <ModelSelector
                      genType='IMAGE'
                      selectedModel={redoImageModel}
                      onModelChange={setRedoImageModel}
                      disabled={loading}
                      className='w-full'
                      dropdownClassName='themed-dropdown'
                    />
                  </div>
                </div>
              )}

              {redoStepId === 5 && (
                <div className='relative z-10'>
                  <label className='text-xs font-semibold text-white mb-2 block'>
                    Video Generation Model
                  </label>
                  <div className='themed-select-wrapper'>
                    <ModelSelector
                      genType='VIDEO'
                      selectedModel={redoVideoModel}
                      onModelChange={setRedoVideoModel}
                      disabled={loading}
                      className='w-full'
                      dropdownClassName='themed-dropdown'
                    />
                  </div>
                </div>
              )}

              <div className='flex gap-2 mt-2'>
                <button
                  type='button'
                  className='flex-1 px-2 py-1 text-xs rounded-xl border-0 transition-colors'
                  style={{
                    background: '#FFFFFF0D',
                    backdropFilter: 'blur(10px)',
                    color: 'white'
                  }}
                  onClick={onCloseRedoModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='flex-1 px-2 py-1 text-xs rounded-xl transition-colors'
                  style={{
                    background: loading ? '#0D474D' : '#017882',
                    color: '#B6FFF9',
                    opacity: loading ? 0.6 : 1
                  }}
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

      {/* Create Project Modal - Themed */}
      {createModalOpen &&
        createPortal(
          <div className='fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]'>
            <form
              onSubmit={onCreateProject}
              className='p-4 rounded-xl shadow-lg w-96 flex flex-col gap-3 relative border-0 '
              style={{
                background: '#18191C',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h3 className='text-lg font-semibold text-white mb-2'>
                Create New Project
              </h3>
              
              <div>
                <label className='text-xs font-semibold text-white mb-2 block'>
                  Project Name
                </label>
                <input
                  ref={nameInputRef}
                  className='w-full p-2 rounded-xl text-white border-0  focus:outline-none  transition-colors'
                  style={{
                    background: '#FFFFFF0D',
                    backdropFilter: 'blur(10px)'
                  }}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={creatingProject}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className='text-xs font-semibold text-white mb-2 block'>
                  Description (optional)
                </label>
                <textarea
                  className='w-full p-2 rounded-xl text-white border-0  focus:outline-none transition-colors resize-y min-h-[60px] max-h-[300px]'
                  style={{
                    background: '#FFFFFF0D',
                    backdropFilter: 'blur(10px)'
                  }}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  disabled={creatingProject}
                  rows={4}
                />
              </div>

              {createProjectError && (
                <div className='text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded p-2'>
                  {createProjectError}
                </div>
              )}

              <div className='flex gap-2 mt-2'>
                <button
                  type='button'
                  className='flex-1 px-2 py-1 text-xs rounded-xl border-0  transition-colors'
                  style={{
                    background: '#FFFFFF0D',
                    backdropFilter: 'blur(10px)',
                    color: 'white'
                  }}
                  onClick={onCloseCreateModal}
                  disabled={creatingProject}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-2 py-1 text-xs rounded-xl transition-colors'
                  style={{
                    background: creatingProject || !newProjectName.trim() 
                      ? '#0D474D' 
                      : '#017882',
                    color: '#B6FFF9',
                    opacity: creatingProject || !newProjectName.trim() ? 0.6 : 1
                  }}
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