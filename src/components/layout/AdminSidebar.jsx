import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Shield,
  LayoutDashboard,
  BarChart2,
  Users,
  HelpCircle,
  ClipboardList,
  Code2,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const adminNavGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
      { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/questions', icon: HelpCircle, label: 'Questions' },
      { to: '/admin/tests', icon: ClipboardList, label: 'Tests' },
      { to: '/admin/coding-problems', icon: Code2, label: 'Coding Problems' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
];

function AdminNavItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 font-semibold border border-amber-500/20'
            : 'text-[#c9b8a8] hover:text-white hover:bg-white/10'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="adminActiveIndicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full"
            />
          )}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Icon
              size={18}
              className={isActive ? 'text-amber-400' : 'text-[#8a7a6a] group-hover:text-amber-400'}
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
            <div className="absolute left-full ml-3 px-2 py-1 bg-[#1a1210] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-amber-500/20">
              {item.label}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

function AdminNavGroup({ group, collapsed }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-2">
      {!collapsed && (
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3 py-1 mb-1 group"
        >
          <span className="text-[10px] font-bold tracking-widest text-[#6a5a4a] uppercase">
            {group.label}
          </span>
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={12} className="text-[#6a5a4a] group-hover:text-[#9a8a7a]" />
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
              <AdminNavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminSidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => navigate('/login');

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo with admin badge */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="relative flex-shrink-0">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.05 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-[0_4px_12px_rgba(217,119,6,0.4)]"
          >
            <Brain size={22} className="text-white" />
          </motion.div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-[#3D3530]">
            <Shield size={10} className="text-white" />
          </div>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-base font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent leading-tight">
                InterviewAce
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold tracking-widest text-amber-500/70 uppercase">
                  Admin Panel
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Admin info card */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-3 mt-4 mb-4 p-3 rounded-2xl border border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                AD
              </div>
              <div>
                <p className="text-sm font-semibold text-[#e8d8c8]">Administrator</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield size={10} className="text-amber-500" />
                  <span className="text-[10px] text-amber-500/80 font-medium">Super Admin</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-[#5a4a3a] scrollbar-track-transparent">
        {adminNavGroups.map((group) => (
          <AdminNavGroup key={group.label} group={group} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#8a7a6a] hover:text-[#c9b8a8] hover:bg-white/5 transition-all duration-200"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/70 hover:text-white hover:bg-red-500/20 transition-all duration-200"
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
      {/* Desktop Admin Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #3D3530 0%, #2a2320 60%, #1e1a18 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center text-[#c9b8a8]"
        style={{ background: '#3D3530', boxShadow: '2px 2px 8px rgba(0,0,0,0.4)' }}
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
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-64 z-50 flex flex-col overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, #3D3530 0%, #2a2320 60%, #1e1a18 100%)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#9a8a7a] hover:text-white transition-colors"
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
