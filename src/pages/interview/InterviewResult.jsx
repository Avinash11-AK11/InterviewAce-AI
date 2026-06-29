import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Star, Share2, Download, ChevronDown, ChevronUp,
  CheckCircle, TrendingUp, MessageSquare, Brain, Target,
  Zap, ArrowLeft, Home, RotateCcw, Award, Clock,
  ThumbsUp, AlertTriangle, BookOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

function CircularProgress({ score, size = 160, strokeWidth = 10, color = '#8FAF8F' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplayScore(Math.round(progress * score));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8e0d8"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: '#2d3748' }}>
          {displayScore}
        </span>
        <span className="text-sm" style={{ color: '#718096' }}>out of 100</span>
      </div>
    </div>
  );
}

function AnimatedBar({ label, score, maxScore = 10, color, icon: Icon }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color }} />
          <span className="text-sm font-medium" style={{ color: '#4a5568' }}>
            {label}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ color: '#2d3748' }}>
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: '#e8e0d8' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(score / maxScore) * 100}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
    </div>
  );
}

function getPerformanceLevel(score) {
  if (score >= 85) return { label: 'Outstanding', color: '#8FAF8F', emoji: '🏆', bg: '#8FAF8F22' };
  if (score >= 70) return { label: 'Good', color: '#A8C5DA', emoji: '👍', bg: '#A8C5DA22' };
  if (score >= 50) return { label: 'Average', color: '#FCD34D', emoji: '📈', bg: '#FCD34D22' };
  return { label: 'Needs Work', color: '#F87171', emoji: '💪', bg: '#F8717122' };
}

function QuestionCard({ question, answer, evaluation, index }) {
  const [expanded, setExpanded] = useState(false);
  const score = evaluation?.score || 0;
  const scoreColor = score >= 75 ? '#8FAF8F' : score >= 50 ? '#FCD34D' : '#F87171';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: '#FAF6F1',
        boxShadow: '6px 6px 14px #e8e0d8, -6px -6px 14px #ffffff',
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: scoreColor }}
          >
            {index + 1}
          </div>
          <p className="text-sm font-medium truncate" style={{ color: '#2d3748' }}>
            {typeof question === 'object' ? question.question || question.text : question}
          </p>
        </div>
        <div className="flex items-center gap-3 ml-3 flex-shrink-0">
          {evaluation ? (
            <span
              className="px-2 py-1 rounded-full text-xs font-bold"
              style={{ background: `${scoreColor}22`, color: scoreColor }}
            >
              {score}/100
            </span>
          ) : (
            <span className="text-xs" style={{ color: '#a0aec0' }}>Skipped</span>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} style={{ color: '#a0aec0' }} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 pb-5 border-t" style={{ borderColor: '#e8e0d8' }}>
              {/* Answer */}
              {answer ? (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={14} style={{ color: '#A8C5DA' }} />
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#A8C5DA' }}>
                      Your Answer
                    </span>
                  </div>
                  <p className="text-sm p-3 rounded-xl" style={{ background: '#F5EFE6', color: '#4a5568' }}>
                    {answer}
                  </p>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: '#FFF5F5', color: '#FC8181' }}>
                  Question was skipped
                </div>
              )}

              {/* Ideal Answer (from the question itself, if provided) */}
              {typeof question === 'object' && question.idealAnswer && !evaluation?.betterAnswer && (
                 <div className="flex items-start gap-2 p-3 rounded-xl mb-3 mt-4" style={{ background: '#8FAF8F11' }}>
                    <Brain size={14} style={{ color: '#8FAF8F', flexShrink: 0, marginTop: 2 }} />
                    <div className="text-sm" style={{ color: '#4a5568' }}>
                       <span className="font-semibold block mb-1" style={{ color: '#3a7a3a' }}>Ideal Answer:</span>
                       {question.idealAnswer}
                    </div>
                 </div>
              )}

              {/* AI Feedback */}
              {evaluation && (
                <div className="mt-4">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Technical', value: evaluation.technical || 0, color: '#A8C5DA' },
                      { label: 'Communication', value: evaluation.communication || 0, color: '#8FAF8F' },
                      { label: 'Confidence', value: evaluation.confidence || 0, color: '#F0B8C8' },
                      { label: 'Problem Solving', value: evaluation.problemSolving || 0, color: '#C4B5FD' },
                    ].map(m => (
                      <div key={m.label} className="p-3 rounded-xl" style={{ background: `${m.color}11` }}>
                        <div className="text-xs" style={{ color: '#718096' }}>{m.label}</div>
                        <div className="text-lg font-bold" style={{ color: m.color }}>{m.value}/100</div>
                      </div>
                    ))}
                  </div>

                  {/* Feedback */}
                  {evaluation.feedback && (
                    <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: '#A8C5DA11' }}>
                      <BookOpen size={14} style={{ color: '#A8C5DA', flexShrink: 0, marginTop: 2 }} />
                      <p className="text-sm" style={{ color: '#4a5568' }}>{evaluation.feedback}</p>
                    </div>
                  )}

                  {/* Better Answer */}
                  {evaluation.betterAnswer && (
                    <div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{ background: '#8FAF8F11' }}>
                      <Brain size={14} style={{ color: '#8FAF8F', flexShrink: 0, marginTop: 2 }} />
                      <div className="text-sm" style={{ color: '#4a5568' }}>
                        <span className="font-semibold block mb-1" style={{ color: '#3a7a3a' }}>Expected Answer / Key Points:</span>
                        {evaluation.betterAnswer}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {evaluation.strengths?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ThumbsUp size={13} style={{ color: '#8FAF8F' }} />
                        <span className="text-xs font-medium" style={{ color: '#8FAF8F' }}>Strengths</span>
                      </div>
                      <ul className="space-y-1">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#4a5568' }}>
                            <CheckCircle size={11} style={{ color: '#8FAF8F', flexShrink: 0, marginTop: 2 }} />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {evaluation.improvements?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle size={13} style={{ color: '#FCD34D' }} />
                        <span className="text-xs font-medium" style={{ color: '#b7860a' }}>Areas to Improve</span>
                      </div>
                      <ul className="space-y-1">
                        {evaluation.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#4a5568' }}>
                            <AlertTriangle size={11} style={{ color: '#FCD34D', flexShrink: 0, marginTop: 2 }} />
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InterviewResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const sessionData = location.state || {};
  const {
    questions = [],
    answers = [],
    evaluations = [],
    role = 'Developer',
    difficulty = 'mid',
    totalTime = 0,
    questionCount,
    answeredCount,
  } = sessionData;

  // Calculate overall score
  const validEvals = evaluations.filter(e => e);
  const overallScore =
    validEvals.length > 0
      ? Math.round(validEvals.reduce((sum, e) => sum + (e.score || 0), 0) / validEvals.length)
      : 0;

  const avgTechnical = validEvals.length
    ? Math.round(validEvals.reduce((s, e) => s + (e.technical || 0), 0) / validEvals.length)
    : 0;
  const avgCommunication = validEvals.length
    ? Math.round(validEvals.reduce((s, e) => s + (e.communication || 0), 0) / validEvals.length)
    : 0;
  const avgConfidence = validEvals.length
    ? Math.round(validEvals.reduce((s, e) => s + (e.confidence || 0), 0) / validEvals.length)
    : 0;
  const avgProblemSolving = validEvals.length
    ? Math.round(validEvals.reduce((s, e) => s + (e.problemSolving || 0), 0) / validEvals.length)
    : 0;

  const performance = getPerformanceLevel(overallScore);
  const xpGained = Math.round((overallScore / 100) * 500);

  const formatTime = s => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: '#F5EFE6' }}>
      {/* Hero Result Section */}
      <div
        className="relative overflow-hidden py-16 px-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #F5EFE6 0%, #EDE8E0 60%, #E8F0E8 100%)',
        }}
      >
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: '#A8C5DA', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: '#F0B8C8', transform: 'translate(-30%, 30%)' }} />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Performance badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-bold mb-6"
            style={{ background: performance.bg, color: performance.color }}
          >
            <span className="text-xl">{performance.emoji}</span>
            {performance.label} Performance
          </motion.div>

          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2d3748' }}>
            Interview Complete!
          </h1>
          <p className="text-lg mb-8" style={{ color: '#718096' }}>
            {role} · {difficulty} level
          </p>

          {/* Score Ring */}
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
              className="p-8 rounded-full"
              style={{
                background: '#FAF6F1',
                boxShadow: '12px 12px 28px #e8e0d8, -12px -12px 28px #ffffff',
              }}
            >
              <CircularProgress
                score={overallScore}
                size={180}
                strokeWidth={12}
                color={performance.color}
              />
            </motion.div>
          </div>

          {/* XP Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #FCD34D22, #F0B8C822)',
              border: '2px solid #FCD34D66',
            }}
          >
            <Zap size={20} style={{ color: '#FCD34D' }} />
            <span className="text-lg font-bold" style={{ color: '#92710a' }}>
              +{xpGained} XP Earned!
            </span>
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {[
            { label: 'Questions', value: questions.length, icon: Brain, color: '#A8C5DA' },
            { label: 'Answered', value: answers.filter(a => a?.trim()).length, icon: CheckCircle, color: '#8FAF8F' },
            { label: 'Time Taken', value: formatTime(totalTime), icon: Clock, color: '#F0B8C8' },
            { label: 'Overall Score', value: `${overallScore}%`, icon: Trophy, color: '#FCD34D' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 rounded-2xl text-center"
                style={{
                  background: '#FAF6F1',
                  boxShadow: '6px 6px 14px #e8e0d8, -6px -6px 14px #ffffff',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${stat.color}22` }}
                >
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                <div className="text-xl font-bold" style={{ color: '#2d3748' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: '#a0aec0' }}>{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Metric Score Bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-3xl mb-8"
          style={{
            background: '#FAF6F1',
            boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
          }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: '#2d3748' }}>
            Performance Breakdown
          </h2>
          <AnimatedBar label="Technical Accuracy" score={avgTechnical} maxScore={100} color="#A8C5DA" icon={Brain} />
          <AnimatedBar label="Communication" score={avgCommunication} maxScore={100} color="#8FAF8F" icon={MessageSquare} />
          <AnimatedBar label="Confidence" score={avgConfidence} maxScore={100} color="#F0B8C8" icon={Star} />
          <AnimatedBar label="Problem Solving" score={avgProblemSolving} maxScore={100} color="#C4B5FD" icon={Target} />
        </motion.div>

        {/* Question Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-10"
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
            Question-by-Question Breakdown
          </h2>
          <p className="text-sm mb-6" style={{ color: '#718096' }}>
            Click any question to see detailed feedback
          </p>
          {questions.map((q, i) => (
            <QuestionCard
              key={i}
              question={q}
              answer={answers[i]}
              evaluation={evaluations[i]}
              index={i}
            />
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/mock-interview')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #8FAF8F, #A8C5DA)',
              boxShadow: '0 4px 20px rgba(143, 175, 143, 0.4)',
            }}
          >
            <RotateCcw size={18} />
            Practice Again
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const text = `I just completed an AI Mock Interview on InterviewAce AI!\n\nRole: ${role}\nDifficulty: ${difficulty}\nScore: ${overallScore}/100\n\nCheck it out!`;
              if (navigator.share) {
                navigator.share({ title: 'Interview Results', text });
              } else {
                navigator.clipboard.writeText(text);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
            style={{
              background: '#FAF6F1',
              color: '#4a5568',
              boxShadow: '4px 4px 10px #e8e0d8, -4px -4px 10px #ffffff',
            }}
          >
            <Share2 size={18} />
            Share Results
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
            style={{ color: '#a0aec0' }}
          >
            <Home size={18} />
            Dashboard
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
