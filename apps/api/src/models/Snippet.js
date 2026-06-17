import mongoose from 'mongoose';

const snippetSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  command: { type: String, required: true, trim: true, maxlength: 500 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  tags: [{ type: String, trim: true, maxlength: 50 }],
}, { timestamps: true });

export const Snippet = mongoose.model('Snippet', snippetSchema);
