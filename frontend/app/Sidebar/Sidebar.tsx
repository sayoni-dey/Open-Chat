'use client';

import React, { useState } from 'react';
import { UserButton, SignInButton } from '@clerk/nextjs';
import { Search, MessageSquare, Menu, X } from 'lucide-react';
import { UserIdentifierFooter } from './UserIdentifier';
// Define layout property contracts for state syncing
interface ChatHistoryItem {
  _id: string;
  title?: string;
}

interface SidebarProps {
  userId: string | null | undefined;
  isLoaded: boolean;
  chatId: string | null;
  chatHistory: ChatHistoryItem[];
  searchQuery: string;
  isGenerating: boolean;
  handleNewChat: () => void;
  handleSearch: (query: string) => Promise<void>;
  loadChatSession: (id: string) => Promise<void>;
}

export default function Sidebar({
  userId,
  isLoaded,
  chatId,
  chatHistory,
  searchQuery,
  isGenerating,
  handleNewChat,
  handleSearch,
  loadChatSession
}: SidebarProps) {
  // Local state to manage whether the navbar is open or collapsed
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <>
      {/* Absolute Toggle Button to Open/Close the Navbar Panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[#2f2f2f] hover:bg-[#3e3e3e] text-gray-300 rounded-lg border border-[#424242] transition-colors shadow-md"
        title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* LEFT SIDEBAR NAVBAR PANEL */}
      <aside 
        className={`fixed md:relative z-40 h-full bg-[#171717] flex flex-col justify-between border-r border-[#2f2f2f] transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-r-0'
        }`}
      >
        {/* Main Content Area wrapper to prevent squishing text layouts during collapse */}
        <div className={`flex flex-col flex-1 overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Header Spacer to avoid overlay collision with the toggle button */}
          <div className="h-14 flex-shrink-0" />

          <div className="p-3 flex flex-col flex-1 overflow-hidden pt-1">
            {/* New Chat Button Trigger */}
            <button 
              onClick={handleNewChat}
              disabled={isGenerating}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-white border border-[#424242] rounded-xl hover:bg-[#212121] transition-colors mb-4 w-full disabled:opacity-50 shadow-sm"
            >
              <span>New Chat</span>
              {/* Custom SVG Pen/Edit asset alternative to the traditional plus sign */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                className="w-4 h-4 text-gray-400 fill-current ml-2"
              >
                <path d="M19.071,4.929a1,1,0,0,0-1.414,0L4.222,18.364a1,1,0,0,0-.263.464l-1,4A1,1,0,0,0,3.2,24a.989.989,0,0,0,.232-.027l4-1a1,1,0,0,0,.464-.263L21.328,9.278a3,3,0,0,0,0-4.243Zm-12.7,13.6L16.236,8.664l1.1,1.1L7.472,19.628ZM5.887,18.113l1.1,1.1L4.852,20.261ZM19.914,7.864l-.164.164-2.2-2.2.164-.164a1,1,0,0,1,1.414,0l.786.786A1,1,0,0,1,19.914,7.864Z"/>
              </svg>
            </button>

            {/* Conditional Search Option: Available for Authenticated Profiles */}
            {userId && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search history..." 
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  className="w-full bg-[#212121] pl-9 pr-3 py-2 text-xs rounded-xl border border-[#2f2f2f] focus:outline-none focus:border-gray-500 text-gray-200"
                />
              </div>
            )}

            {/* Interactive Scaled Chat History Module */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">History Logs</h3>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-gray-500 px-2 italic">
                  {userId ? "No conversations found." : "Log in to preserve history logs."}
                </p>
              ) : (
                chatHistory.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => loadChatSession(item._id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg text-left truncate transition-colors ${
                      chatId === item._id ? 'bg-[#212121] text-white font-medium' : 'text-gray-400 hover:bg-[#212121] hover:text-gray-200'
                    }`}
                  >
                    <MessageSquare size={14} className="flex-shrink-0" />
                    <span className="truncate">{item.title || "Untitled Conversation"}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* BOTTOM LEFT: USER IDENTIFIER FOOTER */}
          <UserIdentifierFooter/>
        </div>
      </aside>
    </>
  );
}