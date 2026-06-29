import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, Clock, Award, Code, HelpCircle, 
  RefreshCw, ChevronRight, Copy, Check, FileText, Brain, ShieldAlert, Cpu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { generateCodingChallenge } from '../../services/geminiService';
import { syncUserStats } from '../../utils/syncStats';
import { toast } from 'react-hot-toast';

export default function CodingHome() {
  const { currentUser: user } = useAuth();

  // States
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('Medium');
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'solution' | 'complexity'
  const [selectedLanguage, setSelectedLanguage] = useState('Java');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPracticed, setHasPracticed] = useState(false);
  const [practicing, setPracticing] = useState(false);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState('');

  // 4 Hours in MS
  const ROTATION_TIME = 4 * 60 * 60 * 1000;

  // ── 1. Fetch & Rotate Challenge ──
  const fetchChallenge = async (forceDifficulty = null) => {
    setLoading(true);
    const targetDiff = forceDifficulty || difficulty;
    
    try {
      const data = await generateCodingChallenge(targetDiff);
      if (data) {
        const challengeObj = {
          ...data,
          difficulty: targetDiff,
          timestamp: Date.now()
        };
        localStorage.setItem(`coding_challenge_${targetDiff}`, JSON.stringify(challengeObj));
        localStorage.setItem(`coding_challenge_current_diff`, targetDiff);
        setChallenge(challengeObj);
        setHasPracticed(false);
        checkIfAlreadyPracticed(challengeObj.title);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate coding challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check local cache on mount
  useEffect(() => {
    const cachedDiff = localStorage.getItem('coding_challenge_current_diff') || 'Medium';
    setDifficulty(cachedDiff);
    
    const cached = localStorage.getItem(`coding_challenge_${cachedDiff}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      // Detect if this is an old cached challenge missing Java/C++ solutions
      const hasJava = parsed.solutions?.some(sol => sol.language === 'Java');
      
      if (age < ROTATION_TIME && hasJava) {
        setChallenge(parsed);
        checkIfAlreadyPracticed(parsed.title);
        setLoading(false);
      } else {
        // Stale or legacy format - refetch automatically
        fetchChallenge(cachedDiff);
      }
    } else {
      fetchChallenge(cachedDiff);
    }
  }, []);

  // Check if user already marked this specific challenge as practiced in Firestore
  const checkIfAlreadyPracticed = async (title) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'submissions'),
        where('userId', '==', user.uid),
        where('problemName', '==', title)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasPracticed(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── 2. Countdown Timer Loop ──
  useEffect(() => {
    if (!challenge) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - challenge.timestamp;
      const remaining = ROTATION_TIME - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        fetchChallenge(); // Trigger automatic rotation
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  // ── 3. Force New Challenge ──
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    await fetchChallenge();
    setIsRefreshing(false);
    toast.success('Generated a fresh coding challenge!');
  };

  // Change difficulty dropdown
  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    fetchChallenge(newDiff);
  };

  // ── 4. Copy Code to Clipboard ──
  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // ── 5. Mark as Practiced & Award XP ──
  const handleMarkAsPracticed = async () => {
    if (!user) {
      toast.error('You must be logged in to save progress.');
      return;
    }
    if (hasPracticed) return;

    setPracticing(true);
    try {
      // Save practice record as a successful submission to integrate with sync stats
      await addDoc(collection(db, 'submissions'), {
        userId: user.uid,
        problemId: `ai_${challenge.title.toLowerCase().replace(/\s+/g, '_')}`,
        problemName: challenge.title,
        difficulty: challenge.difficulty,
        status: 'success',
        passed: true,
        language: selectedLanguage,
        createdAt: serverTimestamp()
      });

      // Synchronize stats to award XP and badge counts
      await syncUserStats(user.uid);
      setHasPracticed(true);
      toast.success('Challenge marked as practiced! +10 XP awarded.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to record practice session.');
    } finally {
      setPracticing(false);
    }
  };

  if (loading || !challenge) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-3xl flex items-center justify-center shadow-lg"
        >
          <Code size={40} className="text-white animate-pulse" />
        </motion.div>
        <p className="text-lg font-semibold text-[#7a6f65] animate-pulse">Generating coding challenge...</p>
      </div>
    );
  }

  // Get current active solution code
  const activeSolution = challenge.solutions.find(sol => sol.language === selectedLanguage) || challenge.solutions[0];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-[85vh] space-y-8">
      
      {/* ── HEADER BLOCK ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8FAF8F]/20 text-[#8FAF8F] rounded-full border border-white shadow-sm text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> Challenge of the Day
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#5a4f45] leading-tight">AI Coding Challenge</h1>
          <p className="text-sm text-[#9a8f85] font-semibold">
            Sharpen your problem-solving skills with a dynamically updated challenge every 4 hours.
          </p>
        </div>

        {/* Timer & Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-[#e8e0d8] shadow-sm">
          <div className="flex items-center gap-2 border-r border-[#e8e0d8] pr-4 shrink-0">
            <Clock size={16} className="text-[#A8C5DA]" />
            <div>
              <span className="block text-[9px] font-black uppercase text-[#9a8f85]">Rotates In</span>
              <span className="block font-black text-sm text-[#5a4f45] font-mono">{timeLeft || '00:00:00'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Diff Selector */}
            <div>
              <span className="block text-[9px] font-black uppercase text-[#9a8f85] mb-1">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="bg-transparent border-0 font-black text-sm text-[#8FAF8F] outline-none cursor-pointer p-0"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="p-2 bg-[#fcfbf9] border border-[#e8e0d8] hover:bg-[#e8e0d8]/20 transition-all rounded-xl shadow-sm text-[#5a4f45] disabled:opacity-50"
              title="Force New Challenge"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Problem, Solutions, & Complexity (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card Wrapper */}
          <div className="bg-white rounded-[2.5rem] border border-[#e8e0d8] shadow-xl overflow-hidden">
            
            {/* Header Tabs */}
            <div className="flex bg-[#fcfbf9] border-b border-[#e8e0d8] p-2">
              {[
                { id: 'problem', label: 'Problem Description', icon: FileText },
                { id: 'solution', label: 'Optimal Solution', icon: Code },
                { id: 'complexity', label: 'Complexity Analysis', icon: Brain }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all
                      ${activeTab === tab.id 
                        ? 'bg-white shadow-sm text-[#8FAF8F] border border-[#e8e0d8]/60' 
                        : 'text-[#7a6f65] hover:bg-white/50'
                      }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                
                {/* Tab 1: Problem Description */}
                {activeTab === 'problem' && (
                  <motion.div
                    key="problem"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="space-y-2 border-b border-[#e8e0d8]/60 pb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border
                          ${challenge.difficulty === 'Easy' ? 'bg-[#8FAF8F]/10 border-[#8FAF8F]/30 text-[#8FAF8F]' :
                            challenge.difficulty === 'Medium' ? 'bg-amber-100 border-amber-300 text-amber-500' :
                            'bg-red-50 border-red-200 text-red-500'}`}
                        >
                          {challenge.difficulty}
                        </span>
                        <span className="text-xs font-bold text-[#9a8f85] uppercase tracking-wider">{challenge.topic}</span>
                      </div>
                      <h2 className="text-2xl font-black text-[#5a4f45]">{challenge.title}</h2>
                    </div>

                    {/* Description */}
                    <p className="text-sm font-semibold text-[#7a6f65] leading-relaxed whitespace-pre-wrap">
                      {challenge.description}
                    </p>

                    {/* Constraints */}
                    {challenge.constraints?.length > 0 && (
                      <div className="bg-[#fcfbf9] border border-[#e8e0d8] p-5 rounded-2xl space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#9a8f85]">Constraints:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-[#7a6f65] font-semibold">
                          {challenge.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Examples */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-sm font-black uppercase tracking-wider text-[#5a4f45]">Examples</h3>
                      {challenge.examples?.map((ex, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-inner">
                          <span className="text-xs font-black text-slate-400 uppercase">Example {i + 1}</span>
                          <div className="space-y-2 text-xs font-mono">
                            <div><span className="text-slate-400 font-sans font-bold">Input:</span> <span className="text-slate-700">{ex.input}</span></div>
                            <div><span className="text-slate-400 font-sans font-bold">Output:</span> <span className="text-slate-700">{ex.output}</span></div>
                            {ex.explanation && (
                              <div className="pt-2 border-t border-slate-200/60 font-sans text-xs text-slate-500 leading-relaxed font-semibold">
                                <span className="font-bold text-slate-400">Explanation:</span> {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                  </motion.div>
                )}

                {/* Tab 2: Optimal Solution */}
                {activeTab === 'solution' && (
                  <motion.div
                    key="solution"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Language Toggler */}
                    <div className="flex justify-between items-center border-b border-[#e8e0d8]/60 pb-4">
                      <div className="flex bg-[#e8e0d8]/40 p-1 rounded-xl">
                        {challenge.solutions.map((sol) => (
                          <button
                            key={sol.language}
                            onClick={() => setSelectedLanguage(sol.language)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all
                              ${selectedLanguage === sol.language 
                                ? 'bg-white shadow-sm text-[#8FAF8F]' 
                                : 'text-[#7a6f65] hover:bg-white/50'
                              }`}
                          >
                            {sol.language}
                          </button>
                        ))}
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyCode(activeSolution.code)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fcfbf9] border border-[#e8e0d8] hover:bg-[#e8e0d8]/20 transition-all rounded-lg text-xs font-black uppercase text-[#7a6f65]"
                      >
                        {copied ? (
                          <>
                            <Check size={12} className="text-[#8FAF8F]" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy Code
                          </>
                        )}
                      </button>
                    </div>

                    {/* Code Container */}
                    <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl font-mono text-sm leading-relaxed overflow-x-auto shadow-2xl relative">
                      <pre className="whitespace-pre">{activeSolution.code}</pre>
                    </div>

                  </motion.div>
                )}

                {/* Tab 3: Complexity Analysis */}
                {activeTab === 'complexity' && (
                  <motion.div
                    key="complexity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-black text-[#5a4f45]">Big-O Complexity Breakdown</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Time */}
                      <div className="bg-white border border-[#e8e0d8] p-6 rounded-2xl shadow-sm relative overflow-hidden flex gap-4">
                        <div className="w-1.5 h-full absolute left-0 top-0 bg-[#8FAF8F]" />
                        <div className="p-3 bg-[#8FAF8F]/10 rounded-xl text-[#8FAF8F] shrink-0 h-fit shadow-inner">
                          <Clock size={20} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-black uppercase tracking-wider text-[#5a4f45]">Time Complexity</h4>
                          <p className="text-xs font-semibold text-[#7a6f65] leading-relaxed">
                            {challenge.complexity.time}
                          </p>
                        </div>
                      </div>

                      {/* Space */}
                      <div className="bg-white border border-[#e8e0d8] p-6 rounded-2xl shadow-sm relative overflow-hidden flex gap-4">
                        <div className="w-1.5 h-full absolute left-0 top-0 bg-[#A8C5DA]" />
                        <div className="p-3 bg-[#A8C5DA]/10 rounded-xl text-[#A8C5DA] shrink-0 h-fit shadow-inner">
                          <Cpu size={20} />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-black uppercase tracking-wider text-[#5a4f45]">Space Complexity</h4>
                          <p className="text-xs font-semibold text-[#7a6f65] leading-relaxed">
                            {challenge.complexity.space}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Instructions & Mark practiced (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Practice Action Panel */}
          <div className="bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/20 border border-white/40 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md">
                <Award size={24} className="text-white" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black leading-tight">Master This Problem</h3>
                <p className="text-xs text-white/90 font-medium leading-relaxed">
                  Analyze the description, walk through the examples, study the optimal solution, and mark this problem as practiced to earn XP.
                </p>
              </div>

              {hasPracticed ? (
                <div className="w-full py-4 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider shadow-inner">
                  <CheckCircle2 size={16} className="text-white" />
                  Already Practiced (+10 XP)
                </div>
              ) : (
                <button
                  onClick={handleMarkAsPracticed}
                  disabled={practicing}
                  className="w-full py-4 bg-white text-[#8FAF8F] rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 shadow-md"
                >
                  {practicing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Mark as Practiced
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Quick Learning Guidelines */}
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 border border-[#e8e0d8] shadow-sm space-y-5">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#5a4f45] border-b border-[#e8e0d8]/60 pb-3 flex items-center gap-2">
              <Brain size={14} className="text-[#8FAF8F]" /> Study Strategy
            </h4>
            
            <ul className="space-y-4">
              {[
                { title: 'Read Carefully', desc: 'Study the constraints first. They give big clues about what Big-O complexity the solution needs.' },
                { title: 'Trace Examples', desc: 'Manually trace the example inputs/outputs to make sure you fully understand edge cases.' },
                { title: 'Analyze Space/Time', desc: 'Compare the optimal solutions in JS and Python. Note how they maintain low auxiliary memory.' }
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="mt-1 w-5 h-5 bg-[#8FAF8F]/10 rounded-full flex items-center justify-center text-[10px] font-black text-[#8FAF8F] shrink-0">{i + 1}</div>
                  <div>
                    <h5 className="text-xs font-black text-[#5a4f45]">{step.title}</h5>
                    <p className="text-[10px] text-[#7a6f65] font-semibold leading-relaxed mt-0.5">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
