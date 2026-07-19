import { groq } from '../config/groq.js';
import { redis } from '../config/redis.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { PDFParse } from 'pdf-parse';

export const handleChatStream = async (req, res) => {
  const { prompt, chatId } = req.body;
  const userId = req.userId; // Injected by Clerk middleware if logged in
  if(!userId){
    console.log(`No user id present`);
  }
  // ----------------------------------------------------
  // PART 1: ANONYMOUS USER & RATE LIMITING (REDIS)
  // ----------------------------------------------------
  // if (!userId) {
  //   try {
  //     const ip = req.ip || req.headers['x-forwarded-for'] || 'anonymous_local';
  //     const redisKey = `rate_limit:${ip}`;

  //     // Increment request count by 1
  //     const currentRequests = await redis.incr(redisKey);

  //     // If it's the first request in the cycle, set expiration window (5 hours = 18000 seconds)
  //     if (currentRequests === 1) {
  //       await redis.expire(redisKey, 18000);
  //     }

  //     if (currentRequests > 5) {
  //       return res.status(429).json({
  //         success: false,
  //         message: "Rate limit exceeded. Please sign in to unlock unlimited chatting!",
  //       });
  //     }
  //   } catch (redisError) {
  //     console.error("Redis Rate Limiting Error:", redisError);
  //     // Fallback: Optional fail-open strategy if Redis fails during local debugging
  //   }
  // }

  // ----------------------------------------------------
  // PART 2: CONVERSATION HISTORY & MODEL MATERIALIZATION
  // ----------------------------------------------------
  let activeChatId = chatId;
  let conversationHistory = [];
  let isNewChat = false;

  // If authenticated and continuing a chat session, compile past contexts
  if (userId && activeChatId) {
    const pastMessages = await Message.find({ chatId: activeChatId }).sort({ createdAt: 1 });
    conversationHistory = pastMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
  }

  // Push the current user prompt into the historical payload stack for the engine
  conversationHistory.push({ role: 'user', content: prompt });

  // If authenticated, track and record user inputs into MongoDB
  if (userId) {
    if (!activeChatId) {
      isNewChat = true;
      // Establish a fresh parent chat entry with a temporary placeholder title
      const newChat = await Chat.create({ 
        userId, 
        title: "New Conversation..." 
      });
      activeChatId = newChat._id;
    }
    await Message.create({ chatId: activeChatId, sender: 'user', text: prompt });
  }

  // ----------------------------------------------------
  // PART 3: GROQ API STREAMING (SERVER-SENT EVENTS)
  // ----------------------------------------------------
  try {
    // Standardize HTTP Headers for Real-Time SSE Text Streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a helpful, elite AI assistant clone.' },
        ...conversationHistory
      ],
      stream: true,
    });

    let completeAiResponse = "";

    for await (const chunk of stream) {
      const textChunk = chunk.choices[0]?.delta?.content || "";
      completeAiResponse += textChunk;
      
      // SSE requires wrapping chunks in a data: prefix ending with two newlines
      res.write(`data: ${JSON.stringify({ chunk: textChunk, chatId: activeChatId })}\n\n`);
    }

    // After the token stream wraps up, write the final assistant response text block to MongoDB
    if (userId && activeChatId) {
      await Message.create({ chatId: activeChatId, sender: 'assistant', text: completeAiResponse });

      // ----------------------------------------------------
      // PART 4: ASYNCHRONOUS BACKGROUND TITLE GENERATION
      // ----------------------------------------------------
      if (isNewChat) {
        // Run in background completely out of the critical streaming path
        Promise.resolve().then(async () => {
          try {
            const titleGenResponse = await groq.chat.completions.create({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: "Summarize the user request into a clean 3 to 5-word title. Return ONLY the title text. Do not add quotes, introductory phrases, or trailing punctuation marks."
                },
                { role: "user", content: prompt }
              ]
            });

            const cleanTitle = titleGenResponse.choices[0]?.message?.content?.trim() || "New Chat";
            // Persist the summarized title into the corresponding session record
            await Chat.findByIdAndUpdate(activeChatId, { title: cleanTitle });
          } catch (err) {
            console.error("Background auto-title creation failed:", err);
          }
        });
      }
    }

    // Inform the client that streaming context has ended cleanly
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error("Groq Stream Error:", error);
    res.write(`data: ${JSON.stringify({ error: "Stream transmission failed." })}\n\n`);
    res.end();
  }
};


export const searchChats = async (req, res) => {
  try {
    // const userId = req.auth?.userId;
    const userId = req.userId;
    const { q } = req.query; // Expecting /api/chat/search?q=your_search_term

    // 1. Guard check: Must be authenticated to search history
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized. Please log in to search your history." 
      });
    }

    // 2. Return empty array if query parameter is missing or blank
    if (!q || q.trim() === "") {
      return res.status(200).json({ success: true, data: [] });
    }

    // 3. Execute fuzzy text search on chat titles matching the user's ID
    const results = await Chat.find({
      userId: userId,
      title: { $regex: q.trim(), $options: 'i' } // 'i' flag ensures case-insensitive search
    }).sort({ updatedAt: -1 }); // Keep newest conversations at the top

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error during search query processing." 
    });
  }
};

// 1. GET ALL CHATS FOR A USER (Sidebar History List)
export const getUserChatHistory = async (req, res) => {
  try {
    const userId = req.userId; // Retrieved from Clerk authentication middleware
    if (!userId) {
      console.log("User Id detected to be null");
      return res.status(401).json({ error: "Unauthorized access." });
    }

    // Fetch conversations sorted by newest update first
    const chats = await Chat.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chat list:", error);
    return res.status(500).json({ error: "Server error fetching history." });
  }
};

// 2. GET ALL SEQUENTIAL MESSAGES FOR A SINGLE CHAT SESSION
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Verification check: ensure the chat session belongs to the requesting Clerk user
    const chatSession = await Chat.findOne({ _id: chatId, userId });
    if (!chatSession) {
      return res.status(404).json({ error: "Conversation session not found." });
    }

    // Fetch individual sequential messages using the chatId foreign key index
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error loading chat window data:", error);
    return res.status(500).json({ error: "Server error parsing messages." });
  }
};



 //FEATURE 1: MULTIMODAL IN-CHAT FLOW (Text + Images)
 
export const handleMultimodalChat = async (req, res) => {
  try {
    const { chatId, messageText } = req.body;
    const files = req.files || [];

    // Construct the payload structure required by Groq's Vision endpoints
    const contentPayload = [{ type: "text", text: messageText }];

    // Inject base64 images into payload if attached
    files.forEach((file) => {
      if (file.mimetype.startsWith("image/")) {
        const base64Image = file.buffer.toString("base64");
        contentPayload.push({
          type: "image_url",
          image_url: { url: `data:${file.mimetype};base64,${base64Image}` },
        });
      }
    });

    // 1. Save user's message metadata to MongoDB
    await Message.create({
      chatId,
      role: "user",
      content: messageText,
      attachments: files.map(f => ({ fileName: f.originalname, fileType: f.mimetype, fileUrl: "inline-base64" }))
    });

    // Set Server-Sent Events headers for immediate streaming responses
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 2. Query Groq multimodal endpoint (using qwen/qwen3.6-27b for vision analysis)
    const stream = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b",
      messages: [{ role: "user", content: contentPayload }],
      stream: true,
    });

    let completeAssistantResponse = "";
    for await (const chunk of stream) {
      const textChunk = chunk.choices[0]?.delta?.content || "";
      completeAssistantResponse += textChunk;
      res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
    }

    // 3. Commit assistant answer back to MongoDB history
    await Message.create({
      chatId,
      role: "assistant",
      content: completeAssistantResponse,
    });

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Multimodal routing error:", error);
    res.status(500).json({ error: error.message });
  }
};


 // FEATURE 2: ISOLATED PDF SUMMARIZER ROUTE
export const handlePDFSummary = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No PDF file attached." });

    // Parse text fragments directly from RAM buffer array
    const pdfData = await pdfParse(req.file.buffer);
    const extractedText = pdfData.text;

    if (!extractedText.trim()) {
      return res.status(400).json({ error: "Could not extract readable text strings from this PDF." });
    }

    // Set headers for smooth real-time response generation
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    // Send context block safely packed inside structural prompts
    const systemPrompt = "You are a professional research analyzer. Synthesize the provided document text into a comprehensive executive summary layout with clear markdown highlights, nested headers, and key actionable takeaways.";

    const stream = await groq.chat.completions.create({
      model: "qwen/qwen3.6-27b", // Utilize 131k context window limits safely
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Document Title: ${req.file.originalname}\n\nContent:\n${extractedText}` }
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const textChunk = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("PDF Summarizer Failure:", error);
    res.write(`data: ${JSON.stringify({ error: "Processing failed." })}\n\n`);
    res.end();
  }
};