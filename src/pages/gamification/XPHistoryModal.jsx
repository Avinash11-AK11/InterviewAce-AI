import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2, Brain, Mic, Trophy, Code, MessageSquare, Award } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { calculateTestXp, calculateInterviewXp, calculateCodingXp } from '../../utils/xpCalculator';
import { BADGES_DATA } from '../../utils/seedData';

export default function XPHistoryModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const events = [];

        // 1. Fetch Tests
        const resultsQ = query(collection(db, 'results'), where('userId', '==', currentUser.uid));
        const resultsSnap = await getDocs(resultsQ);
        resultsSnap.forEach((doc) => {
          const data = doc.data();
          const xp = calculateTestXp(data);
          if (xp > 0) {
            events.push({
              id: doc.id,
              type: 'test',
              title: 'Aptitude Test Completed',
              description: `Score: ${data.score || 0}% | Topic: ${data.topic || 'General'}`,
              xp,
              timestamp: data.createdAt?.toDate() || new Date(0),
              icon: Brain,
              themeColor: 'text-[#8FAF8F] bg-[#8FAF8F]/5 border-[#8FAF8F]/20'
            });
          }
        });

        // 2. Fetch Interviews
        const interviewsQ = query(collection(db, 'interviewSessions'), where('userId', '==', currentUser.uid));
        const interviewsSnap = await getDocs(interviewsQ);
        interviewsSnap.forEach((doc) => {
          const data = doc.data();
          const xp = calculateInterviewXp(data);
          if (xp > 0) {
            events.push({
              id: doc.id,
              type: 'interview',
              title: 'AI Mock Interview',
              description: `Score: ${data.overallScore || data.score || 0}% | Role: ${data.role || 'General'}`,
              xp,
              timestamp: data.completedAt?.toDate() || data.createdAt?.toDate() || new Date(0),
              icon: Mic,
              themeColor: 'text-[#A8C5DA] bg-[#A8C5DA]/5 border-[#A8C5DA]/20'
            });
          }
        });

        // 3. Fetch Coding Submissions
        const submissionsQ = query(collection(db, 'submissions'), where('userId', '==', currentUser.uid));
        const submissionsSnap = await getDocs(submissionsQ);
        submissionsSnap.forEach((doc) => {
          const data = doc.data();
          const xp = calculateCodingXp(data);
          if (xp > 0) {
            events.push({
              id: doc.id,
              type: 'coding',
              title: 'Coding Challenge Solved',
              description: `${data.problemName || data.problemTitle || 'Challenge'} | Difficulty: ${data.difficulty || 'Easy'}`,
              xp,
              timestamp: data.createdAt?.toDate() || new Date(0),
              icon: Code,
              themeColor: 'text-[#F0B8C8] bg-[#F0B8C8]/5 border-[#F0B8C8]/20'
            });
          }
        });

        // 4. Fetch Q&A Sessions
        const qaSessionsQ = query(collection(db, 'qaSessions'), where('userId', '==', currentUser.uid));
        const qaSessionsSnap = await getDocs(qaSessionsQ);
        qaSessionsSnap.forEach((doc) => {
          const data = doc.data();
          const xp = data.xpEarned || 0;
          if (xp > 0) {
            events.push({
              id: doc.id,
              type: 'qa',
              title: 'Technical Q&A Session',
              description: `Topic: ${data.topic || 'General Q&A'}`,
              xp,
              timestamp: data.createdAt?.toDate() || new Date(0),
              icon: MessageSquare,
              themeColor: 'text-[#B5A2D9] bg-[#B5A2D9]/5 border-[#B5A2D9]/20'
            });
          }
        });

        // 5. Fetch Badge Unlocks from User Profile
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const earnedBadgeIds = userData.badges || [];
          earnedBadgeIds.forEach((badgeId) => {
            const badge = BADGES_DATA.find(b => b.id === badgeId);
            if (badge) {
              events.push({
                id: `badge-${badgeId}`,
                type: 'badge',
                title: `Badge Unlocked: ${badge.name}`,
                description: `${badge.description} | Achievement Bonus`,
                xp: badge.xpReward || 0,
                timestamp: userData.updatedAt?.toDate() || new Date(),
                icon: Award,
                themeColor: 'text-amber-500 bg-amber-500/5 border-amber-500/20'
              });
            }
          });
        }

        // Sort chronologically descending
        events.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(events);
      } catch (err) {
        console.error("Failed to fetch XP history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-[#F5EFE6] rounded-[2.5rem] border border-white/60 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5ded6] flex items-center justify-between bg-white/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] text-white flex items-center justify-center shadow-md">
                <Trophy size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#3a2f25]">XP History</h2>
                <p className="text-xs text-[#8a7f75] font-semibold">Timeline of your earned XP</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Timeline Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#F5EFE6]/90 backdrop-blur-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-[#8FAF8F]">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-sm font-bold uppercase tracking-wider text-[#8a7f75]">Fetching history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
                <Trophy size={32} className="opacity-20" />
                <span className="text-sm font-bold text-gray-500">No XP history found yet. Start practicing!</span>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 relative"
                  >
                    {/* Timeline Connector Line */}
                    {index !== history.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-[-24px] w-0.5 bg-gradient-to-b from-[#8FAF8F]/30 to-transparent" />
                    )}
                    
                    {/* Icon */}
                    <div className={`w-12 h-12 flex-shrink-0 rounded-2xl shadow-sm flex items-center justify-center z-10 border ${event.themeColor || 'text-[#8FAF8F] bg-[#8FAF8F]/5 border-[#8FAF8F]/20'}`}>
                      <event.icon size={20} />
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 bg-white/40 border border-white/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:bg-white/80 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-[#3a2f25] text-sm md:text-base leading-snug">{event.title}</h3>
                          <p className="text-xs text-[#7a6f65] mt-1 font-semibold leading-relaxed">{event.description}</p>
                          <p className="text-[9px] text-[#9a8f85] mt-3.5 font-black tracking-wider uppercase">
                            {event.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {/* XP Zap Indicator */}
                        {(() => {
                          let badgeStyle = 'from-[#8FAF8F]/10 to-[#8FAF8F]/5 text-[#5a7a5a] border-[#8FAF8F]/20';
                          if (event.type === 'interview') badgeStyle = 'from-[#A8C5DA]/10 to-[#A8C5DA]/5 text-[#5a7a9a] border-[#A8C5DA]/20';
                          if (event.type === 'coding') badgeStyle = 'from-[#F0B8C8]/10 to-[#F0B8C8]/5 text-[#a85f75] border-[#F0B8C8]/20';
                          if (event.type === 'qa') badgeStyle = 'from-[#B5A2D9]/10 to-[#B5A2D9]/5 text-[#7a5a9a] border-[#B5A2D9]/20';
                          if (event.type === 'badge') badgeStyle = 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20';

                          return (
                            <div className={`flex items-center gap-1 px-2.5 py-1 bg-gradient-to-br ${badgeStyle} rounded-xl border shadow-inner shrink-0`}>
                              <Zap size={11} className="fill-current" />
                              <span className="font-black text-xs">+{event.xp} XP</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
