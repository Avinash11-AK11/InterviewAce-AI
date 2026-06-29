# <p align="center">🎯 InterviewAce AI</p>

<p align="center">
  <strong>Enterprise-Grade Candidate Preparation & AI-Driven Assessment Platform</strong>
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5.0-B73BFE?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-9.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini_1.5_Pro-Google-1A73E8?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"></a>
  <a href="https://interview-ace-ai-jet.vercel.app"><img src="https://img.shields.io/badge/Deployed_to-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"></a>
</p>

---

## 📺 Video Demo & Live Link

- 🚀 **Live Demo:** [Deploy Link (Vercel)](https://interview-ace-ai-jet.vercel.app)
- 📹 **Walkthrough Video:** Click below to view the application features in action.

<p align="center">
  <a href="YOUR_YOUTUBE_VIDEO_URL_HERE">
    <img src="https://img.youtube.com/vi/YOUR_YOUTUBE_VIDEO_ID_HERE/0.jpg" alt="InterviewAce AI System Walkthrough" width="100%" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />
  </a>
</p>

---

## 📖 Product Overview

**InterviewAce AI** is a professional, product-driven candidate simulator that leverages generative AI to help developers land technical roles. The application is built using a **Layered Architecture (Clean Architecture)** design, decoupling the React Presentation UI from data storage and LLM services.

Through **real-time subscription flows** and structured **Google Gemini 1.5 Pro integrations**, the system automates resume ATS analysis, mock interviews, DSA challenge compilations, and logical assessments.

---

## 🏛️ System & Software Architecture

InterviewAce AI is built using a decoupled, layered software pattern to ensure high cohesion, low coupling, and scalable feature addition.

### Layered Architecture Diagram

```mermaid
graph TD
  %% Layer 1: Client/Presentation
  subgraph Presentation Layer [1. Presentation Layer - Client UI]
    UI[React Components] --> Hooks[Custom React Hooks & Contexts]
    UI --> Theme[Neomorphic Design System]
  end

  %% Layer 2: Service/Application Layer
  subgraph Service Layer [2. Service Layer - App Orchestration]
    Hooks --> AuthService[Auth Service]
    Hooks --> GeminiService[Gemini AI Service]
    Hooks --> DBOrchestrator[Database Sync Service]
  end

  %% Layer 3: Integration/Data Layer
  subgraph Data Layer [3. Data & Infrastructure Layer]
    AuthService --> FirebaseAuth[Firebase Auth SDK]
    GeminiService --> GeminiAPI[Google Gemini 1.5 Client]
    DBOrchestrator --> Firestore[Cloud Firestore SDK]
    DBOrchestrator --> CloudStorage[Firebase Storage SDK]
  end

  classDef presentation fill:#F0B8C8,stroke:#d098a8,stroke-width:2px,color:#3a2f25;
  classDef service fill:#A8C5DA,stroke:#88a5ba,stroke-width:2px,color:#3a2f25;
  classDef data fill:#8FAF8F,stroke:#6f8f6f,stroke-width:2px,color:#ffffff;

  class UI,Hooks,Theme presentation;
  class AuthService,GeminiService,DBOrchestrator service;
  class FirebaseAuth,GeminiAPI,Firestore,CloudStorage data;
```

---

## 🔄 Core Product Workflows

### 1. AI Mock Interview Evaluation Pipeline

The diagram below illustrates the lifecycle of a single mock interview session, from prompt compilation to real-time database persistence and state rendering.

```mermaid
sequenceDiagram
  autonumber
  actor Candidate as Candidate
  participant UI as Interview UI (React)
  participant GS as Gemini Service (LLM)
  participant FS as Cloud Firestore (DB)
  participant SE as Stats Engine (syncStats.js)

  Candidate->>UI: Submit Audio/Text Answer
  UI->>UI: Show Loading Skeleton
  UI->>GS: request evaluation(question, answer, role)
  GS->>GS: Enforce JSON Schema (correctness, feedback, idealAnswer)
  GS-->>UI: Return Structured JSON Evaluation
  UI->>FS: writeDoc(interviewSessions, evaluationPayload)
  UI->>SE: trigger syncUserStats(userId)
  SE->>FS: Increment user.interviewsDone & recalculate level/XP
  FS-->>UI: Real-Time onSnapshot triggers state update
  UI-->>Candidate: Render Neomorphic Score Ring & Feedback Cards
```

### 2. Resume ATS & Roadmap Compilation Lifecycle

When a user uploads a resume, the system initiates a concurrent parsing and timeline-generation pipeline:

1. **Extraction:** Resume contents are converted to structural text and sent to `analyzeResume(resumeText)`.
2. **Analysis:** The LLM evaluates formatting anomalies, calculates matching percentages, and lists missing keywords.
3. **Timeline Compilation:** Simultaneously, a second prompt compiles a week-by-week study timeline to close identified skills gaps.
4. **Persistence:** The calculated roadmap, ATS score, and audit logs are written to Firestore as a single document under the `resumes` collection.

---

## 📂 Directory & Module Layout

```text
src/
├── components/
│   ├── auth/          # PrivateRoute, AdminRoute Guards
│   ├── layout/        # Sidebar, Navbar Layout wrappers
│   ├── ui/            # Reusable Neomorphic UI Kit (Button, Card, Modal)
│   └── gamification/  # XPBar, LevelBadge Progression indicators
├── contexts/          # React Auth State Provider
├── hooks/             # Custom useAuth Hook Exports
├── pages/             # Pages by Domain (Aptitude, Mock-Interview, Profile, Settings)
├── services/          # Gemini AI API Integration Layer
├── store/             # Zustand Global State Management
└── utils/             # Database Synchronization Engines, Helpers, Mocks
```

---

## 🎨 Applied Design Patterns

- **Repository/Service Pattern:** All API calls and database actions are abstracted into standalone service modules (`geminiService.js`, `authService.js`), leaving React components UI-focused.
- **Observer Pattern (Reactive UI):** Components subscribe to Firestore document streams via `onSnapshot` listeners. State changes propagate automatically across layout widgets.
- **Command/Batch Pattern:** Rather than issuing individual network writes for bulk status updates (e.g. marking notifications read), changes are bundled into a `writeBatch` to limit API overhead.

---

## 💾 Database Schema (Cloud Firestore)

Below are the JavaScript object schemas representing document structures in our Firestore database collection:

### `users` Collection Document Structure

```javascript
{
  name: "Jane Doe",
  email: "jane.doe@example.com",
  college: "Tech University",
  xp: 1250,
  level: 4,
  badges: ["code_warrior", "quiz_master"], // Array of badge IDs
  streak: 5,
  testsTaken: 8,
  problemsSolved: 12,
  interviewsDone: 3
}
```

### `results` Collection Document Structure

```javascript
{
  userId: "user_document_id_xyz",
  topic: "Quantitative Analysis",
  difficulty: "medium",
  score: 85, // Score percentage
  questions: [
    {
      question: "Solve for x: 2x + 5 = 15",
      selectedAnswer: "5",
      correctAnswer: "5",
      isCorrect: true
    }
  ],
  createdAt: "2026-06-29T12:00:00Z" // ISO string or Firestore Timestamp
}
```

### `interviewSessions` Collection Document Structure

```javascript
{
  userId: "user_document_id_xyz",
  role: "Frontend Engineer",
  difficulty: "hard",
  overallScore: 78,
  completedAt: "2026-06-29T14:30:00Z", // ISO string or Firestore Timestamp
  evaluations: [
    {
      question: "Explain closures in JavaScript.",
      answer: "A closure is a function that remembers its outer variables...",
      score: 85,
      feedback: "Great explanation of lexical scoping.",
      idealAnswer: "A closure is the combination of a function bundled together..."
    }
  ]
}
```

---

## ⚡ Technical Implementations & Optimizations

- **Framer Motion Micro-Animations:** Dynamic state transitions use physical layouts (spring physics and exit animations) to optimize cognitive load.
- **Responsive Layout Guard:** Layouts use double-tier drawer views, automatically collapsing sidebars on smaller displays to protect screen space.
- **Structured Prompts:** Enforces JSON responses using system instructions to prevent LLM hallucination and ensure runtime parsing safety.

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js:** v18.0.0+
- **Firebase:** Account with Firestore and Auth enabled
- **Google AI Studio:** Gemini API Key

### 💻 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/interviewace-ai.git
   cd interviewace-ai
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file at the root:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start local development server:**

   ```bash
   npm run dev
   ```

   Open `http://localhost:5173` in your browser.

5. **Build project for deployment:**
   ```bash
   npm run build
   ```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.

---

_Formulated by Avinash Chavda — Designed to empower candidates through structured AI-driven assessments._
