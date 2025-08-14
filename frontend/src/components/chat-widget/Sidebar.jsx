import React from "react";
import { ProjectHistoryDropdown } from "../ProjectHistoryDropdown";

const Sidebar = ({
  open,
  showMenu,
  setShowMenu,
  showProjectHistory,
  setShowProjectHistory,
  isAuthenticated,
  user,
  onCharacterGenerator,
  onCreateProject,
  onLogout,
  onClose,
}) => {
  return (
    <div className='flex justify-between items-center p-3 border-b border-gray-800 sticky top-0'>
      <div className='flex items-center gap-2 relative'>
        {/* Hamburger */}
        <button
          className='text-white text-xl focus:outline-none hover:text-gray-300'
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
          title='Menu'
        >
          ☰
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div
            className='absolute left-0 mt-2 w-48 bg-black/90 backdrop-blur-md border border-white/20 p-2 rounded-lg flex flex-col gap-2 z-[10002] text-sm'
            onClick={(e) => e.stopPropagation()}
          >
            {isAuthenticated && (
              <>
                <button
                  className='w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded'
                  onClick={() => setShowProjectHistory((v) => !v)}
                >
                  🕒 <span>Project History</span>
                </button>
                <button
                  onClick={onCharacterGenerator}
                  className='w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded'
                >
                  👤 <span>Generate Character</span>
                </button>
                <button
                  onClick={onCreateProject}
                  className='w-full flex items-center gap-2 px-3 py-1 hover:bg-gray-700 rounded'
                >
                  ➕ <span>Create Project</span>
                </button>
              </>
            )}
          </div>
        )}

        {isAuthenticated && (
          <>
            {showProjectHistory && (
              <div className='absolute left-48 top-10 z-[10002]'>
                <ProjectHistoryDropdown
                  onSelect={() => setShowProjectHistory(false)}
                />
              </div>
            )}
          </>
        )}


      </div>

      <button
        className='text-white text-xl focus:outline-none hover:text-gray-300'
        aria-label='Close chat'
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
};

export default Sidebar;
