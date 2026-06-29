import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, Server, Layers, Smartphone, BarChart2, Terminal,
  ChevronDown, ChevronUp, Sparkles, Clock, Target, Brain,
  CheckCircle, AlertCircle, Lightbulb, ArrowRight, Loader2
} from 'lucide-react';
import { generateInterviewQuestions } from '../../services/geminiService';

const ROLES = [
  {
    id: 'frontend',
    label: 'Frontend Developer',
    icon: Code2,
    color: '#A8C5DA',
    bg: 'from-sky-100 to-blue-50',
    description: 'React, CSS, JavaScript, UI/UX',
  },
  {
    id: 'backend',
    label: 'Backend Developer',
    icon: Server,
    color: '#8FAF8F',
    bg: 'from-green-100 to-emerald-50',
    description: 'APIs, Databases, Node.js, Python',
  },
  {
    id: 'fullstack',
    label: 'Full Stack',
    icon: Layers,
    color: '#F0B8C8',
    bg: 'from-pink-100 to-rose-50',
    description: 'End-to-end development',
  },
  {
    id: 'ios',
    label: 'iOS Developer',
    icon: Smartphone,
    color: '#C4B5FD',
    bg: 'from-violet-100 to-purple-50',
    description: 'Swift, SwiftUI, Xcode',
  },
  {
    id: 'data',
    label: 'Data Analyst',
    icon: BarChart2,
    color: '#FCD34D',
    bg: 'from-yellow-100 to-amber-50',
    description: 'SQL, Python, Visualization',
  },
  {
    id: 'devops',
    label: 'DevOps',
    icon: Terminal,
    color: '#6EE7B7',
    bg: 'from-teal-100 to-cyan-50',
    description: 'CI/CD, Docker, Kubernetes',
  },
];

const DIFFICULTIES = [
  { id: 'junior', label: 'Junior', desc: '0–2 years', color: '#8FAF8F', emoji: '🌱' },
  { id: 'mid', label: 'Mid-level', desc: '2–5 years', color: '#A8C5DA', emoji: '🚀' },
  { id: 'senior', label: 'Senior', desc: '5+ years', color: '#F0B8C8', emoji: '⭐' },
];

const QUESTION_COUNTS = [5, 10, 15];

const TIPS = [
  { icon: Clock, text: "Take your time to think before answering. It's okay to pause." },
  { icon: Target, text: 'Structure your answers using STAR: Situation, Task, Action, Result.' },
  { icon: Brain, text: 'Think out loud — interviewers love to see your thought process.' },
  { icon: CheckCircle, text: 'Be specific. Use real examples from your experience when possible.' },
  { icon: AlertCircle, text: "It's fine to say you don't know — show curiosity and how you'd find out." },
  { icon: Lightbulb, text: 'Ask clarifying questions if the problem is ambiguous.' },
];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [difficulty, setDifficulty] = useState('mid');
  const [questionCount, setQuestionCount] = useState(10);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Analyzing role requirements...',
    'Crafting tailored questions...',
    'Calibrating difficulty level...',
    'Preparing your interview...',
  ];

  const handleStart = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue.');
      return;
    }
    setError('');
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 800);

    try {
      const role = ROLES.find(r => r.id === selectedRole);
      const questions = await generateInterviewQuestions(role.label, difficulty, questionCount);

      clearInterval(stepInterval);

      navigate('/mock-interview/session', {
        state: {
          questions,
          role: role.label,
          difficulty,
          questionCount,
        },
      });
    } catch (err) {
      clearInterval(stepInterval);
      setError('Failed to generate questions. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5EFE6' }}>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden py-16 px-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #F5EFE6 0%, #EDE8E0 50%, #E8F0E8 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: '#A8C5DA', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: '#F0B8C8', transform: 'translate(-30%, 30%)' }}
        />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              background: 'rgba(143, 175, 143, 0.2)',
              color: '#5a8a5a',
              border: '1px solid rgba(143, 175, 143, 0.4)',
            }}
          >
            <Sparkles size={14} />
            Powered by Gemini AI
          </div>

          <h1 className="text-5xl font-bold mb-4" style={{ color: '#2d3748' }}>
            AI Mock Interview
          </h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: '#718096' }}>
            Practice with personalized AI-generated questions tailored to your role and experience level. Get instant, detailed feedback on every answer.
          </p>
        </motion.div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {/* Role Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2d3748' }}>
            Choose Your Role
          </h2>
          <p className="text-sm mb-6" style={{ color: '#718096' }}>
            Select the position you're interviewing for
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ROLES.map((role, i) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i + 0.3 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedRole(role.id)}
                  className="relative p-5 rounded-2xl text-left transition-all duration-200"
                  style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${role.color}33, ${role.color}11)`
                      : '#FAF6F1',
                    border: isSelected
                      ? `2px solid ${role.color}`
                      : '2px solid transparent',
                    boxShadow: isSelected
                      ? `0 8px 32px ${role.color}44`
                      : '6px 6px 12px #e8e0d8, -6px -6px 12px #ffffff',
                  }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: role.color }}
                    >
                      <CheckCircle size={12} color="white" />
                    </motion.div>
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${role.color}33` }}
                  >
                    <Icon size={20} style={{ color: role.color }} />
                  </div>
                  <div className="font-semibold text-sm" style={{ color: '#2d3748' }}>
                    {role.label}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#a0aec0' }}>
                    {role.description}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Difficulty & Question Count */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Difficulty */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#2d3748' }}>
              Experience Level
            </h2>
            <p className="text-sm mb-6" style={{ color: '#718096' }}>
              Adjusts question complexity accordingly
            </p>
            <div className="flex flex-col gap-3">
              {DIFFICULTIES.map(d => {
                const isSelected = difficulty === d.id;
                return (
                  <motion.button
                    key={d.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDifficulty(d.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                    style={{
                      background: isSelected ? `${d.color}22` : '#FAF6F1',
                      border: isSelected ? `2px solid ${d.color}` : '2px solid transparent',
                      boxShadow: isSelected
                        ? `0 4px 20px ${d.color}44`
                        : '4px 4px 8px #e8e0d8, -4px -4px 8px #ffffff',
                    }}
                  >
                    <span className="text-2xl">{d.emoji}</span>
                    <div>
                      <div className="font-semibold" style={{ color: '#2d3748' }}>
                        {d.label}
                      </div>
                      <div className="text-xs" style={{ color: '#a0aec0' }}>
                        {d.desc} experience
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <CheckCircle size={18} style={{ color: d.color }} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* Question Count */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#2d3748' }}>
              Number of Questions
            </h2>
            <p className="text-sm mb-6" style={{ color: '#718096' }}>
              Choose how long your session should be
            </p>
            <div className="flex flex-col gap-3">
              {QUESTION_COUNTS.map(count => {
                const isSelected = questionCount === count;
                const timeEst = count === 5 ? '~10 min' : count === 10 ? '~20 min' : '~30 min';
                const label = count === 5 ? 'Quick Practice' : count === 10 ? 'Standard Session' : 'Deep Dive';
                return (
                  <motion.button
                    key={count}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setQuestionCount(count)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                    style={{
                      background: isSelected ? '#A8C5DA22' : '#FAF6F1',
                      border: isSelected ? '2px solid #A8C5DA' : '2px solid transparent',
                      boxShadow: isSelected
                        ? '0 4px 20px #A8C5DA44'
                        : '4px 4px 8px #e8e0d8, -4px -4px 8px #ffffff',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                      style={{
                        background: isSelected ? '#A8C5DA33' : '#f0ebe4',
                        color: isSelected ? '#4a90a4' : '#a0aec0',
                      }}
                    >
                      {count}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#2d3748' }}>
                        {label}
                      </div>
                      <div className="text-xs" style={{ color: '#a0aec0' }}>
                        {count} questions · {timeEst}
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                        <CheckCircle size={18} style={{ color: '#A8C5DA' }} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        </div>

        {/* Interview Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10 rounded-2xl overflow-hidden"
          style={{
            background: '#FAF6F1',
            boxShadow: '6px 6px 14px #e8e0d8, -6px -6px 14px #ffffff',
          }}
        >
          <button
            onClick={() => setTipsOpen(o => !o)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#F0B8C833' }}
              >
                <Lightbulb size={16} style={{ color: '#d4737a' }} />
              </div>
              <span className="font-semibold text-lg" style={{ color: '#2d3748' }}>
                Interview Tips & Best Practices
              </span>
            </div>
            <motion.div animate={{ rotate: tipsOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown size={20} style={{ color: '#a0aec0' }} />
            </motion.div>
          </button>

          <AnimatePresence>
            {tipsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-5 pb-5 grid md:grid-cols-2 gap-3">
                  {TIPS.map((tip, i) => {
                    const Icon = tip.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: '#F5EFE6' }}
                      >
                        <Icon size={16} style={{ color: '#8FAF8F', flexShrink: 0, marginTop: 2 }} />
                        <span className="text-sm" style={{ color: '#4a5568' }}>
                          {tip.text}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-3 p-4 rounded-xl"
              style={{ background: '#FEE2E2', border: '1px solid #FCA5A5' }}
            >
              <AlertCircle size={18} style={{ color: '#EF4444' }} />
              <span className="text-sm" style={{ color: '#DC2626' }}>
                {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <motion.button
            whileHover={!loading ? { scale: 1.04, y: -2 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            onClick={handleStart}
            disabled={loading}
            className="relative inline-flex items-center gap-3 px-12 py-5 rounded-2xl text-white font-bold text-lg overflow-hidden"
            style={{
              background: loading
                ? '#a0aec0'
                : 'linear-gradient(135deg, #8FAF8F 0%, #6a9a6a 50%, #A8C5DA 100%)',
              boxShadow: loading
                ? 'none'
                : '0 8px 32px rgba(143, 175, 143, 0.5), 0 4px 16px rgba(168, 197, 218, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span>{loadingSteps[loadingStep]}</span>
              </>
            ) : (
              <>
                <Sparkles size={22} />
                <span>Start Interview</span>
                <ArrowRight size={22} />
              </>
            )}
          </motion.button>

          {!loading && (
            <p className="mt-3 text-sm" style={{ color: '#a0aec0' }}>
              {selectedRole
                ? `${ROLES.find(r => r.id === selectedRole)?.label} · ${DIFFICULTIES.find(d => d.id === difficulty)?.label} · ${questionCount} questions`
                : 'Select a role to get started'}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
