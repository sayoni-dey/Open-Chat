import { groq } from '../config/groq.js';
import { redis } from '../config/redis.js';
import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';

export const handleChatStream = async (req, res) => {
  const { prompt, chatId } = req.body;
  const userId = req.auth?.userId; // Injected by Clerk middleware if logged in

  // ----------------------------------------------------
  // PART 1: ANONYMOUS USER & RATE LIMITING (REDIS)
  // ----------------------------------------------------
  // if (!userId) {
  //   const ip = req.ip || req.headers['x-forwarded-for'];
  //   const redisKey = `rate_limit:${ip}`;

  //   // Increment request count by 1
  //   const currentRequests = await redis.incr(redisKey);

  //   // If it's the first request in the cycle, set expiration window (5 hours = 18000 seconds)
  //   if (currentRequests === 1) {
  //     await redis.expire(redisKey, 18000);
  //   }

  //   if (currentRequests > 5) {
  //     return res.status(429).json({
  //       success: false,
  //       message: "Rate limit exceeded. Please sign in to unlock unlimited chatting!",
  //     });
  //   }
  // }

  // ----------------------------------------------------
  // PART 2: CONVERSATION HISTORY & ENGINE RETRIEVAL
  // ----------------------------------------------------
  let activeChatId = chatId;
  let conversationHistory = [];

  // If authenticated and continuing a chat session, compile past contexts
  if (userId && activeChatId) {
    const pastMessages = await Message.find({ chatId: activeChatId }).sort({ createdAt: 1 });
    conversationHistory = pastMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));
  }

  // Push the current user prompt into the Groq array structure
  conversationHistory.push({ role: 'user', content: prompt });

  // If authenticated, dynamically write the user's incoming message to MongoDB
  if (userId) {
    if (!activeChatId) {
      // Establish a fresh parent chat entry if starting from scratch
      const newChat = await Chat.create({ userId, title: prompt.substring(0, 30) });
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

    // After the stream wraps up, write the final assistant message to MongoDB if authenticated
    if (userId && activeChatId) {
      await Message.create({ chatId: activeChatId, sender: 'assistant', text: completeAiResponse });
    }

    // Inform the client that streaming is complete
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
    const userId = req.auth?.userId;
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