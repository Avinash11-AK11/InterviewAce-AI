import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Send, Loader2, CheckCircle, AlertCircle,
  Lightbulb, BookOpen, TrendingUp, Star, Clock,
  ChevronDown, X, Zap, Target, BarChart2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, query, where, orderBy, limit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { evaluateAnswer } from '../../services/geminiService';

const DOMAINS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'SQL / Databases',
  'System Design', 'Data Structures', 'Algorithms', 'CSS / HTML',
  'DevOps / CI/CD', 'TypeScript', 'iOS / Swift', 'General Programming',
];

function ScoreRing({ score, size = 120, color }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / 1000, 1);
      setDisplay(Math.round(prog * score));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  const offset = circumference - (display / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e8e0d8" strokeWidth={10} />
        <motion.circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: '#2d3748' }}>{display}</span>
        <span className="text-xs" style={{ color: '#a0aec0' }}>/ 100</span>
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-4 rounded-full" style={{ background: '#e8e0d8', width: '60%' }} />
      <div className="h-24 rounded-xl" style={{ background: '#e8e0d8' }} />
      <div className="h-4 rounded-full" style={{ background: '#e8e0d8', width: '40%' }} />
      <div className="h-16 rounded-xl" style={{ background: '#e8e0d8' }} />
      <div className="h-4 rounded-full" style={{ background: '#e8e0d8', width: '75%' }} />
    </div>
  );
}

// HistoryCard removed as per user request

export default function AnswerEvaluator() {
  const { currentUser } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [domain, setDomain] = useState('');
  const [domainOpen, setDomainOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  // History loading removed as per user request
  const handleEvaluate = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Please provide both a question and your answer.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const evaluation = await evaluateAnswer(question, answer, domain || 'General');
      setResult(evaluation);
      // History saving removed as per user request
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err.message || 'The AI is currently experiencing high demand or an error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = score => {
    if (score >= 80) return '#8FAF8F';
    if (score >= 60) return '#A8C5DA';
    if (score >= 40) return '#FCD34D';
    return '#F87171';
  };

  const getScoreLabel = score => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: '#F5EFE6' }}>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #F5EFE6 0%, #EDE8E0 100%)' }}
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
          style={{ background: '#A8C5DA22', color: '#4a90a4', border: '1px solid #A8C5DA44' }}
        >
          <Zap size={14} />
          AI-Powered Evaluation
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: '#2d3748' }}>
          Answer Evaluator
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: '#718096' }}>
          Get instant AI feedback on your interview answers. Know exactly what you're missing.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT: Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="rounded-3xl p-6"
              style={{
                background: '#FAF6F1',
                boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
              }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#2d3748' }}>
                Submit for Evaluation
              </h2>

              {/* Question Input */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  What is the question? *
                </label>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g., Explain how useEffect works in React..."
                  rows={3}
                  className="w-full resize-none rounded-xl p-4 text-sm outline-none transition-all"
                  style={{
                    background: '#F5EFE6',
                    border: '2px solid transparent',
                    color: '#2d3748',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 3px 3px 6px #e8e0d8, inset -3px -3px 6px #ffffff',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#8FAF8F')}
                  onBlur={e => (e.target.style.borderColor = 'transparent')}
                />
              </div>

              {/* Answer Input */}
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Your Answer *
                </label>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write your answer here in as much detail as possible..."
                  rows={7}
                  className="w-full resize-none rounded-xl p-4 text-sm outline-none transition-all"
                  style={{
                    background: '#F5EFE6',
                    border: '2px solid transparent',
                    color: '#2d3748',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 3px 3px 6px #e8e0d8, inset -3px -3px 6px #ffffff',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#A8C5DA')}
                  onBlur={e => (e.target.style.borderColor = 'transparent')}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: '#a0aec0' }}>
                    {answer.length} characters
                  </span>
                  {answer.length > 0 && (
                    <button onClick={() => setAnswer('')} className="text-xs" style={{ color: '#a0aec0' }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Domain Input */}
              <div className="mb-6 relative">
                <label className="block text-sm font-medium mb-2" style={{ color: '#4a5568' }}>
                  Topic / Domain *
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g., React, System Design, Marketing..."
                  className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                  style={{
                    background: '#F5EFE6',
                    border: '2px solid transparent',
                    color: '#2d3748',
                    fontFamily: 'inherit',
                    boxShadow: 'inset 3px 3px 6px #e8e0d8, inset -3px -3px 6px #ffffff',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#8FAF8F')}
                  onBlur={e => (e.target.style.borderColor = 'transparent')}
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl mb-4"
                    style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}
                  >
                    <AlertCircle size={16} style={{ color: '#EF4444' }} />
                    <span className="text-sm" style={{ color: '#DC2626' }}>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Evaluate Button */}
              <motion.button
                whileHover={!loading ? { scale: 1.03, y: -1 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base"
                style={{
                  background: loading
                    ? '#a0aec0'
                    : 'linear-gradient(135deg, #8FAF8F 0%, #6a9a6a 50%, #A8C5DA 100%)',
                  boxShadow: loading ? 'none' : '0 6px 24px rgba(143, 175, 143, 0.5)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    AI is evaluating...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Evaluate Answer
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT: Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: '#FAF6F1',
                    boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
                  }}
                >
                  <div
                    className="px-6 py-4 border-b"
                    style={{ borderColor: '#e8e0d8' }}
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" style={{ color: '#8FAF8F' }} />
                      <span className="text-sm font-medium" style={{ color: '#718096' }}>
                        Gemini AI is analyzing your answer...
                      </span>
                    </div>
                  </div>
                  <SkeletonLoader />
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: '#FAF6F1',
                    boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
                  }}
                >
                  {/* Score Header */}
                  <div
                    className="px-6 py-5 border-b"
                    style={{
                      background: `linear-gradient(135deg, ${getScoreColor(result.score)}11, transparent)`,
                      borderColor: '#e8e0d8',
                    }}
                  >
                    <div className="flex items-center gap-5">
                      <ScoreRing score={result.score} color={getScoreColor(result.score)} />
                      <div>
                        <div className="text-2xl font-bold" style={{ color: '#2d3748' }}>
                          {getScoreLabel(result.score)}
                        </div>
                        <div className="text-sm" style={{ color: '#718096' }}>
                          Score: {result.score}/100
                        </div>
                        <div
                          className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: `${getScoreColor(result.score)}22`,
                            color: getScoreColor(result.score),
                          }}
                        >
                          Grade: {result.grade || 'B+'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Correctness Assessment */}
                    {result.correctness && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} style={{ color: '#8FAF8F' }} />
                          <span className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                            Assessment
                          </span>
                        </div>
                        <p className="text-sm p-3 rounded-xl" style={{ background: '#F5EFE6', color: '#4a5568' }}>
                          {result.correctness}
                        </p>
                      </div>
                    )}

                    {/* Missing Points */}
                    {result.missingPoints?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={14} style={{ color: '#FB923C' }} />
                          <span className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                            Missing Points
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {result.missingPoints.map((point, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: '#FB923C22' }}
                              >
                                <span style={{ color: '#FB923C', fontSize: 10 }}>!</span>
                              </div>
                              <span style={{ color: '#4a5568' }}>{point}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Model Answer */}
                    {result.modelAnswer && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={14} style={{ color: '#A8C5DA' }} />
                          <span className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                            Model Answer
                          </span>
                        </div>
                        <div
                          className="p-4 rounded-xl text-sm leading-relaxed"
                          style={{ background: '#A8C5DA11', border: '1px solid #A8C5DA33', color: '#2d3748' }}
                        >
                          {result.modelAnswer}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {result.tips?.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb size={14} style={{ color: '#FCD34D' }} />
                          <span className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                            Tips for Improvement
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {result.tips.map((tip, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 + 0.2 }}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle size={13} style={{ color: '#8FAF8F', flexShrink: 0, marginTop: 3 }} />
                              <span style={{ color: '#4a5568' }}>{tip}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Re-evaluate */}
                    <button
                      onClick={() => setResult(null)}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm"
                      style={{ color: '#a0aec0', border: '1px dashed #e8e0d8' }}
                    >
                      <RefreshCw size={14} />
                      Clear & Try Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                  style={{
                    background: '#FAF6F1',
                    boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
                    minHeight: 400,
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                    style={{ background: '#8FAF8F22' }}
                  >
                    <BarChart2 size={36} style={{ color: '#8FAF8F' }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#2d3748' }}>
                    Your Results Appear Here
                  </h3>
                  <p className="text-sm" style={{ color: '#a0aec0' }}>
                    Enter a question and your answer, then click "Evaluate Answer" to get instant AI feedback.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        {/* History Section Removed */}
      </div>
    </div>
  );
}
