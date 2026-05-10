/**
 * In-memory presence registry. For a single-user local-first app this is
 * sufficient — production multi-node deployments would back this with Redis
 * pubsub, which is the reason we keep the API surface narrow and async-ready.
 */
class PresenceRegistry {
  constructor() {
    /** room -> Map<userId, presence> */
    this.rooms = new Map();
  }

  static roomKey(boardId, pageId) {
    return `${boardId}::${pageId}`;
  }

  upsert(boardId, pageId, presence) {
    const key = PresenceRegistry.roomKey(boardId, pageId);
    let room = this.rooms.get(key);
    if (!room) {
      room = new Map();
      this.rooms.set(key, room);
    }
    room.set(presence.userId, { ...presence });
  }

  remove(boardId, pageId, userId) {
    const key = PresenceRegistry.roomKey(boardId, pageId);
    const room = this.rooms.get(key);
    if (!room) return;
    room.delete(userId);
    if (room.size === 0) this.rooms.delete(key);
  }

  list(boardId, pageId) {
    const room = this.rooms.get(PresenceRegistry.roomKey(boardId, pageId));
    return room ? [...room.values()] : [];
  }

  removeUserEverywhere(userId) {
    for (const [key, room] of this.rooms.entries()) {
      if (room.delete(userId) && room.size === 0) this.rooms.delete(key);
    }
  }
}

export const presence = new PresenceRegistry();
