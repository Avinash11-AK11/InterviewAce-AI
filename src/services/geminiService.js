import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function camelCaseKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(item => camelCaseKeys(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      acc[camelKey] = camelCaseKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// Helper to parse JSON from Gemini response and normalize keys to camelCase
function parseJSON(text) {
  let parsed = null;
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from response
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }
  return parsed ? camelCaseKeys(parsed) : null;
}

// Global robust content generation with model fallbacks and retries
async function generateContentWithFallback(contents, jsonMode = false) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
  let lastError = null;

  for (const modelName of modelsToTry) {
    let attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const config = { model: modelName };
        if (jsonMode) {
          config.generationConfig = { responseMimeType: 'application/json' };
        }
        const modelInstance = genAI.getGenerativeModel(config);
        const result = await modelInstance.generateContent(contents);
        return result.response.text();
      } catch (error) {
        lastError = error;
        console.warn(`Model ${modelName} attempt ${attempt} failed:`, error.message || error);
        
        // If it's a 404 (model not found/deprecated), don't retry, skip immediately to next model
        if (error.status === 404 || error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('unsupported') || error.message?.includes('not support')) {
          break; 
        }

        // Exponential backoff before retrying the same model
        if (attempt < attempts) {
          await new Promise(res => setTimeout(res, 3000 * attempt));
        }
      }
    }
  }
  throw lastError;
}

export async function analyzeResume({ resumeText = '', targetRole = '', fileData = null }) {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are an expert ATS (Applicant Tracking System) recruiter and career coach. Today's date is ${currentDate}. Use this as the current real-world date to evaluate the timeline, history, and dates of the candidate's projects and work experience (any date before this is in the past).
Analyze the following resume for a ${targetRole || 'Software Engineer'} position.
${resumeText ? `\nResume Text:\n${resumeText}\n` : ''}

CRITICAL RULES FOR SCORING & ISSUES:
1. Be a highly critical and rigorous grader. Do not give high scores easily. Average resumes should score between 55 and 75. A score above 90 must be extremely rare and reserved only for flawless resumes.
2. The overall 'atsScore' must be a logical weighted average of keywordMatchScore, formattingScore, and readabilityScore.
3. If ANY score is below 98%, you MUST list the corresponding issues in 'actionRequired'.
4. You MUST find and list at least 3 distinct, highly detailed, and actionable issues in the 'actionRequired' array. No resume is perfect. If the resume is good, find advanced improvements (e.g. adding metrics, active verbs, advanced frameworks, formatting layout).

Respond with ONLY valid JSON matching this exact structure (do not output any markdown blocks, only raw JSON):
{
  "atsScore": <number 0-100>,
  "keywordMatchScore": <number 0-100>,
  "formattingScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "actionRequired": [
    {
      "issue": "<Specific issue found in their resume. YOU MUST FIND AT LEAST 1 ISSUE. Even for great resumes, find an area of improvement.>",
      "priority": "<High or Medium>",
      "action": "<Highly detailed, actionable advice on how exactly they should fix this specific issue>"
    }
  ],
  "keywordSuggestions": ["<actual keyword 1 highly relevant to the role>", "<actual keyword 2 highly relevant to the role>", "<actual keyword 3>"],
  "strengths": ["<detailed strength 1 based on their resume>", "<detailed strength 2 based on their resume>"],
  "improvementPlan": [
    {"month": "Month 1", "title": "<Custom thematic title for month 1>", "steps": ["<detailed specific action step>", "<detailed specific action step>"]},
    {"month": "Month 2", "title": "<Custom thematic title for month 2>", "steps": ["<detailed specific action step>", "<detailed specific action step>"]},
    {"month": "Month 3", "title": "<Custom thematic title for month 3>", "steps": ["<detailed specific action step>", "<detailed specific action step>"]}
  ],
  "overallFeedback": "<A highly detailed, personalized 3-4 sentence paragraph summarizing their resume's strengths and core weaknesses for this specific role.>"
}`;

  try {
    let requestParts = [prompt];
    
    if (fileData) {
      requestParts.push({
        inlineData: {
          data: fileData.base64,
          mimeType: fileData.mimeType
        }
      });
    }

    const text = await generateContentWithFallback(requestParts, true);
    const data = parseJSON(text);
    if (data) return data;
    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('Resume analysis failed:', error);
    throw new Error('Failed to analyze resume. The AI is currently experiencing high demand, please try again.');
  }
}

// ── Interview Questions ────────────────────────────────────────
export async function generateInterviewQuestions(role, difficulty = 'Mid-level', count = 5) {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const prompt = `Today's date is ${currentDate}. Generate ${count} unique, varied, and challenging technical interview questions specifically tailored for a ${role} position at the ${difficulty} level. Ensure the questions cover a diverse range of topics relevant to the role and avoid generic questions.

IMPORTANT: Respond with ONLY a valid JSON array, strictly adhering to this format. No extra text, no markdown block syntax.

[
  {
    "id": 1,
    "question": "Question text here",
    "idealAnswer": "A detailed model answer indicating what an ideal response would be",
    "category": "Technical/Behavioral/System Design",
    "difficulty": "${difficulty}",
    "hint": "Optional hint",
    "expectedDuration": 120
  }
]`;

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let data = parseJSON(text);
      if (data && !Array.isArray(data) && typeof data === 'object') {
        const arrayValue = Object.values(data).find(val => Array.isArray(val));
        if (arrayValue) {
          data = arrayValue;
        }
      }
      if (Array.isArray(data) && data.length > 0) return data;
      throw new Error('Failed to parse questions');
    } catch (error) {
      console.error(`Question generation attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (error?.message?.includes('429') || error?.status === 429) {
        throw new Error('You have exceeded the free Gemini API rate limit (15 requests/min). Please wait 60 seconds before trying again.');
      }
      
      if (attempt < 3) await new Promise(res => setTimeout(res, 1500 * attempt)); // exponential-ish backoff
    }
  }

  console.error('Question generation failed after 3 attempts.', lastError);
  throw new Error('Failed to generate questions. Please try again.');
}

// ── Evaluate Interview Answer ──────────────────────────────────
export async function evaluateInterviewAnswer(questionObj, answer, role = 'Software Engineer') {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const answerLower = answer?.toLowerCase() || '';
  const isBadAnswer = !answer || answer.trim().length < 15 || answerLower.includes("i don't know") || answerLower.includes("i dont know");

  const qText = typeof questionObj === 'object' ? questionObj.question : questionObj;
  const idealAnswer = typeof questionObj === 'object' ? questionObj.idealAnswer : null;

  if (isBadAnswer) {
    return {
      technical: 0,
      communication: 0,
      confidence: 0,
      problemSolving: 0,
      score: 0,
      feedback: 'The provided answer was insufficient or indicated a lack of knowledge.',
      betterAnswer: idealAnswer || 'A comprehensive answer covering key technical concepts was expected.',
      strengths: [],
      improvements: ['Provide a detailed answer', 'Ensure you attempt the question']
    };
  }

  const prompt = `You are an expert technical interviewer for ${role} positions. Today's date is ${currentDate}.
  
Question: ${qText}
Candidate's Answer: ${answer}

Evaluate the answer strictly based on the candidate's actual response. If the response is extremely poor, off-topic, or just a few words, give scores close to 0.

Respond with ONLY valid JSON matching this exact schema:
{
  "technical": <number 0-100>,
  "communication": <number 0-100>,
  "confidence": <number 0-100>,
  "problemSolving": <number 0-100>,
  "score": <number 0-100>,
  "feedback": "Detailed constructive feedback",
  "betterAnswer": "The ideal model answer or key points that the candidate completely missed.",
  "strengths": ["what candidate did well"],
  "improvements": ["areas to improve"]
}`;

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = parseJSON(text);
      if (data) return data;
      throw new Error('Parse error');
    } catch (error) {
      console.error(`Evaluation attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (error?.message?.includes('429') || error?.status === 429) {
        throw new Error('You have exceeded the free Gemini API rate limit (15 requests/min). Please wait 60 seconds before trying again.');
      }
      
      if (attempt < 3) await new Promise(res => setTimeout(res, 1500 * attempt));
    }
  }

  console.error('Evaluation failed after 3 attempts:', lastError);
  throw new Error('Failed to evaluate answer. Please try again.');
}

// ── Evaluate General Answer ────────────────────────────────────
export async function evaluateAnswer(question, answer, domain = 'General') {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prompt = `You are an expert ${domain} technical educator. Today's date is ${currentDate}. Evaluate this answer strictly based on its technical accuracy, completeness, and clarity. Even if the candidate says they don't know, or provides a very short/poor answer, you MUST STILL provide a full, highly accurate model answer in "modelAnswer" and give a score of 0.

Question: ${question}
Candidate's Answer: ${answer}

Respond with ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "correctness": "A 1-2 sentence assessment.",
  "score": 85,
  "missingPoints": ["concept missed 1", "concept missed 2"],
  "modelAnswer": "A comprehensive, highly accurate model answer to the question.",
  "tips": ["actionable tip 1", "actionable tip 2"]
}`;

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = parseJSON(text);
      if (data) return data;
      throw new Error('Parse error');
    } catch (error) {
      console.error(`Answer evaluation attempt ${attempt} failed:`, error);
      lastError = error;
      
      // Stop retrying immediately if it's a 429 Quota Exceeded error
      if (error?.message?.includes('429') || error?.status === 429) {
        throw new Error('You have exceeded the free Gemini API rate limit (15 requests/min). Please wait 60 seconds before trying again.');
      }
      
      if (attempt < 3) await new Promise(res => setTimeout(res, 1500 * attempt));
    }
  }

  console.error('Answer evaluation failed after 3 attempts:', lastError);
  throw new Error('Failed to evaluate answer. Please try again.');
}

// ── Roadmap Generator ──────────────────────────────────────────
export async function generateRoadmap(targetRole, currentSkills = [], timeline = 3) {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const prompt = `Today's date is ${currentDate}. Create a ${timeline}-month learning roadmap for becoming a ${targetRole}.
Current skills: ${currentSkills.join(', ') || 'Basic programming knowledge'}

Respond with ONLY valid JSON:
{
  "title": "Roadmap title",
  "targetRole": "${targetRole}",
  "months": [
    {
      "month": 1,
      "title": "Month theme",
      "focus": "Main focus area",
      "topics": [
        {"name": "Topic name", "resources": ["resource1"], "hours": 10},
        ...
      ],
      "milestone": "What you'll achieve this month",
      "project": "Suggested project"
    }
  ],
  "resources": {
    "books": ["book1", "book2"],
    "platforms": ["platform1", "platform2"],
    "communities": ["community1"]
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = parseJSON(text);
    if (data) return data;
    throw new Error('Parse error');
  } catch (error) {
    console.error('Roadmap generation error:', error);
    throw new Error('Failed to generate roadmap. The AI might be busy, please try again.');
  }
}

// ── Aptitude Test Generator ──────────────────────────────────────
export async function generateAptitudeTest(topic, difficulty = 'Medium', count = 10) {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const prompt = `You are an expert aptitude test creator. Today's date is ${currentDate}. Generate a test on the topic "${topic}" with ${difficulty} difficulty, containing exactly ${count} multiple-choice questions.

IMPORTANT: Respond with ONLY a valid JSON array, strictly adhering to this format. No extra text, no markdown.

[
  {
    "id": 1,
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Detailed step-by-step explanation of why Option B is correct and how to solve it."
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let data = parseJSON(text);
    
    // If Gemini wrapped the array in an object (e.g. { questions: [...] })
    if (data && !Array.isArray(data) && typeof data === 'object') {
      const arrayValue = Object.values(data).find(val => Array.isArray(val));
      if (arrayValue) {
        data = arrayValue;
      }
    }
    
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    
    throw new Error('Failed to parse aptitude test');
  } catch (error) {
    console.error('Aptitude test generation error:', error);
    throw new Error('Failed to generate aptitude test. The AI might be busy, please try again.');
  }
}

// ── Coding Challenge Generator ───────────────────────────────────
export async function generateCodingChallenge(difficulty = 'Medium') {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const prompt = `You are a world-class algorithms engineer and senior technical interviewer. Today's date is ${currentDate}.
Generate a single, highly realistic, professional-grade coding challenge at "${difficulty}" difficulty.
The challenge must cover a common software engineering topic (e.g. Arrays, Strings, Trees, Dynamic Programming, Graphs, Backtracking, Slidng Window).

Respond with ONLY valid JSON (no markdown, no explanations) fitting this schema:
{
  "title": "String Compression",
  "difficulty": "${difficulty}",
  "topic": "Arrays & Strings",
  "description": "A detailed, professional problem statement explaining the task clearly.",
  "constraints": [
    "Constraint 1 (e.g. 1 <= nums.length <= 10^5)",
    "Constraint 2"
  ],
  "examples": [
    {
      "input": "chars = [\\"a\\",\\"a\\",\\"b\\",\\"b\\",\\"c\\",\\"c\\",\\"c\\"]",
      "output": "6",
      "explanation": "Brief explanation of the input/output transformation."
    },
    {
      "input": "chars = [\\"a\\"]",
      "output": "1",
      "explanation": "Brief explanation."
    }
  ],
  "solutions": [
    {
      "language": "Java",
      "code": "class Solution {\\n    public int compress(char[] chars) {\\n        // Implementation here\\n    }\\n}"
    },
    {
      "language": "Python",
      "code": "def compress(self, chars: List[str]) -> int:\\n    # Implementation here"
    },
    {
      "language": "C++",
      "code": "class Solution {\\npublic:\\n    int compress(vector<char>& chars) {\\n        // Implementation here\\n    }\\n};"
    }
  ],
  "complexity": {
    "time": "Detailed Big O time complexity breakdown",
    "space": "Detailed Big O space complexity breakdown"
  }
}`;

  try {
    const text = await generateContentWithFallback(prompt, true);
    const data = parseJSON(text);
    if (data && data.title && data.description) return data;
  } catch (error) {
    console.error('Coding challenge generation error:', error);
    throw new Error('Failed to generate coding challenge. The AI might be busy, please try again.');
  }
}

// ── AI Search Assistant ──────────────────────────────────────────
export async function searchProject(queryText) {
  const prompt = `You are the navigation assistant for InterviewAce AI. The user is searching the app for: "${queryText}".
Map their query to the most appropriate section of the app and provide a brief helpful tip/answer.

The app has these sections:
- Dashboard (/dashboard): Overall progress, levels, activity stats.
- Aptitude Tests (/aptitude): Logical reasoning, verbal, quantitative practice tests.
- Technical Q&A (/technical): Practice core CS topics (React, Node, SQL, Swift, System Design, DSA) with circular score metrics.
- Coding Challenges (/coding): Daily algorithm problems in Java, Python, C++ with optimal complexity details.
- Resume Analyzer (/resume): Upload resume for ATS scoring, custom roadmaps, and action items.
- Mock Interview (/mock-interview): Voice/text mock interviews with full grading.
- Answer Evaluator (/evaluator): AI checking for custom technical questions.
- Learning Roadmap (/roadmap): View personalized timeline goals.
- Analytics (/analytics): View detailed progress graphs.
- Achievements (/achievements): View badges.
- Settings (/settings): Edit profile name, college, email, or change password.

Respond with ONLY valid JSON fitting this schema:
{
  "directAnswer": "A 1-2 sentence direct answer or instruction resolving their query.",
  "suggestions": [
    {
      "title": "Name of Section (e.g. Profile Settings)",
      "path": "Route (e.g. /settings)",
      "desc": "Short explanation of why they should go here relative to their search."
    }
  ]
}`;

  try {
    const text = await generateContentWithFallback(prompt, true);
    const data = parseJSON(text);
    if (data && (data.directAnswer || data.suggestions)) return data;
    throw new Error('Parse error');
  } catch (error) {
    console.error('AI search helper error:', error);
    return {
      directAnswer: `I couldn't process that with AI right now, but you can try browsing the settings or technical sections.`,
      suggestions: []
    };
  }
}
