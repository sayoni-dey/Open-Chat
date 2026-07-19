'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Bot, User } from 'lucide-react';
import Sidebar from './Sidebar/Sidebar';
import ChatInput from './ChatInput';
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
  _id?: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface ChatHistoryItem {
  _id: string;
  title?: string;
  userId?: string;
  createdAt?: string;
}

interface SearchResponse {
  success: boolean;
  count: number;
  data: ChatHistoryItem[];
}

export default function Home() {
  const { isLoaded, userId, getToken } = useAuth();
  
  // Single Unified Source of Truth for Session IDs
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyTrigger, setHistoryTrigger] = useState<number>(0);
  
  const [input, setInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // DOM References and Native Network Controllers
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const backendUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  // 1. Core History Fetch Hook
  const fetchChatHistory = async (): Promise<void> => {
    if (!userId) return;
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

  // Re-fetch conversation panels when trigger values or auth indexes cycle
  useEffect(() => {
    if (isLoaded && userId) {
      fetchChatHistory();
    } else {
      setChatHistory([]);
    }
  }, [isLoaded, userId, historyTrigger]);

  // 2. Fetch messages for active selected historical index sessions
  const loadChatSession = async (id: string): Promise<void> => {
    if (isGenerating || !id) return;
    try {
      const token = await getToken();
      const res = await fetch(`${backendUrl}/api/chat/history/${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatId(id);
        setMessages(data || []);
      }
    } catch (err) {
      console.error("Failed to load active conversation logs:", err);
    }
  };

  // Clean initialization configuration to reset application inputs
  const handleNewChat = (): void => {
    if (isGenerating) return;
    setChatId(null);
    setMessages([]);
    setInput('');
  };

  // Auto-scroll screen safely inspecting element references
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = async (query: string): Promise<void> => {
  setSearchQuery(query);

  if (!query.trim()) {
    fetchChatHistory();
    return;
  }

  try {
    const token = await getToken();

    const res = await fetch(
      `${backendUrl}/api/chat/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.ok) {
      const data: SearchResponse = await res.json();
      setChatHistory(data.data);
    }
  } catch (err) {
    console.error("Search error:", err);
  }
};

  // Core Prompt Transmission and Server-Sent Events (SSE) Stream consumption
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!input.trim()  && !attachedFile || isGenerating) return;

    const userPrompt: string = input;
    setInput('');
    setIsGenerating(true);
    setAttachedFile(null);

    setMessages(prev => [
      ...prev, 
      { sender: 'user', text: userPrompt },
      { sender: 'assistant', text: '' }
    ]);

    abortControllerRef.current = new AbortController();
    const requestUrl = `${backendUrl}/api/chat/prompt`; // Points cleanly to your refactored stream endpoint

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        const token = await getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
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
          updated[updated.length - 1] = { sender: 'assistant', text: 'Rate limit reached. Please sign in to unlock unlimited chats!' };
          return updated;
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No readable stream channel found");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let completeResponse = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (!cleanedLine) continue;

          if (cleanedLine.startsWith('data: ')) {
            const content = cleanedLine.replace('data: ', '').trim();
            
            if (content === '[DONE]') {
              // Increment history trigger on end of stream to auto-refresh sidebar history list and load title modifications
              setHistoryTrigger(prev => prev + 1);
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
      console.error('Crash inside handleSendMessage loop:', err);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

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
      <main className="flex-1 flex flex-col h-full relative bg-white dark:bg-[#171717] transition-colors">
        
        {/* Top Right Header Access Button (Visible only when Anonymous) */}
        {!userId && isLoaded && (
          <header className="absolute top-4 right-4 z-10">
            <Link href="/sign-in">
              <button className="bg-white text-black px-3.5 py-1.5 text-xs font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-md">
                Sign In
              </button>
            </Link>
          </header>
        )}
        

        {/* Dynamic Chat Canvas Container Layout */} 
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="p-3 bg-gray-200 dark:bg-[#2a2b2d] rounded-full text-gray-400">
                <Bot size={32} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Ask Me Anything</h1>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 pb-24">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
        
                return (
                <div 
                  key={index} 
                  className={`flex gap-4 p-4 rounded-xl text-sm w-full ${
                    isUser 
                      ? 'bg-gray-100 dark:bg-[#2a2b2d] text-gray-900 dark:text-gray-100 ml-auto max-w-[85%]' 
                      : 'bg-transparent text-gray-800 dark:text-gray-200 mr-auto max-w-full'
                  }`}
                >
                  {/* Avatar block */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isUser ? (
                      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white">
                        <User size={12}/>
                      </div>
                    ) : (
                    <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] text-white">
                      <Bot size={12}/>
                    </div>
                    )}
                  </div>

                  {/* Message Body Content Canvas */}
                  <div className="flex-1 min-w-0 overflow-hidden leading-relaxed">
                    {msg.text ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words
                      prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent
                      prose-code:text-orange-600 dark:prose-code:text-orange-400 
                      prose-code:bg-gray-200 dark:prose-code:bg-neutral-800 
                      prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                  
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className ?? "");

                      if (match) {
                        return (
                          <div className="my-3 overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-800">
                            <SyntaxHighlighter
                              language={match[1]}
                              style={coldarkDark as Record<string, React.CSSProperties>}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: 0,
                                fontSize: "13px",
                              }}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }

                      return (
                        <code
                          className="rounded bg-gray-200 px-1 py-0.5 text-orange-600 dark:bg-neutral-800 dark:text-orange-400"
                          {...props}
                        >
                          {children}
                        </code>
                       );
                      },
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                    </div>
                      ) : (
                        isGenerating && index === messages.length - 1 && (
                          <span className="inline-block animate-pulse text-gray-500 dark:text-gray-400">
                            Reading response chunks...
                          </span>
                        )
                     )}
                    </div>
                  </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>
          )}
      </div>

        {/* Modular Input Bar Component */}
        <ChatInput 
          input={input}
          setInput={setInput}
          isGenerating={isGenerating}
          handleSendMessage={handleSendMessage}
          handleStopGeneration={handleStopGeneration}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
        />
      </main>
    </div>
  );
}