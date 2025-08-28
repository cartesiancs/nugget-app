import { useCallback } from 'react';
import { segmentationApi } from '../services/segmentationapi';

/**
 * Custom hook for handling script generation from concepts
 * @param {Object} params - Hook parameters
 * @param {Function} params.setNodes - React Flow setNodes function
 * @param {Function} params.setEdges - React Flow setEdges function
 * @param {Function} params.setGeneratingScripts - Function to update generating scripts state
 * @param {Function} params.setTaskCompletionStates - Function to update task completion states
 * @param {Function} params.saveGenerationState - Function to save generation state to localStorage
 * @param {Function} params.removeGenerationState - Function to remove generation state from localStorage
 */
export const useScriptGeneration = ({
  setNodes,
  setEdges,
  setGeneratingScripts,
  setTaskCompletionStates,
  saveGenerationState,
  removeGenerationState
}) => {
  const generateScript = useCallback(async (conceptNode, scriptNode) => {
    try {
      setGeneratingScripts(prev => new Set(prev.add(scriptNode.id)));
      
      // Get selected project from localStorage
      let selectedProject = null;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        selectedProject = storedProject ? JSON.parse(storedProject) : null;
      } catch (e) {
        console.error('Error parsing project data:', e);
      }
      
      if (!selectedProject) {
        throw new Error('No project selected. Please select a project first.');
      }
      
      // Update script node to show loading
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === scriptNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Generating script...',
              nodeState: 'loading'
            }
          };
        }
        return node;
      }));

      // Save persistent generation state
      saveGenerationState(selectedProject.id, 'script', scriptNode.id, {
        loadingMessage: 'Generating script...',
        title: 'Loading Script',
        position: scriptNode.position,
        parentNodeId: conceptNode.id,
        conceptContent: conceptNode.data?.content || conceptNode.data?.userText || ''
      });
      
      // Generate 2 different scripts using concept content
      const conceptContent = conceptNode.data?.content || conceptNode.data?.userText || '';
      const conceptTitle = conceptNode.data?.title || 'Selected Concept';
      
      console.log("Starting script generation for concept:", conceptTitle);
      
      // Generate 2 different scripts by making 2 API calls with different approaches
      const [scriptResponse1, scriptResponse2] = await Promise.all([
        segmentationApi.getSegmentation({
          prompt: `Generate a detailed cinematic script for: ${conceptContent}`,
          concept: `${conceptTitle} - Cinematic Style`,
          negative_prompt: "",
          project_id: selectedProject.id,
          model: 'flash'
        }),
        segmentationApi.getSegmentation({
          prompt: `Generate an alternative creative script for: ${conceptContent}`,
          concept: `${conceptTitle} - Creative Style`,
          negative_prompt: "",
          project_id: selectedProject.id,
          model: 'flash'
        })
      ]);
      
      console.log("Script generation responses:", { scriptResponse1, scriptResponse2 });
      
      if (scriptResponse1 && scriptResponse1.segments && Array.isArray(scriptResponse1.segments) &&
          scriptResponse2 && scriptResponse2.segments && Array.isArray(scriptResponse2.segments)) {
        
        // Remove persistent generation state and clean up
        removeGenerationState(selectedProject.id, 'script', scriptNode.id);
        
        // Clean up any temporary script generation data
        try {
          const tempScriptKey = `temp-script-${selectedProject.id}-${scriptNode.id}`;
          localStorage.removeItem(tempScriptKey);
          console.log('✅ Cleaned up temporary script data from localStorage');
        } catch (error) {
          console.error('Error cleaning up temporary script data:', error);
        }
        
        // Remove the placeholder script node
        setNodes(prevNodes => prevNodes.filter(node => node.id !== scriptNode.id));
        setEdges(prevEdges => prevEdges.filter(edge => edge.target !== scriptNode.id));
        
        // Create 2 new script nodes
        const newScriptNodes = [];
        const newEdges = [];
        
        // Create first script node (Cinematic)
        const script1NodeId = `script-${conceptNode.id}-1-${Date.now()}`;
        const script1Id = scriptResponse1.id || `script-cinematic-${Date.now()}`;
        newScriptNodes.push({
          id: script1NodeId,
          type: 'scriptNode',
          position: {
            x: scriptNode.position.x - 200,
            y: scriptNode.position.y
          },
          data: {
            id: script1NodeId,
            scriptId: script1Id, // Store the actual script ID from backend
            content: `Cinematic Script - ${scriptResponse1.segments.length} segments`,
            segments: scriptResponse1.segments,
            nodeState: 'existing',
            title: `Cinematic Script`,
            artStyle: scriptResponse1.artStyle || 'cinematic photography with soft lighting',
            concept: conceptTitle
          }
        });
        
        // Create second script node (Creative)
        const script2NodeId = `script-${conceptNode.id}-2-${Date.now()}`;
        const script2Id = scriptResponse2.id || `script-creative-${Date.now()}`;
        newScriptNodes.push({
          id: script2NodeId,
          type: 'scriptNode',
          position: {
            x: scriptNode.position.x + 200,
            y: scriptNode.position.y
          },
          data: {
            id: script2NodeId,
            scriptId: script2Id, // Store the actual script ID from backend
            content: `Creative Script - ${scriptResponse2.segments.length} segments`,
            segments: scriptResponse2.segments,
            nodeState: 'existing',
            title: `Creative Script`,
            artStyle: scriptResponse2.artStyle || 'creative artistic style',
            concept: conceptTitle
          }
        });
        
        // Create edges connecting concept to both script nodes
        newEdges.push({
          id: `${conceptNode.id}-to-${script1NodeId}`,
          source: conceptNode.id,
          target: script1NodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        });
        
        newEdges.push({
          id: `${conceptNode.id}-to-${script2NodeId}`,
          source: conceptNode.id,
          target: script2NodeId,
          sourceHandle: 'output',
          targetHandle: 'input',
          style: {
            stroke: '#E9E8EB33',
            strokeWidth: 2,
            filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
          }
        });
        
        // Add new nodes and edges
        setNodes(prevNodes => [...prevNodes, ...newScriptNodes]);
        setEdges(prevEdges => [...prevEdges, ...newEdges]);
        
        // Mark script generation as completed
        setTaskCompletionStates(prev => ({ ...prev, script: true }));
        
        console.log(`Generated 2 different script nodes from concept`);
      } else {
        throw new Error('Invalid response format from script generation API');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      
      // Get selected project again for error handling
      let selectedProject = null;
      try {
        const storedProject = localStorage.getItem('project-store-selectedProject');
        selectedProject = storedProject ? JSON.parse(storedProject) : null;
      } catch (e) {
        console.error('Error parsing project data:', e);
      }
      
      // Determine error type and message
      const getErrorDetails = (error) => {
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
          return { message: 'Network Error', description: 'Please check your internet connection and try again.' };
        }
        if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error') || errorMessage.includes('server')) {
          return { message: 'Internal Server Error', description: 'Server is temporarily unavailable. Please try again.' };
        }
        if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
          return { message: 'Authentication Error', description: 'Please log in again to continue.' };
        }
        if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
          return { message: 'Rate Limit Exceeded', description: 'Too many requests. Please wait a moment and try again.' };
        }
        return { message: 'Generation Failed', description: 'Failed to generate script. Please try again.' };
      };
      
      const errorDetails = getErrorDetails(error);
      
      if (selectedProject) {
        // Save error state instead of removing it immediately
        saveGenerationState(selectedProject.id, 'script', scriptNode.id, {
          loadingMessage: 'Failed to generate script',
          title: 'Error',
          position: scriptNode.position,
          parentNodeId: conceptNode.id,
          conceptContent: conceptNode.data?.content || conceptNode.data?.userText || '',
          status: 'error',
          errorMessage: errorDetails.message,
          originalData: {
            conceptNode: conceptNode,
            scriptNode: scriptNode
          }
        });
      }
      
      // Show error in script node with enhanced error display
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === scriptNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              content: errorDetails.message,
              error: errorDetails.message,
              errorDescription: errorDetails.description,
              nodeState: 'error',
              canRetry: true,
              originalData: {
                conceptNode: conceptNode,
                scriptNode: scriptNode
              }
            }
          };
        }
        return node;
      }));
      
      // Don't auto-remove error states - let user manually retry or dismiss
      // if (selectedProject) {
      //   setTimeout(() => {
      //     removeGenerationState(selectedProject.id, 'script', scriptNode.id);
      //   }, 5000);
      // }
    } finally {
      setGeneratingScripts(prev => {
        const newSet = new Set(prev);
        newSet.delete(scriptNode.id);
        return newSet;
      });
    }
  }, [setNodes, setEdges, setGeneratingScripts, setTaskCompletionStates, saveGenerationState, removeGenerationState]);

  return {
    generateScript
  };
};
