import { useCallback } from "react";
import { chatApi } from "../services/chat";
import { s3Api } from "../services/s3";

export const useRetryLogic = () => {
  // Retry failed image generation using chat endpoint
  const retryFailedImageGeneration = useCallback(
    async (failedSegmentIds, selectedScript, selectedProject, selectedImageModel, setGeneratedImages) => {
      if (!selectedScript?.segments) return;

      console.log(
        "Retrying failed image generation for segments:",
        failedSegmentIds,
      );

      try {
        const retryPromises = failedSegmentIds.map(async (segmentId) => {
          const segment = selectedScript.segments.find(
            (seg) => seg.id === segmentId,
          );
          if (!segment) return null;

          try {
            const result = await chatApi.generateImage({
              visual_prompt: segment.visual,
              art_style: selectedScript.artStyle || "realistic",
              segmentId: segment.id,
              project_id: selectedProject?.id,
              model: selectedImageModel || "flux-1.1-pro",
            });

            if (result.s3_key) {
              const imageUrl = await s3Api.downloadImage(result.s3_key);
              return { segmentId, imageUrl, s3Key: result.s3_key };
            }
            return null;
          } catch (error) {
            console.error(
              `Failed to retry image generation for segment ${segmentId}:`,
              error,
            );
            return null;
          }
        });

        const retryResults = await Promise.allSettled(retryPromises);
        const successfulRetries = {};

        retryResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            const { segmentId, imageUrl } = result.value;
            successfulRetries[segmentId] = imageUrl;
          }
        });

        if (Object.keys(successfulRetries).length > 0) {
          setGeneratedImages((prev) => ({ ...prev, ...successfulRetries }));
          console.log(
            "Successfully retried images for segments:",
            Object.keys(successfulRetries),
          );
        }
      } catch (error) {
        console.error("Error retrying failed image generation:", error);
      }
    },
    [],
  );

  // Retry failed video generation using chat endpoint
  const retryFailedVideoGeneration = useCallback(
    async (failedSegmentIds, selectedScript, selectedProject, selectedVideoModel, generatedImages, setGeneratedVideos, setStoredVideosMap) => {
      if (!selectedScript?.segments) return;

      console.log(
        "Retrying failed video generation for segments:",
        failedSegmentIds,
      );

      try {
        const retryPromises = failedSegmentIds.map(async (segmentId) => {
          const segment = selectedScript.segments.find(
            (seg) => seg.id === segmentId,
          );
          if (!segment || !generatedImages[segmentId]) return null;

          try {
            // Extract S3 key from CloudFront URL
            const imageUrl = generatedImages[segmentId];
            let imageS3Key = null;

            if (imageUrl && imageUrl.includes("cloudfront.net/")) {
              const urlParts = imageUrl.split("cloudfront.net/");
              if (urlParts.length > 1) {
                imageS3Key = urlParts[1];
              }
            }

            const result = await chatApi.generateVideo({
              animation_prompt: segment.animation || segment.visual,
              art_style: selectedScript.artStyle || "realistic",
              image_s3_key: imageS3Key,
              segmentId: segment.id,
              project_id: selectedProject?.id,
              model: selectedVideoModel || "gen4_turbo",
            });

            if (result.s3_key) {
              const videoUrl = await s3Api.downloadVideo(result.s3_key);
              return { segmentId, videoUrl };
            }
            return null;
          } catch (error) {
            console.error(
              `Failed to retry video generation for segment ${segmentId}:`,
              error,
            );
            return null;
          }
        });

        const retryResults = await Promise.allSettled(retryPromises);
        const successfulRetries = {};

        retryResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            const { segmentId, videoUrl } = result.value;
            successfulRetries[segmentId] = videoUrl;
          }
        });

        if (Object.keys(successfulRetries).length > 0) {
          setGeneratedVideos((prev) => ({ ...prev, ...successfulRetries }));
          setStoredVideosMap((prev) => {
            const updatedMap = { ...prev, ...successfulRetries };

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
          console.log(
            "Successfully retried videos for segments:",
            Object.keys(successfulRetries),
          );
        }
      } catch (error) {
        console.error("Error retrying failed video generation:", error);
      }
    },
    [],
  );

  return {
    // Actions
    retryFailedImageGeneration,
    retryFailedVideoGeneration,
  };
};
