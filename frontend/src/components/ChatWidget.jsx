import { useState } from 'react';
import { segmentationApi, imageApi, videoApi, webInfoApi, conceptWriterApi } from '../services/api';
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
  const [concepts, setConcepts] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);


  //previous flow 
  
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!prompt.trim() || loading) return;

  //   localStorage.removeItem('segments');
  //   localStorage.removeItem('segmentImages');

  //   setLoading(true);
  //   setError(null);
  //   setResponses(null); // Reset responses
    
  //   try {
  //     console.log('Sending parallel requests...'); // Debug log
      
  //     // Make two parallel requests
  //     const results = await Promise.all([
  //       segmentationApi.getSegmentation(prompt),
  //       segmentationApi.getSegmentation(prompt)
  //     ]);
      
  //     console.log('Received both responses:', results); // Debug log
      
  //     // Validate responses
  //     if (!results[0] || !results[1]) {
  //       throw new Error('One or both responses are empty');
  //     }
      
  //     setResponses({
  //       response1: results[0],
  //       response2: results[1]
  //     });
      
  //     console.log('Set responses state:', {
  //       response1: results[0],
  //       response2: results[1]
  //     }); // Debug log
      
  //     setSelectedResponse(null);
  //     setSelectedSegment(null);
  //   } catch (error) {
  //     console.error('Error in handleSubmit:', error);
  //     setError(error.message || 'Failed to generate segments. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handlePreferResponse = async (option) => {
  //   const selectedResp = option === 1 ? responses?.response1 : responses?.response2;
  //   console.log('Selected response:', option, selectedResp); // Debug log

  //   if (!selectedResp) {
  //     setError('Selected response is not available');
  //     return;
  //   }

  //   // Update UI states immediately
  //   setSelectedResponse(selectedResp);
  //   setResponses(null);
  //   setSelectedSegment(null);

  //   try {
  //     // Save segments to localStorage for later use
  //     localStorage.setItem('segments', JSON.stringify(selectedResp.segments));

  //     // Trigger image generation for every segment in parallel
  //     setLoading(true);

  //     const imageResults = await Promise.all(
  //       selectedResp.segments.map((segment) => imageApi.generateImage(segment.visual))
  //     );

  //     const imagesMap = {};
  //     selectedResp.segments.forEach((segment, idx) => {
  //       const res = imageResults[idx];
  //       const url = res?.images?.[0]?.url;
  //       if (url) {
  //         imagesMap[segment.id] = url;
  //       }
  //     });

  //     // Persist generated image URLs in localStorage
  //     localStorage.setItem('segmentImages', JSON.stringify(imagesMap));

  //     console.log('Image generation completed for all segments', imagesMap);

  //     // Generate videos for all segments using their respective images
  //     const videoResults = await Promise.all(
  //       selectedResp.segments.map((segment) => {
  //         const imageUrl = imagesMap[segment.id];
  //         if (!imageUrl) return null;
  //         return videoApi.generateVideo(
  //           segment.visual,
  //           imageUrl,
  //           segment.narration
  //         );
  //       })
  //     );

  //     const videosMap = {};
  //     selectedResp.segments.forEach((segment, idx) => {
  //       const res = videoResults[idx];
  //       const url = res?.video?.url;
  //       if (url) {
  //         videosMap[segment.id] = url;
  //       }
  //     });

  //     // Persist video URLs in localStorage
  //     localStorage.setItem('segmentVideos', JSON.stringify(videosMap));

  //     console.log('Video generation completed for all segments', videosMap);

  //     // Attach generated URLs to the selected response for immediate UI use
  //     const updatedSegments = selectedResp.segments.map((segment) => ({
  //       ...segment,
  //       imageUrl: imagesMap[segment.id],
  //       videoUrl: videosMap[segment.id],
  //     }));

  //     setSelectedResponse({ ...selectedResp, segments: updatedSegments });
      
  //     // Select the first segment
  //     if (updatedSegments.length > 0) {
  //       setSelectedSegment(updatedSegments[0]);
  //     }
  //   } catch (err) {
  //     console.error('Error during generation:', err);
  //     setError(err.message || 'Failed to generate content. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    localStorage.removeItem('segments');
    localStorage.removeItem('segmentImages');

    setLoading(true);
    setError(null);
    setResponses(null);
    setConcepts(null);
    setSelectedConcept(null);
    
    try {
      console.log('Starting pipeline with web-info...');
      
      const webInfoResult = await webInfoApi.processWebInfo(prompt);
      
      console.log('Web-info response:', webInfoResult);
      
      console.log('Calling concept-writer...');
      
      const webInfoContent = webInfoResult.choices[0].message.content;
      const conceptsResult = await conceptWriterApi.generateConcepts(prompt, webInfoContent);
      
      console.log('Concept-writer response:', conceptsResult);
      
      setConcepts(conceptsResult.concepts);
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConceptSelect = (concept) => {
    console.log('Selected concept:', concept);
    setSelectedConcept(concept);
    setConcepts(null);
    // TODO: Next step will be segmentation with the selected concept
    setError(`Concept selected: "${concept.title}". Next: segmentation → image/video generation`);
  };

  const handlePreferResponse = async (option) => {
    const selectedResp = option === 1 ? responses?.response1 : responses?.response2;
    console.log('Selected response:', option, selectedResp); // Debug log

    if (!selectedResp) {
      setError('Selected response is not available');
      return;
    }

    // Update UI states immediately
    setSelectedResponse(selectedResp);
    setResponses(null);
    setSelectedSegment(null);

    try {
      // Save segments to localStorage for later use
      localStorage.setItem('segments', JSON.stringify(selectedResp.segments));

      // Trigger image generation for every segment in parallel
      setLoading(true);

      const imageResults = await Promise.all(
        selectedResp.segments.map((segment) => imageApi.generateImage(segment.visual))
      );

      const imagesMap = {};
      selectedResp.segments.forEach((segment, idx) => {
        const res = imageResults[idx];
        const url = res?.images?.[0]?.url;
        if (url) {
          imagesMap[segment.id] = url;
        }
      });

      // Persist generated image URLs in localStorage
      localStorage.setItem('segmentImages', JSON.stringify(imagesMap));

      console.log('Image generation completed for all segments', imagesMap);

      // Generate videos for all segments using their respective images
      const videoResults = await Promise.all(
        selectedResp.segments.map((segment) => {
          const imageUrl = imagesMap[segment.id];
          if (!imageUrl) return null;
          return videoApi.generateVideo(
            segment.visual,
            imageUrl,
            segment.narration
          );
        })
      );

      const videosMap = {};
      selectedResp.segments.forEach((segment, idx) => {
        const res = videoResults[idx];
        const url = res?.video?.url;
        if (url) {
          videosMap[segment.id] = url;
        }
      });

      // Persist video URLs in localStorage
      localStorage.setItem('segmentVideos', JSON.stringify(videosMap));

      console.log('Video generation completed for all segments', videosMap);

      // Attach generated URLs to the selected response for immediate UI use
      const updatedSegments = selectedResp.segments.map((segment) => ({
        ...segment,
        imageUrl: imagesMap[segment.id],
        videoUrl: videosMap[segment.id],
      }));

      setSelectedResponse({ ...selectedResp, segments: updatedSegments });
      
      // Select the first segment
      if (updatedSegments.length > 0) {
        setSelectedSegment(updatedSegments[0]);
      }
    } catch (err) {
      console.error('Error during generation:', err);
      setError(err.message || 'Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
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
              ) : concepts ? (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4 text-white">Choose a Concept</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {concepts.map((concept, index) => (
                      <div
                        key={index}
                        onClick={() => handleConceptSelect(concept)}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <h4 className="text-white font-medium text-lg mb-2">{concept.title}</h4>
                        <p className="text-gray-300 text-sm mb-3">{concept.concept}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded">
                            Tone: {concept.tone}
                          </span>
                          <span className="px-2 py-1 bg-green-600 text-green-100 text-xs rounded">
                            Goal: {concept.goal}
                          </span>
                        </div>
                      </div>
                    ))}
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
                  Enter a prompt to start the pipeline (web-info → concept selection → segmentation).
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
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                }}
                placeholder="Enter your prompt to start the pipeline..."
                className="flex-1 rounded-md bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                className={`rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Start Pipeline'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWidget; 