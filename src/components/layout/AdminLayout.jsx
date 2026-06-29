import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, LogOut, Shield, Settings, User } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const adminRouteTitles = {
  '/admin/dashboard': { title: 'Admin Dashboard', subtitle: 'Platform overview & metrics' },
  '/admin/reports': { title: 'Reports', subtitle: 'Analytics & performance data' },
  '/admin/users': { title: 'User Management', subtitle: 'Manage platform users' },
  '/admin/questions': { title: 'Question Bank', subtitle: 'Manage test questions' },
  '/admin/tests': { title: 'Test Management', subtitle: 'Create & manage tests' },
  '/admin/coding-problems': { title: 'Coding Problems', subtitle: 'Manage coding challenges' },
  '/admin/settings': { title: 'System Settings', subtitle: 'Configure platform settings' },
  '/admin/notifications': { title: 'Notifications', subtitle: 'Send & manage notifications' },
};

const mockAdminNotifications = [
  { id: 1, message: '5 new users registered today', time: '10m ago', unread: true },
  { id: 2, message: 'System health check: All services nominal', time: '1h ago', unread: true },
  { id: 3, message: 'New question submission pending review', time: '2h ago', unread: false },
];

function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const pageInfo = adminRouteTitles[location.pathname] || {
    title: 'Admin Panel',
    subtitle: 'System management',
  };

  const unreadCount = mockAdminNotifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6 py-3"
      style={{
        background: 'rgba(42, 35, 32, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
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
            className="flex items-center gap-3"
          >
            <div>
              <h2 className="text-lg font-bold text-[#e8d8c8] leading-tight">{pageInfo.title}</h2>
              <p className="text-xs text-[#6a5a4a] hidden sm:block">{pageInfo.subtitle}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Admin Panel Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10">
        <Shield size={14} className="text-amber-400" />
        <span className="text-xs font-bold text-amber-400 tracking-wider">ADMIN PANEL</span>
      </div>

      {/* Notification Bell */}
      <div className="relative" ref={notifRef}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#8a7a6a] hover:text-amber-400 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(135deg, #3D3530, #2a2320)',
                boxShadow: '8px 8px 24px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="px-4 py-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-[#e8d8c8]">Notifications</h3>
              </div>
              {mockAdminNotifications.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.unread ? 'bg-amber-400' : 'bg-transparent'}`} />
                    <div>
                      <p className="text-xs text-[#c9b8a8]">{notif.message}</p>
                      <p className="text-[10px] text-[#6a5a4a] mt-1">{notif.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Menu */}
      <div className="relative" ref={userMenuRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#e8d8c8] leading-tight">Admin</p>
            <p className="text-[10px] text-[#6a5a4a]">Super Admin</p>
          </div>
          <motion.div animate={{ rotate: userMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-[#6a5a4a] hidden sm:block" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-48 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'linear-gradient(135deg, #3D3530, #2a2320)',
                boxShadow: '8px 8px 24px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {[
                { icon: Settings, label: 'Settings', to: '/admin/settings' },
              ].map(({ icon: Icon, label, to }) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#c9b8a8] hover:bg-white/5 transition-colors"
                >
                  <Icon size={15} className="text-[#6a5a4a]" />
                  {label}
                </button>
              ))}
              <div className="border-t border-white/5">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/70 hover:bg-red-500/10 transition-colors"
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

export default function AdminLayout() {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #1e1a18 0%, #252018 50%, #1a1815 100%)' }}
    >
      {/* Background accent blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-32 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ea580c 0%, transparent 70%)' }}
        />
      </div>

      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-h-screen relative z-10 lg:ml-64"
      >
        <AdminNavbar />

        <main className="flex-1 px-4 lg:px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>

        <footer className="px-6 py-4 border-t border-white/5">
          <p className="text-center text-xs text-[#4a3a2a]">
            InterviewAce AI Admin Panel · © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
