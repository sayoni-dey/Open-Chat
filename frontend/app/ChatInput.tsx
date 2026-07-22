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

// 'use client';

// import React, { useRef } from 'react';
// import { Send, Square, Paperclip, X, FileText, ImageIcon } from 'lucide-react';

// interface ChatInputProps {
//   input: string;
//   setInput: (value: string) => void;
//   isGenerating: boolean;
//   handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
//   handleStopGeneration: () => void;
//   // New props for Multimodal File/Image attachment handling
//   attachedFile: File | null;
//   setAttachedFile: (file: File | null) => void;
// }

// export default function ChatInput({
//   input,
//   setInput,
//   isGenerating,
//   handleSendMessage,
//   handleStopGeneration,
//   attachedFile,
//   setAttachedFile
// }: ChatInputProps) {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setAttachedFile(e.target.files[0]);
//     }
//   };

//   const removeAttachedFile = () => {
//     setAttachedFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   const isImageFile = attachedFile?.type.startsWith('image/');

//   return (
//     <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white dark:from-[#171717] dark:via-[#171717] to-transparent pt-6 pb-4 px-4">
//       <div className="max-w-2xl mx-auto relative">
        
//         {/* Visual State: File/Image Preview Thumbnail Bar sitting right above the text input field */}
//         {attachedFile && (
//           <div className="mb-2 flex items-center gap-2 bg-gray-100 dark:bg-[#2a2b2d] p-2 rounded-xl border border-gray-200 dark:border-[#3a3a3d] w-fit max-w-full animate-in fade-in duration-200">
//             <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
//               {isImageFile ? (
//                 <ImageIcon size={14} className="text-blue-500 flex-shrink-0" />
//               ) : (
//                 <FileText size={14} className="text-red-500 flex-shrink-0" />
//               )}
//               <span className="truncate">{attachedFile.name}</span>
//             </div>
//             <button
//               type="button"
//               onClick={removeAttachedFile}
//               className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3a3d] rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
//               title="Remove file"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         )}

//         <form onSubmit={handleSendMessage} className="relative flex items-center">
//           {/* Hidden HTML input element for multi-format standard file selection */}
//           <input
//             type="file"
//             ref={fileInputRef}
//             onChange={handleFileChange}
//             accept="image/*,application/pdf,text/*"
//             className="hidden"
//           />

//           {/* Interactive Clip Icon Button to trigger the hidden file input handler */}
//           <button
//             type="button"
//             onClick={triggerFileInput}
//             disabled={isGenerating}
//             className="absolute left-3 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-40"
//             title="Attach images or files"
//           >
//             <Paperclip size={16} />
//           </button>

//           <input
//             type="text"
//             value={input}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
//             placeholder={isGenerating ? "Generation in progress..." : "Message Llama-3.1..."}
//             disabled={isGenerating}
//             className="w-full bg-gray-100 dark:bg-[#2a2b2d] text-gray-900 dark:text-gray-100 border-gray-300 dark:border-[#3a3a3d] placeholder:text-gray-500 dark:placeholder:text-gray-500 text-sm pl-11 pr-12 py-3.5 rounded-2xl border focus:outline-none focus:border-[#525252] focus:ring-1 focus:ring-[#525252] disabled:opacity-60 shadow-xl"
//           />
          
//           {/* Dynamic Context Button Selection Control Toggle */}
//           <div className="absolute right-3.5">
//             {isGenerating ? (
//               <button
//                 type="button"
//                 onClick={handleStopGeneration}
//                 className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
//                 title="Stop generating"
//               >
//                 <Square size={14} fill="black" />
//               </button>
//             ) : (
//               <button
//                 type="submit"
//                 disabled={!input.trim() && !attachedFile}
//                 className="p-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:hover:bg-white shadow-sm"
//               >
//                 <Send size={14} />
//               </button>
//             )}
//           </div>
//         </form>
//       </div>
//       <div className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-2 tracking-wide">
//         Free Sandbox Access Layer. Powered by Groq's Multimodal Capabilities.
//       </div>
//     </div>
//   );
// }

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Plus, X, Image as ImageIcon, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isGenerating: boolean;
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleStopGeneration: () => void;
  // State updated to arrays for multi-image processing
  attachedFiles: File[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function ChatInput({
  input,
  setInput,
  isGenerating,
  handleSendMessage,
  handleStopGeneration,
  attachedFiles,
  setAttachedFiles,
}: ChatInputProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close the popup window when clicking anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Appends new files cleanly into the attachment state list
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
    setIsMenuOpen(false); // Close menu drop tray after selecting
  };

  // Removes a single image thumbnail from the preview tray
  const removeFile = (indexToRemove: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative">
      {/* File/Image Preview Tray Ribbon */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-[#252627] border border-b-0 border-gray-200 dark:border-[#38393a] rounded-t-xl transition-all">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-2 bg-white dark:bg-[#2e2f30] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#404142] text-xs max-w-[200px]"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate text-gray-700 dark:text-gray-300">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-gray-400 hover:text-red-500 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Native File Picker Input Element */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple // Allows multi-file selections
        accept="image/*"
        className="hidden"
      />

      {/* Primary Textarea input frame wrapper */}
      <form
        onSubmit={handleSendMessage}
        className={`flex items-center gap-2
        bg-white dark:bg-[#2f2f2f]
        border border-gray-300 dark:border-[#444]
        px-3 py-2 shadow-sm
        ${ attachedFiles.length > 0 ? "rounded-b-3xl border-t-0" : "rounded-3xl" }`}
      >
        <div className="relative" ref={menuRef}>

          {/* Action Trigger Menu Popover Options Tray */}
          {isMenuOpen && (
            <div className="absolute bottom-12 left-0 mb-2 w-56 bg-white dark:bg-[#252627] border border-gray-200 dark:border-[#38393a] rounded-xl shadow-xl z-50 py-1 transition-all animate-in fade-in slide-in-from-bottom-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-750 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#323335] text-left transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Add files and images</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  router.push('/summary'); // Seamlessly transitions the user to your PDF app workflow
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-750 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#323335] text-left transition-colors border-t border-gray-150 dark:border-[#38393a]"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Summarize PDF</span>
              </button>
            </div>
          )}

          {/* Plus Toggle Trigger Button */}
          <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)}
            className=" flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition"
            >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>

        {/* Text Area Entry Strip */}
        {/* <input
          type="text"
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder={isGenerating ? "Generation in progress..." : "Message AI..."}
          disabled={isGenerating}
          className="w-full bg-transparent text-gray-900 dark:text-gray-100 outline-none placeholder-gray-400 dark:placeholder-gray-500 text-sm py-1 px-1 resize-none disabled:cursor-not-allowed"
        /> */}

            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ isGenerating ? "Generation in progress..." : "Message Llama-3.1..."}
            disabled={isGenerating}
            className="flex-1 bg-transparen outline-none border-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 py-2"
          />

        {/* Execution Command Trigger Buttons Tray */}
        {isGenerating ? (
          <button
            type="button"
            onClick={handleStopGeneration}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() && attachedFiles.length === 0}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black transition-all disabled:opacity-30 disabled:hover:bg-black dark:disabled:hover:bg-white disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>
      
      <div className="text-center text-[10px] text-gray-500 dark:text-gray-500 mt-2 tracking-wide">
         Free Sandbox Access Layer. Powered by Groq's Multimodal Capabilities.
       </div>
    </div>
  );
}