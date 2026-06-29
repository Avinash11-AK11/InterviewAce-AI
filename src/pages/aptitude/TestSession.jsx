import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Brain, Clock, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { generateAptitudeTest } from '../../services/geminiService';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

export default function TestSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { topic = 'Mixed Aptitude', difficulty = 'Medium', count = 10 } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(count * 120); // 2 mins per question
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchedRef = React.useRef(false);

  // Generate test on mount or retry
  useEffect(() => {
    if (fetchedRef.current) return;
    
    async function loadTest() {
      setLoading(true);
      setError('');
      try {
        const generated = await generateAptitudeTest(topic, difficulty, count);
        if (!fetchedRef.current) {
          setQuestions(generated);
          setLoading(false);
          fetchedRef.current = true;
        }
      } catch (err) {
        console.error(err);
        if (!fetchedRef.current) {
          setError(err.message || 'Failed to generate test. Please try again.');
          setLoading(false);
        }
      }
    }
    loadTest();
    
    return () => {
      // In strict mode we don't want to cancel the fetch, but we also don't want it to run twice.
    };
  }, [topic, difficulty, count, retryCount]);

  // Timer
  useEffect(() => {
    if (loading || isSubmitting) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitting]);

  const handleSelectOption = (opt) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: opt }));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);

    let correctCount = 0;
    const questionsWithAnswers = questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        ...q,
        userAnswer: answers[idx] || null,
        isCorrect
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    try {
      const resultDoc = await addDoc(collection(db, 'results'), {
        userId: currentUser.uid,
        topic,
        difficulty,
        score,
        timeTaken: (count * 120) - timeLeft,
        questions: questionsWithAnswers,
        createdAt: serverTimestamp()
      });
      
      // Update user stats and XP in real-time
      const { syncUserStats } = await import('../../utils/syncStats');
      await syncUserStats(currentUser.uid);

      navigate(`/aptitude/result/${resultDoc.id}`);
    } catch (err) {
      console.error('Failed to save test result', err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-3xl flex items-center justify-center shadow-lg"
        >
          <Brain size={40} className="text-white" />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#3a2f25] mb-2">Generating Your Test...</h2>
          <p className="text-[#7a6f65] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            AI is crafting {count} unique {topic} questions
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <Brain size={40} className="text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#3a2f25] mb-2">Oops! Something went wrong</h2>
          <p className="text-red-500 font-medium max-w-md mx-auto">{error}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setRetryCount(prev => prev + 1)} 
            className="px-8 py-3 bg-[#3a2f25] text-white font-bold rounded-xl hover:bg-[#2a1f15] transition-all"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/aptitude')} 
            className="px-8 py-3 bg-white text-[#3a2f25] font-bold rounded-xl hover:bg-gray-50 border-2 border-gray-200 transition-all"
          >
            Change Topic
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-bold">
            {currentIndex + 1}
          </div>
          <div>
            <h2 className="font-bold text-[#3a2f25]">{topic}</h2>
            <p className="text-xs text-gray-500">{difficulty} • {questions.length} Questions</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-[#3a2f25]'}`}>
          <Clock size={16} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-[#8FAF8F]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white min-h-[400px] flex flex-col"
        >
          <h3 className="text-xl font-bold text-[#3a2f25] mb-8 leading-relaxed">
            {currentQ.question}
          </h3>

          <div className="space-y-3 flex-1">
            {currentQ.options.map((opt, i) => {
              const isSelected = answers[currentIndex] === opt;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4
                    ${isSelected 
                      ? 'border-[#8FAF8F] bg-[#8FAF8F]/10 shadow-md' 
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                    ${isSelected ? 'border-[#8FAF8F] bg-[#8FAF8F]' : 'border-gray-300'}
                  `}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-base ${isSelected ? 'text-[#3a2f25] font-semibold' : 'text-gray-600'}`}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                ${currentIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#7a6f65] hover:bg-gray-100'}
              `}
            >
              <ChevronLeft size={20} /> Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || Object.keys(answers).length === 0}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#8FAF8F] text-white font-bold hover:bg-[#7A9F7A] hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                Submit Test
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-[#3a2f25] text-white font-bold hover:bg-[#2a1f15] transition-all"
              >
                Next <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
