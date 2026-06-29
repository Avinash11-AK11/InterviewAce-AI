import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Settings, Play, Target, Clock, Activity, ChevronRight, Sparkles } from 'lucide-react';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

const SUGGESTIONS = [
  { text: 'Quantitative Analysis', emoji: '📊' },
  { text: 'Tricky Probability Puzzles', emoji: '🎲' },
  { text: 'Advanced React Hooks', emoji: '⚛️' },
  { text: 'System Design Basics', emoji: '🏗️' },
  { text: 'Data Interpretation', emoji: '📈' }
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function AptitudeHome() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(10);
  const [pastResults, setPastResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'results'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally since we don't have a composite index deployed
        results.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
        setPastResults(results.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch past results', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [currentUser]);

  const handleStartTest = () => {
    if (!topicInput.trim()) return;
    navigate('/aptitude/test', { 
      state: { 
        topic: topicInput, 
        difficulty, 
        count: questionCount 
      } 
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center shadow-lg text-white">
          <Brain size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#3a2f25]">AI Aptitude Tests</h1>
          <p className="text-[#7a6f65] mt-1 text-sm">Tell the AI what you want to practice, and it will generate a completely unique test.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] border border-white/60"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-[#e8e0d8] pb-3">
              <Settings className="text-[#8FAF8F]" />
              <h2 className="text-xl font-black text-[#3a2f25]">Test Configuration</h2>
            </div>

            {/* Custom AI Prompt Input */}
            <div className="mb-10">
              <label className="block text-xs font-black text-[#7a6f65] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-[#A8C5DA]" />
                What topic do you want to practice?
              </label>
              <div className="relative">
                <textarea
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g., 'Tricky probability questions for a data science interview' or 'JavaScript event loop tricky outputs'"
                  className="w-full p-5 rounded-2xl border border-white/40 bg-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:border-[#8FAF8F] focus:ring-4 focus:ring-[#8FAF8F]/15 transition-all outline-none resize-none text-[#3a2f25] placeholder:text-gray-400 font-semibold text-sm leading-relaxed"
                  rows={3}
                />
                <div className="absolute top-4 right-4 text-gray-300">
                  <Brain size={24} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-[#9a8f85] font-black uppercase tracking-widest mr-1">Popular:</span>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s.text}
                    onClick={() => setTopicInput(s.text)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-white/40 border border-white/50 text-[#7a6f65] font-bold hover:border-[#8FAF8F]/40 hover:bg-[#8FAF8F]/5 hover:text-[#5a6a5a] transition-all shadow-[2px_2px_6px_rgba(0,0,0,0.02)] hover:-translate-y-0.5 flex items-center gap-1"
                  >
                    <span>{s.emoji}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {/* Difficulty */}
              <div>
                <label className="block text-xs font-black text-[#7a6f65] uppercase tracking-wider mb-3">Difficulty Level</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`p-3.5 rounded-2xl border text-center text-sm font-black transition-all duration-300
                        ${difficulty === d 
                          ? 'border-none bg-gradient-to-r from-[#8FAF8F] to-[#7a9a7a] text-white shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),_2px_4px_12px_rgba(143,175,143,0.4)] scale-[1.02]' 
                          : 'border-white/60 bg-white/40 text-[#7a6f65] shadow-[3px_3px_6px_#e5ded6,_-3px_-3px_6px_#ffffff] hover:border-[#8FAF8F]/30 hover:bg-[#8FAF8F]/5 hover:text-[#5a6a5a] hover:scale-[1.02]'
                        }
                      `}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-black text-[#7a6f65] uppercase tracking-wider mb-3">Number of Questions</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[5, 10, 15, 20, 25, 30].map(num => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      className={`p-3.5 rounded-2xl border text-center text-sm font-black transition-all duration-300
                        ${questionCount === num 
                          ? 'border-none bg-gradient-to-r from-[#A8C5DA] to-[#8eb0c5] text-white shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1),_2px_4px_12px_rgba(168,197,218,0.4)] scale-[1.02]' 
                          : 'border-white/60 bg-white/40 text-[#7a6f65] shadow-[3px_3px_6px_#e5ded6,_-3px_-3px_6px_#ffffff] hover:border-[#A8C5DA]/30 hover:bg-[#A8C5DA]/5 hover:text-[#5a7a9a] hover:scale-[1.02]'
                        }
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Summary Card */}
              {(() => {
                const getXPPerQuestion = (diff) => {
                  switch (diff) {
                    case 'Beginner': return 10;
                    case 'Intermediate': return 15;
                    case 'Advanced': return 20;
                    case 'Expert': return 30;
                    default: return 10;
                  }
                };
                const maxXP = questionCount * getXPPerQuestion(difficulty);
                return (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-white/70 to-[#FAF6F1]/50 border border-white/60 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#7a6f65] shadow-[2px_2px_6px_rgba(0,0,0,0.02)] border border-white/50">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9a8f85] font-black uppercase tracking-wider">Estimated Time</p>
                        <p className="text-lg font-black text-[#3a2f25] font-mono">{questionCount * 2} mins</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-[#e8e0d8] hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-[2px_2px_6px_rgba(0,0,0,0.02)] border border-white/50">
                        <Target size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#9a8f85] font-black uppercase tracking-wider">Max XP Possible</p>
                        <p className="text-lg font-black text-amber-600 font-mono">Up to +{maxXP} XP</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Start Button */}
            <div className="mt-10">
              <button
                onClick={handleStartTest}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-[#8FAF8F]/25 hover:from-[#7ab07a] hover:to-[#98bad0] transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1"
              >
                <Play fill="currentColor" size={16} />
                Generate & Start Test
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Col: Past Results */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] border border-white/60"
          >
            <div className="flex items-center justify-between mb-6 border-b border-[#e8e0d8] pb-3">
              <div className="flex items-center gap-3">
                <Activity className="text-[#F0B8C8]" />
                <h2 className="text-lg font-black text-[#3a2f25]">Recent Performance</h2>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200/50 rounded-2xl" />
                ))}
              </div>
            ) : pastResults.length > 0 ? (
              <div className="space-y-4">
                {pastResults.map((result, i) => {
                  const getTopicEmoji = (topicName) => {
                    const lower = topicName.toLowerCase();
                    if (lower.includes('quant') || lower.includes('math') || lower.includes('probab')) return '🎲';
                    if (lower.includes('react') || lower.includes('code') || lower.includes('js') || lower.includes('javascript')) return '⚛️';
                    if (lower.includes('design') || lower.includes('arch')) return '🏗️';
                    if (lower.includes('data')) return '📈';
                    return '📝';
                  };

                  const scoreBg = result.score >= 80 
                    ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                    : result.score >= 50 
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                      : 'bg-red-500/10 text-red-600 border-red-500/20';

                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      onClick={() => navigate(`/aptitude/result/${result.id}`)}
                      className="p-4 rounded-2xl bg-white/40 border border-white/50 hover:bg-white/80 transition-all cursor-pointer group shadow-[4px_4px_8px_rgba(0,0,0,0.01)] hover:shadow-[4px_4px_12px_rgba(0,0,0,0.03)] flex gap-3.5 items-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-[2px_2px_6px_rgba(0,0,0,0.02)] border border-white/60 shrink-0">
                        {getTopicEmoji(result.topic)}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-[#3a2f25] text-sm truncate leading-snug group-hover:text-[#8FAF8F] transition-colors">{result.topic}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] uppercase font-black text-[#8a7f75] bg-[#8a7f75]/10 px-2 py-0.5 rounded-full">
                            {result.difficulty}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">{new Date(result.createdAt?.toDate()).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${scoreBg} shadow-sm`}>
                          {result.score}%
                        </div>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-[#3a2f25] group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 px-4 bg-white/30 rounded-2xl border border-dashed border-[#e8e0d8] shadow-inner">
                <Target size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-bold text-sm">No tests taken yet</p>
                <p className="text-gray-400 text-xs mt-1">Configure your first test and get started!</p>
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
