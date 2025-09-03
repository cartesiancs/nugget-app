import { useState, useCallback } from "react";
import { agentApi } from "../services/agent";
import { s3Api } from "../services/s3";

export const useAgentStreaming = () => {
  // Streaming states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMessages, setStreamMessages] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [currentReader, setCurrentReader] = useState(null);
  const [agentActivity, setAgentActivity] = useState(null); // Current agent activity description
  const [streamingProgress, setStreamingProgress] = useState(null); // Progress information

  // Helper functions for verbose messaging
  const getToolStartMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Researching web information - Gathering relevant content and insights for your video concept";
      case "generate_concepts_with_approval":
        return "Concept generation running - Analyzing research data and creating multiple creative video concepts";
      case "generate_segmentation":
        return "Script generation running - Breaking down your concept into detailed segments with visuals and narration";
      case "generate_image_with_approval":
        return "Image generation running - Creating visual content for each script segment using AI";
      case "generate_video_with_approval":
        return "Video generation running - Converting images into dynamic video content with animations";
      default:
        return `Agent processing - ${toolName}`;
    }
  }, []);

  const getApprovalMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Web research approval - Ready to gather relevant information for your video concept";
      case "generate_concepts_with_approval":
        return "Concept generation approval - Ready to create multiple video concepts from research data";
      case "generate_segmentation":
        return "Script generation approval - Ready to break down your concept into detailed segments";
      case "generate_image_with_approval":
        return "Image generation approval - Ready to create visual content for each script segment";
      case "generate_video_with_approval":
        return "Video generation approval - Ready to convert images into dynamic video content";
      default:
        return `Approval required - ${toolName}`;
    }
  }, []);

  const getToolCompleteMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Web research completed - Information gathered and processed for concept creation";
      case "generate_concepts_with_approval":
        return "Concept generation completed - Multiple video concepts created and ready for selection";
      case "generate_segmentation":
        return "Script generation completed - Detailed segments with visuals and narration ready";
      case "generate_image_with_approval":
        return "Image generation completed - Visual content created for all script segments";
      case "generate_video_with_approval":
        return "Video generation completed - Dynamic video content ready for timeline";
      default:
        return `${toolName} completed successfully`;
    }
  }, []);

  const getToolApprovalConfirmationMessage = useCallback((toolName) => {
    switch (toolName) {
      case "get_web_info":
        return "Approved web research to gather relevant information";
      case "generate_concepts_with_approval":
        return "Approved concept generation to create video ideas";
      case "generate_segmentation":
        return "Approved script generation to create detailed segments";
      case "generate_image_with_approval":
        return "Approved image generation for visual content";
      case "generate_video_with_approval":
        return "Approved video generation to create dynamic content";
      default:
        return `Approved ${toolName} process`;
    }
  }, []);

  // Handle individual image completion from log messages
  const handleIndividualImageCompletion = useCallback(
    async (segmentId, s3Key, imageData, setGeneratedImages, setAllUserMessages) => {
      try {
        console.log(
          `Processing individual image completion for segment ${segmentId}`,
        );

        // Convert S3 key to CloudFront URL
        const imageUrl = await s3Api.downloadImage(s3Key);
        console.log(`Generated image URL for segment ${segmentId}:`, imageUrl);

        // Update generated images immediately
        setGeneratedImages((prev) => {
          const newImages = { ...prev, [segmentId]: imageUrl };
          console.log("Updated generated images (individual):", newImages);
          return newImages;
        });

        // Update agent activity
        setAgentActivity(`Image completed for segment ${segmentId}`);
      } catch (error) {
        console.error(
          `Failed to process image for segment ${segmentId}:`,
          error,
        );

        // Add error message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `image-error-${segmentId}-${Date.now()}`,
            content: `Failed to process image for segment ${segmentId}`,
            timestamp: Date.now(),
            type: "error",
          },
        ]);
      }
    },
    [],
  );

  // Handle individual video completion from log messages
  const handleIndividualVideoCompletion = useCallback(
    async (segmentId, s3Key, videoData, setGeneratedVideos, setStoredVideosMap, setAllUserMessages, selectedProject) => {
      try {
        console.log(
          `Processing individual video completion for segment ${segmentId}`,
        );

        // Convert S3 key to CloudFront URL
        const videoUrl = await s3Api.downloadVideo(s3Key);
        console.log(`Generated video URL for segment ${segmentId}:`, videoUrl);

        // Update generated videos immediately
        setGeneratedVideos((prev) => {
          const newVideos = { ...prev, [segmentId]: videoUrl };
          console.log("Updated generated videos (individual):", newVideos);
          return newVideos;
        });

        // Update stored videos map for timeline
        setStoredVideosMap((prev) => {
          const updatedMap = { ...prev, [segmentId]: videoUrl };

          // Save to localStorage for persistence
          if (selectedProject) {
            localStorage.setItem(
              `project-store-videos`,
              JSON.stringify(updatedMap),
            );
          } else {
            localStorage.setItem("segmentVideos", JSON.stringify(updatedMap));
          }
          return updatedMap;
        });

        // Update agent activity
        setAgentActivity(`Video completed for segment ${segmentId}`);

        // 🎯 TRIGGER CHAT SCROLL: Dispatch event to trigger chat scroll to bottom
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("scrollChatToBottom", {
              detail: {
                reason: "video_completed",
                segmentId: segmentId,
                timestamp: Date.now(),
              },
            }),
          );
        }, 200); // Delay to ensure video UI components are updated

        // Dispatch event for individual video completion (for UI updates only)
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("individualVideoCompleted", {
              detail: {
                segmentId,
                videoUrl,
                timestamp: Date.now(),
              },
            }),
          );
        }, 100);
      } catch (error) {
        console.error(
          `Failed to process video for segment ${segmentId}:`,
          error,
        );

        // Add error message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `video-error-${segmentId}-${Date.now()}`,
            content: `Failed to process video for segment ${segmentId}`,
            timestamp: Date.now(),
            type: "error",
          },
        ]);
      }
    },
    [],
  );

  const handleStreamMessage = useCallback(async (message, callbacks = {}) => {
    const {
      setAllUserMessages,
      setGeneratedImages,
      setGeneratedVideos,
      setStoredVideosMap,
      selectedProject,
      handleToolResult,
    } = callbacks;

    setStreamMessages((prev) => [...prev, message]);

    switch (message.type) {
      case "log": {
        // Update agent activity with log message if it contains useful info
        const logMessage = message.data.message || message.data;

        // Handle individual image completion in log messages (similar to videos)
        if (message.data?.ImageData?.s3_key && message.data?.segmentId) {
          console.log("Individual image completed:", message.data.ImageData);
          const segmentId = message.data.segmentId;
          const s3Key = message.data.ImageData.s3_key;

          // Process individual image completion
          handleIndividualImageCompletion(
            segmentId,
            s3Key,
            message.data.ImageData,
            setGeneratedImages,
            setAllUserMessages,
          );
        }

        // Handle individual video completion in log messages
        if (message.data?.VideoData?.s3_key && message.data?.segmentId) {
          console.log("Individual video completed:", message.data.VideoData);
          const segmentId = message.data.segmentId;
          const s3Key = message.data.VideoData.s3_key;

          // Process individual video completion
          handleIndividualVideoCompletion(
            segmentId,
            s3Key,
            message.data.VideoData,
            setGeneratedVideos,
            setStoredVideosMap,
            setAllUserMessages,
            selectedProject,
          );
        }

        // 🎯 CHECK FOR IMAGE BATCH COMPLETION: Look for completion summary messages
        if (
          typeof logMessage === "string" &&
          logMessage.includes("Image generation") &&
          logMessage.includes("completed:")
        ) {
          console.log("Image batch completion detected:", logMessage);

          // Extract counts from message like "Image generation completed: 5 success, 0 failed"
          const successMatch = logMessage.match(/(\d+)\s+success/);
          const successCount = successMatch ? parseInt(successMatch[1]) : 0;

          if (successCount > 0) {
            console.log(`Detected ${successCount} images completed`);

            // Add message about image completion
            setAllUserMessages((prev) => [
              ...prev,
              {
                id: `agent-images-batch-${Date.now()}`,
                content: `Image generation complete! Generated ${successCount} images successfully.`,
                timestamp: Date.now(),
                type: "system",
              },
            ]);
          }
        }

        // 🎯 CHECK FOR VIDEO BATCH COMPLETION: Look for completion summary messages
        if (
          typeof logMessage === "string" &&
          logMessage.includes("Video generation") &&
          logMessage.includes("completed:")
        ) {
          console.log("Video batch completion detected:", logMessage);

          // Extract counts from message like "Video generation completed: 3 success, 0 failed"
          const successMatch = logMessage.match(/(\d+)\s+success/);
          const successCount = successMatch ? parseInt(successMatch[1]) : 0;

          if (successCount > 0) {
            console.log(
              `Detected ${successCount} videos completed`,
            );

            // Add message about video completion (without auto-append)
            setAllUserMessages((prev) => [
              ...prev,
              {
                id: `agent-videos-complete-${Date.now()}`,
                content: `Video generation complete! ${successCount} videos are ready for timeline.`,
                timestamp: Date.now(),
                type: "system",
              },
            ]);

            // 🎯 TRIGGER CHAT SCROLL: Scroll to bottom to show completion message
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("scrollChatToBottom", {
                  detail: {
                    reason: "video_batch_completed",
                    successCount: successCount,
                    timestamp: Date.now(),
                  },
                }),
              );
            }, 100); // Small delay to ensure message is rendered
          }
        }
        if (typeof logMessage === "string") {
          setAgentActivity(logMessage);
        }
        break;
      }

      case "thinking": {
        // Agent is thinking/processing
        const thinkingMessage =
          message.data.message || "Agent is analyzing your request...";
        setAgentActivity(thinkingMessage);

        break;
      }

      case "tool_start": {
        // Tool execution started
        const toolName = message.data.toolName || message.data.tool_name;
        const startMessage = getToolStartMessage(toolName);
        setAgentActivity(startMessage);
        setStreamingProgress({ step: toolName, status: "starting" });

        break;
      }

      case "tool_progress":
        // Tool execution progress
        setStreamingProgress((prev) => ({
          ...prev,
          ...message.data,
          status: "in_progress",
        }));

        // Add progress updates to chat
        if (message.data.message) {
        }
        break;

      case "approval_required": {
        const {
          approvalId,
          toolName,
          arguments: args,
          agentName,
        } = message.data;

        // Set agent activity to show what approval is needed
        const approvalMessage = getApprovalMessage(toolName);
        setAgentActivity(approvalMessage);

        // Parse arguments if they come as JSON string
        let parsedArgs = args;
        if (typeof args === "string") {
          try {
            parsedArgs = JSON.parse(args);
          } catch {
            parsedArgs = {};
          }
        }

        // Check if this approval already exists to prevent duplicates
        setPendingApprovals((prev) => {
          const existingApproval = prev.find((a) => a.id === approvalId);
          if (existingApproval) {
            return prev;
          }

          const newApproval = {
            id: approvalId,
            toolName,
            arguments: parsedArgs,
            agentName,
            timestamp: message.timestamp,
          };
          return [...prev, newApproval];
        });

        // Handle approval based on tool type
        await handleToolApproval(approvalId, toolName, parsedArgs);
        break;
      }

      case "result": {
        // Debug the message data to understand the structure
        console.log('🔍 Result message data:', message.data);
        
        const completeMessage = getToolCompleteMessage(
          message.data.toolName || message.data.tool_name || "operation",
        );
        setAgentActivity(completeMessage);
        setStreamingProgress(null); // Clear progress

        // Add completion message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-complete-${Date.now()}`,
            content: completeMessage,
            timestamp: Date.now(),
            type: "system",
          },
        ]);

        // Add small delay to ensure completion message is processed before tool result
        if (handleToolResult) {
          setTimeout(async () => {
            await handleToolResult(message.data);
          }, 50); // Small delay to ensure message ordering
        }
        break;
      }

      case "completed": {
        const taskCompleteMessage = "Task completed successfully!";
        setAgentActivity(taskCompleteMessage);
        setStreamingProgress(null);
        setIsStreaming(false);

        // Add final completion message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-task-complete-${Date.now()}`,
            content: taskCompleteMessage,
            timestamp: Date.now(),
            type: "system",
          },
        ]);

        // Clear activity after a delay
        setTimeout(() => setAgentActivity(null), 3000);
        break;
      }

      case "error": {
        const errorMessage = `Error: ${message.data.message}`;
        setAgentActivity(errorMessage);
        setStreamingProgress(null);
        setIsStreaming(false);

        // Add error message to chat
        setAllUserMessages((prev) => [
          ...prev,
          {
            id: `agent-error-${Date.now()}`,
            content: errorMessage,
            timestamp: Date.now(),
            type: "system",
          },
        ]);
        break;
      }

      default:
        // Unknown message type - silently ignore
        break;
    }
  }, [getToolStartMessage, getApprovalMessage, getToolCompleteMessage, handleIndividualImageCompletion, handleIndividualVideoCompletion]);

  const handleToolApproval = useCallback(async (approvalId, toolName, args) => {
    console.log("Tool approval required:", { approvalId, toolName, args });
    // Manual approval required - approval will remain pending until user clicks approve
    console.log("Manual approval needed for:", toolName);
  }, []);

  const startAgentStream = useCallback(
    async (userInput, user, selectedProject, setError, setLoading, setAllUserMessages, callbacks = {}) => {
      if (!userInput || !userInput.trim()) {
        setError("Please enter a prompt first");
        return;
      }

      if (!selectedProject?.id) {
        setError("Please select a project first");
        return;
      }

      // Ensure prompt is a string and not empty
      const cleanPrompt = String(userInput).trim();
      if (!cleanPrompt) {
        setError("Please enter a valid prompt");
        return;
      }

      console.log("Starting agent stream with prompt:", cleanPrompt);

      setIsStreaming(true);
      setLoading(true);
      setError(null);
      setStreamMessages([]);
      setPendingApprovals([]);
      setAgentActivity("Initializing agent workflow...");
      setStreamingProgress(null);

      // Add initial verbose messages to chat
      setAllUserMessages((prev) => [
        ...prev,
        {
          id: `agent-init-${Date.now()}`,
          content:
            "Initializing agent workflow - Setting up processing pipeline...",
          timestamp: Date.now(),
          type: "system",
        },
      ]);

      try {
        const response = await agentApi.startAgentRunStream(
          cleanPrompt,
          user?.id,
          "default", // segmentId
          selectedProject.id,
        );

        const reader = response.body.getReader();
        setCurrentReader(reader);

        const decoder = new TextDecoder();
        let buffer = "";

        // Create a better stream processor
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;

              // Process complete lines immediately
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.trim() === "") continue;

                if (line.startsWith("data: ")) {
                  try {
                    const jsonData = line.slice(6).trim();
                    const data = JSON.parse(jsonData);
                    await handleStreamMessage(data, callbacks);
                  } catch (parseError) {
                    console.error("Error parsing stream message:", parseError);
                  }
                }
              }

              // Force immediate processing
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
          } catch (error) {
            console.error("Stream processing error:", error);
            throw error;
          }
        };

        await processStream();
      } catch (error) {
        console.error("Error in agent stream:", error);
        setError(error.message || "Failed to start agent stream");
      } finally {
        setIsStreaming(false);
        setLoading(false);
        setCurrentReader(null);
      }
    },
    [handleStreamMessage],
  );

  const stopStream = useCallback(() => {
    if (currentReader) {
      currentReader.cancel();
      setCurrentReader(null);
    }
    setIsStreaming(false);
  }, [currentReader]);

  const approveToolExecution = useCallback(
    async (approvalId, additionalData, user, selectedProject, selectedConcept, selectedScript, generatedImages, selectedConceptModel, selectedScriptModel, selectedImageModel, selectedVideoModel, setAllUserMessages, setError) => {
      console.log('🚀 approveToolExecution called with:', { approvalId, additionalData, user: user?.email, projectId: selectedProject?.id });
      try {
        // Find the approval to get tool context
        const approval = pendingApprovals.find((a) => a.id === approvalId);
        let finalAdditionalData = additionalData;

        // Add approval confirmation message to chat
        if (approval) {
          setAllUserMessages((prev) => [
            ...prev,
            {
              id: `user-approval-${Date.now()}`,
              content: `Approved: ${getToolApprovalConfirmationMessage(
                approval.toolName,
              )}`,
              timestamp: Date.now(),
              type: "user",
            },
          ]);
        }

        // Prepare specific data based on tool type
        if (!additionalData && approval) {
          switch (approval.toolName) {
            case "generate_concepts_with_approval":
              // For concept generation - match DTO exactly
              finalAdditionalData = {
                web_info: approval.arguments?.web_info || null,
                prompt: approval.arguments?.prompt || null,
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
                model:
                  selectedConceptModel ||
                  approval.arguments?.model ||
                  "gemini-2.0-flash-exp",
              };
              break;

            case "generate_segmentation": {
              // For segmentation - check if concept is selected first
              if (!selectedConcept) {
                setError(
                  "Please select a concept first before generating segmentation",
                );
                return;
              }
              // For segmentation - match DTO exactly and ensure we use selected concept
              // Map frontend model names to backend expected values
              const mapScriptModelToBackend = (frontendModel) => {
                if (frontendModel === "gemini-pro") {
                  return "pro";
                }
                return "flash"; // Default for gemini-2.0-flash-exp, gemini-flash, etc.
              };

              finalAdditionalData = {
                prompt: approval.arguments?.prompt || null,
                concept: selectedConcept.title,
                negative_prompt: approval.arguments?.negative_prompt || null,
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
                model: mapScriptModelToBackend(
                  selectedScriptModel ||
                    approval.arguments?.model ||
                    "gemini-2.0-flash-exp",
                ),
              };
              console.log(
                "🎯 Using selected concept for segmentation:",
                selectedConcept.title,
              );
              console.log(
                "🎯 Using script model for segmentation:",
                selectedScriptModel,
              );
              break;
            }

            case "generate_image_with_approval":
              // For image generation - match DTO exactly
              finalAdditionalData = {
                segments: selectedScript?.segments || null,
                art_style:
                  selectedScript?.artStyle ||
                  approval.arguments?.art_style ||
                  "realistic",
                model:
                  selectedImageModel ||
                  approval.arguments?.model ||
                  "flux-1.1-pro",
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
                segmentId: "default",
              };
              break;

            case "get_web_info":
              // For web info - match DTO exactly
              finalAdditionalData = {
                prompt: approval.arguments?.prompt || null,
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
              };
              break;

            case "generate_video_with_approval": {
              // For video generation - check if we have images and script first
              if (
                !selectedScript?.segments ||
                Object.keys(generatedImages).length === 0
              ) {
                setError(
                  "Please ensure images are generated first before generating videos",
                );
                return;
              }

              // Prepare segments with imageS3Key from generated images
              const videoSegments = selectedScript.segments
                .filter((segment) => generatedImages[segment.id]) // Only segments with images
                .map((segment) => {
                  // Extract S3 key from CloudFront URL
                  const imageUrl = generatedImages[segment.id];
                  let imageS3Key = null;

                  if (imageUrl && imageUrl.includes("cloudfront.net/")) {
                    const urlParts = imageUrl.split("cloudfront.net/");
                    if (urlParts.length > 1) {
                      imageS3Key = urlParts[1];
                    }
                  }

                  return {
                    id: segment.id,
                    animation_prompt: segment.animation || segment.visual,
                    imageS3Key: imageS3Key,
                  };
                });

              finalAdditionalData = {
                segments: videoSegments,
                art_style:
                  selectedScript?.artStyle ||
                  approval.arguments?.art_style ||
                  "realistic",
                model:
                  selectedVideoModel ||
                  approval.arguments?.model ||
                  "gen4_turbo",
                projectId:
                  selectedProject?.id || approval.arguments?.projectId || null,
              };
              console.log(
                "🎬 Prepared video generation data:",
                finalAdditionalData,
              );
              break;
            }

            default:
              // For other tools, just pass the basic approval
              finalAdditionalData = null;
          }
        }

        console.log("Approving tool with data:", {
          approvalId,
          toolName: approval?.toolName,
          finalAdditionalData,
          currentModels: {
            concept: selectedConceptModel,
            script: selectedScriptModel,
            image: selectedImageModel,
            video: selectedVideoModel,
          },
        });

        await agentApi.handleApproval(
          approvalId,
          true,
          user?.id,
          finalAdditionalData,
        );

        // Remove from pending approvals
        setPendingApprovals((prev) =>
          prev.filter((approval) => approval.id !== approvalId),
        );
      } catch (error) {
        console.error("Error approving tool:", error);
        setError("Failed to approve tool execution");
      }
    },
    [pendingApprovals, getToolApprovalConfirmationMessage],
  );

  const rejectToolExecution = useCallback(
    async (approvalId, user, setError) => {
      try {
        await agentApi.handleApproval(approvalId, false, user?.id);

        // Remove from pending approvals
        setPendingApprovals((prev) =>
          prev.filter((approval) => approval.id !== approvalId),
        );
      } catch (error) {
        console.error("Error rejecting tool:", error);
        setError("Failed to reject tool execution");
      }
    },
    [],
  );

  return {
    // States
    isStreaming,
    streamMessages,
    pendingApprovals,
    agentActivity,
    streamingProgress,

    // Actions
    startAgentStream,
    stopStream,
    approveToolExecution,
    rejectToolExecution,
    handleStreamMessage,
    handleToolApproval,

    // Helper functions
    getToolStartMessage,
    getApprovalMessage,
    getToolCompleteMessage,
    getToolApprovalConfirmationMessage,
  };
};
