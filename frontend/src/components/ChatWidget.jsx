import { useState } from 'react';
import { segmentationApi } from '../services/api';
import SegmentList from './SegmentList';
import ComparisonView from './ComparisonView';
import SegmentDetail from './SegmentDetail';
import LoadingSpinner from './LoadingSpinner';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponses(null); // Reset responses
    
    try {
      console.log('Sending parallel requests...'); // Debug log
      
      // Make two parallel requests
      const results = await Promise.all([
        segmentationApi.getSegmentation(prompt),
        segmentationApi.getSegmentation(prompt)
      ]);
      
      console.log('Received both responses:', results); // Debug log
      
      // Validate responses
      if (!results[0] || !results[1]) {
        throw new Error('One or both responses are empty');
      }
      
      setResponses({
        response1: results[0],
        response2: results[1]
      });
      
      console.log('Set responses state:', {
        response1: results[0],
        response2: results[1]
      }); // Debug log
      
      setSelectedResponse(null);
      setSelectedSegment(null);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to generate segments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferResponse = (option) => {
    const selectedResp = option === 1 ? responses?.response1 : responses?.response2;
    console.log('Selected response:', option, selectedResp); // Debug log
    
    if (selectedResp) {
      setSelectedResponse(selectedResp);
      setResponses(null);
    } else {
      setError('Selected response is not available');
    }
  };

  return (
    <div className="z-10">
      {/* Floating chat button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gray-900 hover:bg-gray-700 text-white text-2xl flex items-center justify-center shadow-2xl z-[1001]"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}

      {/* Sliding sidebar - now wider */}
      <div className={`fixed top-0 right-0 h-screen w-[80vw] max-w-[1200px] bg-[#0d0d0d] text-white transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} z-[1000] flex flex-col shadow-xl`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900 sticky top-0">
          <h2 className="text-lg font-semibold">Segmentation Assistant</h2>
          <button
            className="text-white text-xl focus:outline-none"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel - Segment list */}
          {selectedResponse && (
            <div className="w-1/4 border-r border-gray-800 flex flex-col overflow-hidden">
              <SegmentList
                segments={selectedResponse.segments}
                selectedSegmentId={selectedSegment?.id}
                onSegmentClick={setSelectedSegment}
              />
            </div>
          )}

          {/* Main content area */}
          <div className={`flex-1 flex flex-col ${selectedResponse ? 'w-3/4' : 'w-full'}`}>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-400 text-center p-4">
                    <p>{error}</p>
                    <button 
                      onClick={() => setError(null)}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : responses ? (
                <ComparisonView
                  response1={responses.response1}
                  response2={responses.response2}
                  onPreferResponse={handlePreferResponse}
                />
              ) : selectedResponse ? (
                <SegmentDetail segment={selectedSegment} />
              ) : (
                <div className="p-4 text-gray-400">
                  Enter a prompt to generate segmentation options.
                </div>
              )}
            </div>

            {/* Input area */}
            <form
              className="p-4 border-t border-gray-800 bg-gray-900 flex gap-2"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt for segmentation..."
                className="flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                className={`rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget; 