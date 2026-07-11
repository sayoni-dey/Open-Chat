import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true, 
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

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;