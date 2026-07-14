import { Webhook } from 'svix';
import User from '../models/User.js'; // Paths map to your Phase 1 Mongoose user schema [cite: 1064]

export const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Missing Clerk Webhook Secret verification setup." });
  }

  // Fetch svix verification cryptographic verification headers
  const headers = req.headers;
  const payload = req.body;

  const svix_id = headers["svix-id"];
  const svix_timestamp = headers["svix-timestamp"];
  const svix_signature = headers["svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing required signature verification headers." });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    // Unpack and cryptographically verify signature payload
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying clerk webhook payload signature details:", err.message);
    return res.status(400).json({ success: false, message: err.message });
  }

  const { id: clerkId } = evt.data;
  const eventType = evt.type;

  console.log(`Received Clerk Webhook Event Type: ${eventType} for User Identity ID: ${clerkId}`);

  try {
    // Trigger Sync Logic matching user behavior inside the modal pipeline [cite: 523]
    if (eventType === 'user.created') {
      const { email_addresses, first_name, last_name, image_url, username } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const fullName = `${first_name || ''} ${last_name || ''}`.trim();

      await User.create({
        clerkId,
        email,
        name: fullName || username || "New User",
        username: username || email?.split('@')[0],
        profilePicture: image_url
      });
      return res.status(201).json({ success: true, message: "User synced successfully." });
    }

    if (eventType === 'user.updated') {
      const { first_name, last_name, image_url, username, email_addresses } = evt.data;
      const fullName = `${first_name || ''} ${last_name || ''}`.trim();
      const email = email_addresses?.[0]?.email_address;

      // Dynamically locate user profile and mutate parameters smoothly [cite: 523, 1123]
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: clerkId },
        { 
          $set: {
            name: fullName || "Chat User",
            username: username || email?.split('@')[0],
            profilePicture: image_url
          }
        },
        { new: true, runValidators: true } // Return the fresh mutated document reference safely
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, message: "User not found in local MongoDB database record." });
      }

      console.log(`Successfully updated user data reference for: ${updatedUser.username}`);
      return res.status(200).json({ success: true, user: updatedUser });
    }

    if (eventType === 'user.deleted') {
      await User.findOneAndDelete({ clerkId });
      return res.status(200).json({ success: true, message: "User deleted cleanly from system models." });
    }

    res.status(200).json({ success: true, message: "Unhandled payload event safely ignored." });
  } catch (error) {
    console.error("Database tracking interaction failed during Clerk sync execution:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};