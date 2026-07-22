import { getAuth } from "@clerk/express";
import {redis} from "../config/redis.js";

/**
 * 1. Optional Auth Middleware
 * Attaches user authentication context without throwing 401 for anonymous users.
 */
export const optionalAuth = (req, res, next) => {
  try {
    const auth = getAuth(req);
    req.auth = auth;
    next();
  } catch (error) {
    req.auth = { userId: null };
    next();
  }
};

/**
 * 2. Anonymous Rate Limiter Middleware
 * Only enforces limits if the user is unauthenticated (guest).
 * Limit: 5 requests / 5 hours (18,000 seconds) per IP address in Upstash Redis.
 */
export const anonymousRateLimiter = async (req, res, next) => {
  // If user is logged in via Clerk, skip anonymous rate limiting
  if (req.auth && req.auth.userId) {
    console.log('User Authenticated');
    return next();
  }
  console.log('Anonymous User');
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  const redisKey = `ratelimit:anon:${clientIp}`;

  try {
    const requests = await redis.incr(redisKey);

    if (requests === 1) {
      // Set TTL on first request (5 hours)
      await redis.expire(redisKey, 18000);
    }

    if (requests > 5) {
      const ttl = await redis.ttl(redisKey);
      return res.status(429).json({
        success: false,
        error: "Too many requests. Anonymous limit is 5 requests per 5 hours. Please sign in or try again later.",
        retryAfterSeconds: ttl,
      });
    }

    next();
  } catch (error) {
    console.error("Redis Anonymous Rate Limiter Error:", error);
    // Fallback gracefully on cache failure to prevent blocking users
    next();
  }
};

/**
 * 3. Groq Model Rate Limiter Middleware (RPM & Prompt Token Estimation)
 */
export const groqRateLimiter = (options = { rpm: 30, tpm: 144000 }) => {
  return async (req, res, next) => {
    const identifier = req.auth?.userId || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const minuteKey = `ratelimit:groq:rpm:${identifier}:${Math.floor(Date.now() / 60000)}`;

    try {
      const currentRpm = await redis.incr(minuteKey);
      if (currentRpm === 1) {
        await redis.expire(minuteKey, 60);
      }

      if (currentRpm > options.rpm) {
        return res.status(429).json({
          success: false,
          error: "Model rate limit exceeded (Requests Per Minute). Please slow down.",
        });
      }

      next();
    } catch (error) {
      console.error("Groq Rate Limiter Error:", error);
      next();
    }
  };
};