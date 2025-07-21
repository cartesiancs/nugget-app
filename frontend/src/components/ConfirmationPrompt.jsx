import React from 'react';

function ConfirmationPrompt({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="p-4 flex flex-col items-center text-center">
      <p className="text-gray-200 mb-4 max-w-md">{message}</p>
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Yes'}
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
          onClick={onCancel}
          disabled={loading}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default ConfirmationPrompt; 