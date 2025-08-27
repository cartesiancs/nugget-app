import { useState, useRef, useEffect } from "react";

const InterfaceSidebar = ({
  user,
  creditBalance,
  loading,
  activeSection,
  onSectionChange,
  onToggleAllProjects,
  onPurchaseCredits,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const sidebarBgStyle = {
    background:
      "linear-gradient(180.01deg, rgba(50, 53, 62, 0.17) 0.01%, rgba(17, 18, 21, 0.2) 109.75%)",
  };

  const selectedItemBgStyle = {
    background: "#FFFFFF0D",
  };

  const hoverItemBgStyle = {
    background:
      "linear-gradient(180.01deg, rgba(50, 53, 62, 0.17) 0.01%, rgba(17, 18, 21, 0.2) 109.75%)",
  };

  return (
    <div
      className='absolute left-4 top-4 w-80 border-1 border-white/10 rounded-xl shadow-2xl z-20 flex flex-col'
      style={{
        ...sidebarBgStyle,
        height: "fit-content",
        maxHeight: "calc(100vh - 32px)",
      }}
    >
      {/* User Section */}
      <div className='p-3  flex-shrink-0'>
        <div className='flex items-center justify-between'>
          <div className='relative' ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className='flex items-center gap-3 bg-transparent text-white cursor-pointer transition-all duration-200 hover:bg-white/5 rounded-lg p-2'
            >
              <div className='w-8 h-8 rounded-full bg-white flex items-center justify-center'>
                <span className='text-black font-bold text-sm'>
                  {user?.email?.charAt(0).toUpperCase() || "K"}
                </span>
              </div>
              <div className='text-left'>
                <div className='text-white font-medium text-sm'>
                  {user.name || "User"}
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M7 10L12 15L17 10'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className='absolute top-full left-0 mt-2 w-72 bg-[#191919] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md z-50 overflow-hidden'>
                <div className='bg-white/5 rounded-lg p-3 m-2 flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0'>
                    <span className='text-black font-bold text-base'>
                      {user?.email?.charAt(0).toUpperCase() || "K"}
                    </span>
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='text-white text-sm font-medium mb-0.5 truncate'>
                      {user.name || "User"}
                    </div>
                    <div className='text-white/60 text-xs truncate'>
                      {user?.email || "user@example.com"}
                    </div>
                  </div>

                  <button
                    className='text-white p-1 rounded hover:bg-white/10 transition-colors'
                    title='Edit Profile'
                  >
                    <svg
                      className='w-4 h-4'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M18.5 2.50023C18.8978 2.10297 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10297 21.5 2.50023C21.8978 2.89749 22.1221 3.43711 22.1221 4.00023C22.1221 4.56335 21.8978 5.10297 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                </div>

                <div className='px-2'>
                  {[
                    { icon: "⚙️", text: "Settings", active: true },
                    { icon: "👤", text: "My Profile" },
                    { icon: "ℹ️", text: "Help & Resources" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`p-2.5 px-3 text-white text-sm cursor-pointer rounded-lg mb-1 flex items-center gap-3 transition-colors ${
                        item.active ? "bg-white/5" : "hover:bg-white/10"
                      }`}
                    >
                      <span className='text-base w-5 text-center'>
                        {item.icon}
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className='p-2'>
                  <button className='w-full py-3 bg-[#8B4513] text-[#FFA500] text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#A0522D] transition-colors'>
                    <svg
                      className='w-4 h-4'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9'
                        stroke='#FFA500'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M16 17L21 12L16 7'
                        stroke='#FFA500'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M21 12H9'
                        stroke='#FFA500'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <div className='flex items-center gap-1'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
                  stroke='white'
                  strokeOpacity='0.5'
                  strokeWidth='1.33'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
                  stroke='white'
                  strokeOpacity='0.5'
                  strokeWidth='1.33'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
              <span className='text-gray-300'>
                {loading ? "..." : creditBalance}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className='flex-1 p-3'>
        {/* Recents */}
        <div className='mb-3'>
          <div
            role='button'
            tabIndex='0'
            onClick={() => {
              onSectionChange("recents");
              onToggleAllProjects(false);
            }}
            className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              activeSection === "recents"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
            style={activeSection === "recents" ? selectedItemBgStyle : {}}
            onMouseEnter={(e) => {
              if (activeSection !== "recents") {
                Object.assign(e.currentTarget.style, hoverItemBgStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== "recents") {
                e.currentTarget.style.background = "";
              }
            }}
          >
            <svg
              className='w-4 h-4 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <span>Recents</span>
          </div>
        </div>

        {/* Marketplace */}
        <div className='mb-3'>
          <div
            role='button'
            tabIndex='0'
            className='w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm hover:text-white cursor-pointer transition-colors rounded-lg'
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, hoverItemBgStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='flex-shrink-0'
            >
              <path
                d='M13.3333 9.16564C14.0338 8.8056 14.513 8.07572 14.513 7.23392C14.513 6.44752 14.3663 5.66653 14.2882 4.88546C14.2053 4.05671 14.1977 3.13269 13.5434 2.53135C12.8784 1.92013 11.949 2.00387 11.104 2.00387H4.89596C4.051 2.00387 3.1216 1.92013 2.45658 2.53135C1.8023 3.1327 1.79472 4.05671 1.71184 4.88546C1.63374 5.66649 1.4895 6.44756 1.4895 7.23392C1.4895 8.07471 1.96755 8.80384 2.66667 9.16435M13.3333 9.16564C13.0363 9.31833 12.6994 9.40451 12.3424 9.40451C11.1437 9.40451 10.1718 8.4327 10.1718 7.23392C10.1718 8.4327 9.20004 9.40451 8.00126 9.40451C6.80248 9.40451 5.83067 8.4327 5.83067 7.23392C5.83067 8.4327 4.85887 9.40451 3.66009 9.40451C3.30209 9.40451 2.96434 9.31784 2.66667 9.16435M13.3333 9.16564V12.4039C13.3333 12.9639 13.3333 13.244 13.2243 13.4579C13.1285 13.646 12.9755 13.799 12.7873 13.8949C12.5734 14.0039 12.2934 14.0039 11.7333 14.0039H4.26667C3.70661 14.0039 3.42659 14.0039 3.21268 13.8949C3.02451 13.799 2.87153 13.646 2.77566 13.4579C2.66667 13.244 2.66667 12.9639 2.66667 12.4039V9.16435'
                stroke='white'
                strokeOpacity='0.5'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span>Marketplace</span>
          </div>
        </div>

        <div className='flex items-center justify-between text-white text-sm mb-2 px-2 bg-gray-800/30 rounded-lg p-3'>
          <div className='flex items-center gap-2'>
            <span className='text-xs bg-white/20 rounded-full w-7 h-7 flex items-center justify-center'>
              {user.name?.charAt(0).toUpperCase() || "K"}
            </span>
            <span className='font-medium text-base'>
              {user.name || "Kai"}'s Workspace
            </span>
          </div>
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
            className='text-gray-400'
          >
            <path
              d='M10.6667 5.99998C9.95867 5.02539 9.12866 4.15246 8.19863 3.40384C8.08179 3.3098 7.91829 3.3098 7.80146 3.40384C6.87142 4.15246 6.04141 5.02539 5.33337 5.99998M5.33337 9.99998C6.04141 10.9746 6.87142 11.8475 7.80146 12.5961C7.91829 12.6902 8.08179 12.6902 8.19862 12.5961C9.12866 11.8475 9.95867 10.9746 10.6667 9.99998'
              stroke='white'
              strokeOpacity='0.5'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>

        {/* All Projects */}
        <div className='mb-3 mt-3'>
          <div
            role='button'
            tabIndex='0'
            onClick={() => {
              onSectionChange("all-projects");
              onToggleAllProjects(true);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
              activeSection === "all-projects"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
            style={activeSection === "all-projects" ? selectedItemBgStyle : {}}
            onMouseEnter={(e) => {
              if (activeSection !== "all-projects") {
                Object.assign(e.currentTarget.style, hoverItemBgStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== "all-projects") {
                e.currentTarget.style.background = "";
              }
            }}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='flex-shrink-0'
            >
              <path
                d='M2 4.13333C2 3.3866 2 3.01323 2.14532 2.72801C2.27316 2.47713 2.47713 2.27316 2.72801 2.14532C3.01323 2 3.3866 2 4.13333 2H4.53333C5.28007 2 5.65344 2 5.93865 2.14532C6.18954 2.27316 6.39351 2.47713 6.52134 2.72801C6.66667 3.01323 6.66667 3.3866 6.66667 4.13333V5.86667C6.66667 6.6134 6.66667 6.98677 6.52134 7.27199C6.39351 7.52287 6.18954 7.72684 5.93865 7.85468C5.65344 8 5.28007 8 4.53333 8H4.13333C3.3866 8 3.01323 8 2.72801 7.85468C2.47713 7.72684 2.27316 7.52287 2.14532 7.27199C2 6.98677 2 6.6134 2 5.86667V4.13333Z'
                stroke='white'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M2 12.3333C2 12.0236 2 11.8687 2.02562 11.7399C2.13083 11.211 2.54429 10.7975 3.07321 10.6923C3.20201 10.6667 3.3569 10.6667 3.66667 10.6667H5C5.30977 10.6667 5.46466 10.6667 5.59345 10.6923C6.12237 10.7975 6.53584 11.211 6.64105 11.7399C6.66667 11.8687 6.66667 12.0236 6.66667 12.3333C6.66667 12.6431 6.66667 12.798 6.64105 12.9268C6.53584 13.4557 6.12237 13.8692 5.59345 13.9744C5.46466 14 5.30977 14 5 14H3.66667C3.3569 14 3.20201 14 3.07321 13.9744C2.54429 13.8692 2.13083 13.4557 2.02562 12.9268C2 12.798 2 12.6431 2 12.3333Z'
                stroke='white'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M9.33333 3.66667C9.33333 3.3569 9.33333 3.20201 9.35895 3.07321C9.46416 2.54429 9.87763 2.13083 10.4065 2.02562C10.5353 2 10.6902 2 11 2H12.3333C12.6431 2 12.798 2 12.9268 2.02562C13.4557 2.13083 13.8692 2.54429 13.9744 3.07321C14 3.20201 14 3.3569 14 3.66667C14 3.97644 14 4.13132 13.9744 4.26012C13.8692 4.78904 13.4557 5.20251 12.9268 5.30771C12.798 5.33333 12.6431 5.33333 12.3333 5.33333H11C10.6902 5.33333 10.5353 5.33333 10.4065 5.30771C9.87763 5.20251 9.46416 4.78904 9.35895 4.26012C9.33333 4.13132 9.33333 3.97644 9.33333 3.66667Z'
                stroke='white'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M9.33333 10.1333C9.33333 9.3866 9.33333 9.01323 9.47866 8.72801C9.60649 8.47713 9.81046 8.27316 10.0613 8.14532C10.3466 8 10.7199 8 11.4667 8H11.8667C12.6134 8 12.9868 8 13.272 8.14532C13.5229 8.27316 13.7268 8.47713 13.8547 8.72801C14 9.01323 14 9.3866 14 10.1333V11.8667C14 12.6134 14 12.9868 13.8547 13.272C13.7268 13.5229 13.5229 13.7268 13.272 13.8547C12.9868 14 12.6134 14 11.8667 14H11.4667C10.7199 14 10.3466 14 10.0613 13.8547C9.81046 13.7268 9.60649 13.5229 9.47866 13.272C9.33333 12.9868 9.33333 12.6134 9.33333 11.8667V10.1333Z'
                stroke='white'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span>All Projects</span>
          </div>
        </div>

        {/* Folder */}
        <div className='mb-3'>
          <div
            role='button'
            tabIndex='0'
            className='w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm hover:text-white cursor-pointer transition-colors rounded-lg'
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, hoverItemBgStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <svg
              className='w-4 h-4 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
              />
            </svg>
            <span>Folder</span>
          </div>
        </div>

        {/* Trash */}
        <div className='mb-3'>
          <div
            role='button'
            tabIndex='0'
            className='w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm hover:text-white cursor-pointer transition-colors rounded-lg'
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, hoverItemBgStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <svg
              className='w-4 h-4 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
            <span>Trash</span>
          </div>
        </div>

        {/* Community */}
        <div className='mb-3'>
          <div
            role='button'
            tabIndex='0'
            className='w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm hover:text-white cursor-pointer transition-colors rounded-lg'
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, hoverItemBgStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='flex-shrink-0'
            >
              <path
                d='M7.33331 3.99998H9.12861C9.25526 3.99998 9.37097 3.9282 9.42724 3.81474L9.87939 2.90293C9.94806 2.76446 10.1022 2.69174 10.2507 2.73435C10.6876 2.85964 11.6046 3.16192 12.3361 3.66665C14.9121 5.59813 14.6719 9.92645 14.6524 10.8406C14.6512 10.8964 14.6369 10.9514 14.6094 11C13.2874 13.3333 10.994 13.3333 10.994 13.3333L10.2165 11.7158M8.66665 3.99998H6.8746C6.74822 3.99998 6.63271 3.92851 6.57631 3.81541L6.12083 2.90212C6.05197 2.76405 5.89813 2.69166 5.74982 2.73418C5.31317 2.85937 4.3957 3.1617 3.66382 3.66665C1.08785 5.59813 1.3281 9.92645 1.34758 10.8406C1.34877 10.8964 1.36302 10.9514 1.39053 11C2.71261 13.3333 5.00596 13.3333 5.00596 13.3333L5.78593 11.7156M4.6675 11.3333C5.06728 11.4832 5.43709 11.6106 5.78593 11.7156M11.3359 11.3333C10.9357 11.4833 10.5656 11.6108 10.2165 11.7158M5.78593 11.7156C7.41543 12.2058 8.58718 12.2059 10.2165 11.7158M6.66801 7.99998C6.66801 8.36817 6.36946 8.66665 6.00118 8.66665C5.63289 8.66665 5.33434 8.36817 5.33434 7.99998C5.33434 7.63179 5.63289 7.33332 6.00118 7.33332C6.36946 7.33332 6.66801 7.63179 6.66801 7.99998ZM10.669 7.99998C10.669 8.36817 10.3705 8.66665 10.0022 8.66665C9.63392 8.66665 9.33537 8.36817 9.33537 7.99998C9.33537 7.63179 9.63392 7.33332 10.0022 7.33332C10.3705 7.33332 10.669 7.63179 10.669 7.99998Z'
                stroke='white'
                strokeOpacity='0.5'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span>Join Our Community</span>
          </div>
        </div>

        {/* Report Bugs */}
        <div className='mb-3'>
          <div
            role='button'
            tabIndex='0'
            className='w-full flex items-center gap-3 px-3 py-2 text-gray-400 text-sm hover:text-white cursor-pointer transition-colors rounded-lg'
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, hoverItemBgStyle);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='flex-shrink-0'
            >
              <path
                d='M7.99998 13.3333V8.66667M7.99998 13.3333C9.9616 13.3333 11.6405 12.0366 12.3308 10.1995M7.99998 13.3333C6.03836 13.3333 4.35943 12.0366 3.6692 10.1995M9.88618 4.66667C9.95988 4.45815 9.99998 4.23376 9.99998 4C9.99998 2.89543 9.10455 2 7.99998 2C6.89541 2 5.99998 2.89543 5.99998 4C5.99998 4.23376 6.04008 4.45815 6.11378 4.66667M9.88618 4.66667H11.1727C11.4882 4.98018 11.7632 5.33987 11.9882 5.73569M9.88618 4.66667H6.11378M6.11378 4.66667H4.82723C4.51175 4.98018 4.2368 5.33987 4.01174 5.73569M14 2V3.69373C14 4.64709 13.3271 5.46792 12.3922 5.65489L11.9882 5.73569M1.99998 2V3.69373C1.99998 4.64709 2.6729 5.46792 3.60775 5.65489L4.01174 5.73569M14.6666 14V12.3063C14.6666 11.3529 13.9937 10.5321 13.0589 10.3451L12.3308 10.1995M1.33331 14V12.3063C1.33331 11.3529 2.00623 10.5321 2.94108 10.3451L3.6692 10.1995M12.3308 10.1995C12.5474 9.62287 12.6666 8.99302 12.6666 8.33333C12.6666 7.38201 12.4187 6.49275 11.9882 5.73569M3.6692 10.1995C3.45255 9.62287 3.33331 8.99302 3.33331 8.33333C3.33331 7.38201 3.58128 6.49275 4.01174 5.73569'
                stroke='white'
                strokeOpacity='0.5'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <span>Report Bugs</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className='p-4  flex-shrink-0'>
        <div className='flex items-center justify-between bg-yellow-200/10 p-2 rounded-xl mb-3'>
          <span className='text-yellow-400 text-sm'>Get more credits</span>
          <button
            onClick={onPurchaseCredits}
            className='bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1'
          >
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z'
                stroke='currentColor'
                strokeOpacity='0.5'
                strokeWidth='1.33'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M6.86848 6.46472C7.2645 6.0687 7.4625 5.87069 7.69083 5.7965C7.89168 5.73124 8.10802 5.73124 8.30887 5.7965C8.53719 5.87069 8.7352 6.0687 9.13122 6.46472L9.53515 6.86864C9.93116 7.26466 10.1292 7.46267 10.2034 7.69099C10.2686 7.89184 10.2686 8.10819 10.2034 8.30903C10.1292 8.53736 9.93116 8.73537 9.53515 9.13138L9.13122 9.53531C8.7352 9.93132 8.53719 10.1293 8.30887 10.2035C8.10802 10.2688 7.89168 10.2688 7.69083 10.2035C7.4625 10.1293 7.2645 9.93132 6.86848 9.53531L6.46455 9.13138C6.06854 8.73537 5.87053 8.53736 5.79634 8.30903C5.73108 8.10819 5.73108 7.89184 5.79634 7.69099C5.87053 7.46267 6.06854 7.26466 6.46455 6.86864L6.86848 6.46472Z'
                stroke='currentColor'
                strokeOpacity='0.5'
                strokeWidth='1.33'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            Upgrade
          </button>
        </div>
      </div>
      {/* Spacer to push everything to the top */}
      <div className='flex-1'></div>
    </div>
  );
};

export default InterfaceSidebar;
