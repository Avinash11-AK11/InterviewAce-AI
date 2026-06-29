import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Video, FileSearch, Code2, Calculator, Trophy,
  ArrowRight, Zap, Star, Flame, Target, CheckCircle2,
  Brain, Award, User, Sparkles, MessageSquareCode, Clock, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { syncUserStats } from '../../utils/syncStats';
import { calculateLevel, getRank, getRankColor, getXPProgress } from '../../utils/helpers';

const quickActions = [
  {
    title: 'Mock Interview',
    description: 'Practice with our AI recruiter',
    icon: Video,
    path: '/mock-interview',
    color: 'from-[#A8C5DA] to-[#8FAF8F]',
    delay: 0.1,
  },
  {
    title: 'Technical Q&A',
    description: 'Master core CS developer topics',
    icon: MessageSquareCode,
    path: '/technical',
    color: 'from-[#8FAF8F] to-[#7a9a7a]',
    delay: 0.2,
  },
  {
    title: 'Coding Challenges',
    description: 'Solve daily algorithms in Java, Python, C++',
    icon: Code2,
    path: '/coding',
    color: 'from-[#F0B8C8] to-[#e898b0]',
    delay: 0.3,
  },
  {
    title: 'Resume Analyzer',
    description: 'Get real-time ATS audit feedback',
    icon: FileSearch,
    path: '/resume',
    color: 'from-[#EDE7DF] to-[#dcd0c0]',
    delay: 0.4,
  },
];

const achievementsList = [
  { id: 'first_test', title: 'First Step', desc: 'Complete your first aptitude test', emoji: '🎯' },
  { id: 'first_code', title: 'Hello, World!', desc: 'Submit your first coding solution', emoji: '💻' },
  { id: 'first_interview', title: 'First Interview', desc: 'Complete your first AI mock interview', emoji: '🎤' },
  { id: 'perfect_score', title: 'Perfectionist', desc: 'Score 100% on any test', emoji: '💯' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  // States
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const firstName = userProfile?.name?.split(' ')[0] || 'User';

  // ── Calculate weekly activity dynamically ──
  const calculateWeeklyActivity = async (uid) => {
    setChartLoading(true);
    try {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push({
          dateStr: d.toDateString(),
          dayName: daysOfWeek[d.getDay()],
          minutes: 0
        });
      }

      const queries = [
        { col: 'results', mins: 15 },
        { col: 'submissions', mins: 10 },
        { col: 'qaSessions', mins: 15 },
        { col: 'interviewSessions', mins: 25 }
      ];

      const allDocs = await Promise.all(
        queries.map(async (qInfo) => {
          const snap = await getDocs(query(collection(db, qInfo.col), where('userId', '==', uid)));
          return { docs: snap.docs, mins: qInfo.mins };
        })
      );

      allDocs.forEach(({ docs, mins }) => {
        docs.forEach((docSnap) => {
          const data = docSnap.data();
          const timestamp = data.createdAt || data.timestamp;
          if (timestamp) {
            const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
            const dateString = dateVal.toDateString();
            
            const matchedDay = last7Days.find(d => d.dateStr === dateString);
            if (matchedDay) {
              matchedDay.minutes += mins;
            }
          }
        });
      });

      setWeeklyActivity(
        last7Days.map(d => ({
          day: d.dayName,
          minutes: d.minutes
        }))
      );
    } catch (err) {
      console.error('Error calculating weekly activity:', err);
      // Fallback
      setWeeklyActivity([
        { day: 'Mon', minutes: 0 },
        { day: 'Tue', minutes: 0 },
        { day: 'Wed', minutes: 0 },
        { day: 'Thu', minutes: 0 },
        { day: 'Fri', minutes: 0 },
        { day: 'Sat', minutes: 0 },
        { day: 'Sun', minutes: 0 }
      ]);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setSyncing(true);
      syncUserStats(currentUser.uid)
        .then(() => calculateWeeklyActivity(currentUser.uid))
        .finally(() => setSyncing(false));
    }
  }, [currentUser]);

  // Level progress
  const currentXp = userProfile?.xp || 0;
  const level = calculateLevel(currentXp);
  const rank = getRank(level);
  const rankColor = getRankColor(rank);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl p-6 lg:p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.08),-4px_-4px_16px_rgba(255,255,255,0.9)]"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(245,239,230,0.45) 100%)', backdropFilter: 'blur(20px)' }}
      >
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#8FAF8F]/20 to-[#A8C5DA]/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="text-3xl lg:text-4xl font-extrabold text-[#3a2f25] tracking-tight"
            >
              Welcome back, <span className="bg-gradient-to-r from-[#6a9a6a] to-[#7ab0c8] bg-clip-text text-transparent">{firstName}</span>!
            </motion.h1>
            <p className="text-[#7a6f65] font-semibold text-base leading-relaxed">
              Ready to crush your next interview? Let's keep the learning momentum active.
            </p>
            
            {/* Inline XP progress bar */}
            <div className="pt-1">
              {(() => {
                const { progress } = getXPProgress(currentXp);
                const xpInCurrentLevel = currentXp - (level > 1 ? 100 * (level - 1) * (level - 1) : 0);
                const xpRequiredForNext = 100 * level * level - (level > 1 ? 100 * (level - 1) * (level - 1) : 0);
                
                return (
                  <div className="max-w-md">
                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#7a6f65] mb-1">
                      <span className="flex items-center gap-1">
                        <Award size={14} className="text-[#8FAF8F]" /> Level {level} ({rank})
                      </span>
                      <span>{xpInCurrentLevel} / {xpRequiredForNext} XP</span>
                    </div>
                    <div className="w-full h-2 bg-[#e8e0d8] rounded-full overflow-hidden shadow-inner border border-white/45">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] rounded-full"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px] shadow-sm border border-white/60">
              <span className="text-2xl font-black text-[#8FAF8F] font-mono">{userProfile?.interviewsDone || 0}</span>
              <span className="text-[10px] font-bold text-[#9a8f85] uppercase tracking-wider mt-1">Interviews</span>
            </div>
            <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px] shadow-sm border border-white/60">
              <span className="text-2xl font-black text-[#A8C5DA] font-mono">{userProfile?.testsTaken || 0}</span>
              <span className="text-[10px] font-bold text-[#9a8f85] uppercase tracking-wider mt-1">Tests</span>
            </div>
            <div className="bg-gradient-to-br from-[#F0B8C8] to-[#e898b0] rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px] shadow-[4px_4px_12px_rgba(240,184,200,0.4)] border border-white/40 text-white transform rotate-1">
              <span className="text-2xl font-black flex items-center gap-1 font-mono">
                <Flame size={20} className="fill-white" /> {userProfile?.streak || 0}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-white/90">Day Streak</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analytics Chart */}
        <div className="lg:col-span-2 rounded-3xl p-6 border border-white/60 shadow-[6px_6px_20px_rgba(0,0,0,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)] bg-white/40 backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#3a2f25] flex items-center gap-2">
                <Zap size={18} className="text-[#F0B8C8]" /> 
                Weekly Learning Activity
              </h2>
              <p className="text-xs text-[#9a8f85] mt-1">Time spent practicing across all modules (minutes)</p>
            </div>
            <button onClick={() => navigate('/analytics')} className="text-xs font-bold text-[#8FAF8F] hover:text-[#5a7a5a] transition-colors flex items-center gap-1 bg-white/50 px-3 py-1.5 rounded-full border border-white/80 shadow-sm">
              Full Analytics <ArrowRight size={12} />
            </button>
          </div>
          
          {chartLoading ? (
            <div className="h-64 w-full flex flex-col items-center justify-center space-y-3">
              <Loader2 size={24} className="text-[#8FAF8F] animate-spin" />
              <span className="text-xs text-[#9a8f85] font-black uppercase tracking-wider">Syncing Activity Graph...</span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8FAF8F" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8FAF8F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9a8f85' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9a8f85' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#5a7a5a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#8FAF8F" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold text-[#9a8f85] uppercase tracking-widest pl-2">Quick Actions</h2>
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3">
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="group relative flex items-center p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-[4px_4px_16px_rgba(0,0,0,0.05),-2px_-2px_12px_rgba(255,255,255,0.9)] text-left overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-sm flex-shrink-0 mr-4 group-hover:scale-105 transition-all`}>
                  <action.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#3a2f25] text-xs group-hover:text-[#8FAF8F] transition-colors">{action.title}</h3>
                  <p className="text-[10px] text-[#7a6f65] mt-0.5 truncate">{action.description}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/60 flex items-center justify-center text-[#9a8f85] group-hover:bg-white group-hover:text-[#8FAF8F] transition-all group-hover:translate-x-1 shadow-sm border border-white/50">
                  <ArrowRight size={13} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Section: Recent Achievements */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="pt-4"
      >
        <div className="flex items-center justify-between mb-4 pl-2">
          <h2 className="text-sm font-bold text-[#9a8f85] uppercase tracking-widest flex items-center gap-2">
            <Trophy size={14} className="text-[#A8C5DA]" /> Recent Achievements
          </h2>
          <button onClick={() => navigate('/achievements')} className="text-xs text-[#A8C5DA] font-bold hover:underline">View All</button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievementsList.map((achievement) => {
            const isUnlocked = userProfile?.badges?.includes(achievement.id) || false;
            
            return (
              <motion.div
                key={achievement.id}
                whileHover={isUnlocked ? { scale: 1.03, y: -2 } : {}}
                className={`relative p-5 rounded-[2rem] border flex flex-col items-center text-center transition-all ${
                  isUnlocked 
                  ? 'bg-white border-[#e8e0d8] shadow-[4px_4px_16px_rgba(0,0,0,0.04)]' 
                  : 'bg-white/30 border-dashed border-[#e8e0d8] grayscale opacity-50'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute top-3 right-3 text-[#8FAF8F]" title="Unlocked">
                    <CheckCircle2 size={15} />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner text-xl ${
                  isUnlocked ? 'bg-[#8FAF8F]/10 border border-[#8FAF8F]/20' : 'bg-slate-100 border border-slate-200'
                }`}>
                  {achievement.emoji}
                </div>
                <h4 className={`text-xs font-black mb-1 ${isUnlocked ? 'text-[#5a4f45]' : 'text-slate-400'}`}>{achievement.title}</h4>
                <p className="text-[9px] text-[#9a8f85] font-semibold leading-normal px-2">{achievement.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      
    </div>
  );
}
