import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, SkipForward, Flag, Clock,
  MessageSquare, Loader2, CheckCircle, AlertCircle,
  Brain, Mic, MicOff, Send, X, BarChart2, Video, VideoOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { evaluateInterviewAnswer } from '../../services/geminiService';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function ScoreBar({ label, score, color }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: '#4a5568' }}>{label}</span>
        <span style={{ color: '#2d3748', fontWeight: 600 }}>{score}/100</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#e8e0d8' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const { questions = [], role = 'Developer', difficulty = 'mid', questionCount = 10 } =
    location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(''));
  const [evaluations, setEvaluations] = useState(() => Array(questions.length).fill(null));
  const [evaluating, setEvaluating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showEvalPreview, setShowEvalPreview] = useState(false);
  const textareaRef = useRef(null);
  const timerRef = useRef(null);
  const qTimerRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // New Features State
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI Speaking
  const [isListening, setIsListening] = useState(false); // User Mic
  const [interimText, setInterimText] = useState('');
  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);

  // Camera setup
  useEffect(() => {
    let currentStream = null;
    async function setupCamera() {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
          setCameraActive(true);
          setCameraError(false);
        }
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        setCameraActive(false);
        setCameraError(true);
      }
    }
    setupCamera();
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const question = questions[currentIndex];

  // AI Voice Integration
  useEffect(() => {
    if (!question) return;
    const textToSpeak = typeof question === 'object' ? question.question || question.text : question;
    
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    // Slight delay to allow transitions
    const timeoutId = setTimeout(() => {
      synthRef.current.speak(utterance);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (synthRef.current.speaking) synthRef.current.cancel();
    };
  }, [currentIndex, question]);

  // Speech Recognition (Mic)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        
        if (finalStr) {
           setAnswers(prev => {
             const updated = [...prev];
             updated[currentIndex] = (updated[currentIndex] + ' ' + finalStr).trim();
             return updated;
           });
        }
        setInterimText(interimStr);
      };
      
      recognition.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentIndex]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (synthRef.current.speaking) synthRef.current.cancel();
      recognitionRef.current?.start();
    }
  };

  // Global timer
  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Per-question timer
  useEffect(() => {
    setQuestionTimer(0);
    clearInterval(qTimerRef.current);
    qTimerRef.current = setInterval(() => setQuestionTimer(t => t + 1), 1000);
    return () => clearInterval(qTimerRef.current);
  }, [currentIndex]);

  useEffect(() => {
    setCharCount(answers[currentIndex]?.length || 0);
  }, [currentIndex, answers]);

  // Redirect if no questions
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/mock-interview');
    }
  }, [questions, navigate]);

  // Anti-Cheating (Visibility API)
  const handleFinish = useCallback(async () => {
    if (synthRef.current.speaking) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();

    clearInterval(timerRef.current);
    clearInterval(qTimerRef.current);
    setSaving(true);

    const sessionData = {
      userId: currentUser?.uid,
      role,
      difficulty,
      questions,
      answers,
      evaluations,
      totalTime: timer,
      completedAt: serverTimestamp(),
      questionCount: questions.length,
      answeredCount: answers.filter(a => a.trim()).length,
    };

    try {
      let sessionId = null;
      if (currentUser) {
        const docRef = await addDoc(collection(db, 'interviewSessions'), sessionData);
        sessionId = docRef.id;

        const { syncUserStats } = await import('../../utils/syncStats');
        await syncUserStats(currentUser.uid);
      }
      navigate('/mock-interview/result', {
        state: { ...sessionData, sessionId, completedAt: new Date().toISOString() },
      });
    } catch (err) {
      console.error('Save failed:', err);
      navigate('/mock-interview/result', {
        state: { ...sessionData, completedAt: new Date().toISOString() },
      });
    } finally {
      setSaving(false);
    }
  }, [answers, currentUser, difficulty, evaluations, navigate, questions, role, timer]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !cameraError) {
        setWarnings(prev => {
          const newWarnings = prev + 1;
          if (newWarnings >= 2) {
            handleFinish();
          } else {
            setShowWarningModal(true);
          }
          return newWarnings;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleFinish, cameraError]);

  const handleAnswerChange = useCallback(
    e => {
      const val = e.target.value;
      setCharCount(val.length);
      setAnswers(prev => {
        const updated = [...prev];
        updated[currentIndex] = val;
        return updated;
      });
    },
    [currentIndex]
  );

  const handleEvaluate = async () => {
    const answer = answers[currentIndex];
    if (!answer.trim()) return;

    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    setEvaluating(true);
    setShowEvalPreview(false);

    try {
      const evaluation = await evaluateInterviewAnswer(
        questions[currentIndex],
        answer,
        role,
        difficulty
      );
      setEvaluations(prev => {
        const updated = [...prev];
        updated[currentIndex] = evaluation;
        return updated;
      });
      setShowEvalPreview(true);
    } catch (err) {
      console.error('Evaluation failed:', err);
      const fallbackEval = {
        score: 0,
        technical: 0,
        communication: 0,
        confidence: 0,
        problemSolving: 0,
        feedback: 'Evaluation service failed. Your answer could not be scored.',
        strengths: [],
        improvements: ['Please try again later.']
      };
      setEvaluations(prev => {
        const updated = [...prev];
        updated[currentIndex] = fallbackEval;
        return updated;
      });
      setShowEvalPreview(true);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setShowEvalPreview(false);
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowEvalPreview(false);
      setCurrentIndex(i => i - 1);
    }
  };

  const handleSkip = () => {
    setShowEvalPreview(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a.trim()).length;
  const currentAnswer = answers[currentIndex] || '';
  const currentEval = evaluations[currentIndex];

  const getTimerColor = () => {
    if (questionTimer < 60) return '#8FAF8F';
    if (questionTimer < 120) return '#FCD34D';
    return '#F87171';
  };

  // Render Camera Error Blocker
  if (cameraError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Camera Required</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            To simulate a real interview environment, you must allow camera access. Please update your browser permissions and refresh the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5EFE6' }}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: '#8FAF8F' }} />
          <p style={{ color: '#718096' }}>Loading your interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5EFE6' }}>
      
      {/* Anti-Cheating Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl border-4 border-red-500"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Warning: Do Not Switch Tabs</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Leaving the interview window is strictly prohibited during this proctored session. 
                <br/><br/>
                <strong className="text-red-500">If you switch tabs again, the interview will be terminated immediately.</strong>
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition-colors"
              >
                I Understand, Resume Interview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div
        className="sticky top-0 z-40 px-6 py-3"
        style={{
          background: 'rgba(245, 239, 230, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#e8e0d8' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #8FAF8F, #A8C5DA)' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#4a5568' }}>
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#8FAF8F' }}
                />
                <span className="text-xs font-medium" style={{ color: '#718096' }}>
                  {role} · {difficulty}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#718096' }}>
                <CheckCircle size={12} style={{ color: '#8FAF8F' }} />
                {answeredCount} answered
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Question timer */}
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold"
                style={{ background: `${getTimerColor()}22`, color: getTimerColor() }}
              >
                <Clock size={12} />
                {formatTime(questionTimer)}
              </div>

              {/* Total timer */}
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: '#a0aec0' }}
              >
                <Clock size={12} />
                Total: {formatTime(timer)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout for Real Interview Feel */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Panel: Video Feeds */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          
          {/* AI Interviewer Video Box */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center shadow-xl border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            
            {/* AI Avatar Animation */}
            <motion.div 
              animate={{ 
                scale: isSpeaking || evaluating ? [1, 1.15, 1] : [1, 1.05, 1],
                opacity: isSpeaking || evaluating ? [0.8, 1, 0.8] : 1
              }} 
              transition={{ repeat: Infinity, duration: isSpeaking ? 0.8 : (evaluating ? 1.5 : 4), ease: "easeInOut" }} 
              className="z-10 bg-slate-800 p-6 rounded-full border border-slate-700 shadow-2xl"
            >
              <Brain size={56} className={(isSpeaking || evaluating) ? "text-indigo-400" : "text-slate-400"} />
            </motion.div>

            {/* Speaking / Analyzing Indicator */}
            <AnimatePresence>
              {(isSpeaking || evaluating) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-slate-700/50"
                >
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${evaluating ? 'bg-indigo-400' : 'bg-green-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${evaluating ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                  </span>
                  <span className={`text-white text-xs font-medium ${evaluating ? 'text-indigo-100' : 'text-green-100'}`}>
                    {evaluating ? 'Analyzing answer...' : 'Speaking...'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-4 left-4 flex items-center gap-2">
               <div className="bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm font-medium backdrop-blur-md border border-slate-700/50 shadow-lg">
                 AI Interviewer
               </div>
            </div>
          </div>

          {/* User Camera Box */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center shadow-xl border border-slate-800">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
            />
            
            {!cameraActive && (
              <div className="flex flex-col items-center gap-3 z-10 text-slate-500">
                <VideoOff size={32} />
                <span className="text-sm font-medium">Camera Off / Unavailable</span>
              </div>
            )}

            <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
               <div className="bg-black/60 px-3 py-1.5 rounded-lg text-white text-sm font-medium backdrop-blur-md border border-slate-700/50 shadow-lg">
                 You
               </div>
            </div>
            
            <div className="absolute top-4 right-4 z-10">
               {cameraActive ? (
                 <div className="bg-green-500/20 text-green-400 p-2 rounded-full backdrop-blur-md">
                   <Video size={16} />
                 </div>
               ) : (
                 <div className="bg-red-500/20 text-red-400 p-2 rounded-full backdrop-blur-md">
                   <VideoOff size={16} />
                 </div>
               )}
            </div>
          </div>

        </div>

        {/* Right Panel: Questions and Answers */}
        <div className="w-full lg:w-2/3 flex flex-col">
          {/* Question indicator dots */}
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => { setShowEvalPreview(false); setCurrentIndex(i); }}
                className="w-6 h-6 rounded-full text-xs font-medium transition-all"
                style={{
                  background:
                    i === currentIndex
                      ? '#8FAF8F'
                      : answers[i]?.trim()
                      ? '#A8C5DA'
                      : '#e8e0d8',
                  color:
                    i === currentIndex || answers[i]?.trim() ? 'white' : '#a0aec0',
                  transform: i === currentIndex ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question */}
              <div
                className="rounded-3xl p-8 mb-6 relative overflow-hidden"
                style={{
                  background: '#FAF6F1',
                  boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #8FAF8F, #A8C5DA)' }}
                  >
                    Q{currentIndex + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={14} style={{ color: '#8FAF8F' }} />
                      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8FAF8F' }}>
                        Interview Question
                      </span>
                    </div>
                    <p className="text-xl font-medium leading-relaxed" style={{ color: '#2d3748' }}>
                      {typeof question === 'object' ? question.question || question.text || JSON.stringify(question) : question}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer Area (Mic & Textarea) */}
              <div
                className="rounded-3xl p-6 mb-6"
                style={{
                  background: '#FAF6F1',
                  boxShadow: '8px 8px 20px #e8e0d8, -8px -8px 20px #ffffff',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} style={{ color: '#A8C5DA' }} />
                    <span className="text-sm font-medium" style={{ color: '#4a5568' }}>
                      Your Answer
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: '#a0aec0' }}>
                    {charCount} characters
                  </span>
                </div>
                
                {/* Microphone Toggle Button */}
                <div className="flex justify-center mb-6 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleListen}
                    className="flex flex-col items-center justify-center gap-2"
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/50' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                      {isListening ? <Mic size={32} /> : <MicOff size={32} />}
                    </div>
                    <span className={`text-sm font-bold ${isListening ? 'text-red-500' : 'text-slate-600'}`}>
                      {isListening ? 'Listening... Click to stop' : 'Click to Speak'}
                    </span>
                  </motion.button>
                </div>

                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={currentAnswer}
                    onChange={handleAnswerChange}
                    placeholder="Speak into your microphone or type your answer here..."
                    rows={6}
                    className={`w-full resize-none rounded-xl p-4 text-sm leading-relaxed outline-none transition-all ${isListening ? 'border-red-400' : 'border-transparent'}`}
                    style={{
                      background: '#F5EFE6',
                      borderWidth: '2px',
                      color: '#2d3748',
                      fontFamily: 'inherit',
                      boxShadow: 'inset 4px 4px 8px #e8e0d8, inset -4px -4px 8px #ffffff',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#A8C5DA')}
                    onBlur={e => (e.target.style.borderColor = 'transparent')}
                  />
                  {/* Show interim speech text overlay */}
                  {interimText && (
                    <div className="absolute inset-0 p-4 pointer-events-none overflow-hidden text-sm leading-relaxed">
                      <span className="invisible whitespace-pre-wrap">{currentAnswer}{currentAnswer ? ' ' : ''}</span>
                      <span className="text-slate-400 italic">{interimText}</span>
                    </div>
                  )}
                </div>

                {/* Think time hint */}
                {questionTimer > 0 && questionTimer < 15 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs flex items-center gap-1.5"
                    style={{ color: '#8FAF8F' }}
                  >
                    <Brain size={12} />
                    Take a moment to think before speaking...
                  </motion.div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEvaluate}
                      disabled={!currentAnswer.trim() || evaluating}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                      style={{
                        background:
                          !currentAnswer.trim() || evaluating
                            ? '#cbd5e0'
                            : 'linear-gradient(135deg, #8FAF8F, #A8C5DA)',
                        cursor: !currentAnswer.trim() || evaluating ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {evaluating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit & Evaluate
                        </>
                      )}
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentAnswer.trim() && (
                      <button
                        onClick={() => {
                          setAnswers(prev => {
                            const updated = [...prev];
                            updated[currentIndex] = '';
                            return updated;
                          });
                          setCharCount(0);
                          setShowEvalPreview(false);
                        }}
                        className="p-2 rounded-lg text-xs flex items-center gap-1"
                        style={{ color: '#a0aec0' }}
                      >
                        <X size={14} />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Evaluation Preview */}
              <AnimatePresence>
                {showEvalPreview && currentEval && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="rounded-3xl p-6 mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #F0FFF4, #EBF8FF)',
                      border: '2px solid #8FAF8F44',
                      boxShadow: '0 4px 20px rgba(143, 175, 143, 0.2)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BarChart2 size={16} style={{ color: '#8FAF8F' }} />
                        <span className="font-semibold text-sm" style={{ color: '#2d3748' }}>
                          Quick Evaluation
                        </span>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                          background: `${currentEval.score >= 75 ? '#8FAF8F' : currentEval.score >= 50 ? '#FCD34D' : '#F87171'}22`,
                          color: currentEval.score >= 75 ? '#3a7a3a' : currentEval.score >= 50 ? '#92710a' : '#c53030',
                        }}
                      >
                        {currentEval.score}/100
                      </div>
                    </div>

                    <ScoreBar label="Technical Accuracy" score={currentEval.technical ?? 0} color="#A8C5DA" />
                    <ScoreBar label="Communication" score={currentEval.communication ?? 0} color="#8FAF8F" />
                    <ScoreBar label="Confidence" score={currentEval.confidence ?? 0} color="#F0B8C8" />
                    <ScoreBar label="Problem Solving" score={currentEval.problemSolving ?? 0} color="#C4B5FD" />

                    {currentEval.feedback && (
                      <p className="mt-3 text-sm" style={{ color: '#4a5568' }}>
                        <strong>Feedback:</strong> {currentEval.feedback}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: currentIndex === 0 ? '#e8e0d8' : '#FAF6F1',
                color: currentIndex === 0 ? '#cbd5e0' : '#4a5568',
                boxShadow: currentIndex === 0 ? 'none' : '4px 4px 8px #e8e0d8, -4px -4px 8px #ffffff',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronLeft size={18} />
              Previous
            </motion.button>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSkip}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm"
                style={{ color: '#a0aec0' }}
              >
                <SkipForward size={16} />
                Skip
              </motion.button>

              {currentIndex === questions.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #F0B8C8, #d4737a)',
                    boxShadow: '0 4px 16px rgba(240, 184, 200, 0.5)',
                  }}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Flag size={16} />
                  )}
                  Finish Interview
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{
                    background: '#FAF6F1',
                    color: '#4a5568',
                    boxShadow: '4px 4px 8px #e8e0d8, -4px -4px 8px #ffffff',
                  }}
                >
                  Next
                  <ChevronRight size={18} />
                </motion.button>
              )}
            </div>
          </div>

          {/* Finish early button */}
          {currentIndex < questions.length - 1 && answeredCount > 0 && (
            <div className="text-center mt-6">
              <button
                onClick={handleFinish}
                disabled={saving}
                className="text-sm underline"
                style={{ color: '#a0aec0' }}
              >
                {saving ? 'Saving...' : `Finish early (${answeredCount} answered)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
