import React from "react";

const Styles = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Style categories and their options based on the design
  const styleCategories = [
    {
      name: "Surreal",
      styles: [
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
        },
      ],
    },
    {
      name: "Photorealism",
      styles: [
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        },
        {
          name: "Style name",
          gradient: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
        },
      ],
    },
  ];

  return (
    <div className='fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[1002] animate-in fade-in slide-in-from-bottom-2 duration-200'>
      <div
        className='rounded-2xl shadow-2xl p-4 backdrop-blur-xl w-[600px]'
        style={{
          background:
            "linear-gradient(179.96deg, rgba(85, 103, 113, 0.6) 0.04%, rgba(24, 25, 28, 0.6) 57.19%)",
        }}
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-3 pb-3 border-b border-gray-600/30'>
          <div className='flex items-center gap-3'>
            {/* Search Input */}
            <div className='relative flex-shrink-0'>
              <svg
                className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <input
                type='text'
                placeholder='Search Assets...'
                className='pl-10 pr-4 py-2 bg-[#2A2D36] border border-gray-600/30 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-48'
              />
            </div>

            {/* Filter Tabs */}
            <div className='flex items-center gap-1  rounded-lg p-1'>
              <button className='px-3 py-2 text-sm text-white bg-gray-500/50 rounded-md font-medium'>
                All Styles
              </button>
              <button className='px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-500/30 rounded-md transition-colors'>
                Trending
              </button>
              <button className='px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-500/30 rounded-md transition-colors'>
                My Styles
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-white hover:bg-gray-600/30 rounded-lg transition-colors flex-shrink-0'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='space-y-4'>
          {styleCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* Category Header */}
              <h3 className='text-white font-medium text-base mb-3'>
                {category.name}
              </h3>

              {/* Style Horizontal Scroll Container - Shows max 7 circles */}
              <div
                className='overflow-x-auto overflow-y-hidden scrollbar-hide'
                style={{ maxWidth: "560px" }} // Adjusted for smaller container
              >
                <div
                  className='flex gap-4 pb-2'
                  style={{
                    width: `${category.styles.length * 84}px`, // Full width for all items to enable scroll
                  }}
                >
                  {category.styles.map((style, styleIndex) => (
                    <div
                      key={styleIndex}
                      className='flex flex-col items-center cursor-pointer group flex-shrink-0'
                      style={{ width: "80px" }}
                    >
                      {/* Style Preview Circle */}
                      <div
                        className='w-14 h-14 rounded-full mb-2 border-2 border-transparent group-hover:border-white/30 transition-all duration-200 group-hover:shadow-lg group-hover:scale-105'
                        style={{ background: style.gradient }}
                      >
                        {/* Inner circle for depth */}
                        <div className='w-full h-full rounded-full flex items-center justify-center'>
                          <div className='w-8 h-8 bg-white/10 rounded-full backdrop-blur-sm'></div>
                        </div>
                      </div>

                      {/* Style Name */}
                      <span className='text-xs text-gray-300 group-hover:text-white transition-colors text-center leading-tight'>
                        {style.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom scrollbar styles */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Styles;
