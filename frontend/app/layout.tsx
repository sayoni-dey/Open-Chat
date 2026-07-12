import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Groq Llama 3.1 Clone',
  description: 'High-speed AI Chatbot Interface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[#212121] text-gray-200 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}