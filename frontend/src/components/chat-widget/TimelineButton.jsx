import React from "react";
import LoadingSpinner from "../LoadingSpinner";

const TimelineButton = ({
  canSendTimeline,
  addingTimeline,
  onSendToTimeline,
}) => {
  if (!canSendTimeline) return null;

  return (
    <div className='mb-4'>
      <button
        onClick={onSendToTimeline}
        disabled={addingTimeline}
        className='w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium disabled:opacity-50 flex items-center justify-center gap-2'
      >
        {addingTimeline ? (
          <>
            <div className='w-4 h-4'>
              <LoadingSpinner />
            </div>
            <span>Adding to Timeline...</span>
          </>
        ) : (
          <>
            <span>➕</span>
            <span>Add Videos to Timeline</span>
          </>
        )}
      </button>
    </div>
  );
};

export default TimelineButton;
