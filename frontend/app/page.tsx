'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserButton, SignInButton } from '@clerk/nextjs';
import { Plus, Search, Send, Square, MessageSquare, Bot, User } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatInput from './ChatInput';
// Explicit Type Interfaces for strict TypeScript enforcement
interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatHistoryItem {
  _id: string;
  title?: string;
  userId?: string;
  createdAt?: string;
}

interface StreamPayload {
  chatId?: string;
  text?: string;
}

export default function Home() {
  const { isLoaded, userId, getToken } = useAuth();
  
  // State variables configured with safe structural type initializers
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Typing DOM references and Native Abort Controllers
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const backendUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // Auto-scroll screen safely inspecting element references
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch past conversations for logged-in users
  useEffect(() => {
    if (isLoaded && userId) {
      fetchChatHistory();
    } else {
      setChatHistory([]);
    }
  }, [isLoaded, userId, chatId]);

  const fetchChatHistory = async (): Promise<void> => {
    try {
      const token = await getToken();
      const res = await fetch(`${backendUrl}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: ChatHistoryItem[] = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error("Error pulling history:", err);
    }
  };

  // Handle Input Changes with instant Search Syncing
  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchChatHistory();
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${backendUrl}/api/chat/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: ChatHistoryItem[] = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // Load old messages when clicking item in left history panel
  const loadChatSession = async (id: string): Promise<void> => {
    if (isGenerating) return;
    try {
      const token = await getToken();
      const res = await fetch(`${backendUrl}/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: { messages: Message[] } = await res.json();
        setChatId(id);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load active conversation:", err);
    }
  };

  // Reset local state variables to launch a fresh chat canvas
  const handleNewChat = (): void => {
    if (isGenerating) return;
    setChatId(null);
    setMessages([]);
    setInput('');
  };

  // Core Prompt Transmission and Server-Sent Events (SSE) Stream consumption
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
  e.preventDefault();
  if (!input.trim() || isGenerating) {
    console.log("Guard block triggered. input.trim():", !input.trim(), "isGenerating:", isGenerating);
    return;
  }

  const userPrompt: string = input;
  setInput('');
  setIsGenerating(true);

  setMessages(prev => [
    ...prev, 
    { sender: 'user', text: userPrompt },
    { sender: 'assistant', text: '' }
  ]);

  abortControllerRef.current = new AbortController();
  const requestUrl = `${backendUrl}/api/chat`;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userId) {
      const token = await getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log("Anonymous user session layout config initialized.");
    }

    const requestBody = { prompt: userPrompt, chatId: chatId || null };
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: abortControllerRef.current.signal
    });

    if (response.status === 429) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'assistant', text: 'Rate limit reached.' };
        return updated;
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`Server returned unhealthy status: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No readable stream channel found");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let completeResponse = '';
    let buffer = '';
    let chunkCounter = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      chunkCounter++;
      const rawString = decoder.decode(value, { stream: true });

      buffer += rawString;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const cleanedLine = line.trim();
        if (!cleanedLine) continue;

        if (cleanedLine.startsWith('data: ')) {
          const content = cleanedLine.replace('data: ', '').trim();
          
          if (content === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(content);
            if (parsed.chatId && !chatId) {
              setChatId(parsed.chatId);
            }
            if (parsed.chunk) {
              completeResponse += parsed.chunk;
            }
          } catch (e) {
            completeResponse += content;
          }

          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { sender: 'assistant', text: completeResponse };
            return updated;
          });
        }
      }
    }

  } catch (err: unknown) {
    console.error('Caught execution crash inside handleSendMessage catch block:', err);
  } finally {
    setIsGenerating(false);
    abortControllerRef.current = null;
  }
};

  // Halt connection mid-way across HTTP sockets
  const handleStopGeneration = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden w-full">
      
      {/* LEFT SIDEBAR NAVBAR PANEL */}
      <Sidebar 
      userId={userId}
      isLoaded={isLoaded}
      chatId={chatId}
      chatHistory={chatHistory}
      searchQuery={searchQuery}
      isGenerating={isGenerating}
      handleNewChat={handleNewChat}
      handleSearch={handleSearch}
      loadChatSession={loadChatSession}
    />

      {/* MAIN CONSOLE INTERFACE SCREEN */}
      <main className="flex-1 flex flex-col h-full relative bg-[#212121]">
        
        {/* Top Right Header Access Button (Visible only when Anonymous) */}
        {!userId && (
          <header className="absolute top-4 right-4 z-10">
            <SignInButton mode="modal">
              <button className="bg-white text-black px-3.5 py-1.5 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-md">
                Sign In / Register
              </button>
            </SignInButton>
          </header>
        )}

        {/* Dynamic Chat Canvas Container Layout */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="p-3 bg-[#2f2f2f] rounded-full text-gray-400">
                <Bot size={32} />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">How can I assist your code pipeline today?</h1>
              <p className="text-xs text-gray-400">
                Powered by Groq's Llama-3.1-8b-instant architecture layer with Redis Token Bucket verification.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 pb-24">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex gap-4 p-4 rounded-xl text-sm ${
                    msg.sender === 'user' ? 'bg-[#2f2f2f] text-gray-100' : 'bg-transparent text-gray-300'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {msg.sender === 'user' ? (
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px]"><User size={12}/></div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px]"><Bot size={12}/></div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 whitespace-pre-wrap leading-relaxed">
                    {msg.text || (isGenerating && index === messages.length - 1 ? (
                      <span className="inline-block animate-pulse text-gray-500">▋ Reading response chunks...</span>
                    ) : '')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Newly modularized clean input dashboard layout bar */}
          <ChatInput 
            input={input}
            setInput={setInput}
            isGenerating={isGenerating}
            handleSendMessage={handleSendMessage}
            handleStopGeneration={handleStopGeneration}
          />
      </main>
    </div>
  );
}