import * as Y from 'yjs';
import { Page } from '../models/Page.js';
import { logger } from '../config/logger.js';
import { debounce } from '@excalidrow/shared/utils';

/**
 * Per-page Yjs document cache. The first client that joins a page rehydrates
 * the doc from MongoDB; subsequent updates are merged in memory and a
 * debounced persist writes the latest state back. When the room empties, the
 * doc is flushed and evicted to free memory.
 */
class YjsStore {
  constructor() {
    this.docs = new Map(); // pageId -> { doc, refCount, persist }
  }

  async acquire(pageId) {
    const cached = this.docs.get(pageId);
    if (cached) {
      cached.refCount += 1;
      return cached.doc;
    }

    const doc = new Y.Doc();
    const page = await Page.findById(pageId).select('yDoc');
    if (page?.yDoc) {
      try {
        Y.applyUpdate(doc, Buffer.from(page.yDoc, 'base64'));
      } catch (err) {
        logger.warn({ err, pageId }, 'failed to hydrate yjs doc');
      }
    }

    const persist = debounce(async () => {
      try {
        const update = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
        await Page.updateOne({ _id: pageId }, { $set: { yDoc: update } });
      } catch (err) {
        logger.warn({ err, pageId }, 'failed to persist yjs doc');
      }
    }, 800);

    doc.on('update', () => persist());

    this.docs.set(pageId, { doc, refCount: 1, persist });
    return doc;
  }

  async release(pageId) {
    const cached = this.docs.get(pageId);
    if (!cached) return;
    cached.refCount -= 1;
    if (cached.refCount <= 0) {
      cached.persist.flush();
      this.docs.delete(pageId);
    }
  }

  applyUpdate(pageId, base64Update) {
    const cached = this.docs.get(pageId);
    if (!cached) return null;
    const buf = Buffer.from(base64Update, 'base64');
    Y.applyUpdate(cached.doc, buf);
    return cached.doc;
  }
}

export const yjsStore = new YjsStore();
