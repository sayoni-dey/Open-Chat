import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'New Chat', // You can auto-generate a 3-word title using Llama later!
  },
  userId: {
    type: String, // References the clerkId from the User model
    required: true,
    index: true,  // Indexed for fast lookups when loading a user's chat history sidebar
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", ChatSchema);
export default ChatSchema;