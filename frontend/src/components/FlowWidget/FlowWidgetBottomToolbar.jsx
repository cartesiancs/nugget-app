import { useState } from "react";

function FlowWidgetBottomToolbar({ onAddNode }) {
  const [addMenuExpanded, setAddMenuExpanded] = useState(false);

  return (
    <>
      {/* Add Menu Toolbar - appears above main toolbar */}
      {addMenuExpanded && (
        <div className='fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[1002] animate-in fade-in slide-in-from-bottom-2 duration-200'>
          <div className='flex items-center gap-1 bg-gray-800/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-2xl border border-gray-700/50'>
            {/* Add Image */}
            <button
              onClick={() => {
                onAddNode("image");
                setAddMenuExpanded(false);
              }}
              className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'
              title='Add Image'
            >
              <div className='w-6 h-6 bg-yellow-600 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-3 h-3 text-white'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
            </button>

            {/* Add Video */}
            <button
              onClick={() => {
                onAddNode("video");
                setAddMenuExpanded(false);
              }}
              className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'
              title='Add Video'
            >
              <div className='w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-3 h-3 text-white'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
              </div>
            </button>

            {/* Add Text */}
            <button
              onClick={() => {
                onAddNode("text");
                setAddMenuExpanded(false);
              }}
              className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'
              title='Add Text'
            >
              <div className='w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-3 h-3 text-white'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M4 6h16M4 12h16m-7 6h7'
                  />
                </svg>
              </div>
            </button>

            {/* Import Button */}
            <button
              onClick={() => {
                // Create a file input for import
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.txt,.md';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    console.log("Importing file:", file.name);
                    // TODO: Implement actual file import logic
                  }
                };
                input.click();
                setAddMenuExpanded(false);
              }}
              className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'
              title='Import'
            >
              <div className='w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-3 h-3 text-white'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={2}
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Bottom Toolbar */}
      <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[1001]'>
        <div className='flex items-center gap-1 bg-gray-800/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-2xl border border-gray-700/50'>
          {/* Play/Triangle Icon */}
          <button className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'>
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M8 5v14l11-7z' />
            </svg>
          </button>

          {/* Hand/Stop Icon */}
          <button className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2h-1V5a2 2 0 00-2-2H10a2 2 0 00-2 2v2H7a2 2 0 00-2 2v10a2 2 0 002 2zM14 5v2H10V5h4z'
              />
            </svg>
          </button>

          {/* Grid/Apps Icon */}
          <button className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
              />
            </svg>
          </button>

          {/* Separator */}
          <div className='h-8 w-px bg-gray-600 mx-1'></div>

          {/* Plus/Add Icon */}
          <button
            onClick={() => setAddMenuExpanded(!addMenuExpanded)}
            className={`h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200 ${
              addMenuExpanded ? "bg-gray-700/50 text-white" : "bg-gray-700/30"
            }`}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${
                addMenuExpanded ? "rotate-45" : ""
              }`}
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 4v16m8-8H4'
              />
            </svg>
          </button>

          {/* Separator */}
          <div className='h-8 w-px bg-gray-600 mx-1'></div>

          {/* Palette/Color Icon */}
          <button className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 5H5v12a2 2 0 002 2 2 2 0 002-2V5z'
              />
              <circle cx={16} cy={8} r={2} />
              <circle cx={18} cy={12} r={2} />
              <circle cx={16} cy={16} r={2} />
            </svg>
          </button>

          {/* Brush/Edit Icon */}
          <button className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
              />
            </svg>
          </button>

          {/* Comment/Chat Icon */}
          <button className='h-12 w-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200'>
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export default FlowWidgetBottomToolbar;
