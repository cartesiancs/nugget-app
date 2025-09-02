import { useCallback } from 'react';

/**
 * Custom hook for handling segment creation from scripts
 * @param {Object} params - Hook parameters
 * @param {Function} params.setNodes - React Flow setNodes function
 * @param {Function} params.setEdges - React Flow setEdges function
 * @param {Function} params.setTaskCompletionStates - Function to update task completion states
 */
export const useSegmentCreation = ({
  setNodes,
  setEdges,
  setTaskCompletionStates
}) => {
  const createSegments = useCallback(async (scriptNode, segmentNode) => {
    const segments = scriptNode.data?.segments || [];
    
    if (segments.length === 0) {
      console.error('No segments found in script node');
      return;
    }
    
    // Remove the placeholder segment node
    setNodes(prevNodes => prevNodes.filter(node => node.id !== segmentNode.id));
    setEdges(prevEdges => prevEdges.filter(edge => edge.target !== segmentNode.id));
    
    // Create segment nodes from script segments (limit to 5)
    const segmentsToCreate = segments.slice(0, 5);
    const timestamp = Date.now(); // Generate timestamp once for consistent IDs
    
    const segmentIds = []; // Track segment IDs for mapping
    const newSegmentNodes = segmentsToCreate.map((segment, index) => {
      const segmentNodeId = `segment-${scriptNode.id}-${index}-${timestamp}`;
      const segmentId = segment.segmentId || segment.id || `segment-${index + 1}-${timestamp}`;
      
      // Store segment ID for mapping
      segmentIds.push(segmentId);
      
      return {
        id: segmentNodeId,
        type: 'segmentNode',
        position: {
          x: scriptNode.position.x + (index - 2) * 420,
          y: scriptNode.position.y + 400
        },
        data: {
          ...segment,
          id: segmentId,
          segmentId: segmentId, // Store the actual segment ID from backend
          nodeState: 'existing',
          title: `Segment ${index + 1}`,
          visual: segment.visual || '',
          narration: segment.narration || '',
          animation: segment.animation || ''
        }
      };
    });
    
    // Create edges connecting script to segments
    const newEdges = segmentsToCreate.map((_, index) => {
      const segmentNodeId = `segment-${scriptNode.id}-${index}-${timestamp}`;
      return {
        id: `${scriptNode.id}-to-${segmentNodeId}`,
        source: scriptNode.id,
        target: segmentNodeId,
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
    setNodes(prevNodes => [...prevNodes, ...newSegmentNodes]);
    setEdges(prevEdges => [...prevEdges, ...newEdges]);
    
    // Mark segment creation as completed
    setTaskCompletionStates(prev => ({ ...prev, segment: true }));
    
    console.log(`Created ${segmentsToCreate.length} segment nodes from script`);
  }, [setNodes, setEdges, setTaskCompletionStates]);

  return {
    createSegments
  };
};
