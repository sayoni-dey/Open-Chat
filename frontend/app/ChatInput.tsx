'use client';

import React from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isGenerating: boolean;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleStopGeneration: () => void;
}

export default function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSendMessage,
  handleStopGeneration
}: ChatInputProps) {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white dark:from-[#171717] dark:via-[#171717]
        to-transparent to-transparent pt-6 pb-4 px-4">
      <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder={isGenerating ? "Generation in progress..." : "Message Llama-3.1..."}
          disabled={isGenerating}
          className="w-full bg-gray-100 dark:bg-[#2a2b2d] text-gray-900 dark:text-gray-100 border-gray-300 dark:border-[#3a3a3d] placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm pl-4 pr-12 py-3.5 rounded-2xl border focus:outline-none focus:border-[#525252] focus:ring-1 focus:ring-[#525252] disabled:opacity-60 placeholder-gray-500 shadow-xl"
        />
        
        {/* Dynamic Context Button Selection Control Toggle */}
        <div className="absolute right-3.5">
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
              title="Stop generating"
            >
              <Square size={14} fill="black" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-sm"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>
      <div className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-2 tracking-wide">
        Free Sandbox Access Layer. Powered by Groq's Llama-3.1-8b-instant.
      </div>
    </div>
  );
}