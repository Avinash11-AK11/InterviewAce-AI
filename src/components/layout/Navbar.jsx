import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  Settings,
  X,
  LayoutDashboard,
  Calculator,
  MessageSquareCode,
  Code2,
  FileSearch,
  Video,
  Star,
  Map,
  BarChart3,
  Trophy,
  Sparkles,
  Loader2
} from 'lucide-react';
import { searchProject } from '../../services/geminiService';
import { collection, query, where, doc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/helpers';

const routeTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your learning overview' },
  '/profile': { title: 'My Profile', subtitle: 'Manage your account' },
  '/aptitude': { title: 'Aptitude Tests', subtitle: 'Sharpen your logic skills' },
  '/technical': { title: 'Technical Q&A', subtitle: 'Master technical concepts' },
  '/coding': { title: 'Coding Challenges', subtitle: 'Level up your coding' },
  '/resume': { title: 'Resume Analyzer', subtitle: 'AI-powered resume feedback' },
  '/mock-interview': { title: 'Mock Interview', subtitle: 'Practice makes perfect' },
  '/evaluator': { title: 'Answer Evaluator', subtitle: 'Get AI feedback on your answers' },
  '/roadmap': { title: 'Learning Roadmap', subtitle: 'Your personalized path' },
  '/analytics': { title: 'Analytics', subtitle: 'Track your progress' },
  '/achievements': { title: 'Achievements', subtitle: 'Your badges & rewards' },
  '/notifications': { title: 'Notifications', subtitle: 'Stay up to date' },
  '/settings': { title: 'Settings', subtitle: 'Customize your experience' },
};

export default function Navbar({ sidebarCollapsed = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  
  // State definitions
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // AI Search states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  // Refs
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setNotifications([]);
      } else {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
          const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
          return timeB - timeA;
        });
        setNotifications(list);
      }
    }, (err) => {
      console.error(err);
      setNotifications([]);
    });

    return () => unsub();
  }, [currentUser]);

  const handleMarkRead = async (id) => {
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (e) { console.error(e); }
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
      await batch.commit();
      toast.success('All notifications marked as read');
    } catch (e) { console.error(e); }
  };

  const pageInfo = routeTitles[location.pathname] || {
    title: 'InterviewAce AI',
    subtitle: 'AI-Powered Interview Prep',
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Search items definition
  const SEARCHABLE_ITEMS = [
    { title: 'Dashboard', path: '/dashboard', type: 'page', desc: 'Main learning overview & progress', icon: LayoutDashboard },
    { title: 'Aptitude Tests', path: '/aptitude', type: 'page', desc: 'Logic, math, and reason practice', icon: Calculator },
    { title: 'Technical Q&A', path: '/technical', type: 'page', desc: 'AI trainer for core CS concepts', icon: MessageSquareCode },
    { title: 'Coding Challenges', path: '/coding', type: 'page', desc: 'Daily algorithms in Java, Python, C++', icon: Code2 },
    { title: 'Resume Analyzer', path: '/resume', type: 'page', desc: 'Instant ATS feedback & custom roadmap', icon: FileSearch },
    { title: 'Mock Interview', path: '/mock-interview', type: 'page', desc: 'Simulated technical interview practice', icon: Video },
    { title: 'Answer Evaluator', path: '/evaluator', type: 'page', desc: 'Get AI feedback on custom questions', icon: Star },
    { title: 'Learning Roadmap', path: '/roadmap', type: 'page', desc: 'Dynamic career development timeline', icon: Map },
    { title: 'Analytics & Reports', path: '/analytics', type: 'page', desc: 'Detailed score graphs & tracking', icon: BarChart3 },
    { title: 'Achievements & Badges', path: '/achievements', type: 'page', desc: 'View your earned profile awards', icon: Trophy },
    { title: 'Profile Settings', path: '/settings', type: 'page', desc: 'Customize settings & preferences', icon: Settings }
  ];

  // Helper to map dynamic AI suggested paths to the correct React icon
  const getIconForPath = (path) => {
    const match = SEARCHABLE_ITEMS.find((item) => item.path === path);
    return match ? match.icon : Trophy;
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
        // Clear query and results on close to keep it neat
        setSearchQuery('');
        setAiResult(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset AI results when the user types or clears the query
  const handleSearchQueryChange = (val) => {
    setSearchQuery(val);
    if (aiResult) setAiResult(null);
  };

  const filteredItems = searchQuery.trim()
    ? SEARCHABLE_ITEMS.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCHABLE_ITEMS.slice(0, 3); // Suggestions when query is empty

  const handleAISearch = async (queryVal) => {
    if (!queryVal.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await searchProject(queryVal);
      setAiResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        const queryClean = searchQuery.toLowerCase().trim();
        const exactMatch = SEARCHABLE_ITEMS.find(item => item.title.toLowerCase() === queryClean);
        if (exactMatch) {
          navigate(exactMatch.path);
          setSearchFocused(false);
          setSearchQuery('');
        } else {
          // Fire AI search assistant for generic sentences/queries
          handleAISearch(searchQuery);
        }
      }
    }
  };

  const displayUser = {
    displayName: userProfile?.name || 'User',
    email: userProfile?.email || '',
    photoURL: userProfile?.profilePicture || null,
    level: userProfile?.level || 1,
  };

  const initials = (displayUser.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3"
      style={{
        background: 'rgba(250, 246, 241, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Page Title */}
      <div className="flex-1 min-w-0 pl-12 lg:pl-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-lg font-bold text-[#3a2f25] leading-tight truncate">
              {pageInfo.title}
            </h2>
            <p className="text-xs text-[#9a8f85] hidden sm:block">{pageInfo.subtitle}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Search Bar */}
      <div className="relative hidden md:block" ref={searchRef}>
        <motion.div
          animate={{ width: searchFocused || searchQuery ? 340 : 200 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative"
        >
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
              searchFocused
                ? 'shadow-[inset_3px_3px_8px_rgba(0,0,0,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.8)] bg-[#EDE7DF]'
                : 'shadow-[3px_3px_8px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] bg-[#F5EFE6]'
            }`}
          >
            <Search size={15} className={searchFocused ? 'text-[#8FAF8F]' : 'text-[#b5a99f]'} />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-[#4a3f35] placeholder-[#b5a99f] outline-none min-w-0 font-semibold"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setAiResult(null); }}>
                <X size={13} className="text-[#b5a99f] hover:text-[#7a6f65]" />
              </button>
            )}
          </div>

          {/* Results Dropdown */}
          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 left-0 right-0 bg-[#fbfaf8]/95 backdrop-blur-md border border-[#e8e0d8] rounded-2xl shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto"
              >
                {/* 1. Loading State */}
                {aiLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center space-y-3 text-center">
                    <Loader2 size={24} className="text-[#8FAF8F] animate-spin" />
                    <span className="text-xs font-black text-[#7a6f65] uppercase tracking-wider">
                      Consulting AI Assistant...
                    </span>
                  </div>
                ) : aiResult ? (
                  /* 2. AI Search Results */
                  <div className="p-4 space-y-4">
                    {/* Direct Answer bubble */}
                    <div className="bg-[#8FAF8F]/10 border border-[#8FAF8F]/20 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#8FAF8F] uppercase tracking-wider">
                        <Sparkles size={14} /> AI Assistant
                      </div>
                      <p className="text-xs text-[#5a4f45] leading-relaxed font-semibold">
                        {aiResult.directAnswer}
                      </p>
                    </div>

                    {/* AI Suggestions Navigation list */}
                    {aiResult.suggestions?.length > 0 && (
                      <div className="space-y-2">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-[#9a8f85] border-b border-[#e8e0d8]/60 pb-1.5">
                          Suggested Pages
                        </span>
                        <div className="space-y-1">
                          {aiResult.suggestions.map((sug) => {
                            const IconComponent = getIconForPath(sug.path);
                            return (
                              <button
                                key={sug.path}
                                onClick={() => {
                                  navigate(sug.path);
                                  setSearchFocused(false);
                                  setSearchQuery('');
                                  setAiResult(null);
                                }}
                                className="w-full text-left flex gap-3 p-2.5 hover:bg-[#8FAF8F]/10 rounded-xl transition-all group border border-transparent hover:border-[#8FAF8F]/20"
                              >
                                <div className="p-2 bg-white rounded-lg border border-[#e8e0d8] text-[#7a6f65] group-hover:text-[#8FAF8F] group-hover:border-[#8FAF8F]/30 transition-all shrink-0">
                                  <IconComponent size={14} />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-black text-[#5a4f45] group-hover:text-[#8FAF8F] transition-all">
                                    {sug.title}
                                  </span>
                                  <span className="block text-[9px] text-[#9a8f85] font-semibold truncate">
                                    {sug.desc}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 3. Local matches (Normal UI) */
                  <>
                    <div className="px-4 py-2.5 border-b border-[#e8e0d8]/60 bg-[#fcfbf9] text-[9px] font-black uppercase tracking-wider text-[#9a8f85]">
                      {searchQuery ? 'Search Results' : 'Suggested Navigations'}
                    </div>

                    <div className="p-2 space-y-1">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.title}
                              onClick={() => {
                                navigate(item.path);
                                setSearchFocused(false);
                                  setSearchQuery('');
                              }}
                              className="w-full text-left flex gap-3 p-2.5 hover:bg-[#8FAF8F]/10 rounded-xl transition-all group border border-transparent hover:border-[#8FAF8F]/20"
                            >
                              <div className="p-2 bg-white rounded-lg border border-[#e8e0d8] text-[#7a6f65] group-hover:text-[#8FAF8F] group-hover:border-[#8FAF8F]/30 transition-all shrink-0">
                                <IconComponent size={14} />
                              </div>
                              <div className="min-w-0">
                                <span className="block text-xs font-black text-[#5a4f45] group-hover:text-[#8FAF8F] transition-all">
                                  {item.title}
                                </span>
                                <span className="block text-[9px] text-[#9a8f85] font-semibold truncate">
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs font-bold text-[#9a8f85]">
                          No local results found for "{searchQuery}"
                        </div>
                      )}

                      {/* AI Search Prompt Trigger */}
                      {searchQuery.trim() && (
                        <div className="border-t border-[#e8e0d8]/60 mt-2 pt-2 px-1 pb-1">
                          <button
                            onClick={() => handleAISearch(searchQuery)}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                          >
                            <Sparkles size={14} /> Ask AI Assistant
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
          className="relative w-10 h-10 rounded-xl bg-[#F5EFE6] flex items-center justify-center text-[#7a6f65] hover:text-[#5a7a5a] transition-colors shadow-[3px_3px_8px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)]"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[#F0B8C8] to-[#e898b0] text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>

        {/* Notifications Dropdown */}
        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(135deg, #FAF6F1, #F5EFE6)',
                boxShadow: '8px 8px 24px rgba(0,0,0,0.12),-4px_-4px_16px_rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.7)',
              }}
            >
              <div className="px-4 py-3 border-b border-white/40 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#3a2f25]">Notifications</h3>
                <span 
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#8FAF8F] font-medium cursor-pointer hover:underline"
                >
                  Mark all read
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs font-semibold text-[#8a7f75]">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 3).map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => !notif.read && handleMarkRead(notif.id)}
                      className={`px-4 py-3 border-b border-white/30 hover:bg-white/40 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-[#8FAF8F]/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          !notif.read ? 'bg-[#8FAF8F]' : 'bg-transparent'
                        }`} />
                        <div>
                          <p className="text-xs text-[#4a3f35] leading-relaxed font-semibold">{notif.message}</p>
                          <p className="text-[10px] text-[#b5a99f] mt-1 font-bold">{formatRelativeTime(notif.timestamp)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 text-center">
                <button
                  onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                  className="text-xs text-[#6a9a6a] font-medium hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Avatar Menu */}
      <div className="relative" ref={userMenuRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/40 transition-colors"
        >
          {displayUser.photoURL ? (
            <img
              src={displayUser.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#3a2f25] leading-tight">
              {displayUser.displayName?.split(' ')[0]}
            </p>
            <p className="text-[10px] text-[#9a8f85]">Lv.{displayUser.level}</p>
          </div>
          <motion.div animate={{ rotate: userMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-[#9a8f85] hidden sm:block" />
          </motion.div>
        </motion.button>

        {/* User Dropdown */}
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-52 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(135deg, #FAF6F1, #F5EFE6)',
                boxShadow: '8px 8px 24px rgba(0,0,0,0.12), -4px -4px 16px rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.7)',
              }}
            >
              <div className="px-4 py-3 border-b border-white/40">
                <p className="text-sm font-bold text-[#3a2f25]">{displayUser.displayName}</p>
                <p className="text-xs text-[#9a8f85] truncate">{displayUser.email}</p>
              </div>
              {[
                { icon: User, label: 'My Profile', to: '/profile' },
                { icon: Settings, label: 'Settings', to: '/settings' },
              ].map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#5a4f45] hover:bg-white/40 transition-colors"
                >
                  <Icon size={15} className="text-[#9a8f85]" />
                  {label}
                </button>
              ))}
              <div className="border-t border-white/40">
                <button
                  onClick={() => logout().then(() => navigate('/login'))}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#c08080] hover:bg-[#c08080]/10 transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
