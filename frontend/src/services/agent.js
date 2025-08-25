import { getAuthHeaders } from "./api";

export const agentApi = {


  // Start streaming agent run with EventSource (better for SSE)
  startAgentRunStreamWithEventSource: async (userInput, userId, segmentId, projectId) => {
    try {
      const headers = await getAuthHeaders();
      
      // Ensure prompt is a valid string
      if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
        throw new Error('Invalid prompt: must be a non-empty string');
      }
      
      const body = {
        prompt: userInput.trim(),
        segmentId: segmentId || 'default',
        projectId: projectId,
      };

      console.log('EventSource Agent API request:', { body, headers });

      // Create a URL with auth header as query param since EventSource doesn't support custom headers
      const url = new URL('https://backend.usuals.ai/agent/run');
      
      // For EventSource, we need to send the data differently
      // Let's make a POST request first to start the stream, then connect via EventSource
      const initResponse = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
      });

      console.log('EventSource init response:', initResponse.status, initResponse.headers);

      if (!initResponse.ok) {
        throw new Error(`HTTP error! status: ${initResponse.status}`);
      }

      return initResponse;
    } catch (error) {
      console.error('Error starting agent stream with EventSource:', error);
      throw error;
    }
  },

  // Start streaming agent run with fetch (original method)
  startAgentRunStream: async (userInput, userId, segmentId, projectId) => {
    try {
      const headers = await getAuthHeaders();
      
      // Ensure prompt is a valid string
      if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
        throw new Error('Invalid prompt: must be a non-empty string');
      }
      
      const body = {
        prompt: userInput.trim(),
        segmentId: segmentId || 'default',
        projectId: projectId,
      };

      console.log('Agent API request:', { body, headers });

      const response = await fetch('https://backend.usuals.ai/agent/run', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(body),
      });

      console.log('Fetch response:', response.status, response.headers);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Return the response for streaming
      return response;
    } catch (error) {
      console.error('Error starting agent stream:', error);
      throw error;
    }
  },

  // Handle approval request
  handleApproval: async (approvalId, approved, userId, additionalData = null) => {
    try {
      const headers = await getAuthHeaders();
      
      const body = {
        approvalId,
        approved,
        ...(additionalData || {}), // Spread additional data directly into the body
      };

      console.log('🟢 Sending approval request:', {
        url: 'https://backend.usuals.ai/agent/approval',
        headers,
        body
      });

      const response = await fetch('https://backend.usuals.ai/agent/approval', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Approval response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Approval request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Approval response:', result);
      return result;
    } catch (error) {
      console.error('Failed to handle approval:', error);
      throw error;
    }
  },

  // Get pending approvals
  getPendingApprovals: async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch('https://backend.usuals.ai/agent/approvals', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  },
};
