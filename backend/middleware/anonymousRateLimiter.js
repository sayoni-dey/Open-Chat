// middlewares/anonymousRateLimiter.js
import { redis } from "../config/redis.js"; // Your Upstash Redis client instance

export const anonymousRateLimiter = async (req, res, next) => {
  // If user is authenticated via Clerk, skip anonymous rate limiting
  const userId = req.auth?.userId;
  if (userId) {
    return next();
  }

  try {
    // Identify user by IP address
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip ||
      "anonymous_local";

    const redisKey = `rate_limit:anon:${ip}`;

    // Atomically increment request counter
    const currentRequests = await redis.incr(redisKey);

    // Set 5-hour TTL (18,000 seconds) on the first request in the window
    if (currentRequests === 1) {
      await redis.expire(redisKey, 18000);
    }

    // Block if threshold exceeded
    if (currentRequests > 5) {
      const ttl = await redis.ttl(redisKey);
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded for guest users. Please sign in to unlock unlimited chatting!",
        retryAfterSeconds: ttl > 0 ? ttl : 0,
      });
    }

    next();
  } catch (redisError) {
    console.error("Redis Anonymous Rate Limiting Error:", redisError);
    // Fail-open fallback: allow request through if Redis drops so app remains functional
    next();
  }
};