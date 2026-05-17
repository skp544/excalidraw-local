import { asyncHandler } from '../utils/async-handler.js';
import { Activity, Notification } from '../models/index.js';

export const listActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const before = req.query.before ? new Date(req.query.before) : null;
  const filter = { actorId: req.user.id };
  if (before && !Number.isNaN(before.getTime())) {
    filter.createdAt = { $lt: before };
  }
  const items = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json({ items: items.map((a) => a.toJSONResponse()) });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json({ items: items.map((n) => n.toJSONResponse()) });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, userId: req.user.id },
    { $set: { readAt: new Date() } },
  );
  res.status(204).end();
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  res.status(204).end();
});
