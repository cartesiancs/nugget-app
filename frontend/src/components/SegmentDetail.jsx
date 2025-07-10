import { useState } from 'react';
import { videoApi } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

function SegmentDetail({ segment }) {
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRetryVideo = async () => {
    if (!segment?.imageUrl || !segment?.narration) {
      setError('Required data missing for video generation');
      return;
    }

    setRetryLoading(true);
    setError(null);

    try {
      const result = await videoApi.generateVideo(
        segment.visual,
        segment.imageUrl,
        segment.narration
      );
      
      if (result.video?.url) {
        const storedVideos = JSON.parse(localStorage.getItem('segmentVideos') || '{}');
        storedVideos[segment.id] = result.video.url;
        localStorage.setItem('segmentVideos', JSON.stringify(storedVideos));
        
        segment.videoUrl = result.video.url;
      } else {
        throw new Error('No video URL in response');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError(err.message || 'Failed to generate video');
    } finally {
      setRetryLoading(false);
    }
  };

  if (!segment) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a segment to view details
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-blue-400">Visual Description</h2>
        <p className="text-gray-300">{segment.visual}</p>
        {segment.imageUrl && (
          <img 
            src={segment.imageUrl} 
            alt="Generated visual" 
            className="rounded-lg max-h-96 w-auto"
          />
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-blue-400">Video & Audio Description</h2>
        <p className="text-gray-300">{segment.narration}</p>
        
        <div className="space-y-4">
          {retryLoading && (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={handleRetryVideo}
                className="text-blue-400 hover:text-blue-300 ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {segment.videoUrl && !retryLoading && (
            <div className="rounded-lg overflow-hidden bg-gray-900">
              <video
                src={segment.videoUrl}
                controls
                className="w-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SegmentDetail; 