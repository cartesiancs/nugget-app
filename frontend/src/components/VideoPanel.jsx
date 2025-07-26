import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { videoApi } from '../services/video-gen';
import { s3Api } from '../services/s3';

function VideoPanel({ segment, onClose }) {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (segment?.imageUrl && segment?.id && !videos[segment.id]) {
      handleGenerateVideo(segment);
    }
  }, [segment?.imageUrl, segment?.id]);

  const handleGenerateVideo = async (currentSegment) => {
    if (!currentSegment?.imageUrl || !currentSegment?.narration) {
      setError('Required data missing for video generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await videoApi.generateVideo({
        animation_prompt: currentSegment.animation || currentSegment.visual,
        art_style: currentSegment.artStyle || '',
        imageS3Key: currentSegment.imageUrl,
        uuid: currentSegment.id
      });
      
      if (result.s3Keys && result.s3Keys.length > 0) {
        // Download video from S3 and create blob URL
        const videoUrl = await s3Api.downloadVideo(result.s3Keys[0]);
        setVideos(prev => ({
          ...prev,
          [currentSegment.id]: videoUrl
        }));
      } else {
        throw new Error('No video URL in response');
      }
    } catch (err) {
      console.error('Error generating video:', err);
      setError(err.message || 'Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  const currentVideo = segment ? videos[segment.id] : null;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold">Video Preview</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
          aria-label="Close video panel"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Video Preview */}
        {currentVideo && !loading && (
          <div className="space-y-2">
            <video
              src={currentVideo}
              controls
              className="w-full rounded-lg bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm p-2 bg-red-900/20 rounded-lg">
            {error}
            <button
              onClick={() => segment && handleGenerateVideo(segment)}
              className="ml-2 text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoPanel; 