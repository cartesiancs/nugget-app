import React from "react";
import LoadingSpinner from "../LoadingSpinner";

const TimelineButton = ({
  canSendTimeline,
  addingTimeline,
  onSendToTimeline,
  inConversation = false,
}) => {
  if (!canSendTimeline) return null;

  // Conversation style - integrated into message flow
  if (inConversation) {
    return (
      <div className="mt-3">
        <div
          onClick={addingTimeline ? undefined : onSendToTimeline}
          className={` bg-gray-800 hover:bg-gray-700 text-[#94E7ED] py-3  rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${addingTimeline ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M11.9996 15V12M11.9996 12V9M11.9996 12H8.99963M11.9996 12H14.9996M21.1496 12.0001C21.1496 17.0535 17.053 21.1501 11.9996 21.1501C6.9462 21.1501 2.84961 17.0535 2.84961 12.0001C2.84961 6.94669 6.9462 2.8501 11.9996 2.8501C17.053 2.8501 21.1496 6.94669 21.1496 12.0001Z" 
              stroke="#94E7ED" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          {addingTimeline ? (
            <span>Adding to timeline...</span>
          ) : (
            <span>Add to the timeline</span>
          )}
        </div>
      </div>
    );
  }

  // Legacy standalone style
  return (
    <div className='mb-4'>
      <div
        onClick={addingTimeline ? undefined : onSendToTimeline}
        className={`ml-20 py-2 bg-gray-700 hover:bg-gray-500 text-[#94E7ED] rounded-full font-medium flex items-center justify-center gap-2 cursor-pointer ${addingTimeline ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M11.9996 15V12M11.9996 12V9M11.9996 12H8.99963M11.9996 12H14.9996M21.1496 12.0001C21.1496 17.0535 17.053 21.1501 11.9996 21.1501C6.9462 21.1501 2.84961 17.0535 2.84961 12.0001C2.84961 6.94669 6.9462 2.8501 11.9996 2.8501C17.053 2.8501 21.1496 6.94669 21.1496 12.0001Z" 
            stroke="#94E7ED" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {addingTimeline ? (
          <span>Adding to timeline...</span>
        ) : (
          <span>Add to the timeline</span>
        )}
      </div>
    </div>
  );
};

export default TimelineButton;