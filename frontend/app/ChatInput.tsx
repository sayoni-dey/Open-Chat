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
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-6 pb-4 px-4">
      <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder={isGenerating ? "Generation in progress..." : "Message Llama-3.1..."}
          disabled={isGenerating}
          className="w-full bg-[#2f2f2f] text-sm text-white pl-4 pr-12 py-3.5 rounded-2xl border border-[#3c3c3c] focus:outline-none focus:border-[#525252] focus:ring-1 focus:ring-[#525252] disabled:opacity-60 placeholder-gray-500 shadow-xl"
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
      <div className="text-center text-[10px] text-gray-500 mt-2 tracking-wide">
        Free Sandbox Access Layer. Upstash Redis verifies anonymous interactions natively.
      </div>
    </div>
  );
}