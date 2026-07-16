import { getAuth } from '@clerk/express';

export const requireAuth = (req, res, next) => {

  // Extract authentication state injected by clerkMiddleware
  // const { userId } = getAuth(req);
  const auth = getAuth(req);

  const { userId } = auth;

  if (!userId) {
    return res.status(401).json({ 
      error: 'Unauthenticated request. Please log in to gain access.' 
    });
  }

  // Inject the validated userId directly into the request for down-stream access
  req.userId = userId;
  next();
};