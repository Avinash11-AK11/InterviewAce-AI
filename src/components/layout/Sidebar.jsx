import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getXPProgress } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  LayoutDashboard,
  User,
  Calculator,
  MessageSquareCode,
  Code2,
  FileSearch,
  Video,
  Star,
  Map,
  BarChart3,
  Trophy,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Zap,
} from 'lucide-react';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/profile', icon: User, label: 'Profile' },
    ],
  },
  {
    label: 'PREPARE',
    items: [
      { to: '/aptitude', icon: Calculator, label: 'Aptitude Tests' },
      { to: '/technical', icon: MessageSquareCode, label: 'Technical Q&A' },
      { to: '/coding', icon: Code2, label: 'Coding Challenges' },
    ],
  },
  {
    label: 'AI TOOLS',
    items: [
      { to: '/resume', icon: FileSearch, label: 'Resume Analyzer' },
      { to: '/mock-interview', icon: Video, label: 'Mock Interview' },
      { to: '/evaluator', icon: Star, label: 'Answer Evaluator' },
      { to: '/roadmap', icon: Map, label: 'Roadmap' },
    ],
  },
  {
    label: 'PROGRESS',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/achievements', icon: Trophy, label: 'Achievements' },
    ],
  },
  {
    label: 'OTHER',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const rankColors = {
  Novice: 'from-gray-400 to-gray-500',
  Apprentice: 'from-green-400 to-emerald-500',
  Practitioner: 'from-blue-400 to-cyan-500',
  Expert: 'from-purple-400 to-violet-500',
  Master: 'from-orange-400 to-amber-500',
  Legend: 'from-pink-400 to-rose-500',
};

function getRank(level) {
  if (level < 5) return 'Novice';
  if (level < 10) return 'Apprentice';
  if (level < 20) return 'Practitioner';
  if (level < 35) return 'Expert';
  if (level < 50) return 'Master';
  return 'Legend';
}

function NavItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group relative flex items-center ${collapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-[#8FAF8F]/20 to-[#A8C5DA]/20 text-[#5a7a5a] font-semibold shadow-sm border border-[#8FAF8F]/30'
            : 'text-[#7a6f65] hover:text-[#5a7a5a] hover:bg-white/50 border border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#8FAF8F] to-[#A8C5DA] rounded-r-full"
            />
          )}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Icon
              size={collapsed ? 20 : 18}
              className={isActive ? 'text-[#6a9a6a]' : 'text-[#9a8f85] group-hover:text-[#6a9a6a]'}
            />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {collapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-[#3D3530] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ group, collapsed }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      {!collapsed && (
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-1 mb-1 group"
        >
          <span className="text-[10px] font-bold tracking-widest text-[#b5a99f] uppercase">
            {group.label}
          </span>
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={12} className="text-[#b5a99f] group-hover:text-[#8a7f75]" />
          </motion.div>
        </button>
      )}
      <AnimatePresence initial={false}>
        {(open || collapsed) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden space-y-0.5"
          >
            {group.items.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar({ onCollapsedChange }) {
  const navigate = useNavigate();
  const { userProfile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const notificationCount = 3;

  const displayUser = {
    displayName: userProfile?.name || 'User',
    email: userProfile?.email || '',
    photoURL: userProfile?.profilePicture || null,
    xp: userProfile?.xp || 0,
  };

  const { level, progress: xpPercent, currentLevelXP, nextLevelXP } = getXPProgress(displayUser.xp);
  const xpIntoLevel = displayUser.xp - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const rank = getRank(level);
  const rankColor = rankColors[rank];
  const initials = (displayUser.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <motion.div
          whileHover={{ rotate: 10, scale: 1.05 }}
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center shadow-[3px_3px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.8)] flex-shrink-0"
        >
          <Brain size={22} className="text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-base font-extrabold bg-gradient-to-r from-[#6a9a6a] via-[#7ab0c8] to-[#d08898] bg-clip-text text-transparent leading-tight">
                InterviewAce
              </h1>
              <p className="text-[10px] text-[#b5a99f] font-medium -mt-0.5">AI Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-3 mb-4 p-3 rounded-2xl bg-gradient-to-br from-white/60 to-[#F5EFE6]/40 shadow-[3px_3px_8px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.9)] border border-white/50"
          >
            <div className="flex items-center gap-3 mb-2.5">
              {displayUser.photoURL ? (
                <img
                  src={displayUser.photoURL}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#4a3f35] truncate">
                  {displayUser.displayName || 'User'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${rankColor} text-white`}>
                    Lv.{level}
                  </span>
                  <span className="text-[10px] text-[#9a8f85]">{rank}</span>
                </div>
              </div>
            </div>
            {/* XP Bar */}
            <div>
              <div className="flex justify-between text-[10px] text-[#9a8f85] mb-1">
                <span className="flex items-center gap-1">
                  <Zap size={10} className="text-amber-500" />
                  {(displayUser.xp || 0).toLocaleString()} XP
                </span>
                <span>{nextLevelXP.toLocaleString()} Goal</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#e8e0d8] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed avatar */}
      {collapsed && (
        <div className="flex justify-center mb-3">
          {displayUser.photoURL ? (
            <img
              src={displayUser.photoURL}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-[#d8d0c8] scrollbar-track-transparent">
        {navGroups.map((group) => (
          <NavGroup key={group.label} group={group} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse Toggle + Logout */}
      <div className="px-3 py-4 border-t border-white/30 space-y-2">
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            if (onCollapsedChange) onCollapsedChange(!collapsed);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9a8f85] hover:text-[#5a7a5a] hover:bg-white/40 transition-all duration-200 group"
        >
          <motion.div whileHover={{ scale: 1.1 }} animate={{ rotate: collapsed ? 180 : 0 }}>
            <Menu size={18} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#c08080] hover:text-white hover:bg-[#c08080]/80 transition-all duration-200"
        >
          <motion.div whileHover={{ scale: 1.1 }}>
            <LogOut size={18} />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #FAF6F1 0%, #F5EFE6 60%, #F0EBE3 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
        }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#FAF6F1] shadow-[3px_3px_8px_rgba(0,0,0,0.12),-2px_-2px_6px_rgba(255,255,255,0.9)] flex items-center justify-center text-[#7a6f65]"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-64 z-50 flex flex-col overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #FAF6F1 0%, #F5EFE6 60%, #F0EBE3 100%)',
                boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center text-[#9a8f85] hover:text-[#4a3f35] transition-colors"
              >
                <X size={16} />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
