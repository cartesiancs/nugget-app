import React from "react";
import { ProjectHistoryDropdown } from "../ProjectHistoryDropdown";

const Sidebar = ({
  open,
  showMenu,
  setShowMenu,
  showUserMenu,
  setShowUserMenu,
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

        {isAuthenticated && user && (
          <div className='relative ml-2'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu((v) => !v);
                setShowMenu(false);
              }}
              className='flex items-center gap-1 focus:outline-none'
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt='Profile'
                  className='w-7 h-7 rounded-full border border-gray-600'
                />
              ) : (
                <div className='w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center'>
                  <span className='text-white text-xs font-medium'>
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='w-3 h-3 text-gray-300'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>

            {showUserMenu && (
              <div
                className='absolute right-0 mt-2 w-44 bg-black/90 backdrop-blur-md border border-white/20 text-white rounded-md shadow-lg p-2 z-[10002] text-sm'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='px-2 py-1 border-b border-gray-700 mb-1'>
                  {user.name || user.email}
                </div>
                <button
                  onClick={onLogout}
                  className='w-full text-left px-2 py-1 hover:bg-gray-800 rounded'
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
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
