import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true, // Speeds up context generation when scrolling history
    },
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

export default mongoose.model('Message', MessageSchema);