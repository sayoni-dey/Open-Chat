"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function PDFSummaryDashboard() {
  // Fixes Error 3: Explicitly type state to allow both null and File objects
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fixes Error 1: Typed form event 'e' explicitly
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setSummary("");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("pdf", file);

    // Fixes Error 4: Import API URL dynamically from project environment configurations
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const response = await fetch(`${apiUrl}/api/chat/summarize-pdf`, {
        method: "POST",
        body: formData,
      });

      // Fixes Error 2: Strictly assert response.body safety context checkpoint 
      if (!response.body) {
        throw new Error("Readable stream payload channel is not accessible from backend.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const rawLines = decoder.decode(value).split("\n\n");
        for (const line of rawLines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                setSummary((prev) => prev + parsed.chunk);
              }
            } catch (err) {
              // Skips incomplete or malformed JSON chunks gracefully
            }
          }
        }
      }
    } catch (error) {
      console.error("PDF Processing Error:", error);
      setSummary("### Error\nFailed to summarize the document layout safely.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fixes Error 1 & 3: Typed input element change target cleanly with optional chaining
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#212121] text-white">
      {/* LEFT DRAWER PANEL: UPLOAD PORTAL */}
      <div className="w-1/3 border-r border-[#3c3c3c] p-6 flex flex-col justify-center items-center bg-[#171717]">
        <h2 className="text-xl font-semibold mb-4 text-emerald-400">AI PDF Analyzer</h2>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="border-2 border-dashed border-[#4e4e4e] hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#2f2f2f] file:text-white hover:file:bg-[#3e3e3e]"
            />
            {file && <p className="text-xs text-emerald-400 mt-3 truncate max-w-full">Selected: {file.name}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full bg-emerald-500 text-black font-semibold py-3 rounded-xl disabled:bg-gray-600 disabled:text-gray-400 hover:bg-emerald-400 transition"
          >
            {isLoading ? "Analyzing Document Blocks..." : "Generate Summary"}
          </button>
        </form>
      </div>

      {/* RIGHT DISPLAY VIEWPORT: DYNAMIC SUMMARY RESPONSE CANVAS */}
      <div className="w-2/3 p-8 overflow-y-auto bg-[#212121]">
        {summary ? (
          <div className="prose prose-invert max-w-none bg-[#2f2f2f] p-6 rounded-2xl border border-[#3c3c3c]">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
            {isLoading ? "Reading document layers, synthesizing structural data chunks..." : "Upload a PDF report to populate an analytical executive breakdown summary."}
          </div>
        )}
      </div>
    </div>
  );
}