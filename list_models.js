import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const models = data.models || [];
  models.forEach(m => {
    if (m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent')) {
      console.log(m.name);
    }
  });
}
run();
