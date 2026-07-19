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
    attachments: [
    {
      fileName: String,
      fileType: String, // e.g., 'image/png', 'application/pdf'
      fileUrl: String,  // Local upload path (or S3 URL when migrating)
    }]

  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

export default mongoose.model('Message', MessageSchema);