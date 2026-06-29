import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Target, Clock, CheckCircle2, XCircle, BrainCircuit } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function TestResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      if (!id) return;
      try {
        const docRef = doc(db, 'results', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResult(docSnap.data());
        }
      } catch (err) {
        console.error('Failed to load result', err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#8FAF8F]" size={40} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-700">Result Not Found</h2>
        <button onClick={() => navigate('/aptitude')} className="mt-4 px-6 py-2 bg-gray-200 rounded-xl">Go Back</button>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const isHigh = result.score >= 80;
  const isMed = result.score >= 50 && result.score < 80;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <button 
        onClick={() => navigate('/aptitude')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Header Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 text-sm font-bold uppercase tracking-wider mb-6">
          <Target size={16} /> {result.topic} • {result.difficulty}
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Score Circle */}
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="stroke-gray-100" strokeWidth="12" fill="none" />
              <motion.circle 
                cx="80" cy="80" r="70" 
                className={isHigh ? 'stroke-green-400' : isMed ? 'stroke-yellow-400' : 'stroke-red-400'} 
                strokeWidth="12" fill="none" strokeLinecap="round"
                initial={{ strokeDasharray: '440', strokeDashoffset: '440' }}
                animate={{ strokeDashoffset: 440 - (440 * result.score) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${isHigh ? 'text-green-500' : isMed ? 'text-yellow-500' : 'text-red-500'}`}>
                {result.score}%
              </span>
            </div>
          </div>

          <div className="text-left space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Time Taken</p>
              <p className="text-xl font-bold text-[#3a2f25] flex items-center gap-2">
                <Clock className="text-[#A8C5DA]" /> {formatTime(result.timeTaken)}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Questions</p>
              <p className="text-xl font-bold text-[#3a2f25] flex items-center gap-2">
                <BrainCircuit className="text-[#d08898]" /> {result.questions?.length || 0}
              </p>
            </div>
            {/* Show XP Earned Based on Score */}
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
              const maxXP = (result.questions?.length || 10) * getXPPerQuestion(result.difficulty);
              const earnedXP = result.score >= 50 ? Math.round((result.score / 100) * maxXP) : 0;
              return (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-100 bg-amber-50">
                  <span className="text-sm font-bold text-amber-600 uppercase tracking-wider">XP Earned:</span>
                  <span className="text-xl font-black text-amber-500">
                    +{earnedXP} XP
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </motion.div>

      {/* Detailed Breakdown */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#3a2f25] px-2">Detailed Breakdown</h3>
        
        {result.questions?.map((q, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-3xl border-2 bg-white/80 backdrop-blur-xl shadow-sm
              ${q.isCorrect ? 'border-green-100' : 'border-red-100'}
            `}
          >
            <div className="flex items-start gap-4">
              <div className="pt-1">
                {q.isCorrect ? (
                  <CheckCircle2 className="text-green-500" size={24} />
                ) : (
                  <XCircle className="text-red-500" size={24} />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <h4 className="text-lg font-bold text-[#3a2f25]">{i + 1}. {q.question}</h4>
                
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const isUserPick = q.userAnswer === opt;
                    const isActualCorrect = q.correctAnswer === opt;
                    
                    let bg = 'bg-gray-50 border-gray-100';
                    let text = 'text-gray-600';
                    if (isActualCorrect) {
                      bg = 'bg-green-50 border-green-200';
                      text = 'text-green-700 font-bold';
                    } else if (isUserPick && !isActualCorrect) {
                      bg = 'bg-red-50 border-red-200';
                      text = 'text-red-700 font-bold';
                    }

                    return (
                      <div key={j} className={`p-3 rounded-xl border flex items-center justify-between ${bg}`}>
                        <span className={text}>{opt}</span>
                        {isUserPick && <span className={`text-xs px-2 py-1 rounded-md ${isActualCorrect ? 'bg-green-200/50 text-green-700' : 'bg-red-200/50 text-red-700'}`}>Your Answer</span>}
                        {isActualCorrect && !isUserPick && <span className="text-xs px-2 py-1 rounded-md bg-green-200/50 text-green-700">Correct Answer</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <p className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                    <BrainCircuit size={16} /> AI Explanation
                  </p>
                  <p className="text-sm text-blue-900 leading-relaxed">
                    {q.explanation || 'No explanation provided.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
