import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, 
  Loader2, Award, Code, HelpCircle, RefreshCw, Send, CheckCircle, 
  Brain, Target, MessageSquare, ShieldAlert, Cpu, Database, Layout, Smartphone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateInterviewQuestions, evaluateInterviewAnswer } from '../../services/geminiService';
import { syncUserStats } from '../../utils/syncStats';
import { toast } from 'react-hot-toast';

const TOPICS = [
  { id: 'React & Frontend', name: 'React & Frontend', desc: 'Hooks, State Management, Virtual DOM, Web Performance, HTML/CSS', gradient: 'from-[#8FAF8F] to-[#A8C5DA]', icon: Layout },
  { id: 'Node.js & Backend', name: 'Node.js & Backend', desc: 'Event Loop, Express, REST APIs, Microservices, Security, Performance', gradient: 'from-[#A8C5DA] to-[#8FAF8F]', icon: Cpu },
  { id: 'SQL & Databases', name: 'SQL & Databases', desc: 'Schema Design, Indexing, Transactions, Joins, Normalization, Query Optimization', gradient: 'from-amber-100 to-amber-200', icon: Database },
  { id: 'Swift & iOS Development', name: 'Swift & iOS Development', desc: 'UIKit, SwiftUI, Memory Management, Concurrency, Swift Package Manager', gradient: 'from-[#F0B8C8] to-[#A8C5DA]', icon: Smartphone },
  { id: 'System Design', name: 'System Design', desc: 'Caching, Load Balancers, Scalability, Sharding, Message Queues', gradient: 'from-[#8FAF8F] to-[#F0B8C8]', icon: Brain },
  { id: 'Data Structures & Algorithms', name: 'DSA & Coding', desc: 'Arrays, Trees, Graphs, Sorting, Dynamic Programming, Big O complexity', gradient: 'from-[#A8C5DA] to-[#F0B8C8]', icon: Code }
];

export default function TechnicalHome() {
  const { currentUser } = useAuth();
  
  // App States: 'setup' | 'loading' | 'practice' | 'evaluation' | 'summary'
  const [sessionState, setSessionState] = useState('setup');
  
  // Setup States
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].id);
  const [difficulty, setDifficulty] = useState('Mid-level');
  const [questionCount, setQuestionCount] = useState(3);
  
  // Practice States
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Evaluation States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);

  // Setup dynamic date
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── 1. Start Q&A Session ──
  const handleStartSession = async () => {
    setIsGenerating(true);
    setSessionState('loading');
    
    try {
      const qData = await generateInterviewQuestions(selectedTopic, difficulty, questionCount);
      if (qData && qData.length > 0) {
        setQuestions(qData);
        setCurrentIdx(0);
        setUserAnswer('');
        setShowHint(false);
        setSessionResults([]);
        setSessionState('practice');
        toast.success('Practice questions generated successfully!');
      } else {
        throw new Error('No questions returned');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate technical questions. Please try again.');
      setSessionState('setup');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── 2. Submit Answer for Evaluation ──
  const handleSubmitAnswer = async () => {
    if (userAnswer.trim().length < 15) {
      toast.error('Please write a more detailed answer (at least 15 characters)');
      return;
    }

    setIsEvaluating(true);
    try {
      const questionObj = questions[currentIdx];
      const evaluation = await evaluateInterviewAnswer(questionObj, userAnswer, selectedTopic);
      
      setCurrentEvaluation(evaluation);
      
      // Store result
      const newResult = {
        question: questionObj.question,
        userAnswer: userAnswer,
        evaluation: evaluation
      };
      
      setSessionResults(prev => [...prev, newResult]);
      setSessionState('evaluation');
    } catch (error) {
      console.error(error);
      toast.error('Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── 3. Move to Next or Finish ──
  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setUserAnswer('');
      setShowHint(false);
      setCurrentEvaluation(null);
      setSessionState('practice');
    } else {
      handleFinishSession();
    }
  };

  // ── 4. Finish Session & Save to Firebase ──
  const handleFinishSession = async () => {
    setSessionState('loading');
    
    try {
      const avgScore = Math.round(
        sessionResults.reduce((acc, curr) => acc + (curr.evaluation.score || 0), 0) / sessionResults.length
      );
      
      // Calculate XP Earned (+15 XP per question solved with score > 50)
      let xpEarned = 0;
      sessionResults.forEach(r => {
        if ((r.evaluation.score || 0) >= 50) xpEarned += 15;
      });

      if (currentUser) {
        // Save to Firestore
        await addDoc(collection(db, 'qaSessions'), {
          userId: currentUser.uid,
          topic: selectedTopic,
          difficulty,
          averageScore: avgScore,
          xpEarned,
          results: sessionResults,
          createdAt: serverTimestamp()
        });

        // Trigger XP & Achievements sync
        await syncUserStats(currentUser.uid);
        
        toast.success(`Session complete! You earned +${xpEarned} XP!`);
      }
      
      setSessionState('summary');
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete session, but your progress is kept.');
      setSessionState('summary');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-[85vh]">
      <AnimatePresence mode="wait">
        
        {/* ── STATE 1: SETUP SCREEN ── */}
        {sessionState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8FAF8F]/20 to-[#A8C5DA]/20 rounded-full border border-white shadow-sm">
                <Brain size={16} className="text-[#8FAF8F]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#5a4f45]">AI Technical Trainer</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#5a4f45] leading-tight">Technical Q&A Practice</h1>
              <p className="text-[#7a6f65] max-w-2xl mx-auto text-sm md:text-base">
                Master core technical concepts, programming paradigms, and framework APIs with real-time, constructive, AI-graded feedback.
              </p>
            </div>

            {/* Config Box */}
            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/50 p-6 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#8FAF8F]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-8">
                
                {/* 1. Choose Topic */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-[#7a6f65] uppercase tracking-wider">
                    1. Select a Technical Field
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {TOPICS.map((topic) => {
                      const Icon = topic.icon;
                      return (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic.id)}
                          className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 flex items-start gap-4 hover:-translate-y-1 hover:shadow-lg
                            ${selectedTopic === topic.id 
                              ? 'border-[#8FAF8F] bg-[#8FAF8F]/5 shadow-md shadow-[#8FAF8F]/10' 
                              : 'border-[#e8e0d8] bg-white/50 hover:border-[#8FAF8F]/50'
                            }`}
                        >
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${topic.gradient} text-white shrink-0 shadow-sm`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#5a4f45]">{topic.name}</h4>
                            <p className="text-xs text-[#9a8f85] font-medium leading-relaxed mt-1">{topic.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Config Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#e8e0d8]/60">
                  {/* Difficulty */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#7a6f65] uppercase tracking-wider">
                      2. Difficulty Level
                    </label>
                    <div className="flex bg-[#e8e0d8]/40 p-1.5 rounded-2xl">
                      {['Junior', 'Mid-level', 'Senior'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                            ${difficulty === level 
                              ? 'bg-white shadow-sm text-[#8FAF8F]' 
                              : 'text-[#7a6f65] hover:bg-white/50'
                            }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Count */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#7a6f65] uppercase tracking-wider">
                      3. Question Volume
                    </label>
                    <div className="flex bg-[#e8e0d8]/40 p-1.5 rounded-2xl">
                      {[3, 5, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setQuestionCount(num)}
                          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                            ${questionCount === num 
                              ? 'bg-white shadow-sm text-[#8FAF8F]' 
                              : 'text-[#7a6f65] hover:bg-white/50'
                            }`}
                        >
                          {num} Questions
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-end pt-4 border-t border-[#e8e0d8]/40">
                  <button
                    onClick={handleStartSession}
                    className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:shadow-xl hover:shadow-[#8FAF8F]/20 hover:-translate-y-0.5 transition-all"
                  >
                    <Sparkles size={16} />
                    Generate Q&A Session
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* ── STATE 2: LOADING SCREEN ── */}
        {sessionState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[60vh] flex flex-col items-center justify-center space-y-6"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-3xl flex items-center justify-center shadow-lg"
            >
              <Loader2 size={40} className="text-white animate-spin" />
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-[#5a4f45]">AI is Thinking...</h3>
              <p className="text-[#9a8f85] font-semibold text-sm">
                Generating unique, high-quality questions for {selectedTopic} ({difficulty} Level).
              </p>
            </div>
          </motion.div>
        )}

        {/* ── STATE 3: ACTIVE PRACTICE SESSION ── */}
        {sessionState === 'practice' && questions.length > 0 && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Header: Progress */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSessionState('setup')}
                className="flex items-center gap-1 text-xs font-black uppercase text-[#9a8f85] hover:text-[#5a4f45] transition-colors"
              >
                <ArrowLeft size={16} /> Exit Practice
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-black uppercase tracking-wider text-[#9a8f85]">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <div className="w-32 bg-[#e8e0d8] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#8FAF8F] h-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl border border-[#e8e0d8] shadow-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#8FAF8F]" />
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8FAF8F]/10 text-[#8FAF8F] text-[10px] font-black uppercase rounded-lg">
                  <Target size={12} /> {questions[currentIdx].category || 'Technical Question'}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#5a4f45] leading-relaxed">
                  {questions[currentIdx].question}
                </h2>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-[#7a6f65] mb-2">
                Your Answer:
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your explanation, sample code, or technical details here..."
                className="w-full h-64 p-6 bg-white border-2 border-[#e8e0d8] rounded-[2rem] focus:ring-4 focus:ring-[#8FAF8F]/20 focus:border-[#8FAF8F] outline-none transition-all resize-none text-[#5a4f45] font-medium leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs font-bold text-[#9a8f85]">
                <span>Min length: 15 chars. (Currently: {userAnswer.length})</span>
                <span>Baseline Year: {currentDate.split(', ').pop()}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e8e0d8]/40">
              {questions[currentIdx].hint ? (
                <div>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-xs font-black uppercase text-[#A8C5DA] hover:text-[#5a4f45] transition-colors"
                  >
                    <HelpCircle size={16} /> {showHint ? 'Hide Hint' : 'Reveal Hint'}
                  </button>
                  {showHint && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-[#7a6f65] font-semibold mt-2 max-w-md italic"
                    >
                      💡 {questions[currentIdx].hint}
                    </motion.p>
                  )}
                </div>
              ) : <div />}

              <button
                onClick={handleSubmitAnswer}
                disabled={isEvaluating}
                className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Submit Answer
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STATE 4: EVALUATION SCREEN (Per question feedback) ── */}
        {sessionState === 'evaluation' && currentEvaluation && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Header: Score Ring */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-3xl border border-[#e8e0d8] p-8 gap-8 shadow-xl">
              
              {/* Score SVG */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="stroke-[#f0edea] fill-none" strokeWidth="6" />
                  <motion.circle 
                    initial={{ strokeDasharray: '0, 300' }}
                    animate={{ strokeDasharray: `${(currentEvaluation.score / 100) * 263}, 300` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    cx="50" cy="50" r="42" 
                    className={`fill-none ${currentEvaluation.score >= 80 ? 'stroke-[#8FAF8F]' : currentEvaluation.score >= 50 ? 'stroke-amber-400' : 'stroke-red-400'}`} 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-[#5a4f45]">{currentEvaluation.score || 0}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#9a8f85] mt-0.5">Score</span>
                </div>
              </div>

              {/* Subscores Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                {[
                  { label: 'Technical Accuracy', val: currentEvaluation.technical || 0 },
                  { label: 'Communication', val: currentEvaluation.communication || 0 },
                  { label: 'Confidence', val: currentEvaluation.confidence || 0 },
                  { label: 'Problem Solving', val: currentEvaluation.problemSolving || 0 }
                ].map((item, i) => (
                  <div key={i} className="bg-[#fcfbf9] border border-[#e8e0d8] p-4 rounded-2xl text-center shadow-sm">
                    <span className="block text-xl font-black text-[#5a4f45]">{item.val}%</span>
                    <span className="block text-[9px] font-black uppercase text-[#9a8f85] leading-tight mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critique Feedback */}
            <div className="space-y-6">
              <div className="bg-white border border-[#e8e0d8] rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
                <h4 className="text-lg font-black text-[#5a4f45] flex items-center gap-2 border-b border-[#e8e0d8]/60 pb-3">
                  <MessageSquare size={18} className="text-[#8FAF8F]" /> AI Grade Assessment
                </h4>
                <p className="text-sm font-semibold text-[#7a6f65] leading-relaxed">
                  {currentEvaluation.feedback}
                </p>
              </div>

              {/* Strengths / Improvements Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white border border-[#e8e0d8] rounded-3xl p-6 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#8FAF8F] border-b border-[#e8e0d8]/60 pb-3 flex items-center gap-2 mb-4">
                    <CheckCircle size={16} /> Key Strengths
                  </h4>
                  <ul className="space-y-3">
                    {currentEvaluation.strengths?.map((str, i) => (
                      <li key={i} className="flex gap-2 text-xs font-semibold text-[#7a6f65] leading-relaxed">
                        <CheckCircle2 size={14} className="text-[#8FAF8F] shrink-0 mt-0.5" />
                        {str}
                      </li>
                    ))}
                    {(!currentEvaluation.strengths || currentEvaluation.strengths.length === 0) && (
                      <li className="text-xs font-semibold text-[#9a8f85] italic">No prominent strengths identified in the response.</li>
                    )}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white border border-[#e8e0d8] rounded-3xl p-6 shadow-sm">
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#F0B8C8] border-b border-[#e8e0d8]/60 pb-3 flex items-center gap-2 mb-4">
                    <ShieldAlert size={16} /> Areas to Improve
                  </h4>
                  <ul className="space-y-3">
                    {currentEvaluation.improvements?.map((imp, i) => (
                      <li key={i} className="flex gap-2 text-xs font-semibold text-[#7a6f65] leading-relaxed">
                        <AlertTriangle size={14} className="text-[#F0B8C8] shrink-0 mt-0.5" />
                        {imp}
                      </li>
                    ))}
                    {(!currentEvaluation.improvements || currentEvaluation.improvements.length === 0) && (
                      <li className="text-xs font-semibold text-[#8FAF8F] italic">Perfect execution! No adjustments needed.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Model Answer comparison */}
              <div className="bg-[#5a4f45]/5 border border-[#5a4f45]/20 rounded-3xl p-6 md:p-8 space-y-4 shadow-inner">
                <h4 className="text-base font-black text-[#5a4f45] flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" /> Ideal Model Answer
                </h4>
                <p className="text-xs font-semibold text-[#7a6f65] leading-relaxed whitespace-pre-wrap bg-white/70 p-4 border border-[#e8e0d8] rounded-2xl shadow-sm">
                  {currentEvaluation.betterAnswer || currentEvaluation.modelAnswer}
                </p>
              </div>
            </div>

            {/* Next Action */}
            <div className="flex justify-end pt-4 border-t border-[#e8e0d8]/40">
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {currentIdx + 1 < questions.length ? (
                  <>
                    Next Question <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Finish Session & Save <Award size={16} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STATE 5: SESSION COMPLETE SUMMARY ── */}
        {sessionState === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Completion Banner */}
            <div className="bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-[2.5rem] p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-white/10 skew-x-12 blur-3xl" />
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="w-20 h-20 bg-white/20 border border-white/40 rounded-full flex items-center justify-center mx-auto shadow-lg backdrop-blur-md">
                  <Award size={40} className="text-white" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black">Practice Session Complete!</h2>
                  <p className="text-white/90 font-bold max-w-lg mx-auto text-sm md:text-base">
                    You have successfully completed {sessionResults.length} technical Q&A questions on <span className="underline">{selectedTopic}</span>.
                  </p>
                </div>

                {/* Score & XP badges */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
                  <div className="bg-white/20 border border-white/40 px-6 py-3 rounded-2xl backdrop-blur-md text-center">
                    <span className="block text-2xl font-black">
                      {Math.round(
                        sessionResults.reduce((acc, curr) => acc + (curr.evaluation.score || 0), 0) / sessionResults.length
                      )}%
                    </span>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-white/80 mt-0.5">Average Grade</span>
                  </div>

                  <div className="bg-white/20 border border-white/40 px-6 py-3 rounded-2xl backdrop-blur-md text-center">
                    <span className="block text-2xl font-black text-amber-300">
                      +{sessionResults.reduce((acc, curr) => (curr.evaluation.score >= 50 ? acc + 15 : acc), 0)} XP
                    </span>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-white/80 mt-0.5">Reward Earned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Recap List */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-[#5a4f45] border-b border-[#e8e0d8] pb-4">
                Question Recap & Answers
              </h3>

              <div className="space-y-4">
                {sessionResults.map((result, i) => (
                  <div key={i} className="bg-white border border-[#e8e0d8] rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e8e0d8]/60 pb-3">
                      <span className="text-xs font-black text-[#9a8f85] uppercase">Question {i + 1}</span>
                      <span className={`px-3 py-1 text-xs font-black uppercase rounded-lg ${result.evaluation.score >= 80 ? 'bg-[#8FAF8F]/10 text-[#8FAF8F]' : result.evaluation.score >= 50 ? 'bg-amber-100 text-amber-500' : 'bg-red-50 text-red-500'}`}>
                        Score: {result.evaluation.score}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-[#5a4f45] leading-relaxed">{result.question}</h4>
                      <div className="bg-[#fcfbf9] border border-[#e8e0d8] p-4 rounded-xl space-y-2">
                        <span className="block text-[10px] font-black text-[#9a8f85] uppercase tracking-wider">Your Answer:</span>
                        <p className="text-xs font-semibold text-[#7a6f65] leading-relaxed whitespace-pre-wrap">{result.userAnswer}</p>
                      </div>
                      <div className="bg-[#5a4f45]/5 border border-[#5a4f45]/15 p-4 rounded-xl space-y-2">
                        <span className="block text-[10px] font-black text-[#5a4f45] uppercase tracking-wider">AI Suggestion:</span>
                        <p className="text-xs font-semibold text-[#7a6f65] leading-relaxed">{result.evaluation.feedback}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer options */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setSessionState('setup')}
                className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#e8e0d8] text-[#5a4f45] font-black text-sm uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all"
              >
                <RefreshCw size={16} /> New Session
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:shadow-lg transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
