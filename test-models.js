import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
async function run() {
  // We can't list models directly with the web SDK easily without the REST API,
  // let's fetch it via curl
}
