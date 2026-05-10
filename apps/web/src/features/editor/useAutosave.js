import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api.js';
import { captureThumbnail } from './exporter.js';

/**
 * Autosave engine for the active page. Coalesces noisy onChange events from
 * Excalidraw, debounces a single PATCH per 1.2s, and opportunistically
 * refreshes the board thumbnail every ~30s of activity.
 */
export function useAutosave({ boardId, pageId, excalidrawApi }) {
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const pendingScene = useRef(null);
  const lastThumbAt = useRef(0);
  const timer = useRef(null);

  const persist = useCallback(async () => {
    const scene = pendingScene.current;
    if (!scene || !pageId || !boardId) return;
    pendingScene.current = null;
    setState('saving');
    try {
      await api.patch(`/boards/${boardId}/pages/${pageId}`, { scene });
      setState('saved');
      const now = Date.now();
      if (now - lastThumbAt.current > 30_000 && excalidrawApi) {
        lastThumbAt.current = now;
        captureThumbnail({ excalidrawApi, boardId }).catch(() => {});
      }
      setTimeout(() => setState((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch (err) {
      setState('error');
    }
  }, [boardId, pageId, excalidrawApi]);

  const schedule = useCallback(
    (scene) => {
      pendingScene.current = scene;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(persist, 1200);
    },
    [persist],
  );

  // Flush on unmount and on tab close so we never lose changes.
  useEffect(() => {
    const onUnload = () => {
      if (pendingScene.current && navigator.sendBeacon) {
        try {
          const url = `${import.meta.env.VITE_API_URL ?? ''}/api/v1/boards/${boardId}/pages/${pageId}`;
          const payload = new Blob([JSON.stringify({ scene: pendingScene.current })], {
            type: 'application/json',
          });
          navigator.sendBeacon(url, payload);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (timer.current) clearTimeout(timer.current);
      if (pendingScene.current) persist();
    };
  }, [boardId, pageId, persist]);

  return { state, schedule, flush: persist };
}
