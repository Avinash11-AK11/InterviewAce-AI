import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const envStr = fs.readFileSync('.env', 'utf-8');
const key = envStr.match(/VITE_GEMINI_API_KEY=(.*)/)[1];

async function run() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await response.json();
  console.log(data.models.map(m => m.name));
}
run();
