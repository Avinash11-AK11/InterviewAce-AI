import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, Check, CheckCheck, Trophy, ClipboardList,
  Mic, Settings, Zap, AlertCircle, Trash2, RefreshCw, X,
} from 'lucide-react';
import {
  collection, query, where, orderBy, getDocs, updateDoc,
  writeBatch, doc, addDoc, serverTimestamp, onSnapshot, deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_NOTIFICATIONS } from '../../utils/seedData';
import { formatRelativeTime } from '../../utils/helpers';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',        label: 'All',        icon: Bell },
  { id: 'unread',     label: 'Unread',     icon: BellOff },
  { id: 'test',       label: 'Tests',      icon: ClipboardList },
  { id: 'interview',  label: 'Interviews', icon: Mic },
  { id: 'system',     label: 'System',     icon: Settings },
];

const TYPE_CONFIG = {
  badge:     { icon: Trophy,        color: 'bg-yellow-50 text-yellow-600', dot: 'bg-yellow-400', label: 'Badge' },
  test:      { icon: ClipboardList, color: 'bg-blue-50 text-blue-600',    dot: 'bg-blue-400',   label: 'Test' },
  interview: { icon: Mic,           color: 'bg-green-50 text-green-600',  dot: 'bg-green-400',  label: 'Interview' },
  xp:        { icon: Zap,           color: 'bg-purple-50 text-purple-600',dot: 'bg-purple-400', label: 'XP' },
  system:    { icon: Settings,      color: 'bg-gray-50 text-gray-600',    dot: 'bg-gray-400',   label: 'System' },
  alert:     { icon: AlertCircle,   color: 'bg-red-50 text-red-600',      dot: 'bg-red-400',    label: 'Alert' },
};

// ─── Notification Card ─────────────────────────────────────────────────────────
const NotificationCard = ({ notification, onRead, onDelete }) => {
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      onClick={() => !notification.read && onRead(notification.id)}
      className={`relative flex items-start gap-4 p-5 rounded-3xl border cursor-pointer transition-all duration-200 group
        ${notification.read
          ? 'bg-white/30 border-white/40 hover:bg-white/50 opacity-80'
          : 'bg-white/70 border-white/80 shadow-[8px_8px_20px_rgba(0,0,0,0.03)] hover:bg-white/90'
        }`}
    >
      {/* Unread dot */}
      {!notification.read && (
        <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${cfg.dot}`} />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border border-white/50 shadow-sm ${cfg.color}`}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 mb-1">
          <p className={`font-bold text-sm md:text-base leading-tight ${notification.read ? 'text-[#7a6f65]' : 'text-[#3a2f25]'}`}>
            {notification.title}
          </p>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-white/60 border border-white/80 text-[#8a7f75]">
            {cfg.label}
          </span>
        </div>
        <p className={`text-xs md:text-sm font-semibold leading-relaxed ${notification.read ? 'text-[#9a8f85]' : 'text-[#5a4f45]'}`}>
          {notification.message}
        </p>
        <p className="text-[10px] font-bold text-[#b5a89a] mt-2">
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>

      {/* Delete btn */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-xl transition-all"
        title="Delete Notification"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ activeTab }) => (
  <motion.div
    className="flex flex-col items-center justify-center py-20 text-gray-400"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring' }}
  >
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
    >
      <BellOff size={56} className="opacity-20 mb-4" />
    </motion.div>
    <p className="font-semibold text-lg text-gray-500">No notifications</p>
    <p className="text-sm mt-1 text-center max-w-xs">
      {activeTab === 'unread'
        ? "You're all caught up! No unread notifications."
        : "Notifications will appear here as you use InterviewAce AI."}
    </p>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Notifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // ── Fetch from Firestore ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setNotifications(MOCK_NOTIFICATIONS);
      } else {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort in memory by timestamp desc (handle Firestore timestamps vs plain numbers)
        list.sort((a, b) => {
          const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
          const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
          return timeB - timeA;
        });
        setNotifications(list);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Mark single as read ───────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (e) { console.error(e); }
    }
  }, [currentUser]);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          if (n.id && !n.id.startsWith('n')) {
            batch.update(doc(db, 'notifications', n.id), { read: true });
          }
        });
      await batch.commit();
    } catch (e) { console.error(e); }
  }, [currentUser, notifications]);

  // ── Delete notification ───────────────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (currentUser && !id.startsWith('n')) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (e) { console.error(e); }
    }
  }, [currentUser]);

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-6">

      {/* ── Header Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-8 border border-white/60 shadow-[8px_8px_32px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] bg-white/50 backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#8FAF8F]/15 to-[#A8C5DA]/15 blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center shadow-lg text-white flex-shrink-0">
              <Bell size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-[#3a2f25] tracking-tight">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-xl bg-[#F0B8C8] text-white text-xs font-black shadow-sm">
                    {unreadCount} UNREAD
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm font-semibold text-[#7a6f65] mt-1">Stay updated on your study challenges and achievements.</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={markAllRead}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#8FAF8F] text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-[#7ab07a] transition-all hover:-translate-y-0.5 shrink-0 self-start sm:self-center"
            >
              <CheckCheck size={14} />
              Mark All Read
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ── Filter Tabs ── */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = id === 'unread'
            ? unreadCount
            : id === 'all'
              ? notifications.length
              : notifications.filter((n) => n.type === id).length;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 border
                ${activeTab === id
                  ? 'bg-[#8FAF8F] border-[#8FAF8F] text-white shadow-md'
                  : 'bg-white/40 border-white/50 text-[#7a6f65] hover:bg-white/80 shadow-sm'
                }`}
            >
              <Icon size={12} />
              {label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1
                  ${activeTab === id ? 'bg-white/20 text-white' : 'bg-white/60 border border-white/80 text-[#8a7f75]'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ── Notification List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-[#8FAF8F]/30 border-t-[#8FAF8F] rounded-full"
          />
          <p className="text-[#8a7f75] text-xs font-bold uppercase tracking-wider">Loading notifications...</p>
        </div>
      ) : (
        <div className="space-y-3 group">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={markRead}
                  onDelete={deleteNotification}
                />
              ))
            ) : (
              <EmptyState activeTab={activeTab} />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
