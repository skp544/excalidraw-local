import mongoose from 'mongoose';

/**
 * Local-first notifications. Even though this is single-user today,
 * having a notification stream makes it easy to surface autosave
 * recoveries, export-completed events, and future collaboration pings.
 */
const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, maxlength: 160 },
    body: { type: String, default: '', maxlength: 600 },
    icon: { type: String, default: null },
    href: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

NotificationSchema.methods.toJSONResponse = function toJSONResponse() {
  return {
    id: this._id.toString(),
    title: this.title,
    body: this.body,
    icon: this.icon,
    href: this.href,
    isRead: Boolean(this.readAt),
    createdAt: this.createdAt,
  };
};

export const Notification = mongoose.model('Notification', NotificationSchema);
