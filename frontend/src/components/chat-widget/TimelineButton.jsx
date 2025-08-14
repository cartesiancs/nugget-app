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
          className={`text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${addingTimeline ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            background: addingTimeline 
              ? 'rgba(24, 25, 28, 0.6)' 
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.8) 0%, rgba(14, 165, 233, 0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M11.9996 15V12M11.9996 12V9M11.9996 12H8.99963M11.9996 12H14.9996M21.1496 12.0001C21.1496 17.0535 17.053 21.1501 11.9996 21.1501C6.9462 21.1501 2.84961 17.0535 2.84961 12.0001C2.84961 6.94669 6.9462 2.8501 11.9996 2.8501C17.053 2.8501 21.1496 6.94669 21.1496 12.0001Z" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          {addingTimeline ? (
            <span className="text-sm">Adding to timeline...</span>
          ) : (
            <span className="text-sm">Add to the timeline</span>
          )}
        </div>
      </div>
    );
  }

  // Legacy standalone style
  return (
    <div className='mb-3'>
      <div
        onClick={addingTimeline ? undefined : onSendToTimeline}
        className={`text-white py-2 px-3 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer ${addingTimeline ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          background: addingTimeline 
            ? 'rgba(24, 25, 28, 0.6)' 
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.8) 0%, rgba(14, 165, 233, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M11.9996 15V12M11.9996 12V9M11.9996 12H8.99963M11.9996 12H14.9996M21.1496 12.0001C21.1496 17.0535 17.053 21.1501 11.9996 21.1501C6.9462 21.1501 2.84961 17.0535 2.84961 12.0001C2.84961 6.94669 6.9462 2.8501 11.9996 2.8501C17.053 2.8501 21.1496 6.94669 21.1496 12.0001Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {addingTimeline ? (
          <span className="text-sm">Adding to timeline...</span>
        ) : (
          <span className="text-sm">Add to the timeline</span>
        )}
      </div>
    </div>
  );
};

export default TimelineButton;