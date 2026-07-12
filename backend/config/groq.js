import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Ensuring env variables are loaded if accessing this file independently
dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY in environment variables.');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
