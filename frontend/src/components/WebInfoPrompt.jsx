import { useState } from 'react';
import { webInfoApi } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

function WebInfoPrompt({ onWebInfoResponse, onError }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleWebInfoRequest = async (userPrompt) => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Sending web-info request...'); // Debug log
      
      const data = await webInfoApi.processWebInfo(userPrompt);
      console.log("Web-info response:", data);

      // Call the callback function to handle the response
      if (onWebInfoResponse) {
        onWebInfoResponse(data);
      }

      return data;
    } catch (error) {
      console.error("Error in web-info request:", error);
      const errorMessage = error.message || 'Failed to process web-info request. Please try again.';
      setError(errorMessage);
      
      // Call the error callback if provided
      if (onError) {
        onError(errorMessage);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    await handleWebInfoRequest(prompt);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation();
    }
  };

  return (
    <div className="web-info-prompt-container">
      {loading && (
        <div className="mb-4">
          <LoadingSpinner />
          <p className="text-gray-400 text-center mt-2">Processing web-info request...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your prompt to start the pipeline..."
          className="flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500"
          disabled={loading}
        />
        <button
          type="submit"
          className={`rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Processing...' : 'Start'}
        </button>
      </form>
    </div>
  );
}



export default WebInfoPrompt; 