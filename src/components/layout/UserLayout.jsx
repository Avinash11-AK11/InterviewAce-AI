import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function UserLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EFE6 50%, #F0EBE3 100%)' }}
    >
      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A8C5DA 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8FAF8F 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #F0B8C8 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full opacity-15 blur-2xl"
          style={{ background: 'radial-gradient(circle, #A8C5DA 0%, transparent 70%)' }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar onCollapsedChange={setSidebarCollapsed} />

      {/* Spacer for Desktop Sidebar to push content correctly without overflowing */}
      <motion.div
        className="hidden lg:block flex-shrink-0"
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10 min-w-0">
        {/* Sticky Navbar */}
        <Navbar sidebarCollapsed={sidebarCollapsed} />

          {/* Page Content */}
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

          {/* Footer */}
          <footer className="px-6 py-4 border-t border-white/30">
            <p className="text-center text-xs text-[#b5a99f]">
              © {new Date().getFullYear()} InterviewAce AI · Crafted with ❤️ for job seekers
            </p>
          </footer>
      </div>
    </div>
  );
}
