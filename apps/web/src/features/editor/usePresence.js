import { useEffect, useState } from 'react';
import { ensureSocketConnected, getSocket } from '@/lib/socket.js';
import { SOCKET_EVENTS } from '@excalidrow/shared/constants';

/**
 * Subscribes to a board/page room and surfaces remote peers. Single-user
 * today, but the wiring is fully bidirectional so collaboration can be
 * enabled later by simply opening another browser tab.
 */
export function usePresence({ boardId, pageId }) {
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    if (!boardId || !pageId) return undefined;
    const socket = ensureSocketConnected();

    const onJoined = (payload) => {
      if (payload.boardId === boardId && payload.pageId === pageId) {
        setPeers(payload.peers ?? []);
      }
    };
    const onUpdate = (payload) => {
      if (payload.boardId !== boardId || payload.pageId !== pageId) return;
      setPeers((prev) => {
        const next = prev.filter((p) => p.userId !== payload.userId);
        next.push(payload);
        return next;
      });
    };
    const onLeave = (payload) => {
      if (payload.boardId !== boardId || payload.pageId !== pageId) return;
      setPeers((prev) => prev.filter((p) => p.userId !== payload.userId));
    };

    socket.on(SOCKET_EVENTS.BOARD_JOINED, onJoined);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, onUpdate);
    socket.on(SOCKET_EVENTS.PRESENCE_LEAVE, onLeave);
    socket.emit(SOCKET_EVENTS.BOARD_JOIN, { boardId, pageId });

    return () => {
      socket.emit(SOCKET_EVENTS.BOARD_LEAVE, { boardId, pageId });
      socket.off(SOCKET_EVENTS.BOARD_JOINED, onJoined);
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, onUpdate);
      socket.off(SOCKET_EVENTS.PRESENCE_LEAVE, onLeave);
      setPeers([]);
    };
  }, [boardId, pageId]);

  const sendCursor = (x, y) => {
    const s = getSocket();
    if (!s.connected) return;
    s.volatile.emit(SOCKET_EVENTS.PRESENCE_CURSOR, { boardId, pageId, x, y });
  };

  return { peers, sendCursor };
}
