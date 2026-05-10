import { Server as IOServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { SOCKET_EVENTS } from '@excalidrow/shared/constants';
import { userColor } from '@excalidrow/shared/utils';
import { presence } from './presence.js';
import { yjsStore } from './yjs-store.js';
import { User } from '../models/User.js';

const roomKey = (boardId, pageId) => `room:${boardId}:${pageId}`;

export function attachSockets(httpServer) {
  const io = new IOServer(httpServer, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
    transports: ['websocket'],
    serveClient: false,
    maxHttpBufferSize: 8 * 1024 * 1024,
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('missing access token'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('user not found'));
      socket.data.user = {
        id: user._id.toString(),
        name: user.name,
        color: userColor(user._id.toString()),
      };
      next();
    } catch (err) {
      next(new Error(err?.message ?? 'auth error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.debug({ userId: user.id, sid: socket.id }, 'socket connected');

    socket.on(SOCKET_EVENTS.BOARD_JOIN, async ({ boardId, pageId }) => {
      if (!boardId || !pageId) return;
      const key = roomKey(boardId, pageId);
      socket.join(key);
      await yjsStore.acquire(pageId);
      const me = { userId: user.id, name: user.name, color: user.color };
      presence.upsert(boardId, pageId, me);
      socket.to(key).emit(SOCKET_EVENTS.PRESENCE_UPDATE, { ...me, boardId, pageId });
      socket.emit(SOCKET_EVENTS.BOARD_JOINED, {
        boardId,
        pageId,
        peers: presence.list(boardId, pageId),
      });
    });

    socket.on(SOCKET_EVENTS.BOARD_LEAVE, async ({ boardId, pageId }) => {
      if (!boardId || !pageId) return;
      const key = roomKey(boardId, pageId);
      socket.leave(key);
      presence.remove(boardId, pageId, user.id);
      socket.to(key).emit(SOCKET_EVENTS.PRESENCE_LEAVE, { boardId, pageId, userId: user.id });
      await yjsStore.release(pageId);
    });

    socket.on(SOCKET_EVENTS.PRESENCE_CURSOR, ({ boardId, pageId, x, y }) => {
      if (!boardId || !pageId) return;
      const me = { userId: user.id, name: user.name, color: user.color, cursor: { x, y } };
      presence.upsert(boardId, pageId, me);
      socket.to(roomKey(boardId, pageId))
        .volatile.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { ...me, boardId, pageId });
    });

    socket.on(SOCKET_EVENTS.PRESENCE_SELECTION, ({ boardId, pageId, ids }) => {
      if (!boardId || !pageId) return;
      const me = { userId: user.id, name: user.name, color: user.color, selection: ids ?? [] };
      presence.upsert(boardId, pageId, me);
      socket.to(roomKey(boardId, pageId))
        .emit(SOCKET_EVENTS.PRESENCE_UPDATE, { ...me, boardId, pageId });
    });

    socket.on(SOCKET_EVENTS.YJS_UPDATE, ({ boardId, pageId, update }) => {
      if (!boardId || !pageId || typeof update !== 'string') return;
      yjsStore.applyUpdate(pageId, update);
      socket.to(roomKey(boardId, pageId)).emit(SOCKET_EVENTS.YJS_REMOTE_UPDATE, {
        boardId,
        pageId,
        update,
        from: user.id,
      });
    });

    socket.on(SOCKET_EVENTS.YJS_AWARENESS, ({ boardId, pageId, update }) => {
      if (!boardId || !pageId || typeof update !== 'string') return;
      socket.to(roomKey(boardId, pageId)).emit(SOCKET_EVENTS.YJS_REMOTE_AWARENESS, {
        boardId,
        pageId,
        update,
        from: user.id,
      });
    });

    socket.on('disconnect', async () => {
      logger.debug({ userId: user.id, sid: socket.id }, 'socket disconnected');
      // Notify rooms this socket belonged to.
      for (const room of socket.rooms) {
        if (typeof room !== 'string' || !room.startsWith('room:')) continue;
        const [, boardId, pageId] = room.split(':');
        presence.remove(boardId, pageId, user.id);
        socket.to(room).emit(SOCKET_EVENTS.PRESENCE_LEAVE, {
          boardId,
          pageId,
          userId: user.id,
        });
        await yjsStore.release(pageId);
      }
    });
  });

  return io;
}
