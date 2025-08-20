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
  useConversationalFlow,
  setUseConversationalFlow,
}) => {
  return (
    <div 
      className='flex justify-between items-center p-2 sticky top-0 backdrop-blur-sm'
      style={{
        background: '#18191C80',
        
      }}
    >
      <div className='flex items-center gap-3 relative'>
        {/* Star Logo */}
        <svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M8.57731 5.76368C9.037 4.87064 9.26685 4.42412 9.57563 4.27944C9.84446 4.15348 10.1554 4.15348 10.4242 4.27944C10.733 4.42412 10.9628 4.87064 11.4225 5.76368L12.6142 8.07877C12.6938 8.23349 12.7337 8.31085 12.7852 8.37917C12.8309 8.43981 12.8834 8.49505 12.9416 8.54381C13.0072 8.59874 13.0824 8.64245 13.2329 8.72989L15.6193 10.1166C16.4012 10.571 16.7921 10.7982 16.9236 11.0943C17.0382 11.3526 17.0382 11.6474 16.9236 11.9057C16.7921 12.2018 16.4012 12.429 15.6193 12.8834L13.2329 14.2701C13.0824 14.3575 13.0072 14.4013 12.9416 14.4562C12.8834 14.505 12.8309 14.5602 12.7852 14.6208C12.7337 14.6891 12.6938 14.7665 12.6142 14.9212L11.4225 17.2363C10.9628 18.1294 10.733 18.5759 10.4242 18.7206C10.1554 18.8465 9.84446 18.8465 9.57563 18.7206C9.26685 18.5759 9.037 18.1294 8.57731 17.2363L7.38563 14.9212C7.30598 14.7665 7.26616 14.6891 7.21465 14.6208C7.16892 14.5602 7.11644 14.505 7.05821 14.4562C6.99261 14.4013 6.91738 14.3575 6.76692 14.2701L4.38054 12.8834C3.59863 12.429 3.20768 12.2018 3.07623 11.9057C2.96157 11.6474 2.96157 11.3526 3.07623 11.0943C3.20768 10.7982 3.59863 10.571 4.38054 10.1166L6.76692 8.72989C6.91738 8.64245 6.99261 8.59874 7.05821 8.54381C7.11644 8.49505 7.16892 8.43981 7.21465 8.37917C7.26616 8.31085 7.30598 8.23349 7.38563 8.07877L8.57731 5.76368Z'
            stroke='white'
            stroke-opacity='0.5'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
          />
          <path
            d='M17.4594 19.4062C17.2057 19.089 17.0788 18.9304 17.0313 18.7475C16.9895 18.5866 16.9895 18.4134 17.0313 18.2525C17.0788 18.0696 17.2057 17.911 17.4594 17.5938L18.275 16.5744C18.5287 16.2572 18.6556 16.0986 18.8019 16.0392C18.9306 15.9869 19.0692 15.9869 19.1979 16.0392C19.3442 16.0986 19.4711 16.2572 19.7248 16.5744L20.5404 17.5938C20.7941 17.911 20.921 18.0696 20.9685 18.2525C21.0104 18.4134 21.0104 18.5866 20.9685 18.7475C20.921 18.9304 20.7941 19.089 20.5404 19.4062L19.7248 20.4256C19.4711 20.7428 19.3442 20.9014 19.1979 20.9608C19.0692 21.0131 18.9306 21.0131 18.8019 20.9608C18.6556 20.9014 18.5287 20.7428 18.275 20.4256L17.4594 19.4062Z'
            stroke='white'
            stroke-opacity='0.5'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
          />
          <path
            d='M18.2297 4.36247C18.1028 4.23559 18.0394 4.17215 18.0156 4.099C17.9947 4.03466 17.9947 3.96534 18.0156 3.901C18.0394 3.82785 18.1028 3.76441 18.2297 3.63753L18.6374 3.22976C18.7643 3.10289 18.8278 3.03945 18.9009 3.01568C18.9653 2.99477 19.0346 2.99477 19.0989 3.01568C19.1721 3.03945 19.2355 3.10289 19.3624 3.22976L19.7701 3.63753C19.897 3.76441 19.9605 3.82785 19.9842 3.901C20.0051 3.96534 20.0051 4.03466 19.9842 4.099C19.9605 4.17215 19.897 4.23559 19.7701 4.36247L19.3624 4.77024C19.2355 4.89711 19.1721 4.96055 19.0989 4.98432C19.0346 5.00523 18.9653 5.00523 18.9009 4.98432C18.8278 4.96055 18.7643 4.89711 18.6374 4.77024L18.2297 4.36247Z'
            stroke='white'
            stroke-opacity='0.5'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
          />
        </svg>

        {/* Chat Text */}
        <span className='text-white text-base font-medium'>Chat</span>

        {/* Credits Container */}
        <div 
          className='flex items-center gap-1.5  bg-[#FFFFFF0D] border-0  rounded-lg px-2 py-1'
          style={{
            backdropFilter: 'blur(10px)',
          }}
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='text-gray-400'
          >
            <path
              d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
              stroke='currentColor'
              strokeWidth='1.2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
            <path
              d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
              stroke='currentColor'
              strokeWidth='1.2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
          <span className='text-gray-200 text-xs font-medium'>
            {user.credits || "2000"}
          </span>
        </div>

        {/* Options Menu */}
        {showMenu && (
          <div
            className='absolute right-0 top-10 w-44 backdrop-blur-md border border-gray-700/40 rounded-lg shadow-xl z-[100000]'
            style={{
              background: 'linear-gradient(179.99deg, rgba(233, 232, 235, 0.12) 0.01%, rgba(24, 25, 28, 0.9) 79.99%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='py-1'>
              {isAuthenticated && (
                <>
                  <button
                    onClick={onCharacterGenerator}
                    className='w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors rounded-md mx-1'
                  >
                    <span className='text-sm'>👤</span>
                    <span>Generate Character</span>
                  </button>
                  <div className="border-t border-gray-700/50 my-1 mx-2"></div>
                  <button
                    onClick={() => setUseConversationalFlow?.(!useConversationalFlow)}
                    className='w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors rounded-md mx-1'
                  >
                    <span className='text-sm'>💬</span>
                    <span>{useConversationalFlow ? 'Legacy Mode' : 'Hybrid Mode'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Project History Dropdown */}
        {isAuthenticated && showProjectHistory && (
          <div className='absolute left-0 top-12 z-[10002]'>
            <ProjectHistoryDropdown
              onSelect={() => setShowProjectHistory(false)}
            />
          </div>
        )}
      </div>

      {/* Right side icons */}
      <div className='flex items-center gap-2'>
        {isAuthenticated && (
          <>
            {/* Project History Icon */}
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='text-gray-400 hover:text-gray-300 cursor-pointer transition-colors'
              onClick={(e) => {
                e.stopPropagation();
                setShowProjectHistory((v) => !v);
              }}
            >
              <path
                d='M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>

            {/* Create New Project Icon */}
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='text-gray-400 hover:text-gray-300 cursor-pointer transition-colors'
              onClick={(e) => {
                e.stopPropagation();
                onCreateProject();
              }}
            >
              <path
                d='M12 5V19M5 12H19'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </>
        )}

        {/* Options Menu Icon (3 dots) */}
        {/* <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='text-gray-400 hover:text-gray-300 cursor-pointer transition-colors'
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
        >
          <path
            d='M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M5 13C5.5523 13 6 12.5523 6 12C6 11.4477 5.5523 11 5 11C4.4477 11 4 11.4477 4 12C4 12.5523 4.4477 13 5 13Z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg> */}

        {/* Close button */}
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='text-gray-400 hover:text-gray-300 cursor-pointer transition-colors'
          onClick={onClose}
        >
          <path
            d='M18 6L6 18M6 6L18 18'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>
    </div>
  );
};

export default Sidebar;