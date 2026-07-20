///controller/multimodalInput.controller.js
import { groq } from "../config/groq.js";
import { Message } from "../models/Message.js"; // [cite: 534, 1218]
import { PDFParse } from 'pdf-parse';

// Allowed image mime types for Vision model
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file limit
const MAX_FILE_COUNT = 5;

/**
 * Utility: Sends SSE errors safely based on whether headers have already been sent.
 */
const sendError = (res, statusCode, message) => {
  if (res.headersSent) {
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    res.end();
  } else {
    res.status(statusCode).json({ error: message });
  }
};

/**
 * Utility: Chunks raw PDF text into overlapping character blocks to avoid LLM context overflow.
 */
const chunkText = (text, chunkSize = 12000, overlap = 1000) => {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += chunkSize - overlap;
  }
  return chunks;
};

// ============================================================================
// FEATURE 1: MULTIMODAL IN-CHAT FLOW (Text + Images + Context Memory)
// ============================================================================
// export const handleMultimodalChat = async (req, res) => {
//   const abortController = new AbortController();

//   // Issue #7: Abort ongoing Groq request if the client disconnects prematurely
//   req.on("close", () => {
//     if (!res.writableEnded) {
//       abortController.abort();
//       console.log("Client disconnected from multimodal chat stream.");
//     }
//   });

//   try {
//     const { chatId, messageText } = req.body;
//     const files = req.files || [];

//     if (!chatId) {
//       return sendError(res, 400, "chatId is required.");
//     }

//     // Issue #3: Strict File Validation
//     if (files.length > MAX_FILE_COUNT) {
//       return sendError(res, 400, `Maximum ${MAX_FILE_COUNT} attachments permitted per message.`);
//     }

//     for (const file of files) {
//       if (file.size > MAX_FILE_SIZE_BYTES) {
//         return sendError(res, 400, `File '${file.originalname}' exceeds maximum allowed size of 10MB.`);
//       }
//       if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
//         return sendError(res, 400, `File type '${file.mimetype}' is not supported. Only JPEG, PNG, WEBP, and GIF are allowed.`);
//       }
//     }

//     // Construct user content payload for Groq Vision API
//     const userContentPayload = [];
//     if (messageText && messageText.trim()) {
//       userContentPayload.push({ type: "text", text: messageText.trim() });
//     }

//     files.forEach((file) => {
//       const base64Image = file.buffer.toString("base64");
//       userContentPayload.push({
//         type: "image_url",
//         image_url: { url: `data:${file.mimetype};base64,${base64Image}` },
//       });
//     });

//     if (userContentPayload.length === 0) {
//       return sendError(res, 400, "Cannot send an empty message without attachments.");
//     }

//     // Issue #1: Fetch Chat History from MongoDB
//     const previousMessages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean(); // [cite: 539]

//     // Format previous messages for Groq completion payload
//     const conversationHistory = previousMessages.map((msg) => ({
//       role: msg.role,
//       content: msg.content,
//     }));

//     // Append current multimodal prompt
//     const messagesPayload = [
//       ...conversationHistory,
//       { role: "user", content: userContentPayload },
//     ];

//     // Issue #2: Save User Message with Production Metadata
//     const attachmentsMetadata = files.map((f) => ({
//       fileName: f.originalname,
//       fileType: f.mimetype,
//       fileSize: f.size,
//       storageUrl: null, // Populate if storing files in cloud storage like AWS S3 or Cloudinary
//     }));

//     await Message.create({
//       chatId,
//       role: "user",
//       content: messageText || "",
//       attachments: attachmentsMetadata,
//     });

//     // Issue #5: Consistent SSE Headers and Header Flushing
//     res.setHeader("Content-Type", "text/event-stream");
//     res.setHeader("Cache-Control", "no-cache");
//     res.setHeader("Connection", "keep-alive");
//     res.flushHeaders?.();

//     // Query Groq Multimodal Vision Endpoint
//     const stream = await groq.chat.completions.create(
//       {
//         model: "qwen/qwen3.6-27b",
//         messages: messagesPayload,
//         stream: true,
//       },
//       { signal: abortController.signal }
//     );

//     let completeAssistantResponse = "";

//     for await (const chunk of stream) {
//       const textChunk = chunk.choices[0]?.delta?.content || "";
//       completeAssistantResponse += textChunk;
//       res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
//     }

//     // Save Assistant Response to MongoDB
//     await Message.create({
//       chatId,
//       role: "assistant",
//       content: completeAssistantResponse,
//     });

//     res.write("data: [DONE]\n\n");
//     res.end();
//   } catch (error) {
//     if (error.name === "AbortError") {
//       console.log("Groq request aborted successfully.");
//       return;
//     }
//     console.error("Multimodal routing error:", error);
//     // Issue #6: Consistent SSE Error Handling
//     sendError(res, 500, error.message || "An unexpected streaming error occurred.");
//   }
// };

import Groq from "groq-sdk";
import { v2 as cloudinary } from "cloudinary";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import redis from "../config/redis.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Guardrail Constants
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file limit
const MAX_FILE_COUNT = 5;
const MAX_CONTEXT_MESSAGES = 20; // Replays the last 20 messages (~10 user-assistant turns)

/**
 * Utility: Uploads a buffer to Cloudinary using a Stream.
 */
const uploadToCloudinary = (fileBuffer, mimeType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chatbot_attachments",
        resource_type: mimeType.startsWith("image/") ? "image" : "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * SSE Error Helper (Adheres strictly to standard SSE formatting)
 */
const sendSSEError = (res, errorMessage, statusCode = 500) => {
  if (!res.headersSent) {
    res.status(statusCode).setHeader("Content-Type", "text/event-stream");
  }
  res.write(`event: error\n`);
  res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
  res.end();
};

export const handleMultimodalChat = async (req, res) => {
  const abortController = new AbortController();

  // Abort ongoing Groq generation on client disconnection
  req.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
      console.log("Client disconnected from multimodal stream.");
    }
  });

  try {
    const { chatId: inputChatId, messageText } = req.body;
    const userId = req.auth?.userId || null;
    const files = req.files || [];

    // --- STEP 1: INPUT VALIDATION & GUARDRAILS ---
    if (!messageText?.trim() && files.length === 0) {
      return res.status(400).json({ error: "Message text or an attachment is required." });
    }

    if (files.length > MAX_FILE_COUNT) {
      return res.status(400).json({
        error: `Maximum ${MAX_FILE_COUNT} attachments permitted per message.`,
      });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return res.status(400).json({
          error: `File '${file.originalname}' exceeds the 10MB limit.`,
        });
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          error: `File type '${file.mimetype}' is not supported. Only JPEG, PNG, WEBP, and GIF are allowed.`,
        });
      }
    }

    // --- STEP 2: CLOUD STORAGE UPLOAD ---
    // Upload files to Cloudinary and return secure hosted URLs
    const uploadedAttachments = await Promise.all(
      files.map(async (file) => {
        const secureUrl = await uploadToCloudinary(file.buffer, file.mimetype);
        return {
          type: file.mimetype.startsWith("image/") ? "image" : "file",
          url: secureUrl,
          mimeType: file.mimetype,
          fileName: file.originalname,
          fileSize: file.size,
        };
      })
    );

    // --- STEP 3: ENSURE / CREATE CHAT SESSION ---
    let activeChatId = inputChatId;
    if (!activeChatId) {
      const newChat = await Chat.create({
        userId,
        title: messageText ? messageText.substring(0, 30) : "Multimodal Conversation",
      });
      activeChatId = newChat._id;
    }

    // --- STEP 4: PERSIST USER MESSAGE FIRST (SINGLE SOURCE OF TRUTH) ---
    await Message.create({
      chatId: activeChatId,
      role: "user",
      content: messageText || "",
      attachments: uploadedAttachments,
    });

    // --- STEP 5: REBUILD SLIDING CONVERSATION HISTORY FROM MONGO DB ---
  // Fetch only the most recent N messages in reverse-chronological order, then reverse back
  const recentDbMessages = await Message.find({ chatId: activeChatId })
    .sort({ createdAt: -1 })
    .limit(MAX_CONTEXT_MESSAGES)
    .lean();

  // Reverse array so messages are in chronological order (Oldest -> Newest) for the LLM payload
  const dbMessages = recentDbMessages.reverse();

  // Construct LLM payload from the truncated message context window
  const llmPayloadMessages = dbMessages.map((msg) => {
    if (msg.role === "user" && msg.attachments && msg.attachments.length > 0) {
      const contentArray = [];

      if (msg.content) {
        contentArray.push({ type: "text", text: msg.content });
      }

      msg.attachments.forEach((att) => {
        if (att.type === "image" && att.url) {
          contentArray.push({
            type: "image_url",
            image_url: { url: att.url },
          });
        }
      });

      return {
        role: msg.role,
        content: contentArray,
      };
    }

    return {
      role: msg.role,
      content: msg.content,
    };
  });

    // --- STEP 6: INITIALIZE SSE CONNECTION ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // --- STEP 7: EXECUTE GROQ LLM STREAMING REQUEST ---
    const stream = await groq.chat.completions.create(
      {
        model: "llama-3.2-11b-vision-preview",
        messages: llmPayloadMessages,
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal: abortController.signal }
    );

    let assistantResponseText = "";
    let completionTokensUsed = 0;

    for await (const chunk of stream) {
      const deltaText = chunk.choices[0]?.delta?.content || "";
      assistantResponseText += deltaText;

      if (chunk.usage?.completion_tokens) {
        completionTokensUsed = chunk.usage.completion_tokens;
      }

      if (deltaText) {
        res.write(`data: ${JSON.stringify({ chunk: deltaText, chatId: activeChatId })}\n\n`);
      }
    }

    // --- STEP 8: SAVE ASSISTANT RESPONSE TO MONGO DB ---
    await Message.create({
      chatId: activeChatId,
      role: "assistant",
      content: assistantResponseText,
    });

    // --- STEP 9: UPDATE REDIS RATE LIMIT TRACKER POST-STREAM ---
    if (completionTokensUsed > 0) {
      const identifier = userId || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const minuteKey = Math.floor(Date.now() / 60000);
      const tokenKey = `ratelimit:groq:tpm:${identifier}:${minuteKey}`;

      await redis.incrby(tokenKey, completionTokensUsed).catch((err) =>
        console.error("Failed to update token usage in Redis:", err)
      );
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Groq request aborted cleanly upon client disconnection.");
      return;
    }
    console.error("Multimodal Stream Controller Error:", error);
    return sendSSEError(res, error.message || "An unexpected error occurred during processing.");
  }
};

// ============================================================================
// FEATURE 2: ISOLATED PDF SUMMARIZER ROUTE (Map-Reduce Summarization)
// ============================================================================
export const handlePDFSummary = async (req, res) => {
  const abortController = new AbortController();

  // Issue #7: Abort ongoing Groq request if client disconnects mid-summarization
  req.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
      console.log("Client disconnected from PDF summarization stream.");
    }
  });

  try {
    // Issue #3: File Validation for PDF
    if (!req.file) {
      return sendError(res, 400, "No PDF file attached.");
    }

    if (req.file.mimetype !== "application/pdf") {
      return sendError(res, 400, "Invalid file format. Only PDF files are supported.");
    }

    if (req.file.size > 20 * 1024 * 1024) { // 20 MB max limit for PDFs
      return sendError(res, 400, "PDF file exceeds maximum allowed size of 20MB.");
    }

    // Parse text fragments from RAM buffer
    const pdfData = await PDFParse(req.file.buffer);
    const extractedText = pdfData.text ? pdfData.text.trim() : "";

    if (!extractedText) {
      return sendError(res, 400, "Could not extract readable text strings from this PDF.");
    }

    // Issue #5: Consistent SSE Headers & Headers Flushing
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Issue #4: Large PDF Handling (Text Chunking / Map-Reduce)
    const chunks = chunkText(extractedText);
    let intermediateSummaries = [];

    if (chunks.length > 1) {
      // Step A: Summarize individual chunks (Map phase)
      for (let i = 0; i < chunks.length; i++) {
        const chunkCompletion = await groq.chat.completions.create(
          {
            model: "qwen/qwen3.6-27b",
            messages: [
              {
                role: "system",
                content: "Summarize this portion of a document concisely, preserving key metrics, facts, and actionable points.",
              },
              { role: "user", content: chunks[i] },
            ],
          },
          { signal: abortController.signal }
        );

        const summaryChunk = chunkCompletion.choices[0]?.message?.content || "";
        intermediateSummaries.push(summaryChunk);
      }
    } else {
      intermediateSummaries.push(extractedText);
    }

    const consolidatedText = intermediateSummaries.join("\n\n--- Chunk Summary ---\n\n");

    // Issue #8: Structured System Prompt
    const systemPrompt = `You are an expert research analyzer and executive document summarizer. 
Your task is to analyze the provided text and produce a structured, professional executive summary. 

Format your output in clean Markdown using the following structure:
1. ## Executive Summary
   - A high-level overview of the document's core objective and conclusions.
2. ## Key Topics & Themes
   - Bulleted list of main subjects covered.
3. ## Important Findings & Metrics
   - Bulleted list of essential data points, findings, facts, or key statistics.
4. ## Action Items & Next Steps
   - Strategic takeaways or actionable recommendations (if applicable).
5. ## Conclusion
   - Brief closing summary.`;

    // Step B: Final Streaming Aggregation (Reduce phase)
    const stream = await groq.chat.completions.create(
      {
        model: "qwen/qwen3.6-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Document Title: ${req.file.originalname}\n\nContent:\n${consolidatedText}` },
        ],
        stream: true,
      },
      { signal: abortController.signal }
    );

    for await (const chunk of stream) {
      const textChunk = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("PDF summarization Groq request aborted successfully.");
      return;
    }
    console.error("PDF Summarizer Failure:", error);
    // Issue #6: Consistent Error Handling
    sendError(res, 500, "Processing failed while reading or summarizing the PDF.");
  }
};