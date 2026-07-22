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
    text : {
      type: String,
      required: true
    },
    // attachments: [
    // {
    //   fileName: String,
    //   fileType: String, // e.g., 'image/png', 'application/pdf'
    //   fileUrl: String,  // Local upload path (or S3 URL when migrating)
    // }]
    attachments: [
  {
    type: {
      type: String,
      enum: ["image", "file"],
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },
  },
]

  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

export default mongoose.model('Message', MessageSchema);