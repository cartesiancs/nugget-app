import { useState, useEffect } from 'react';

function LoadingSpinner() {
  const [progress, setProgress] = useState(0);
  const estimatedTimeInSeconds = 180; // 3 minutes
  const updateInterval = 1000; // 1 second

  useEffect(() => {
    const startTime = Date.now();
    
    const timer = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / (estimatedTimeInSeconds * 1000)) * 100, 99);
      setProgress(newProgress);
    }, updateInterval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      {/* Spinner */}
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      
      {/* Progress bar */}
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Progress text */}
      <div className="text-gray-400 text-sm">
        Generating segments... ({Math.round(progress)}%)
      </div>
      
      {/* Estimated time */}
      <div className="text-gray-500 text-xs">
        This might take 2-3 minutes
      </div>
    </div>
  );
}

export default LoadingSpinner; 