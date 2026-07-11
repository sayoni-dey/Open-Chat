// import express from 'express';
// import { Webhook } from 'svix';
// import User from '../models/user.model.js';

// const router = express.Router();

// router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
//   const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

//   if (!WEBHOOK_SECRET) {
//     console.error('Missing CLERK_WEBHOOK_SECRET environment variable.');
//     return res.status(500).json({ error: 'Webhook secret not configured on server.' });
//   }

//   // Get the SVIX cryptographic verification headers
//   const svix_id = req.headers['svix-id'];
//   const svix_timestamp = req.headers['svix-timestamp'];
//   const svix_signature = req.headers['svix-signature'];

//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return res.status(400).json({ error: 'Missing missing svix headers' });
//   }

//   const payload = req.body.toString();
//   const wh = new Webhook(WEBHOOK_SECRET);

//   let evt;

//   // Verify that the payload came legitimately from Clerk's servers
//   try {
//     evt = wh.verify(payload, {
//       'svix-id': svix_id,
//       'svix-timestamp': svix_timestamp,
//       'svix-signature': svix_signature,
//     });
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err.message);
//     return res.status(400).json({ error: 'Invalid webhook signature verification' });
//   }

//   // Handle the specific event type
//   const { type } = evt;
  
//   if (type === 'user.created') {
//     const { id, email_addresses, first_name, last_name } = evt.data;
//     const email = email_addresses?.[0]?.email_address;
//     const name = `${first_name || ''} ${last_name || ''}`.trim();

//     try {
//       // Upsert/Create user document using our SQL-normalized user structure
//       const newUser = await User.findOneAndUpdate(
//         { clerkId: id },
//         { clerkId: id, email, name },
//         { upsert: true, new: true }
//       );
//       console.log(`👤 User synced successfully from Clerk to MongoDB: ${newUser.email}`);
//     } catch (dbError) {
//       console.error('Error saving user to database:', dbError.message);
//       return res.status(500).json({ error: 'Database saving error' });
//     }
//   }

//   // Always acknowledge receipt to Clerk with a 200 OK status
//   res.status(200).json({ success: true, message: 'Webhook processed successfully' });
// });

// export default router;

import express from 'express';
import { Webhook } from 'svix';
import User from '../models/user.model.js';

const router = express.Router();

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET environment variable.');
    return res.status(500).json({ error: 'Webhook secret not configured on server.' });
  }

  // --- COMMENTED OUT FOR PHASE A TESTING ---
  // const svix_id = req.headers['svix-id'];
  // const svix_timestamp = req.headers['svix-timestamp'];
  // const svix_signature = req.headers['svix-signature'];

  // if (!svix_id || !svix_timestamp || !svix_signature) {
  //   return res.status(400).json({ error: 'Missing missing svix headers' });
  // }
  // ------------------------------------------

  const payload = req.body.toString();
  
  // FOR PHASE A: Parse the raw string into a readable object directly
  let evt;
  try {
    evt = JSON.parse(payload);
  } catch (parseErr) {
    return res.status(400).json({ error: 'Invalid JSON payload structure' });
  }

  // Handle the specific event type
  const { type } = evt;
  
  if (type === 'user.created') {
    // Note: Clerk nests the user details inside 'data'
    const { id, email_addresses, first_name, last_name } = evt.data || {};
    const email = email_addresses?.[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      const newUser = await User.findOneAndUpdate(
        { clerkId: id },
        { clerkId: id, email, name },
        { upsert: true, new: true }
      );
      console.log(`User synced successfully from Clerk to MongoDB: ${newUser.email}`);
    } catch (dbError) {
      console.error('Error saving user to database:', dbError.message);
      return res.status(500).json({ error: 'Database saving error' });
    }
  }

  res.status(200).json({ success: true, message: 'Webhook processed successfully' });
});

export default router;