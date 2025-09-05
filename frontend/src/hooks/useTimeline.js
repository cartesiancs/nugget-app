import { useState, useEffect, useCallback } from "react";

export const useTimeline = () => {
  const [timelineProgress, setTimelineProgress] = useState({
    expected: 0,
    added: 0,
  });

  // Listen to electron timeline events
  useEffect(() => {
    if (window?.electronAPI?.res?.timeline?.add) {
      window.electronAPI.res.timeline.add((_evt, payload) => {
        setTimelineProgress((prev) => ({
          ...prev,
          added: prev.added + Object.keys(payload || {}).length,
        }));
      });
    }
  }, []);

  const sendVideosToTimeline = useCallback(
    async (selectedScript, combinedVideosMap, setError) => {
      let payload = [];
      if (selectedScript) {
        // Prefer the unified map so we cover both freshly generated and previously stored videos
        // Sort by segment ID to ensure correct order
        payload = selectedScript.segments
          .filter((s) => combinedVideosMap[s.id])
          .sort((a, b) => {
            const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0;
            const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0;
            return idA - idB;
          })
          .map((s) => ({ id: s.id, url: combinedVideosMap[s.id] }));
      }

      // Fallback – use every video we currently know about
      if (payload.length === 0) {
        payload = Object.entries(combinedVideosMap).map(([id, url]) => {
          const numId = Number(id);
          return {
            id: isNaN(numId) ? id : numId,
            url,
          };
        });

        // Sort by ID using the same robust logic as the main sorting
        payload.sort((a, b) => {
          const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace(/[^0-9]/g, '')) || 0;
          const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id).replace(/[^0-9]/g, '')) || 0;
          return idA - idB;
        });
      }

      if (payload.length === 0) {
        setError("No videos to add.");
        return false;
      }

      console.log('🎬 Sending videos to timeline:', payload);
      console.log('🎬 Combined videos map keys:', Object.keys(combinedVideosMap));
      console.log('🎬 Timeline payload order:', payload.map(p => ({ id: p.id, url: p.url?.substring(0, 50) + '...' })));

      let success = false;
      try {
        const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
        const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
        if (addByUrlFn) {
          if (addByUrlWithDir) {
            await addByUrlWithDir(payload);
          } else {
            await addByUrlFn(payload);
          }
          success = true;
        } else if (window?.electronAPI?.req?.timeline?.addByUrl) {
          if (window.electronAPI.req.timeline.addByUrlWithDir) {
            await window.electronAPI.req.timeline.addByUrlWithDir(payload);
          } else {
            await window.electronAPI.req.timeline.addByUrl(payload);
          }
          success = true;
        } else if (window.require) {
          const { ipcRenderer } = window.require("electron");
          await ipcRenderer.invoke(
            "extension:timeline:addByUrlWithDir",
            payload,
          );
          success = true;
        }
      } catch (err) {
        console.error("timeline add failed", err);
      }

      if (success) {
        setTimelineProgress({ expected: payload.length, added: 0 });
      } else {
        setError("Failed to add videos to timeline.");
      }

      return success;
    },
    [],
  );

  const addSingleVideoToTimeline = useCallback(
    async (segmentId, combinedVideosMap, setError) => {
      const videoUrl =
        combinedVideosMap[segmentId] || combinedVideosMap[String(segmentId)];
      if (!videoUrl) {
        setError("Video not found.");
        return false;
      }

      const payload = [{ id: Number(segmentId), url: videoUrl }];
      let success = false;
      try {
        const addByUrlWithDir = window?.api?.ext?.timeline?.addByUrlWithDir;
        const addByUrlFn = window?.api?.ext?.timeline?.addByUrl;
        if (addByUrlFn) {
          if (addByUrlWithDir) {
            await addByUrlWithDir(payload);
          } else {
            await addByUrlFn(payload);
          }
          success = true;
        } else if (window?.electronAPI?.req?.timeline?.addByUrl) {
          if (window.electronAPI.req.timeline.addByUrlWithDir) {
            await window.electronAPI.req.timeline.addByUrlWithDir(payload);
          } else {
            await window.electronAPI.req.timeline.addByUrl(payload);
          }
          success = true;
        } else if (window.require) {
          const { ipcRenderer } = window.require("electron");
          await ipcRenderer.invoke(
            "extension:timeline:addByUrlWithDir",
            payload,
          );
          success = true;
        }
      } catch (err) {
        console.error("timeline add failed", err);
      }

      if (success) {
        setTimelineProgress({ expected: 1, added: 0 });
      } else {
        setError("Failed to add video to timeline.");
      }

      return success;
    },
    [],
  );

  return {
    timelineProgress,
    sendVideosToTimeline,
    addSingleVideoToTimeline,
  };
};
