import { useCallback } from 'react';

export const useErrorHandling = ({
  setNodes,
  setEdges,
  saveGenerationState,
  removeGenerationState,
  generateConcepts,
  generateScript,
  generateImage,
  generateVideo,
  nodes
}) => {
  const getErrorDetails = useCallback((error) => {
    const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
    
    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
      return {
        type: 'network',
        message: 'Network Error',
        description: 'Please check your internet connection and try again.'
      };
    }
    
    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error') || errorMessage.includes('server')) {
      return {
        type: 'server',
        message: 'Internal Server Error',
        description: 'Server is temporarily unavailable. Please try again.'
      };
    }
    
    // Authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
      return {
        type: 'auth',
        message: 'Authentication Error',
        description: 'Please log in again to continue.'
      };
    }
    
    // Rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
      return {
        type: 'rateLimit',
        message: 'Rate Limit Exceeded',
        description: 'Too many requests. Please wait a moment and try again.'
      };
    }
    
    // API/Generation specific errors
    if (errorMessage.includes('API') || errorMessage.includes('generation') || errorMessage.includes('Failed to generate')) {
      return {
        type: 'generation',
        message: 'Generation Failed',
        description: 'Failed to generate content. Please try again.'
      };
    }
    
    // Default fallback
    return {
      type: 'unknown',
      message: 'Error',
      description: errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage
    };
  }, []);

  const showErrorState = useCallback((nodeId, error, originalData = {}) => {
    const errorDetails = getErrorDetails(error);
    
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            nodeState: 'error',
            error: errorDetails.message,
            errorDescription: errorDetails.description,
            errorType: errorDetails.type,
            originalData: originalData, // Store original data for retry
            canRetry: true,
            retryCount: (node.data?.retryCount || 0) + 1
          }
        };
      }
      return node;
    }));
  }, [setNodes, getErrorDetails]);

  const clearErrorState = useCallback((nodeId) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId) {
        const { error, errorDescription, errorType, originalData, canRetry, retryCount, ...cleanData } = node.data;
        return {
          ...node,
          data: cleanData
        };
      }
      return node;
    }));
  }, [setNodes]);

  const retryGeneration = useCallback(async (nodeId, nodeType) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.data?.originalData) {
      console.error('Cannot retry: Node not found or missing original data');
      return;
    }

    // Clear error state and set to loading
    setNodes(prevNodes => prevNodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: {
            ...n.data,
            nodeState: 'loading',
            content: 'Retrying generation...',
            error: undefined,
            errorDescription: undefined,
            errorType: undefined,
            canRetry: false
          }
        };
      }
      return n;
    }));

    try {
      const originalData = node.data.originalData;
      
      switch (nodeType) {
        case 'conceptNode':
          if (generateConcepts && originalData.message && originalData.parentNodeId) {
            await generateConcepts(originalData.message, originalData.parentNodeId);
          } else {
            throw new Error('Missing concept generation data');
          }
          break;
          
        case 'scriptNode':
          if (generateScript && originalData.conceptNode && originalData.scriptNode) {
            await generateScript(originalData.conceptNode, originalData.scriptNode);
          } else {
            throw new Error('Missing script generation data');
          }
          break;
          
        case 'imageNode':
          if (generateImage && originalData.segmentNode && originalData.imageNode) {
            await generateImage(originalData.segmentNode, originalData.imageNode);
          } else {
            throw new Error('Missing image generation data');
          }
          break;
          
        case 'videoNode':
          if (generateVideo && originalData.imageNode && originalData.videoNode) {
            await generateVideo(originalData.imageNode, originalData.videoNode);
          } else {
            throw new Error('Missing video generation data');
          }
          break;
          
        default:
          throw new Error(`Unsupported node type for retry: ${nodeType}`);
      }
      
      console.log(`Successfully retried ${nodeType} generation for node ${nodeId}`);
    } catch (retryError) {
      console.error(`Retry failed for ${nodeType} node ${nodeId}:`, retryError);
      
      // Show error state again with updated retry count
      showErrorState(nodeId, retryError, originalData);
    }
  }, [nodes, setNodes, generateConcepts, generateScript, generateImage, generateVideo, showErrorState]);

  const withErrorHandling = useCallback(async (generationFunction, nodeType, params) => {
    const { nodeId, ...originalData } = params;
    
    try {
      // Get selected project for error state persistence
      const storedProject = localStorage.getItem('project-store-selectedProject');
      const selectedProject = storedProject ? JSON.parse(storedProject) : null;
      
      const result = await generationFunction(params);
      
      // Clear any existing error states for this node
      if (selectedProject) {
        removeGenerationState(selectedProject.id, nodeType.replace('Node', ''), nodeId);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in ${nodeType} generation:`, error);
      
      if (selectedProject) {
        saveGenerationState(selectedProject.id, nodeType.replace('Node', ''), nodeId, {
          status: 'error',
          errorMessage: error.message || 'Generation failed',
          errorType: getErrorDetails(error).type,
          originalData: originalData,
          timestamp: Date.now()
        });
      }
      
      // Show error state in the node
      showErrorState(nodeId, error, originalData);
      
      throw error; // Re-throw for upstream handling
    }
  }, [saveGenerationState, removeGenerationState, showErrorState, getErrorDetails]);

  /**
   * Gets error statistics for a project
   * @param {string} projectId - Project ID
   * @returns {Object} - Error statistics
   */
  const getErrorStats = useCallback((projectId) => {
    const stats = {
      total: 0,
      byType: {},
      byNodeType: {}
    };
    
    const nodeTypes = ['concept', 'script', 'image', 'video'];
    
    nodeTypes.forEach(type => {
      try {
        const key = `generation-states-${projectId}-${type}`;
        const states = JSON.parse(localStorage.getItem(key) || '{}');
        
        Object.values(states).forEach(state => {
          if (state.status === 'error') {
            stats.total++;
            const errorType = state.errorType || 'unknown';
            stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
            stats.byNodeType[type] = (stats.byNodeType[type] || 0) + 1;
          }
        });
      } catch (error) {
        console.error(`Error reading ${type} generation states:`, error);
      }
    });
    
    return stats;
  }, []);

  /**
   * Clears all error states for a project
   * @param {string} projectId - Project ID
   */
  const clearAllErrors = useCallback((projectId) => {
    const nodeTypes = ['concept', 'script', 'image', 'video'];
    
    nodeTypes.forEach(type => {
      try {
        const key = `generation-states-${projectId}-${type}`;
        const states = JSON.parse(localStorage.getItem(key) || '{}');
        const cleanedStates = {};
        
        Object.entries(states).forEach(([nodeId, state]) => {
          if (state.status !== 'error') {
            cleanedStates[nodeId] = state;
          }
        });
        
        localStorage.setItem(key, JSON.stringify(cleanedStates));
      } catch (error) {
        console.error(`Error clearing ${type} error states:`, error);
      }
    });
    
    // Clear error states from current nodes
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.data?.nodeState === 'error') {
        const { error, errorDescription, errorType, originalData, canRetry, retryCount, ...cleanData } = node.data;
        return {
          ...node,
          data: {
            ...cleanData,
            nodeState: 'existing'
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  return {
    showErrorState,
    clearErrorState,
    retryGeneration,
    withErrorHandling,
    getErrorStats,
    clearAllErrors,
    getErrorDetails
  };
};
