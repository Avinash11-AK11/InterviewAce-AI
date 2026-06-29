import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, CheckCircle, Zap, ChevronRight, Star, Loader2, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BADGES_DATA } from '../../utils/seedData';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, increment } from 'firebase/firestore';
import XPHistoryModal from './XPHistoryModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Tests', 'Coding', 'Interviews', 'Streaks', 'Special'];

const CATEGORY_ICONS = {
  All:        '🏅',
  Tests:      '📝',
  Coding:     '💻',
  Interviews: '🎤',
  Streaks:    '🔥',
  Special:    '✨',
};

const CATEGORY_COLORS = {
  Tests:      { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   glow: 'shadow-blue-200' },
  Coding:     { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', glow: 'shadow-purple-200' },
  Interviews: { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200',  glow: 'shadow-green-200' },
  Streaks:    { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', glow: 'shadow-orange-200' },
  Special:    { bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-200',   glow: 'shadow-pink-200' },
};

// ─── Badge Progress Calculation ───────────────────────────────────────────────
const getBadgeProgress = (badge, stats) => {
  if (!stats) return { current: 0, total: badge.requirement.count, pct: 0 };
  const { type, count } = badge.requirement;
  let current = 0;
  switch (type) {
    case 'tests_taken':    current = stats.testsTaken || 0;       break;
    case 'problems_solved':current = stats.problemsSolved || 0;   break;
    case 'interviews_done':current = stats.interviewsDone || 0;   break;
    case 'streak_days':    current = stats.currentStreak || 0;    break;
    case 'resumes_uploaded':current= stats.resumesUploaded || 0;  break;
    case 'high_score_count':current = stats.highScoreCount || 0;  break;
    case 'perfect_score':  current = stats.perfectScores || 0;    break;
    case 'hard_problems':  current = stats.hardProblemsSolved || 0;break;
    case 'profile_complete':current = stats.profileComplete ? 1 : 0;break;
    default:               current = 0;
  }
  return { current: Math.min(current, count), total: count, pct: Math.min((current / count) * 100, 100) };
};

const isEarned = (badge, stats) => {
  const p = getBadgeProgress(badge, stats);
  return p.pct >= 100;
};

// ─── Badge Card ───────────────────────────────────────────────────────────────
const BadgeCard = ({ badge, earned, progress, index }) => {
  const [hovered, setHovered] = useState(false);
  const colors = CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.Special;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 200 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative rounded-3xl p-6 transition-all duration-300 overflow-hidden
        ${earned
          ? `bg-white/80 border-2 ${colors.border} shadow-lg ${colors.glow} backdrop-blur-md`
          : 'bg-white/40 border border-white/60 grayscale opacity-70'
        }
        ${hovered && earned ? 'shadow-xl -translate-y-1' : ''}
      `}
      style={{
        boxShadow: earned && hovered
          ? `0 12px 30px rgba(0,0,0,0.08), inset -2px -2px 6px rgba(255,255,255,0.9), inset 2px 2px 6px rgba(0,0,0,0.02)`
          : earned
            ? `0 4px 15px rgba(0,0,0,0.03), inset -2px -2px 6px rgba(255,255,255,0.9), inset 2px 2px 6px rgba(0,0,0,0.02)`
            : '0 4px 10px rgba(0,0,0,0.02)',
      }}
    >
      {/* Earned indicator */}
      {earned && (
        <motion.div
          className="absolute top-4 right-4 bg-green-100 rounded-full p-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          <CheckCircle size={18} className="text-green-600" />
        </motion.div>
      )}

      {/* Lock for unearned */}
      {!earned && (
        <div className="absolute top-4 right-4 bg-gray-100/80 rounded-full p-1.5 backdrop-blur-sm">
          <Lock size={14} className="text-gray-400" />
        </div>
      )}

      {/* Emoji / Icon */}
      <div className={`text-5xl mb-4 relative inline-block ${!earned ? 'opacity-40' : ''}`}>
        {badge.emoji}
        {earned && (
          <motion.div
            className="absolute -inset-4 rounded-full pointer-events-none z-0"
            animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.4), transparent 70%)' }}
          />
        )}
      </div>

      {/* Name & Category */}
      <h3 className={`font-extrabold text-lg mb-1 leading-tight ${earned ? 'text-[#3a2f25]' : 'text-gray-500'}`}>
        {badge.name}
      </h3>
      <div className="mb-3">
        <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${earned ? `${colors.bg} ${colors.text}` : 'bg-gray-200 text-gray-500'}`}>
          {badge.category}
        </span>
      </div>

      {/* Description */}
      <p className={`text-sm leading-relaxed ${earned ? 'text-[#7a6f65]' : 'text-gray-400'}`}>
        {badge.description}
      </p>

      {/* Progress bar (if not earned) */}
      {!earned && (
        <div className="mt-4 bg-white/50 p-3 rounded-2xl border border-white/60">
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            <span>Progress</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gray-400 to-gray-300"
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 1, delay: index * 0.05 + 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Earned Stats */}
      {earned && (
        <div className="mt-4 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</span>
            <span className="text-xs font-bold text-green-600">Unlocked</span>
          </div>
        </div>
      )}

      {/* XP reward */}
      <div className={`mt-4 flex items-center gap-1.5 ${earned ? 'text-amber-500' : 'text-gray-400'}`}>
        <Zap size={14} fill="currentColor" />
        <span className="text-sm font-black">+{badge.xpReward} XP</span>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Badges() {
  const { userProfile, currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [liveStats, setLiveStats] = useState({
    testsTaken: 0,
    problemsSolved: 0,
    interviewsDone: 0,
    currentStreak: userProfile?.streak || 0,
    resumesUploaded: 0,
    highScoreCount: 0,
    perfectScores: 0,
    hardProblemsSolved: 0,
    profileComplete: userProfile?.name && userProfile?.college ? 1 : 0,
  });

  useEffect(() => {
    if (currentUser) {
      fetchRealTimeStats();
    }
  }, [currentUser]);

  const fetchRealTimeStats = async () => {
    setIsLoading(true);
    try {
      const uid = currentUser.uid;

      // 1. Fetch Aptitude Results
      const resultsQ = query(collection(db, 'results'), where('userId', '==', uid));
      const resultsSnap = await getDocs(resultsQ);
      let testsTaken = 0;
      let perfectScores = 0;
      let highScoreCount = 0;
      
      resultsSnap.forEach(doc => {
        testsTaken++;
        const data = doc.data();
        if (data.score === 100) perfectScores++;
        if (data.score >= 90) highScoreCount++;
      });

      // 2. Fetch Coding Submissions
      const subsQ = query(collection(db, 'submissions'), where('userId', '==', uid));
      const subsSnap = await getDocs(subsQ);
      let problemsSolved = 0;
      let hardProblemsSolved = 0;

      subsSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === 'success' || data.status === 'passed' || data.passed) {
          problemsSolved++;
          if (data.difficulty === 'Hard' || data.difficulty === 'hard') hardProblemsSolved++;
        }
      });

      // 3. Fetch Interviews
      const interviewsQ = query(collection(db, 'interviewSessions'), where('userId', '==', uid));
      const interviewsSnap = await getDocs(interviewsQ);
      let interviewsDone = 0;
      
      interviewsSnap.forEach(doc => {
        interviewsDone++;
        const data = doc.data();
        if (data.overallScore === 100 || data.score === 100) perfectScores++;
      });

      // 4. Fetch Resumes
      const resumesQ = query(collection(db, 'resumes'), where('userId', '==', uid));
      const resumesSnap = await getDocs(resumesQ);
      const resumesUploaded = resumesSnap.size;

      const newStats = {
        testsTaken,
        problemsSolved,
        interviewsDone,
        currentStreak: userProfile?.streak || 0,
        resumesUploaded,
        highScoreCount,
        perfectScores,
        hardProblemsSolved,
        profileComplete: userProfile?.name && userProfile?.college ? 1 : 0,
      };

      setLiveStats(newStats);

      // Automatically sync newly earned badges to userProfile if needed
      const newlyEarned = BADGES_DATA.filter(b => isEarned(b, newStats)).map(b => b.id);
      const previouslyEarned = userProfile?.badges || [];
      const missing = newlyEarned.filter(id => !previouslyEarned.includes(id));
      
      if (missing.length > 0) {
        let totalNewXp = 0;
        missing.forEach(badgeId => {
          const b = BADGES_DATA.find(x => x.id === badgeId);
          if (b) totalNewXp += b.xpReward || 0;
        });

        // Sync to DB
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { 
          badges: arrayUnion(...missing),
          xp: increment(totalNewXp)
        });
      }

    } catch (err) {
      console.error("Failed to fetch live badge stats", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBadges = useMemo(() => {
    return activeCategory === 'All'
      ? BADGES_DATA
      : BADGES_DATA.filter((b) => b.category === activeCategory);
  }, [activeCategory]);

  const earnedBadges = useMemo(() => {
    return BADGES_DATA.filter((b) => isEarned(b, liveStats) || userProfile?.badges?.includes(b.id));
  }, [liveStats, userProfile?.badges]);

  const nextBadge = useMemo(() => {
    const unearned = BADGES_DATA.filter((b) => !isEarned(b, liveStats) && !userProfile?.badges?.includes(b.id));
    return unearned.reduce((best, badge) => {
      const p = getBadgeProgress(badge, liveStats);
      if (!best) return { badge, progress: p };
      const bestP = getBadgeProgress(best.badge, liveStats);
      return p.pct >= bestP.pct ? { badge, progress: p } : best;
    }, null);
  }, [liveStats]);

  const totalXPFromBadges = earnedBadges.reduce((sum, b) => sum + (b.xpReward || 0), 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-[#8FAF8F]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-3">
              <Award size={32} className="text-[#F0B8C8]" fill="currentColor" />
              <h1 className="text-3xl font-extrabold text-[#3a2f25]">Your Achievements</h1>
            </div>
            <p className="text-[#7a6f65] mt-1">Real-time sync active. Collect badges by completing challenges.</p>
          </div>
          
          <div className="hidden md:flex gap-4 items-center">
            {[
              { label: 'Earned',    value: earnedBadges.length, icon: '🏅', color: 'from-[#8FAF8F]/20 to-[#A8C5DA]/20 text-[#5a7a5a]' },
              { label: 'Total',     value: BADGES_DATA.length,  icon: '🎯', color: 'from-[#A8C5DA]/20 to-[#d08898]/20 text-[#5a7a9a]' },
              { label: 'Total XP', value: `${(userProfile?.xp || 0).toLocaleString()}`, icon: '⚡', color: 'from-amber-100 to-yellow-100 text-yellow-700' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={`flex flex-col items-center justify-center px-6 py-2 rounded-2xl font-semibold text-sm bg-gradient-to-br ${color} shadow-sm border border-white/50 backdrop-blur-sm`}>
                <span className="text-2xl font-black flex items-center gap-1">{value}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</span>
              </div>
            ))}
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="ml-2 flex items-center justify-center p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 hover:shadow-md transition-all group"
              title="View XP History"
            >
              <History size={24} className="group-hover:-rotate-12 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* ── Next Badge Milestone ── */}
        {nextBadge && (
          <motion.div
            className="bg-white/40 rounded-3xl p-6 border border-white/60 shadow-[6px_6px_20px_rgba(0,0,0,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)] backdrop-blur-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8FAF8F]/20 to-[#A8C5DA]/20 flex flex-shrink-0 items-center justify-center shadow-inner">
                <span className="text-5xl">{nextBadge.badge.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-amber-400" fill="currentColor" />
                    <span className="text-xs font-black text-[#9a8f85] uppercase tracking-wider">Closest to Earning</span>
                  </div>
                  <span className="text-xs font-bold text-[#5a4f45]">{nextBadge.progress.current} / {nextBadge.progress.total}</span>
                </div>
                <h3 className="text-xl font-bold text-[#3a2f25] mb-1">{nextBadge.badge.name}</h3>
                <p className="text-sm text-[#7a6f65] mb-3">{nextBadge.badge.description}</p>
                <div className="w-full h-2.5 bg-[#e8e0d8] rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA]"
                    initial={{ width: 0 }}
                    animate={{ width: `${nextBadge.progress.pct}%` }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                  />
                </div>
              </div>
              <ChevronRight size={24} className="text-[#9a8f85] hidden sm:block" />
            </div>
          </motion.div>
        )}

        {/* ── Category Filters ── */}
        <motion.div
          className="flex gap-3 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {CATEGORIES.map((cat) => {
            const count = cat === 'All'
              ? BADGES_DATA.length
              : BADGES_DATA.filter((b) => b.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                  ${activeCategory === cat
                    ? 'bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white shadow-md border-transparent'
                    : 'bg-white/50 text-[#7a6f65] hover:bg-white border border-white/60 hover:text-[#5a7a5a] shadow-sm'
                  }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                  ${activeCategory === cat ? 'bg-white/30 text-white' : 'bg-[#e8e0d8] text-[#9a8f85]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Badge Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {filteredBadges.map((badge, index) => {
              const earned = isEarned(badge, liveStats) || userProfile?.badges?.includes(badge.id);
              const progress = getBadgeProgress(badge, liveStats);
              // if admin forced it, just force 100% visual progress
              if (earned && progress.pct < 100) {
                progress.current = badge.requirement.count;
                progress.pct = 100;
              }
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earned}
                  progress={progress}
                  index={index}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filteredBadges.length === 0 && (
          <div className="text-center py-16 bg-white/30 rounded-3xl border border-white/50 border-dashed">
            <span className="text-5xl block mb-4 grayscale opacity-50">🏅</span>
            <p className="font-bold text-[#5a4f45]">No badges in this category</p>
          </div>
        )}
      </div>

      <XPHistoryModal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
      />
    </div>
  );
}

