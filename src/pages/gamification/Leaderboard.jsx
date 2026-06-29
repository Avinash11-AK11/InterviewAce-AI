import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Trophy, Crown, Medal, Star, Filter, Globe, GraduationCap,
  Calendar, Zap, Award, Users, ChevronUp, ChevronDown,
} from 'lucide-react';
import {
  collection, query, orderBy, limit, getDocs, where,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { calculateLevel, getRank, getInitials, getAvatarColor } from '../../utils/helpers';
import { MOCK_LEADERBOARD } from '../../utils/seedData';

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTER_OPTIONS = [
  { id: 'global',  label: 'Global',  icon: Globe },
  { id: 'college', label: 'College', icon: GraduationCap },
  { id: 'weekly',  label: 'Weekly',  icon: Calendar },
];

const MEDAL_STYLES = {
  1: { bg: 'from-yellow-300 to-yellow-500', border: 'border-yellow-400', shadow: 'shadow-yellow-300/50', crown: '#F59E0B', size: 'w-24 h-24', zIndex: 'z-20', translateY: '-translate-y-4' },
  2: { bg: 'from-gray-300 to-gray-400',     border: 'border-gray-400',   shadow: 'shadow-gray-300/50',   crown: '#9CA3AF', size: 'w-20 h-20', zIndex: 'z-10', translateY: '' },
  3: { bg: 'from-amber-600 to-amber-800',   border: 'border-amber-700',  shadow: 'shadow-amber-400/50',  crown: '#B45309', size: 'w-20 h-20', zIndex: 'z-10', translateY: '' },
};

// ─── Avatar Component ─────────────────────────────────────────────────────────
const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl', xl: 'w-24 h-24 text-3xl' };
  const colorData = getAvatarColor(user?.name || '');
  const bg = colorData?.bg || '#8FAF8F';
  return user?.avatarUrl ? (
    <img src={user.avatarUrl} alt={user.name}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`} />
  ) : (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ${className}`}
      style={{ backgroundColor: bg }}>
      {getInitials(user?.name || '?')}
    </div>
  );
};

// ─── Podium Card ──────────────────────────────────────────────────────────────
const PodiumCard = ({ user, rank }) => {
  const style = MEDAL_STYLES[rank];
  const rankLabel = { 1: '1st', 2: '2nd', 3: '3rd' }[rank];
  const rankOrder = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';

  return (
    <motion.div
      className={`flex flex-col items-center ${rankOrder} ${style.translateY}`}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.15, type: 'spring', stiffness: 100 }}
    >
      {/* Crown */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="mb-1"
      >
        <Crown size={rank === 1 ? 32 : 22} style={{ color: style.crown }} fill={style.crown} />
      </motion.div>

      {/* Avatar */}
      <Link to={`/profile/${user?.uid || user?.id}`} className="hover:opacity-85 transition-opacity">
        <div className={`${style.size} rounded-full border-4 ${style.border} shadow-xl ${style.shadow} bg-gradient-to-br ${style.bg} p-0.5`}>
          <Avatar user={user} size={rank === 1 ? 'xl' : 'lg'} className="w-full h-full" />
        </div>
      </Link>

      {/* Rank Badge */}
      <div className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${style.bg}`}>
        {rankLabel}
      </div>

      {/* Name */}
      <Link to={`/profile/${user?.uid || user?.id}`} className="hover:underline text-center">
        <p className="mt-1 font-bold text-gray-700 text-sm text-center max-w-[120px] truncate">{user?.name}</p>
      </Link>
      <p className="text-xs text-gray-500 text-center max-w-[120px] truncate">{user?.college}</p>

      {/* XP */}
      <div className="mt-1 flex items-center gap-1">
        <Zap size={12} className="text-yellow-500" fill="currentColor" />
        <span className="text-xs font-semibold text-gray-600">{(user?.xp || 0).toLocaleString()} XP</span>
      </div>

      {/* Podium block */}
      <div className={`mt-2 rounded-t-lg w-24 ${rank === 1 ? 'h-16 bg-yellow-400/30' : 'h-10 bg-gray-200/50'} border-t-2 ${style.border}`} />
    </motion.div>
  );
};

// ─── Table Row ────────────────────────────────────────────────────────────────
const LeaderboardRow = ({ user, rank, isCurrentUser, index }) => {
  const rankBg = isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-400' : 'hover:bg-cream-50';
  return (
    <motion.tr
      className={`border-b border-gray-100 transition-colors ${rankBg}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold
          ${rank <= 10 ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <Link to={`/profile/${user.uid || user.id}`} className="flex items-center gap-3 hover:opacity-85 transition-opacity group">
          <Avatar user={user} size="sm" />
          <div>
            <p className="font-semibold text-gray-800 text-sm group-hover:underline">
              {user.name} {isCurrentUser && <span className="text-xs text-blue-500 ml-1">(You)</span>}
            </p>
            <p className="text-xs text-gray-400">{user.college}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Lv. {user.level}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Zap size={12} className="text-yellow-500" fill="currentColor" />
          <span className="text-sm font-semibold text-gray-700">{(user.xp || 0).toLocaleString()}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Award size={12} className="text-purple-500" />
          <span className="text-sm text-gray-600">{user.badgesCount || 0}</span>
        </div>
      </td>
      {rank <= 3 && (
        <td className="px-4 py-3 text-center">
          {rank === 1 && <span className="text-lg">🥇</span>}
          {rank === 2 && <span className="text-lg">🥈</span>}
          {rank === 3 && <span className="text-lg">🥉</span>}
        </td>
      )}
    </motion.tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { userProfile, currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('global');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));

      if (activeFilter === 'college' && userProfile?.college) {
        q = query(
          collection(db, 'users'),
          where('college', '==', userProfile.college),
          orderBy('xp', 'desc'),
          limit(50),
        );
      } else if (activeFilter === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        q = query(
          collection(db, 'users'),
          orderBy('weeklyXP', 'desc'),
          limit(50),
        );
      }

      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs.map((doc, i) => ({
          id: doc.id,
          rank: i + 1,
          name: doc.data().displayName || doc.data().name || 'Anonymous',
          college: doc.data().college || 'Unknown College',
          xp: activeFilter === 'weekly' ? (doc.data().weeklyXP || 0) : (doc.data().xp || 0),
          level: calculateLevel(doc.data().xp || 0),
          badgesCount: (doc.data().badges || []).length,
          avatarUrl: doc.data().photoURL || null,
        }));
        setLeaderboard(data);
        if (currentUser) {
          const myRank = data.findIndex((u) => u.id === currentUser.uid);
          setUserRank(myRank >= 0 ? myRank + 1 : null);
        }
      } else {
        // Use mock data
        setLeaderboard(MOCK_LEADERBOARD.map((u, i) => ({ ...u, rank: i + 1 })));
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setLeaderboard(MOCK_LEADERBOARD.map((u, i) => ({ ...u, rank: i + 1 })));
    } finally {
      setLoading(false);
    }
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const currentUserInTop50 = leaderboard.find((u) => u.id === currentUser?.uid);
  const currentUserEntry = !currentUserInTop50 && userProfile
    ? {
        id: currentUser?.uid,
        name: userProfile.displayName || userProfile.name || 'You',
        college: userProfile.college || '',
        xp: userProfile.xp || 0,
        level: calculateLevel(userProfile.xp || 0),
        badgesCount: (userProfile.badges || []).length,
        avatarUrl: userProfile.photoURL || null,
        rank: '51+',
      }
    : null;

  return (
    <div className="min-h-screen bg-[#F5EFE6] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 mb-2">
            <Trophy size={32} className="text-yellow-500" fill="currentColor" />
            <h1 className="text-3xl font-extrabold text-gray-800">Leaderboard</h1>
          </div>
          <p className="text-gray-500 text-sm">See how you rank against other interview prep champions</p>
          {userRank && (
            <motion.div
              className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
            >
              <Star size={14} fill="currentColor" /> Your rank: #{userRank}
            </motion.div>
          )}
        </motion.div>

        {/* ── Filter Tabs ── */}
        <motion.div
          className="flex justify-center gap-3 mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          {FILTER_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200
                ${activeFilter === id
                  ? 'bg-[#8FAF8F] text-white shadow-lg shadow-[#8FAF8F]/30'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-[#8FAF8F]/30 border-t-[#8FAF8F] rounded-full"
            />
            <p className="text-gray-400 text-sm">Loading leaderboard...</p>
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {top3.length >= 3 && (
              <div className="bg-gradient-to-br from-[#FAF6F1] to-[#F5EFE6] rounded-3xl p-8 mb-6
                shadow-[inset_-3px_-3px_8px_rgba(255,255,255,0.9),inset_3px_3px_8px_rgba(0,0,0,0.08)]">
                <div className="flex items-end justify-center gap-8">
                  {[top3[1], top3[0], top3[2]].map((user) => (
                    <PodiumCard key={user.id} user={user} rank={user.rank} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Table ── */}
            <motion.div
              className="bg-white rounded-3xl overflow-hidden shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {/* Stats bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAF6F1]">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-[#8FAF8F]" />
                  <span className="font-semibold text-gray-700">Top {leaderboard.length} Competitors</span>
                </div>
                <span className="text-sm text-gray-400">Filtered: {FILTER_OPTIONS.find(f => f.id === activeFilter)?.label}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center w-16">Rank</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Level</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">XP</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Badges</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rest.map((user, index) => (
                        <LeaderboardRow
                          key={user.id}
                          user={user}
                          rank={user.rank}
                          isCurrentUser={user.id === currentUser?.uid}
                          index={index}
                        />
                      ))}
                      {/* Current user outside top 50 */}
                      {currentUserEntry && (
                        <>
                          <tr><td colSpan={5} className="text-center py-2 text-gray-300 text-xs">• • •</td></tr>
                          <LeaderboardRow
                            user={currentUserEntry}
                            rank={currentUserEntry.rank}
                            isCurrentUser
                            index={rest.length + 1}
                          />
                        </>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No data yet</p>
                  <p className="text-sm mt-1">Be the first on the leaderboard!</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
