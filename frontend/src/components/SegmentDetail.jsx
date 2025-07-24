import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { videoApi } from '../services/video-gen';
import { s3Api } from '../services/s3';

function SegmentDetail({ segment }) {
  const [retryLoading, setRetryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [segmentImageUrl, setSegmentImageUrl] = useState(null);
  const [segmentVideoUrl, setSegmentVideoUrl] = useState(null);

  // Function to load segment data
  const loadSegmentData = () => {
    if (segment) {
      // Load segment-specific data from localStorage
      const storedImages = JSON.parse(localStorage.getItem('segmentImages') || '{}');
      const storedVideos = JSON.parse(localStorage.getItem('segmentVideos') || '{}');
      
      // Get this segment's specific image and video URLs
      const currentImageUrl = segment.imageUrl || storedImages[segment.id];
      const currentVideoUrl = segment.videoUrl || storedVideos[segment.id];
      
      // Update state variables
      setSegmentImageUrl(currentImageUrl);
      setSegmentVideoUrl(currentVideoUrl);
      
      const messages = [
        {
          type: 'assistant',
          content: `Scene ${segment.id}: ${segment.visual}`,
        }
      ];

      // Add image if it exists for this specific segment
      if (currentImageUrl) {
        messages.push({
          type: 'assistant',
          content: '✅ Image generated for this scene:',
          images: [currentImageUrl]
        });
      }

      // Add video if it exists for this specific segment
      if (currentVideoUrl) {
        messages.push({
          type: 'assistant',
          content: '✅ Video generated for this scene:',
          videos: [currentVideoUrl]
        });
      }

      // Add narration if it exists
      if (segment.narration) {
        messages.push({
          type: 'assistant',
          content: `Narration: ${segment.narration}`
        });
      }

      setChatMessages(messages);
    }
  };

  // Initialize chat messages when segment changes
  useEffect(() => {
    loadSegmentData();
  }, [segment]);

  // Listen for localStorage changes to update segment data
  useEffect(() => {
    const handleStorageChange = () => {
      loadSegmentData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [segment]);

  const handleRetryVideo = async () => {
    if (!segmentImageUrl || !segment?.narration) {
      setError('Required data missing for video generation');
      return;
    }

    setRetryLoading(true);
    setError(null);

    // Add generating message
    setChatMessages(prev => [...prev, {
      type: 'assistant',
      content: '🔄 Generating video for this scene...'
    }]);

    try {
      const result = await videoApi.generateVideo({
        animation_prompt: segment.animation || segment.visual,
        art_style: segment.artStyle || '',
        imageS3Key: segment.s3Key,
        uuid: segment.id
      });
      
      if (result.s3Keys && result.s3Keys.length > 0) {
        // Get CloudFront URL directly
        const videoUrl = await s3Api.downloadVideo(result.s3Keys[0]);
        const storedVideos = JSON.parse(localStorage.getItem('segmentVideos') || '{}');
        storedVideos[segment.id] = videoUrl;
        localStorage.setItem('segmentVideos', JSON.stringify(storedVideos));

        // Update state variables
        setSegmentVideoUrl(videoUrl);

        // Add success message with video
        setChatMessages(prev => [...prev, {
          type: 'assistant',
          content: '✅ Video generated successfully!',
          videos: [videoUrl]
        }]);
      } else {
        throw new Error('No video URL in response');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError(err.message || 'Failed to generate video');
      
      // Add error message
      setChatMessages(prev => [...prev, {
        type: 'assistant',
        content: `❌ Failed to generate video: ${err.message}`
      }]);
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
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <h2 className="text-lg font-semibold text-blue-400">Scene {segment.id} Chat</h2>
        <p className="text-sm text-gray-400 mt-1">Individual scene conversation</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <div>{message.content}</div>
              {message.images && message.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.images.map((imageUrl, imgIndex) => (
                    <img 
                      key={imgIndex}
                      src={imageUrl} 
                      alt={`Scene ${segment.id} image ${imgIndex + 1}`}
                      className="rounded-lg max-w-full h-auto max-h-48 object-cover"
                    />
                  ))}
                </div>
              )}
              {message.videos && message.videos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.videos.map((videoUrl, vidIndex) => (
                    <video 
                      key={vidIndex}
                      src={videoUrl} 
                      controls
                      className="rounded-lg max-w-full h-auto max-h-48"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {retryLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <LoadingSpinner />
                <span>Generating video...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-900/20 text-red-400 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={handleRetryVideo}
                  className="text-blue-400 hover:text-blue-300 ml-4"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-3">
          {!segmentImageUrl && (
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium"
              disabled
            >
              Generate Image (Use Main Chat)
            </button>
          )}
          {segmentImageUrl && !segmentVideoUrl && (
            <button
              onClick={handleRetryVideo}
              disabled={retryLoading}
              className={`px-4 py-2 rounded-md font-medium ${
                retryLoading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {retryLoading ? 'Generating...' : 'Generate Video'}
            </button>
          )}
          {segmentVideoUrl && (
            <div className="text-green-400 text-sm flex items-center">
              ✅ Scene complete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SegmentDetail; 