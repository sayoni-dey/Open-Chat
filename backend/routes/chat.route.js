import express from 'express';
import { handleChatStream, getUserChatHistory, getChatMessages, searchChats } from '../controllers/chat.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js';
import multer from "multer";
import { groqModelRateLimiter } from "../middleware/groqModelRateLimiter.js"
import {handleMultimodalChat, handlePDFSummary} from '../controllers/multimodalInput.controller.js';
import {
  optionalAuth,
  anonymousRateLimiter
} from "../middleware/authAndRateLimit.js";

const router = express.Router();

// Configured Groq limits per model
const LLAMA_INSTANT_LIMITS = {
  modelName: "llama-3.1-8b-instant",
  rpm: 30,        // 30 Requests Per Minute
  rpd: 14400,     // 14,400 Requests Per Day
  tpm: 6000,      // 6,000 Tokens Per Minute
  tpd: 500000,    // 500,000 Tokens Per Day
};

const QWEN_VISION_LIMITS = {
  modelName: "qwen/qwen3.6-27b",
  rpm: 10,        // 10 Requests Per Minute
  rpd: 1000,      // 1,000 Requests Per Day
  tpm: 4000,      // 4,000 Tokens Per Minute
  tpd: 100000,    // 100,000 Tokens Per Day
};

// Hybrid execution route (Handles rate limits for guests and streaming logs for accounts)
router.post('/prompt',
  // optionalAuth,
  // anonymousRateLimiter,
  requireAuth,
  groqModelRateLimiter(LLAMA_INSTANT_LIMITS), 
  handleChatStream);



// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB buffer limit
});

//Implements Multi-Modal Inputs and a separate pdf-summarizing feature
router.post("/multimodal",
  optionalAuth,
  anonymousRateLimiter,
  groqModelRateLimiter(QWEN_VISION_LIMITS), 
  upload.array("files", 5),
  handleMultimodalChat);

router.post("/summarize-pdf", requireAuth,
  // anonymousRateLimiter,
  groqModelRateLimiter(QWEN_VISION_LIMITS),
   upload.single("pdf"),
   handlePDFSummary);



// History management routes protected strictly via Clerk token inspection
router.get('/history', requireAuth, getUserChatHistory);
router.get('/history/:chatId',requireAuth, getChatMessages);



//Specific Search Endpoint (MUST go before any /:id or catch-all routes)
router.get('/search',requireAuth, searchChats);

export default router;
