// 'use client';

// import React from 'react';
// import { Send, Square, Paperclip, X, Image as ImageIcon } from 'lucide-react';

// interface ChatInputProps {
//   input: string;
//   setInput: (value: string) => void;
//   isGenerating: boolean;
//   handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
//   handleStopGeneration: () => void;
// }

// export default function ChatInput({
//   input,
//   setInput,
//   isGenerating,
//   handleSendMessage,
//   handleStopGeneration
// }: ChatInputProps) {
//   return (
//     <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white dark:from-[#171717] dark:via-[#171717]
//         to-transparent to-transparent pt-6 pb-4 px-4">
//       <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto relative flex items-center">
//         <input
//           type="text"
//           value={input}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
//           placeholder={isGenerating ? "Generation in progress..." : "Message Llama-3.1..."}
//           disabled={isGenerating}
//           className="w-full bg-gray-100 dark:bg-[#2a2b2d] text-gray-900 dark:text-gray-100 border-gray-300 dark:border-[#3a3a3d] placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm pl-4 pr-12 py-3.5 rounded-2xl border focus:outline-none focus:border-[#525252] focus:ring-1 focus:ring-[#525252] disabled:opacity-60 placeholder-gray-500 shadow-xl"
//         />
        
//         {/* Dynamic Context Button Selection Control Toggle */}
//         <div className="absolute right-3.5">
//           {isGenerating ? (
//             <button
//               type="button"
//               onClick={handleStopGeneration}
//               className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
//               title="Stop generating"
//             >
//               <Square size={14} fill="black" />
//             </button>
//           ) : (
//             <button
//               type="submit"
//               disabled={!input.trim()}
//               className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-sm"
//             >
//               <Send size={14} />
//             </button>
//           )}
//         </div>
//       </form>
//       <div className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-2 tracking-wide">
//         Free Sandbox Access Layer. Powered by Groq's Llama-3.1-8b-instant.
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useRef } from 'react';
import { Send, Square, Paperclip, X, FileText, ImageIcon } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isGenerating: boolean;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleStopGeneration: () => void;
  // New props for Multimodal File/Image attachment handling
  attachedFile: File | null;
  setAttachedFile: (file: File | null) => void;
}

export default function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSendMessage,
  handleStopGeneration,
  attachedFile,
  setAttachedFile
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const isImageFile = attachedFile?.type.startsWith('image/');

  return (
    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white dark:from-[#171717] dark:via-[#171717] to-transparent pt-6 pb-4 px-4">
      <div className="max-w-2xl mx-auto relative">
        
        {/* Visual State: File/Image Preview Thumbnail Bar sitting right above the text input field */}
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 bg-gray-100 dark:bg-[#2a2b2d] p-2 rounded-xl border border-gray-200 dark:border-[#3a3a3d] w-fit max-w-full animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
              {isImageFile ? (
                <ImageIcon size={14} className="text-blue-500 flex-shrink-0" />
              ) : (
                <FileText size={14} className="text-red-500 flex-shrink-0" />
              )}
              <span className="truncate">{attachedFile.name}</span>
            </div>
            <button
              type="button"
              onClick={removeAttachedFile}
              className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3a3d] rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Remove file"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="relative flex items-center">
          {/* Hidden HTML input element for multi-format standard file selection */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/*"
            className="hidden"
          />

          {/* Interactive Clip Icon Button to trigger the hidden file input handler */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isGenerating}
            className="absolute left-3 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-40"
            title="Attach images or files"
          >
            <Paperclip size={16} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            placeholder={isGenerating ? "Generation in progress..." : "Message Llama-3.1..."}
            disabled={isGenerating}
            className="w-full bg-gray-100 dark:bg-[#2a2b2d] text-gray-900 dark:text-gray-100 border-gray-300 dark:border-[#3a3a3d] placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm pl-11 pr-12 py-3.5 rounded-2xl border focus:outline-none focus:border-[#525252] focus:ring-1 focus:ring-[#525252] disabled:opacity-60 shadow-xl"
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
                disabled={!input.trim() && !attachedFile}
                className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-sm"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-2 tracking-wide">
        Free Sandbox Access Layer. Powered by Groq's Multimodal Capabilities.
      </div>
    </div>
  );
}