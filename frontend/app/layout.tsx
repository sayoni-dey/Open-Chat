import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Groqui',
  description: 'High-speed AI Chatbot Interface',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-black dark:bg-[#212121] dark:text-gray-200 antialiased transition-colors">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}