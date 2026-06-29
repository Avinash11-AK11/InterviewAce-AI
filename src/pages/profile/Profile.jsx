import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Save, User, MapPin, GraduationCap, Mail, Loader2, 
  Award, Zap, BookOpen, Code2, Video, MessageSquare, Share2, ArrowLeft, Trophy,
  Calendar, CheckCircle2, ChevronRight, X, Sparkles, TrendingUp
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { calculateLevel, getRank, getRankColor, getAvatarColor, getInitials, getXPProgress } from '../../utils/helpers';
import { BADGES_DATA } from '../../utils/seedData';

// Category colors for badges
const CATEGORY_COLORS = {
  Tests:      { border: 'border-blue-200', text: 'text-blue-600', bg: 'bg-blue-50/50', accent: '#A8C5DA' },
  Coding:     { border: 'border-purple-200', text: 'text-purple-600', bg: 'bg-purple-50/50', accent: '#B5A2D9' },
  Interviews: { border: 'border-green-200', text: 'text-green-600', bg: 'bg-green-50/50', accent: '#8FAF8F' },
  Streaks:    { border: 'border-orange-200', text: 'text-orange-600', bg: 'bg-orange-50/50', accent: '#F5C9A0' },
  Special:    { border: 'border-pink-200', text: 'text-pink-600', bg: 'bg-pink-50/50', accent: '#F0B8C8' },
};

// Helper to determine if badge is earned
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

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, updateProfile } = useAuth();
  
  const targetUid = userId || currentUser?.uid;
  const isOwnProfile = !userId || userId === currentUser?.uid;

  // Profile states
  const [targetProfile, setTargetProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  // Statistics & History Graph states
  const [weeklyPractice, setWeeklyPractice] = useState([]);
  const [subjectMastery, setSubjectMastery] = useState([]);
  const [stats, setStats] = useState({
    testsTaken: 0,
    problemsSolved: 0,
    interviewsDone: 0,
    qaSessionsDone: 0,
    currentStreak: 0,
    resumesUploaded: 0,
    highScoreCount: 0,
    perfectScores: 0,
    hardProblemsSolved: 0,
    profileComplete: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    college: '',
    graduationYear: '',
  });

  const fileInputRef = useRef(null);

  // Fetch target user data, stats, and practice logs
  useEffect(() => {
    async function loadProfileData() {
      if (!targetUid) return;
      setProfileLoading(true);
      try {
        let profile = null;
        if (isOwnProfile && userProfile) {
          profile = userProfile;
        } else {
          const docRef = doc(db, 'users', targetUid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            profile = { uid: targetUid, ...docSnap.data() };
          }
        }

        if (profile) {
          setTargetProfile(profile);
          setFormData({
            name: profile.name || '',
            bio: profile.bio || '',
            college: profile.college || '',
            graduationYear: profile.graduationYear || '',
          });

          // Fetch subcollection records for stats
          const [resultsSnap, subsSnap, interviewsSnap, qaSessionsSnap, resumesSnap] = await Promise.all([
            getDocs(query(collection(db, 'results'), where('userId', '==', targetUid))),
            getDocs(query(collection(db, 'submissions'), where('userId', '==', targetUid))),
            getDocs(query(collection(db, 'interviewSessions'), where('userId', '==', targetUid))),
            getDocs(query(collection(db, 'qaSessions'), where('userId', '==', targetUid))),
            getDocs(query(collection(db, 'resumes'), where('userId', '==', targetUid)))
          ]);

          // 1. Aptitude statistics & Subject grouping
          let testsTaken = 0;
          let perfectScores = 0;
          let highScoreCount = 0;
          const subjectMap = { Quantitative: [], Logical: [], Verbal: [] };

          resultsSnap.forEach(d => {
            testsTaken++;
            const data = d.data();
            if (data.score === 100) perfectScores++;
            if (data.score >= 90) highScoreCount++;
            
            const category = data.category || 'Quantitative';
            if (subjectMap[category]) {
              subjectMap[category].push(data.score || 0);
            }
          });

          // Map subject mastery percentage averages
          const masteryList = Object.keys(subjectMap).map(sub => {
            const scores = subjectMap[sub];
            const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            return { subject: sub, average: avg, count: scores.length };
          });
          setSubjectMastery(masteryList);

          // 2. Coding submissions
          let problemsSolved = 0;
          let hardProblemsSolved = 0;
          subsSnap.forEach(d => {
            const data = d.data();
            if (data.status === 'success' || data.status === 'passed' || data.passed) {
              problemsSolved++;
              if (data.difficulty === 'Hard' || data.difficulty === 'hard') hardProblemsSolved++;
            }
          });

          // 3. Interviews
          let interviewsDone = 0;
          interviewsSnap.forEach(d => {
            interviewsDone++;
            const data = d.data();
            if (data.overallScore === 100 || data.score === 100) perfectScores++;
          });

          setStats({
            testsTaken,
            problemsSolved,
            interviewsDone,
            qaSessionsDone: qaSessionsSnap.size,
            currentStreak: profile.streak || 0,
            resumesUploaded: resumesSnap.size,
            highScoreCount,
            perfectScores,
            hardProblemsSolved,
            profileComplete: profile.name && profile.college ? 1 : 0
          });

          // 4. Activity minutes aggregation (last 7 days)
          const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const activeDays = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            activeDays.push({
              dateStr: d.toDateString(),
              label: daysOfWeek[d.getDay()],
              minutes: 0
            });
          }

          const docGroups = [
            { list: resultsSnap, mins: 15 },
            { list: subsSnap, mins: 10 },
            { list: qaSessionsSnap, mins: 15 },
            { list: interviewsSnap, mins: 25 }
          ];

          docGroups.forEach(({ list, mins }) => {
            list.forEach(docItem => {
              const item = docItem.data();
              const timestamp = item.createdAt || item.timestamp;
              if (timestamp) {
                const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
                const matched = activeDays.find(ad => ad.dateStr === dateVal.toDateString());
                if (matched) matched.minutes += mins;
              }
            });
          });

          setWeeklyPractice(activeDays);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
        toast.error("Error loading user profile");
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfileData();
  }, [targetUid, isOwnProfile, userProfile]);

  const levelInfo = useMemo(() => {
    const xp = targetProfile?.xp || 0;
    const { level, progress, nextLevelXP } = getXPProgress(xp);
    const rank = getRank(level);
    return { level, rank, progressPct: progress, xp, nextLvlXp: nextLevelXP };
  }, [targetProfile?.xp]);

  const avatarColor = useMemo(() => {
    return getAvatarColor(targetProfile?.name || '');
  }, [targetProfile?.name]);

  const earnedBadges = useMemo(() => {
    return BADGES_DATA.filter(b => isEarned(b, stats) || targetProfile?.badges?.includes(b.id));
  }, [stats, targetProfile?.badges]);

  // Image Upload Action
  const handleImageClick = () => {
    if (!isOwnProfile || imageLoading) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setImageLoading(true);
      const toastId = toast.loading('Uploading picture...');
      const imageUrl = await uploadToCloudinary(file);
      await updateProfile({ profilePicture: imageUrl });
      
      setTargetProfile(prev => ({ ...prev, profilePicture: imageUrl }));
      toast.success('Profile picture updated!', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    try {
      setSaveLoading(true);
      await updateProfile(formData);
      toast.success('Profile details saved successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}/profile/${targetUid}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Profile URL copied to clipboard! 🚀", {
      icon: '🔗',
      style: { borderRadius: '16px', background: '#3a2f25', color: '#fff' }
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#8FAF8F] animate-spin" />
        <p className="text-sm font-bold text-[#7a6f65] uppercase tracking-widest animate-pulse">Retrieving Profile...</p>
      </div>
    );
  }

  if (!targetProfile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto">
        <Trophy size={48} className="text-slate-300" />
        <h2 className="text-xl font-black text-[#3a2f25]">User Profile Not Found</h2>
        <p className="text-sm text-[#7a6f65]">The requested user ID may be invalid or does not exist in the database.</p>
        <button onClick={() => navigate('/leaderboard')} className="btn-primary mt-2 flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Leaderboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 px-2 md:px-4">
      
      {/* Navigation & Header Actions Row */}
      <div className="flex items-center justify-between">
        {!isOwnProfile ? (
          <button 
            onClick={() => navigate('/leaderboard')} 
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/40 border border-white/60 text-[#7a6f65] font-black text-xs uppercase tracking-wider hover:bg-white/70 transition-all shadow-[2px_2px_6px_rgba(0,0,0,0.02)]"
          >
            <ArrowLeft size={14} /> Back to Leaderboard
          </button>
        ) : (
          <div className="text-xs font-black uppercase text-[#9a8f85] tracking-widest flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#8FAF8F]" /> My Progress Portal
          </div>
        )}

        <button 
          onClick={handleShareProfile} 
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#A8C5DA]/20 border border-[#A8C5DA]/30 text-[#5a7a9a] font-black text-xs uppercase tracking-wider hover:bg-[#A8C5DA]/30 transition-all shadow-sm"
        >
          <Share2 size={14} /> Share Profile
        </button>
      </div>

      {/* Main Glassmorphic Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-8 border border-white/70 shadow-[8px_8px_32px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] bg-white/50 backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#8FAF8F]/15 to-[#B5A2D9]/15 blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
          
          {/* Avatar Section */}
          <div className="relative group">
            <div 
              className={`w-36 h-36 rounded-full p-1.5 shadow-xl transition-transform duration-300 ${isOwnProfile ? 'cursor-pointer hover:scale-[1.03]' : ''}`}
              onClick={handleImageClick}
              style={{ background: 'linear-gradient(135deg, #8FAF8F, #B5A2D9)' }}
            >
              <div className="w-full h-full rounded-full border-4 border-[#FAF6F1] overflow-hidden bg-white flex items-center justify-center relative">
                {targetProfile?.profilePicture ? (
                  <img src={targetProfile.profilePicture} alt={targetProfile.name} className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center font-black text-4xl text-white animate-fade-in"
                    style={{ backgroundColor: avatarColor?.bg || '#8FAF8F' }}
                  >
                    {getInitials(targetProfile?.name)}
                  </div>
                )}
                
                {/* Upload Overlay (Only shown on own profile) */}
                {isOwnProfile && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {imageLoading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                  </div>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageChange} 
              />
            )}
          </div>

          {/* User Meta Information */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8FAF8F]/10 border border-[#8FAF8F]/20 text-xs font-black uppercase text-[#6B8F6B] tracking-wider">
              <User size={12} /> {targetProfile?.role === 'admin' ? 'Admin / Mentor' : 'Developer Candidate'}
            </div>
            <h1 className="text-4xl font-black text-[#3a2f25] tracking-tight">{targetProfile?.name || 'Candidate'}</h1>
            <p className="text-sm font-bold text-[#7a6f65] flex items-center justify-center md:justify-start gap-2">
              <Mail size={15} className="text-[#9a8f85]" /> {targetProfile?.email}
            </p>
            {targetProfile?.college && (
              <p className="text-xs font-semibold text-[#8a7f75] flex items-center justify-center md:justify-start gap-1">
                <GraduationCap size={15} className="text-[#8FAF8F]" /> {targetProfile.college} {targetProfile.graduationYear ? `• Graduating ${targetProfile.graduationYear}` : ''}
              </p>
            )}
          </div>

          {/* Gamification Level Box */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 min-w-[200px] shadow-[4px_4px_16px_rgba(0,0,0,0.03)] border border-white/80 space-y-3 w-full md:w-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#9a8f85] uppercase tracking-wider">Level {levelInfo.level}</span>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B5A2D9]/10 text-[#B5A2D9]`}>
                {levelInfo.rank}
              </span>
            </div>
            
            {/* XP progress bar */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-[#e8e0d8] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#8FAF8F] to-[#B5A2D9] rounded-full transition-all duration-1000"
                  style={{ width: `${levelInfo.progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-[#8a7f75] font-mono">
                <span>{levelInfo.xp} XP</span>
                <span>{levelInfo.nextLvlXp} XP</span>
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Grid Layout: Stats & Charts Left, Achievements Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Columns (Details, Stats & Dynamic Charts) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Practice Statistics Grid */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] space-y-6">
            <h2 className="text-lg font-black text-[#3a2f25] border-b border-[#e8e0d8] pb-3 flex items-center gap-2">
              <Trophy size={18} className="text-[#A8C5DA]" /> Practice Statistics
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-[#A8C5DA]/5 border border-[#A8C5DA]/15 flex items-center gap-4 hover:scale-[1.02] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#A8C5DA]/20 flex items-center justify-center text-[#5a7a9a] shrink-0">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black text-[#9a8f85] uppercase tracking-wider truncate">Aptitude</span>
                  <span className="text-2xl font-black text-[#3a2f25] font-mono leading-none">{stats.testsTaken}</span>
                  <span className="text-[9px] block text-[#7a6f65] font-bold mt-0.5 truncate">Tests Completed</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#B5A2D9]/5 border border-[#B5A2D9]/15 flex items-center gap-4 hover:scale-[1.02] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#B5A2D9]/20 flex items-center justify-center text-[#8e7ab5] shrink-0">
                  <Code2 size={20} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black text-[#9a8f85] uppercase tracking-wider truncate">Coding</span>
                  <span className="text-2xl font-black text-[#3a2f25] font-mono leading-none">{stats.problemsSolved}</span>
                  <span className="text-[9px] block text-[#7a6f65] font-bold mt-0.5 truncate">Problems Solved</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#8FAF8F]/5 border border-[#8FAF8F]/15 flex items-center gap-4 hover:scale-[1.02] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#8FAF8F]/20 flex items-center justify-center text-[#6B8F6B] shrink-0">
                  <Video size={20} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black text-[#9a8f85] uppercase tracking-wider truncate">Interviews</span>
                  <span className="text-2xl font-black text-[#3a2f25] font-mono leading-none">{stats.interviewsDone}</span>
                  <span className="text-[9px] block text-[#7a6f65] font-bold mt-0.5 truncate">Sessions Finished</span>
                </div>
              </div>

              <div className="p-4 rounded-3xl bg-[#F0B8C8]/5 border border-[#F0B8C8]/15 flex items-center gap-4 hover:scale-[1.02] transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#F0B8C8]/20 flex items-center justify-center text-[#cc8a9a] shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black text-[#9a8f85] uppercase tracking-wider truncate">Technical Q&As</span>
                  <span className="text-2xl font-black text-[#3a2f25] font-mono leading-none">{stats.qaSessionsDone}</span>
                  <span className="text-[9px] block text-[#7a6f65] font-bold mt-0.5 truncate">Topics Finished</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Recharts Activity Chart */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] space-y-4">
            <h2 className="text-lg font-black text-[#3a2f25] border-b border-[#e8e0d8] pb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#8FAF8F]" /> Activity Overview
            </h2>

            {weeklyPractice.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyPractice} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profileMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8FAF8F" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8FAF8F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,79,69,0.05)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a6f65', fontWeight: 'bold' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7a6f65', fontWeight: 'bold' }} />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid #e8e0d8', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
                      itemStyle={{ color: '#5a7a9a', fontWeight: 'bold', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="minutes" stroke="#8FAF8F" strokeWidth={2.5} fillOpacity={1} fill="url(#profileMinutes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center py-6 text-xs text-[#9a8f85] font-black uppercase">No practice history available</p>
            )}
          </div>

          {/* Subject Mastery Progress Bars */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] space-y-4">
            <h2 className="text-lg font-black text-[#3a2f25] border-b border-[#e8e0d8] pb-3 flex items-center gap-2">
              <Zap size={18} className="text-[#F5C9A0]" /> Topic Mastery
            </h2>

            <div className="space-y-4">
              {subjectMastery.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-[#5a4f45]">{item.subject} Aptitude</span>
                    <span className="font-bold text-[#8a7f75] font-mono">{item.average}% ({item.count} attempts)</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#e8e0d8]/50 overflow-hidden border border-white/40 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        item.subject === 'Quantitative' ? 'bg-[#8FAF8F]' :
                        item.subject === 'Logical' ? 'bg-[#A8C5DA]' : 'bg-[#F0B8C8]'
                      }`}
                      style={{ width: `${item.average}%` }}
                    />
                  </div>
                </div>
              ))}
              {subjectMastery.length === 0 && (
                <p className="text-center py-6 text-xs text-[#9a8f85] font-black uppercase">No aptitude data available</p>
              )}
            </div>
          </div>

          {/* Personal Details Panel (Edit or Read-Only Card) */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)]">
            <h2 className="text-lg font-black text-[#3a2f25] border-b border-[#e8e0d8] pb-3 flex items-center gap-2 mb-6">
              <User className="text-[#8FAF8F]" /> Candidate Information
            </h2>

            {isOwnProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#7a6f65] uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white/60 border border-white/40 focus:border-[#8FAF8F] focus:ring-2 focus:ring-[#8FAF8F]/20 rounded-2xl px-4 py-3 text-sm text-[#3a2f25] placeholder-[#b5a99f] transition-all outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#7a6f65] uppercase tracking-widest ml-1 flex items-center gap-1">
                      <GraduationCap size={14} className="text-[#A8C5DA]" /> College / University
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      className="w-full bg-white/60 border border-white/40 focus:border-[#A8C5DA] focus:ring-2 focus:ring-[#A8C5DA]/20 rounded-2xl px-4 py-3 text-sm text-[#3a2f25] placeholder-[#b5a99f] transition-all outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                      placeholder="Enter University"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#7a6f65] uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Calendar size={14} className="text-[#F0B8C8]" /> Graduation Year
                    </label>
                    <input
                      type="text"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleInputChange}
                      className="w-full bg-white/60 border border-white/40 focus:border-[#F0B8C8] focus:ring-2 focus:ring-[#F0B8C8]/20 rounded-2xl px-4 py-3 text-sm text-[#3a2f25] placeholder-[#b5a99f] transition-all outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                      placeholder="e.g. 2026"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#7a6f65] uppercase tracking-widest ml-1">About Me / Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-white/60 border border-white/40 focus:border-[#8FAF8F] focus:ring-2 focus:ring-[#8FAF8F]/20 rounded-2xl px-4 py-3 text-sm text-[#3a2f25] placeholder-[#b5a99f] transition-all outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-none"
                    placeholder="Brief bio describing your interests, career goals, or technical domains..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="bg-gradient-to-r from-[#8FAF8F] to-[#7a9a7a] hover:from-[#7ab07a] hover:to-[#6a8a6a] text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(143,175,143,0.3)] disabled:opacity-70"
                  >
                    {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-white/30 border border-white/50 space-y-1">
                    <span className="text-[10px] font-black text-[#9a8f85] uppercase tracking-wider block">College / University</span>
                    <span className="text-sm font-bold text-[#3a2f25] flex items-center gap-1.5">
                      <GraduationCap size={16} className="text-[#A8C5DA]" />
                      {targetProfile.college || 'Not Specified'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/30 border border-white/50 space-y-1">
                    <span className="text-[10px] font-black text-[#9a8f85] uppercase tracking-wider block">Expected Graduation</span>
                    <span className="text-sm font-bold text-[#3a2f25] flex items-center gap-1.5">
                      <Calendar size={16} className="text-[#F0B8C8]" />
                      {targetProfile.graduationYear || 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/30 border border-white/50 space-y-2">
                  <span className="text-[10px] font-black text-[#9a8f85] uppercase tracking-wider block">About Me</span>
                  <p className="text-sm font-semibold text-[#5a4f45] leading-relaxed whitespace-pre-wrap">
                    {targetProfile.bio || 'This candidate hasn\'t written an about me bio yet.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Badges & Achievements) */}
        <div className="lg:col-span-5">
          
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#e8e0d8] pb-3">
              <h2 className="text-lg font-black text-[#3a2f25] flex items-center gap-2">
                <Award size={18} className="text-[#B5A2D9]" /> Unlocked Badges
              </h2>
              <span className="text-xs font-black text-[#8e7ab5] bg-[#B5A2D9]/10 px-3 py-1 rounded-full font-mono">
                {earnedBadges.length} / {BADGES_DATA.length}
              </span>
            </div>

            {earnedBadges.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Award size={36} className="text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-[#9a8f85] uppercase tracking-wider">No badges unlocked yet</p>
                <p className="text-[11px] text-[#7a6f65]">Complete practice activities to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
                {BADGES_DATA.map((badge, idx) => {
                  const hasUnlocked = earnedBadges.some(b => b.id === badge.id);
                  const colors = CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.Special;
                  
                  return (
                    <motion.div 
                      key={badge.id}
                      onClick={() => hasUnlocked && setSelectedBadge(badge)}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between min-h-[110px] ${
                        hasUnlocked 
                          ? `bg-white/80 ${colors.border} shadow-sm cursor-pointer hover:scale-[1.03] hover:shadow-md` 
                          : 'bg-white/20 border-white/30 grayscale opacity-40 select-none'
                      }`}
                      whileTap={hasUnlocked ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">{badge.emoji}</span>
                        {hasUnlocked && (
                          <span className="text-[8px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                      <div className="mt-2 min-w-0">
                        <span className="block text-xs font-black text-[#3a2f25] truncate">{badge.name}</span>
                        <span className="block text-[9px] text-[#7a6f65] leading-tight line-clamp-2 mt-0.5">
                          {badge.description}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#e8e0d8]/30 flex items-center justify-between text-[9px] font-bold">
                        <span className="text-[#9a8f85] uppercase tracking-wider font-mono">{badge.category}</span>
                        <span className="text-amber-600 font-mono flex items-center gap-0.5">
                          <Zap size={9} fill="currentColor" />+{badge.xpReward} XP
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Badge details Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="modal-overlay z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 backdrop-blur-md rounded-[2rem] p-6 max-w-sm w-full border border-[#e8e0d8] shadow-2xl relative space-y-6 mx-4 text-center"
            >
              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-black/5 text-[#9a8f85] transition-all"
              >
                <X size={16} />
              </button>

              <div className="space-y-2">
                <span className="text-5xl block animate-bounce">{selectedBadge.emoji}</span>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#B5A2D9]/10 text-[10px] font-black uppercase text-[#8e7ab5] tracking-wider mt-2">
                  <Award size={10} /> Achievement Earned
                </div>
                <h3 className="text-xl font-black text-[#3a2f25] pt-1">{selectedBadge.name}</h3>
                <p className="text-xs text-[#7a6f65] px-4">{selectedBadge.description}</p>
              </div>

              {/* Requirement badge metrics bar */}
              <div className="bg-[#FAF6F1]/80 rounded-2xl p-4 border border-[#e8e0d8]/50 space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-[#9a8f85]">
                  <span>Metric</span>
                  <span className="text-[#8e7ab5]">{selectedBadge.requirement.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#5a4f45]">
                  <span>Required Target</span>
                  <span className="font-mono">{selectedBadge.requirement.count}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-600 text-sm font-black font-mono">
                  <Zap size={16} fill="currentColor" /> +{selectedBadge.xpReward} XP Reward Claimed
                </div>
                <button 
                  onClick={() => {
                    handleShareProfile();
                    setSelectedBadge(null);
                  }}
                  className="btn-primary flex items-center justify-center gap-2 mt-4 text-xs font-black uppercase tracking-widest py-3 rounded-xl bg-gradient-to-r from-[#8FAF8F] to-[#7a9a7a]"
                >
                  <Share2 size={14} /> Share Achievement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
