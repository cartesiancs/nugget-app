import { useCallback } from 'react';
import { webInfoApi } from '../services/web-info';
import { conceptWriterApi } from '../services/concept-writer';

/**
 * Custom hook for handling concept generation
 * @param {Object} params - Hook parameters
 * @param {Function} params.setNodes - React Flow setNodes function
 * @param {Function} params.setEdges - React Flow setEdges function
 * @param {Function} params.setGeneratingConcepts - Function to update generating concepts state
 * @param {Function} params.setUserConcepts - Function to update user concepts state
 * @param {Function} params.setTaskCompletionStates - Function to update task completion states
 * @param {Function} params.saveGenerationState - Function to save generation state to localStorage
 * @param {Function} params.removeGenerationState - Function to remove generation state from localStorage
 * @param {Array} params.nodes - Current nodes array
 */
export const useConceptGeneration = ({
  setNodes,
  setEdges,
  setGeneratingConcepts,
  setUserConcepts,
  setTaskCompletionStates,
  saveGenerationState,
  removeGenerationState,
  nodes
}) => {
  const generateConcepts = useCallback(async (message, nodeId) => {
    // Get selected project from localStorage
    let selectedProject = null;
    try {
      const storedProject = localStorage.getItem('project-store-selectedProject');
      selectedProject = storedProject ? JSON.parse(storedProject) : null;
    } catch (e) {
      console.error('Error parsing project data:', e);
    }
    
    if (!selectedProject) {
      console.error('No project selected');
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              error: 'No project selected. Please select a project first.',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
      return;
    }
    
    // Store user node data in localStorage with project ID and user text
    const userNodeDataKey = `userNodeData-${selectedProject.id}`;
    const existingUserNodeData = JSON.parse(localStorage.getItem(userNodeDataKey) || '{}');
    existingUserNodeData[nodeId] = {
      projectId: selectedProject.id,
      text: message
    };
    localStorage.setItem(userNodeDataKey, JSON.stringify(existingUserNodeData));

    // Update state
    setUserConcepts(prev => new Map(prev.set(nodeId, message)));
    
    // Mark user input as completed
    setTaskCompletionStates(prev => ({ ...prev, userInput: true }));
    
    // Update the user node to show user text immediately
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            userText: message,
            nodeState: 'user',
            content: message
          }
        };
      }
      return node;
    }));
    
    // Create a single loading concept node first
    const loadingConceptNodeId = `loading-concept-${nodeId}-${Date.now()}`;
    const userNodePosition = nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 };
    const loadingConceptNode = {
      id: loadingConceptNodeId,
      type: 'conceptNode',
      position: {
        x: userNodePosition.x,
        y: userNodePosition.y + 300
      },
      data: {
        id: loadingConceptNodeId,
        content: 'Generating concepts...',
        nodeState: 'loading',
        title: 'Loading Concepts'
      }
    };

    // Save persistent generation state
    saveGenerationState(selectedProject.id, 'concept', loadingConceptNodeId, {
      loadingMessage: 'Generating concepts...',
      title: 'Loading Concepts',
      position: { x: userNodePosition.x, y: userNodePosition.y + 300 },
      parentNodeId: nodeId,
      originalPrompt: message
    });
    
    // Create edge connecting user node to loading concept node
    const loadingEdge = {
      id: `${nodeId}-to-${loadingConceptNodeId}`,
      source: nodeId,
      target: loadingConceptNodeId,
      sourceHandle: 'output',
      targetHandle: 'input',
      style: {
        stroke: '#E9E8EB33',
        strokeWidth: 2,
        filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
      }
    };
    
    // Add loading concept node and edge immediately
    setNodes(prevNodes => [...prevNodes, loadingConceptNode]);
    setEdges(prevEdges => [...prevEdges, loadingEdge]);

    // Generate concepts from backend
    try {
      setGeneratingConcepts(prev => new Set(prev.add(loadingConceptNodeId)));
      
      // First call web-info API
      const webInfoResult = await webInfoApi.processWebInfo(
        message,
        selectedProject.id,
      );
      const webInfoContent = webInfoResult.choices[0].message.content;
      const conceptsResponse = await conceptWriterApi.generateConcepts(
        message,
        webInfoContent,
        selectedProject.id,
      );
      
      if (conceptsResponse && conceptsResponse.concepts && Array.isArray(conceptsResponse.concepts)) {
        // Remove persistent generation state and clean up localStorage
        removeGenerationState(selectedProject.id, 'concept', loadingConceptNodeId);
        
        // Mark user data as processed
        try {
          const userNodeDataKey = `userNodeData-${selectedProject.id}`;
          const existingUserNodeData = JSON.parse(localStorage.getItem(userNodeDataKey) || '{}');
          Object.keys(existingUserNodeData).forEach(key => {
            if (existingUserNodeData[key].text === message) {
              existingUserNodeData[key].processed = true;
              existingUserNodeData[key].processedAt = Date.now();
            }
          });
          localStorage.setItem(userNodeDataKey, JSON.stringify(existingUserNodeData));
        } catch (error) {
          console.error('Error updating user node data:', error);
        }
        
        // Remove the loading concept node and its edge
        setNodes(prevNodes => prevNodes.filter(node => node.id !== loadingConceptNodeId));
        setEdges(prevEdges => prevEdges.filter(edge => edge.target !== loadingConceptNodeId));
        
        // Create concept nodes from backend response
        const userNodePosition = nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 };
        const conceptCount = conceptsResponse.concepts.length;
        const conceptSpacing = 350; // Space between concepts
        const totalWidth = (conceptCount - 1) * conceptSpacing;
        const startX = userNodePosition.x - (totalWidth / 2); // Center the concepts under user node
        const timestamp = Date.now(); // Use single timestamp for consistency
        
        // Extract concept IDs for mapping
        const conceptIds = [];
        
        const newConceptNodes = conceptsResponse.concepts.map((concept, index) => {
          const conceptNodeId = `generated-concept-${nodeId}-${index}-${timestamp}`;
          const conceptId = concept.id || `concept-${index}-${timestamp}`;
          
          // Store concept ID for mapping
          conceptIds.push(conceptId);
          
          return {
            id: conceptNodeId,
            type: 'conceptNode',
            position: {
              x: startX + index * conceptSpacing,
              y: userNodePosition.y + 300
            },
            data: {
              ...concept,
              nodeState: 'existing',
              content: concept.content || concept.text || concept.concept || concept.description || concept.title,
              title: concept.title || `Generated Concept ${index + 1}`,
              id: conceptId,
              conceptId: conceptId // Store the actual concept ID from backend
            }
          };
        });
        
        // Create edges connecting user node to generated concepts
        const newEdges = conceptsResponse.concepts.map((_, index) => {
          const conceptNodeId = `generated-concept-${nodeId}-${index}-${timestamp}`;
          return {
            id: `${nodeId}-to-${conceptNodeId}`,
            source: nodeId,
            target: conceptNodeId,
            sourceHandle: 'output',
            targetHandle: 'input',
            style: {
              stroke: '#E9E8EB33',
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 6px rgba(233, 232, 235, 0.2))'
            }
          };
        });
        
        // Add new nodes and edges
        setNodes(prevNodes => [...prevNodes, ...newConceptNodes]);
        setEdges(prevEdges => [...prevEdges, ...newEdges]);
        
        setTaskCompletionStates(prev => ({ ...prev, concept: true }));
      } else {
        throw new Error('Invalid response format from concept generation API');
      }
    } catch (error) {
      console.error('Error generating concepts:', error);
      // Save error state instead of removing it immediately
      saveGenerationState(selectedProject.id, 'concept', loadingConceptNodeId, {
        loadingMessage: 'Failed to generate concepts',
        title: 'Error',
        position: { x: userNodePosition.x, y: userNodePosition.y + 300 },
        parentNodeId: nodeId,
        originalPrompt: message,
        status: 'error',
        errorMessage: error.message || 'Failed to generate concepts'
      });
      
      // Show error in the loading concept node
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === loadingConceptNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              content: 'Failed to generate concepts',
              error: error.message || 'Failed to generate concepts',
              nodeState: 'error'
            }
          };
        }
        return node;
      }));
      
      setTimeout(() => {
        removeGenerationState(selectedProject.id, 'concept', loadingConceptNodeId);
      }, 5000);
    } finally {
      setGeneratingConcepts(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingConceptNodeId);
        return newSet;
      });
    }
  }, [setNodes, setEdges, setGeneratingConcepts, setUserConcepts, setTaskCompletionStates, saveGenerationState, removeGenerationState, nodes]);

  return {
    generateConcepts
  };
};
