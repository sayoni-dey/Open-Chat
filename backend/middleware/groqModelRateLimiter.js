// middlewares/groqModelRateLimiter.js
import { redis } from "../config/redis.js";


//Estimates input tokens for the incoming request (1 token ≈ 4 chars + file estimates).

const estimateTokens = (req) => {
  const text = req.body?.messageText || req.body?.prompt || "";
  const textTokens = Math.ceil(text.length / 4);

  // Add buffer tokens for uploaded attachments/PDFs
  const filesCount = req.files?.length || (req.file ? 1 : 0);
  const fileTokens = filesCount * 1000;

  return Math.max(textTokens + fileTokens, 50); // Minimum baseline of 50 tokens
};


// Middleware factory enforcing Groq RPM, RPD, TPM, and TPD limits using Redis.

export const groqModelRateLimiter = (limits) => {
  const { modelName, rpm, rpd, tpm, tpd } = limits;

  return async (req, res, next) => {
    try {
      const now = Date.now();
      const currentMinuteKey = `groq:${modelName}:min:${Math.floor(now / 60000)}`;
      const currentDayKey = `groq:${modelName}:day:${Math.floor(now / 86400000)}`;

      const estimatedTokens = estimateTokens(req);

      // Retrieve active counts from Redis
      const [reqMin, reqDay, tokMin, tokDay] = await Promise.all([
        redis.get(`${currentMinuteKey}:req`),
        redis.get(`${currentDayKey}:req`),
        redis.get(`${currentMinuteKey}:tok`),
        redis.get(`${currentDayKey}:tok`),
      ]);

      const currentReqMin = parseInt(reqMin || "0", 10);
      const currentReqDay = parseInt(reqDay || "0", 10);
      const currentTokMin = parseInt(tokMin || "0", 10);
      const currentTokDay = parseInt(tokDay || "0", 10);

      // 1. Check RPM (Requests Per Minute)
      if (rpm && currentReqMin >= rpm) {
        return res.status(429).json({
          error: "Groq Model Limit Exceeded (RPM)",
          message: `The model '${modelName}' has reached its request limit of ${rpm} RPM. Please try again shortly.`,
        });
      }

      // 2. Check RPD (Requests Per Day)
      if (rpd && currentReqDay >= rpd) {
        return res.status(429).json({
          error: "Groq Model Limit Exceeded (RPD)",
          message: `The model '${modelName}' has reached its daily limit of ${rpd} RPD. Please try again tomorrow.`,
        });
      }

      // 3. Check TPM (Tokens Per Minute)
      if (tpm && currentTokMin + estimatedTokens > tpm) {
        return res.status(429).json({
          error: "Groq Model Limit Exceeded (TPM)",
          message: `Token usage limit per minute exceeded for model '${modelName}'.`,
        });
      }

      // 4. Check TPD (Tokens Per Day)
      if (tpd && currentTokDay + estimatedTokens > tpd) {
        return res.status(429).json({
          error: "Groq Model Limit Exceeded (TPD)",
          message: `Daily token limit reached for model '${modelName}'.`,
        });
      }

      // Atomically update Redis counters for request and token windows
      const pipeline = redis.pipeline();

      pipeline.incr(`${currentMinuteKey}:req`);
      pipeline.expire(`${currentMinuteKey}:req`, 70); // TTL slightly > 1 min

      pipeline.incr(`${currentDayKey}:req`);
      pipeline.expire(`${currentDayKey}:req`, 90000); // TTL ~25 hrs

      pipeline.incrby(`${currentMinuteKey}:tok`, estimatedTokens);
      pipeline.expire(`${currentMinuteKey}:tok`, 70);

      pipeline.incrby(`${currentDayKey}:tok`, estimatedTokens);
      pipeline.expire(`${currentDayKey}:tok`, 90000);

      await pipeline.exec();

      next();
    } catch (error) {
      console.error("Groq Rate Limiter Error:", error);
      // Fail-open strategy to keep app functional if Redis fails
      next();
    }
  };
};