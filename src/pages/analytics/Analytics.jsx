import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Code2, Brain, Video, CheckCircle2, TrendingUp, 
  Trophy, Calendar, Loader2, Clock, Star, Award, ChevronRight, BarChart3, AlertCircle, Calculator, List
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Sector
} from 'recharts';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays, isAfter } from 'date-fns';
import toast from 'react-hot-toast';
import { calculateLevel, getRank } from '../../utils/helpers';

const COLORS = ['#8FAF8F', '#A8C5DA', '#F0B8C8', '#EDE7DF'];

// Custom Tooltip for Radar Chart
const RadarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-[#e8e0d8] shadow-lg text-xs space-y-1">
        <p className="font-black text-[#3a2f25]">{data.subject}</p>
        <p className="font-bold text-[#8FAF8F]">Average Mastery: <span className="font-mono font-black">{data.Mastery}%</span></p>
        <p className="text-[10px] text-[#9a8f85] font-semibold">Total Attempts: {data.attempts}</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { currentUser } = useAuth();
  
  // Loading & Filter States
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // '7days' | '30days' | 'all'
  const [masteryView, setMasteryView] = useState('radar'); // 'radar' | 'list'
  const [activePieIndex, setActivePieIndex] = useState(null);
  
  // DB Raw States
  const [rawAptitude, setRawAptitude] = useState([]);
  const [rawInterviews, setRawInterviews] = useState([]);
  const [rawCoding, setRawCoding] = useState([]);
  const [rawQA, setRawQA] = useState([]);
  
  // Computed States
  const [kpis, setKpis] = useState({
    totalAptitude: 0,
    avgAptitudeScore: 0,
    totalInterviews: 0,
    avgInterviewScore: 0,
    problemsSolved: 0,
    qaSessionsDone: 0,
    avgQAScore: 0,
    totalXP: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [masteryData, setMasteryData] = useState([]);
  const [weeklyPractice, setWeeklyPractice] = useState([]);

  // Fetch all user raw data on mount
  useEffect(() => {
    if (currentUser) {
      fetchRawAnalytics();
    }
  }, [currentUser]);

  // Re-calculate everything when filters or raw data change
  useEffect(() => {
    if (!isLoading) {
      calculateAnalytics();
    }
  }, [timeFilter, rawAptitude, rawInterviews, rawCoding, rawQA]);

  // Fetch raw collections from Firestore
  const fetchRawAnalytics = async () => {
    setIsLoading(true);
    try {
      const uid = currentUser.uid;

      // 1. Fetch Aptitude
      const aptitudeSnap = await getDocs(query(collection(db, 'results'), where('userId', '==', uid)));
      const apt = aptitudeSnap.docs.map(doc => ({ id: doc.id, type: 'Aptitude Test', ...doc.data() }));
      setRawAptitude(apt);

      // 2. Fetch Interviews
      const interviewSnap = await getDocs(query(collection(db, 'interviewSessions'), where('userId', '==', uid)));
      const intv = interviewSnap.docs.map(doc => ({ id: doc.id, type: 'Mock Interview', ...doc.data() }));
      setRawInterviews(intv);

      // 3. Fetch Coding
      const codingSnap = await getDocs(query(collection(db, 'submissions'), where('userId', '==', uid)));
      const cod = codingSnap.docs.map(doc => ({ id: doc.id, type: 'Coding Challenge', ...doc.data() }));
      setRawCoding(cod);

      // 4. Fetch Technical Q&A
      const qaSnap = await getDocs(query(collection(db, 'qaSessions'), where('userId', '==', uid)));
      const qa = qaSnap.docs.map(doc => ({ id: doc.id, type: 'Technical Q&A', ...doc.data() }));
      setRawQA(qa);

    } catch (error) {
      console.error("Failed to fetch raw analytics:", error);
      toast.error("Failed to load real-time analytics data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Perform client-side calculations and filtering
  const calculateAnalytics = () => {
    const now = new Date();
    let cutoffDate = null;
    if (timeFilter === '7days') cutoffDate = subDays(now, 7);
    if (timeFilter === '30days') cutoffDate = subDays(now, 30);

    // Filter helper
    const filterByDate = (item) => {
      if (!cutoffDate) return true;
      const timestamp = item.createdAt || item.timestamp;
      if (!timestamp) return false;
      const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return isAfter(dateVal, cutoffDate);
    };

    const apt = rawAptitude.filter(filterByDate);
    const intv = rawInterviews.filter(filterByDate);
    const cod = rawCoding.filter(filterByDate);
    const qa = rawQA.filter(filterByDate);

    // Merge and Sort all activities
    const allActivity = [...apt, ...intv, ...cod, ...qa].sort((a, b) => {
      const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    setRecentActivities(allActivity.slice(0, 6));

    // Calculate KPIs
    const aptitudeScores = apt.map(d => d.score).filter(s => s != null);
    const interviewScores = intv.map(d => d.overallScore || d.score).filter(s => s != null);
    const qaScores = qa.map(d => d.averageScore || d.score).filter(s => s != null);
    
    // Sum XP
    let totalXp = 0;
    cod.forEach(c => { if (c.status === 'success' || c.passed) totalXp += 10; });
    qa.forEach(q => { totalXp += q.xpEarned || 0; });
    apt.forEach(a => { if (a.score > 50) totalXp += 20; });
    intv.forEach(i => { if ((i.overallScore || i.score) > 50) totalXp += 30; });

    setKpis({
      totalAptitude: apt.length,
      avgAptitudeScore: aptitudeScores.length ? Math.round(aptitudeScores.reduce((a, b) => a + b, 0) / aptitudeScores.length) : 0,
      totalInterviews: intv.length,
      avgInterviewScore: interviewScores.length ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length) : 0,
      problemsSolved: cod.filter(d => d.status === 'success' || d.passed).length,
      qaSessionsDone: qa.length,
      avgQAScore: qaScores.length ? Math.round(qaScores.reduce((a, b) => a + b, 0) / qaScores.length) : 0,
      totalXP: totalXp
    });

    // Practice Minutes Line/Area Graph (dynamic aggregation based on selected filter)
    const activeDays = [];
    const docGroups = [
      { list: apt, mins: 15 },
      { list: cod, mins: 10 },
      { list: qa, mins: 15 },
      { list: intv, mins: 25 }
    ];

    if (timeFilter === '7days') {
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        activeDays.push({
          dateStr: d.toDateString(),
          label: daysOfWeek[d.getDay()],
          minutes: 0
        });
      }
      docGroups.forEach(({ list, mins }) => {
        list.forEach((item) => {
          const timestamp = item.createdAt || item.timestamp;
          if (timestamp) {
            const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
            const matched = activeDays.find(ad => ad.dateStr === dateVal.toDateString());
            if (matched) matched.minutes += mins;
          }
        });
      });
    } else if (timeFilter === '30days') {
      for (let i = 29; i >= 0; i--) {
        const d = subDays(new Date(), i);
        activeDays.push({
          dateStr: d.toDateString(),
          label: format(d, 'MMM dd'),
          minutes: 0
        });
      }
      docGroups.forEach(({ list, mins }) => {
        list.forEach((item) => {
          const timestamp = item.createdAt || item.timestamp;
          if (timestamp) {
            const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
            const matched = activeDays.find(ad => ad.dateStr === dateVal.toDateString());
            if (matched) matched.minutes += mins;
          }
        });
      });
    } else {
      // All Time: Group by Month for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        activeDays.push({
          yearMonth: format(d, 'yyyy-MM'),
          label: format(d, 'MMM yyyy'),
          minutes: 0
        });
      }
      docGroups.forEach(({ list, mins }) => {
        list.forEach((item) => {
          const timestamp = item.createdAt || item.timestamp;
          if (timestamp) {
            const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
            const ym = format(dateVal, 'yyyy-MM');
            const matched = activeDays.find(ad => ad.yearMonth === ym);
            if (matched) matched.minutes += mins;
          }
        });
      });
    }

    setWeeklyPractice(activeDays);

    // Score Progression Line Chart (Averages)
    const trendMap = {};
    const sortedAsc = [...allActivity].reverse();
    sortedAsc.forEach(item => {
      const timestamp = item.createdAt || item.timestamp;
      if (!timestamp) return;
      const dateVal = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      const dateLabel = format(dateVal, 'MMM dd');
      
      if (!trendMap[dateLabel]) {
        trendMap[dateLabel] = { date: dateLabel, Aptitude: null, Interview: null, QandA: null };
      }
      if (item.type === 'Aptitude Test' && item.score != null) {
        trendMap[dateLabel].Aptitude = item.score; 
      }
      if (item.type === 'Mock Interview' && (item.overallScore != null || item.score != null)) {
        trendMap[dateLabel].Interview = item.overallScore || item.score;
      }
      if (item.type === 'Technical Q&A' && (item.averageScore != null || item.score != null)) {
        trendMap[dateLabel].QandA = item.averageScore || item.score;
      }
    });
    setTrendData(Object.values(trendMap));

    // Category Distribution (Pie Chart)
    const dist = [
      { name: 'Aptitude Tests', value: apt.length },
      { name: 'Coding Problems', value: cod.length },
      { name: 'Technical Q&As', value: qa.length },
      { name: 'Mock Interviews', value: intv.length },
    ].filter(d => d.value > 0);
    setDistributionData(dist.length > 0 ? dist : [{ name: 'No Practice Yet', value: 1 }]);

    // Mastery Radar Chart
    const topicScores = {};
    apt.forEach(a => {
      const topic = a.testTopic || 'Aptitude';
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(a.score);
    });
    qa.forEach(q => {
      const topic = q.topic || 'CS Core';
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(q.averageScore || q.score);
    });
    intv.forEach(i => {
      const topic = i.role || 'Interview';
      if (!topicScores[topic]) topicScores[topic] = [];
      topicScores[topic].push(i.overallScore || i.score);
    });

    const mastery = Object.keys(topicScores).map(topic => {
      const scores = topicScores[topic].filter(s => s != null);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return {
        subject: topic,
        // Slice labels to prevent clipping on the Radar edges
        shortSubject: topic.length > 10 ? topic.slice(0, 8) + '..' : topic,
        Mastery: avg,
        attempts: scores.length,
        fullMark: 100
      };
    });

    // Sort mastery desc
    mastery.sort((a, b) => b.Mastery - a.Mastery);
    setMasteryData(mastery);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#8FAF8F]" size={45} />
        <span className="text-xs font-black uppercase text-[#9a8f85] tracking-widest animate-pulse">Syncing AI Analytics...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 p-4 md:p-8">
      
      {/* ── HEADER & INTERVAL SELECTOR ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#3a2f25] tracking-tight">Performance Analytics</h1>
          <p className="text-[#7a6f65] font-semibold text-sm mt-1">
            Analyze your learning speed, concept mastery, and real-time practice stats.
          </p>
        </div>

        {/* Time Selector */}
        <div className="flex bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/60 shadow-[2px_2px_8px_rgba(0,0,0,0.03),-1px_-1px_6px_rgba(255,255,255,0.7)]">
          {[
            { id: '7days', label: '7 Days' },
            { id: '30days', label: '30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                ${timeFilter === tab.id 
                  ? 'bg-gradient-to-br from-[#8FAF8F] to-[#81a081] text-white shadow-sm border border-white/20' 
                  : 'text-[#7a6f65] hover:bg-white/40'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Interviews Aced', count: kpis.totalInterviews, sub: `Avg Score: ${kpis.avgInterviewScore}%`, icon: Video, color: 'from-[#A8C5DA]/30 to-[#A8C5DA]/10', iconColor: 'text-[#5a7a9a]' },
          { title: 'Aptitude Tests', count: kpis.totalAptitude, sub: `Avg Score: ${kpis.avgAptitudeScore}%`, icon: Calculator, color: 'from-[#8FAF8F]/30 to-[#8FAF8F]/10', iconColor: 'text-[#5a7a5a]' },
          { title: 'Technical Q&As', count: kpis.qaSessionsDone, sub: `Avg Score: ${kpis.avgQAScore}%`, icon: Brain, color: 'from-[#EDE7DF]/90 to-[#EDE7DF]/40', iconColor: 'text-[#8a7f72]' },
          { title: 'Practice XP', count: kpis.totalXP, sub: `Rank: ${getRank(calculateLevel(kpis.totalXP))}`, icon: Trophy, color: 'from-[#F0B8C8]/30 to-[#F0B8C8]/10', iconColor: 'text-[#a85f75]' }
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} border border-white/60 rounded-[2rem] p-6 shadow-[6px_6px_20px_rgba(0,0,0,0.04),-4px_-4px_16px_rgba(255,255,255,0.8)] flex flex-col justify-between min-h-[125px] hover:scale-[1.02] transition-transform`}>
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl bg-white/60 shadow-sm border border-white/80 shrink-0 ${card.iconColor}`}>
                <card.icon size={20} />
              </div>
              <span className="text-3xl font-black text-[#3a2f25] font-mono leading-none">{card.count}</span>
            </div>
            <div className="mt-4">
              <h3 className="text-xs font-black text-[#3a2f25] uppercase tracking-wider">{card.title}</h3>
              <p className="text-[10px] text-[#7a6f65] font-bold mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── VISUALIZATIONS SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section (8 cols): Progress Trend & Practice Time */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Trend Chart */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)]">
            <h2 className="text-lg font-black text-[#3a2f25] flex items-center gap-2 mb-6 border-b border-[#e8e0d8] pb-3">
              <TrendingUp size={20} className="text-[#8FAF8F]" /> Score Progression
            </h2>
            <div className="h-72 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,79,69,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7a6f65', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7a6f65', fontWeight: 'bold' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid #white', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Line type="monotone" name="Aptitude" dataKey="Aptitude" stroke="#8FAF8F" strokeWidth={3} dot={{ r: 4, fill: '#8FAF8F', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" name="Interview" dataKey="Interview" stroke="#A8C5DA" strokeWidth={3} dot={{ r: 4, fill: '#A8C5DA', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                    <Line type="monotone" name="Technical Q&A" dataKey="QandA" stroke="#F0B8C8" strokeWidth={3} dot={{ r: 4, fill: '#F0B8C8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#9a8f85] text-xs font-bold uppercase gap-2">
                  <AlertCircle size={24} className="text-slate-300" />
                  Not enough practice history to map scores yet.
                </div>
              )}
            </div>
          </div>

          {/* Practice consistency graph (minutes) */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)]">
            <h2 className="text-lg font-black text-[#3a2f25] flex items-center gap-2 mb-6 border-b border-[#e8e0d8] pb-3">
              <Clock size={20} className="text-[#A8C5DA]" /> {timeFilter === '7days' ? 'Practice Time (Last 7 Days)' : timeFilter === '30days' ? 'Practice Time (Last 30 Days)' : 'Practice Time (All Time)'}
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyPractice} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A8C5DA" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A8C5DA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(90,79,69,0.05)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7a6f65', fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7a6f65', fontWeight: 'bold' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '16px', border: '1px solid #white', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
                    itemStyle={{ color: '#5a7a9a', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#A8C5DA" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Section (4 cols): Mastery Radar & Distribution */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Concept Mastery Radar / List Card */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between border-b border-[#e8e0d8] pb-3 mb-4">
              <h2 className="text-md font-black text-[#3a2f25] flex items-center gap-2">
                <Award size={18} className="text-[#8FAF8F]" /> Subject Mastery
              </h2>
              
              {/* Radar / List Toggle */}
              <div className="flex bg-[#e8e0d8]/30 p-1 rounded-xl border border-white/40">
                <button
                  onClick={() => setMasteryView('radar')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    masteryView === 'radar' 
                      ? 'bg-white text-[#8FAF8F] shadow-sm' 
                      : 'text-[#7a6f65] hover:bg-white/20'
                  }`}
                  title="Chart View"
                >
                  <Activity size={14} />
                </button>
                <button
                  onClick={() => setMasteryView('list')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    masteryView === 'list' 
                      ? 'bg-white text-[#8FAF8F] shadow-sm' 
                      : 'text-[#7a6f65] hover:bg-white/20'
                  }`}
                  title="List View"
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[220px]">
              {masteryData.length > 0 ? (
                <AnimatePresence mode="wait">
                  {masteryView === 'radar' ? (
                    <motion.div
                      key="radar"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="h-64 w-full flex items-center justify-center"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" radius="70%" data={masteryData.slice(0, 5)}>
                          <defs>
                            <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8FAF8F" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#8FAF8F" stopOpacity={0.15}/>
                            </linearGradient>
                          </defs>
                          <PolarGrid stroke="rgba(90,79,69,0.08)" />
                          <PolarAngleAxis dataKey="shortSubject" tick={{ fontSize: 9, fill: '#5a4f45', fontWeight: 'black' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#9a8f85' }} />
                          <Radar name="Mastery" dataKey="Mastery" stroke="#8FAF8F" fill="url(#radarGrad)" fillOpacity={1} />
                          <Tooltip content={<RadarTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 max-h-[260px] overflow-y-auto pr-1"
                    >
                      {masteryData.map((item, idx) => (
                        <div key={idx} className="space-y-1 group" title={`Attempts: ${item.attempts}`}>
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-[#3a2f25] truncate max-w-[70%] transition-colors group-hover:text-[#8FAF8F]" title={item.subject}>
                              {item.subject}
                            </span>
                            <span className="text-[#8FAF8F] font-mono font-black">{item.Mastery}%</span>
                          </div>
                          
                          {/* Neomorphic mini progress bar */}
                          <div className="w-full h-1.5 bg-[#e8e0d8] rounded-full overflow-hidden shadow-inner border border-white/20">
                            <div 
                              className={`h-full rounded-full ${
                                item.Mastery >= 75 ? 'bg-[#8FAF8F]' :
                                item.Mastery >= 50 ? 'bg-[#A8C5DA]' : 'bg-[#F0B8C8]'
                              }`}
                              style={{ width: `${item.Mastery}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                <div className="text-center text-xs font-bold text-[#9a8f85] uppercase py-12">
                  No subject mastery details yet.
                </div>
              )}
            </div>
          </div>

          {/* Distribution Pie Chart */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] flex flex-col">
            <h2 className="text-md font-black text-[#3a2f25] border-b border-[#e8e0d8] pb-3 flex items-center gap-2 mb-4">
              <Target size={18} className="text-[#F0B8C8]" /> Practice Shares
            </h2>
            <div className="flex flex-col items-center gap-4">
              {/* Donut Chart (Centered with Dynamic Hover details inside hole) */}
              {(() => {
                const total = distributionData.reduce((sum, item) => sum + (item.name === 'No Practice Yet' ? 0 : item.value), 0);
                
                const trackTheme = {
                  'Aptitude Tests': { border: 'border-[#8FAF8F]/40', text: 'text-[#8FAF8F]', bg: 'bg-[#8FAF8F]/5 shadow-[inset_0_2px_8px_rgba(143,175,143,0.08)]' },
                  'Coding Problems': { border: 'border-[#F0B8C8]/40', text: 'text-[#F0B8C8]', bg: 'bg-[#F0B8C8]/5 shadow-[inset_0_2px_8px_rgba(240,184,200,0.08)]' },
                  'Technical Q&As': { border: 'border-[#A8C5DA]/40', text: 'text-[#A8C5DA]', bg: 'bg-[#A8C5DA]/5 shadow-[inset_0_2px_8px_rgba(168,197,218,0.08)]' },
                  'Mock Interviews': { border: 'border-[#B5A2D9]/40', text: 'text-[#B5A2D9]', bg: 'bg-[#B5A2D9]/5 shadow-[inset_0_2px_8px_rgba(181,162,217,0.08)]' }
                };

                const activeTrack = activePieIndex !== null && distributionData[activePieIndex] ? distributionData[activePieIndex].name : null;
                const activeStyle = trackTheme[activeTrack] || { border: 'border-[#e8e0d8] border-dashed', text: 'text-[#9a8f85]', bg: 'bg-white/40 shadow-inner' };

                return (
                  <div className="h-44 w-44 shrink-0 relative flex items-center justify-center">
                    {/* Glowing Interactive center circle */}
                    <div className={`absolute flex flex-col items-center justify-center text-center pointer-events-none z-10 w-24 h-24 rounded-full border-2 transition-all duration-300 ${activeStyle.border} ${activeStyle.bg}`}>
                      {activePieIndex !== null && distributionData[activePieIndex] && distributionData[activePieIndex].name !== 'No Practice Yet' ? (
                        <>
                          <span className="text-3xl font-black text-[#3a2f25] font-mono leading-none">
                            {distributionData[activePieIndex].value}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider mt-1 truncate w-[85%] ${activeStyle.text}`}>
                            {distributionData[activePieIndex].name === 'Aptitude Tests' ? 'Aptitude' : 
                             distributionData[activePieIndex].name === 'Coding Problems' ? 'Coding' : 
                             distributionData[activePieIndex].name === 'Technical Q&As' ? 'Q&As' : 'Interviews'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-black text-[#3a2f25] font-mono leading-none">{total}</span>
                          <span className="text-[9px] font-black uppercase text-[#9a8f85] tracking-widest mt-1">Practiced</span>
                        </>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {/* Premium Drop shadow to make sectors float off background */}
                          <filter id="sectorShadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3a2f25" floodOpacity="0.06" />
                          </filter>
                        </defs>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                          activeIndex={activePieIndex}
                          activeShape={(props) => (
                            <Sector
                              cx={props.cx}
                              cy={props.cy}
                              innerRadius={props.innerRadius}
                              outerRadius={props.outerRadius + 4}
                              startAngle={props.startAngle}
                              endAngle={props.endAngle}
                              fill={props.fill}
                              stroke="none"
                              filter="url(#sectorShadow)"
                            />
                          )}
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(null)}
                        >
                          {distributionData.map((entry, index) => {
                            const trackColors = {
                              'Aptitude Tests': '#8FAF8F',
                              'Coding Problems': '#F0B8C8',
                              'Technical Q&As': '#A8C5DA',
                              'Mock Interviews': '#B5A2D9' // Premium Soft Lavender
                            };
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.name === 'No Practice Yet' ? '#e8e0d8' : (trackColors[entry.name] || COLORS[index % COLORS.length])} 
                              />
                            );
                          })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}

              {/* Custom Detailed Legend List (2x2 Grid) */}
              <div className="w-full">
                {(() => {
                  const trackColors = {
                    'Aptitude Tests': '#8FAF8F',
                    'Coding Problems': '#F0B8C8',
                    'Technical Q&As': '#A8C5DA',
                    'Mock Interviews': '#B5A2D9'
                  };
                  const total = distributionData.reduce((sum, item) => sum + (item.name === 'No Practice Yet' ? 0 : item.value), 0);
                  
                  if (total === 0 || (distributionData.length === 1 && distributionData[0].name === 'No Practice Yet')) {
                    return (
                      <p className="text-[10px] text-center font-bold text-[#9a8f85] uppercase tracking-wider py-4">
                        No share details available
                      </p>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-2.5 w-full pt-3 border-t border-[#e8e0d8]/40">
                      {distributionData.map((item, idx) => {
                        const color = trackColors[item.name] || '#e8e0d8';
                        const bgLight = color + '15'; // 8% opacity tint background
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/40 hover:scale-[1.02] transition-all"
                            style={{ backgroundColor: bgLight }}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black text-[#5a4f45] truncate" title={item.name}>
                                {item.name === 'Aptitude Tests' ? 'Aptitude' : 
                                 item.name === 'Coding Problems' ? 'Coding' : 
                                 item.name === 'Technical Q&As' ? 'Q&As' : 'Interviews'}
                              </span>
                              <span className="block text-[9px] font-bold text-[#7a6f65] font-mono leading-none mt-0.5">{pct}% ({item.value})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── RECENT ACTIVITY TABLE ── */}
      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)]">
        <h2 className="text-lg font-black text-[#3a2f25] flex items-center gap-2 mb-6 border-b border-white/60 pb-3">
          <Calendar size={20} className="text-[#A8C5DA]" /> Training History Ledger
        </h2>
        
        {recentActivities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e8e0d8] text-[#9a8f85] text-xs font-black uppercase tracking-wider">
                  <th className="pb-3 px-4">Subject Type</th>
                  <th className="pb-3 px-4">Completion Date</th>
                  <th className="pb-3 px-4">Details / Topics</th>
                  <th className="pb-3 px-4 text-right">Practice Status</th>
                </tr>
              </thead>
              <tbody className="text-[#5a4f45] font-semibold text-xs">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="border-b border-[#e8e0d8]/40 last:border-0 hover:bg-[#8FAF8F]/5 transition-all">
                    <td className="py-4 px-4 font-black text-[#3a2f25] flex items-center gap-2">
                      {activity.type === 'Aptitude Test' && <Calculator size={15} className="text-[#8FAF8F]" />}
                      {activity.type === 'Mock Interview' && <Video size={15} className="text-[#A8C5DA]" />}
                      {activity.type === 'Coding Challenge' && <Code2 size={15} className="text-[#F0B8C8]" />}
                      {activity.type === 'Technical Q&A' && <Brain size={15} className="text-amber-500" />}
                      {activity.type}
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      {activity.createdAt ? format(activity.createdAt.seconds ? new Date(activity.createdAt.seconds * 1000) : new Date(activity.createdAt), 'MMM dd, yyyy') : 'Just now'}
                    </td>
                    <td className="py-4 px-4">
                      {activity.type === 'Coding Challenge' 
                        ? `${activity.problemName || 'Algorithm'} (${activity.difficulty || 'Medium'})`
                        : activity.type === 'Technical Q&A'
                        ? `${activity.topic || 'CS Core'} (Score: ${activity.averageScore || activity.score || 0}%)`
                        : activity.type === 'Mock Interview'
                        ? `${activity.role || 'Recruiting Quiz'} (Score: ${activity.overallScore || activity.score || 0}%)`
                        : `${activity.testTopic || 'Logic'} (Score: ${activity.score || 0}%)`}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#8FAF8F]/10 text-[#5a7a5a] border border-[#8FAF8F]/20">
                        <CheckCircle2 size={11} /> Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white/30 rounded-2xl border border-white/50 border-dashed">
            <Activity size={32} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-[#3a2f25] font-black">No training history registered</h3>
            <p className="text-[#9a8f85] text-xs font-semibold mt-1">Start practicing across your dashboard modules to populate logs.</p>
          </div>
        )}
      </div>

    </div>
  );
}
