import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true, // Used to link with Clerk's authentication identifier
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("User", UserSchema);

export default UserSchema;