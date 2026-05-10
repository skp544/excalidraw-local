/**
 * Generic helpers shared across api and web. Must remain dependency-free
 * (other than std + zod) so they can run in either environment.
 */

export const noop = () => {};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Trailing-edge debounce. Returns a function with .cancel() and .flush().
 */
export function debounce(fn, wait = 250) {
  let timer = null;
  let lastArgs = null;
  let lastThis = null;

  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(lastThis, lastArgs);
    }, wait);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn.apply(lastThis, lastArgs);
    }
  };

  return debounced;
}

/**
 * Throttle that fires on the leading edge and at most once per `wait` ms.
 */
export function throttle(fn, wait = 50) {
  let lastTime = 0;
  let timer = null;
  let lastArgs = null;

  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    lastArgs = args;
    if (remaining <= 0) {
      lastTime = now;
      fn.apply(this, lastArgs);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(this, lastArgs);
      }, remaining);
    }
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function safeFilename(name) {
  return String(name)
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 180);
}

const DEFAULT_PALETTE = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F97316', '#EAB308', '#10B981', '#06B6D4',
  '#3B82F6', '#22C55E',
];

/** Deterministic colour for a user id, used for cursor presence. */
export function userColor(id) {
  if (!id) return DEFAULT_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_PALETTE[hash % DEFAULT_PALETTE.length];
}

export function relativeTime(input) {
  const target = input instanceof Date ? input : new Date(input);
  const diff = (Date.now() - target.getTime()) / 1000;
  if (!Number.isFinite(diff)) return '';
  const abs = Math.abs(diff);
  if (abs < 45) return diff >= 0 ? 'just now' : 'in a moment';
  if (abs < 90) return diff >= 0 ? '1 minute ago' : 'in 1 minute';
  const mins = Math.round(abs / 60);
  if (mins < 60) return diff >= 0 ? `${mins} minutes ago` : `in ${mins} minutes`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return diff >= 0 ? `${hours} hours ago` : `in ${hours} hours`;
  const days = Math.round(hours / 24);
  if (days < 30) return diff >= 0 ? `${days} days ago` : `in ${days} days`;
  return target.toLocaleDateString();
}
