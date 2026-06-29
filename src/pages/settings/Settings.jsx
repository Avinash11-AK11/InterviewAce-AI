import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Shield, User, ChevronRight, LogOut, AlertTriangle, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function Settings() {
  const navigate = useNavigate();
  const { userProfile, forgotPassword, logout } = useAuth();
  
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!userProfile?.email) {
      toast.error('No email found for this account.');
      return;
    }
    
    try {
      setResetting(true);
      await forgotPassword(userProfile.email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Failed to send reset email.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out.');
    }
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion is currently disabled for safety during beta testing.', {
      icon: '⚠️',
      duration: 5000,
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8">
      
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-8 border border-white/60 shadow-[8px_8px_32px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] bg-white/50 backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-[#8FAF8F]/15 to-[#A8C5DA]/15 blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center shadow-lg text-white">
            <SettingsIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#3a2f25] tracking-tight">Settings</h1>
            <p className="text-sm font-semibold text-[#7a6f65] mt-1">Manage your developer account preferences and security.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        
        {/* Left Column: Navigation/Summary Card */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#e8e0d8] justify-center lg:justify-start">
              {userProfile?.profilePicture ? (
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#8FAF8F] to-[#A8C5DA] shadow-sm">
                  <img src={userProfile.profilePicture} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white bg-white" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[#3a2f25] font-black text-lg truncate leading-tight">{userProfile?.name}</p>
                <p className="text-xs text-[#9a8f85] font-semibold truncate mt-1">{userProfile?.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <button onClick={() => navigate('/profile')} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/30 border border-white/40 hover:bg-white/80 text-[#7a6f65] hover:text-[#5a7a5a] transition-all group font-bold text-sm shadow-sm">
                <span className="flex items-center gap-3"><User size={18} className="text-[#8FAF8F]" /> Edit Profile</span>
                <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
              <button onClick={handleLogout} className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F0B8C8]/5 border border-[#F0B8C8]/20 hover:bg-[#F0B8C8]/10 text-[#a85f75] hover:text-[#8b4f60] transition-all group font-bold text-sm">
                <span className="flex items-center gap-3"><LogOut size={18} /> Log Out</span>
              </button>
            </div>
          </div>

        </motion.div>

        {/* Right Column: Settings Sections */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
          
          {/* Security Section */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/60 shadow-[8px_8px_32px_rgba(0,0,0,0.05)] space-y-6">
            <h2 className="text-lg font-black text-[#3a2f25] border-b border-[#e8e0d8] pb-3 flex items-center gap-2">
              <Shield className="text-[#A8C5DA]" /> Security & Account
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-white/40 border border-white/50 gap-4">
              <div className="pr-4">
                <h3 className="text-base font-bold text-[#3a2f25]">Password Reset</h3>
                <p className="text-xs text-[#7a6f65] font-semibold mt-1">Receive an email with a secure link to reset your account password.</p>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="bg-white/60 hover:bg-white text-[#8FAF8F] px-6 py-3 rounded-xl font-bold border border-white/80 shadow-[4px_4px_8px_#E3DCD5,_-4px_-4px_8px_#FFFFFF] flex items-center justify-center gap-2 transition-all min-w-[150px] whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              >
                {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-[#F0B8C8]/40 shadow-[8px_8px_32px_rgba(240,184,200,0.05)] space-y-6">
            <h2 className="text-lg font-black text-[#c08080] border-b border-[#F0B8C8]/20 pb-3 flex items-center gap-2">
              <AlertTriangle className="text-[#F0B8C8]" /> Danger Zone
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl bg-[#F0B8C8]/5 border border-[#F0B8C8]/25 gap-4">
              <div className="pr-4">
                <h3 className="text-base font-bold text-[#a06060]">Delete Account</h3>
                <p className="text-xs text-[#c08080] font-semibold mt-1">Permanently remove your developer profile and delete all performance metrics.</p>
              </div>
              <button
                onClick={handleDeleteAccount}
                className="bg-white hover:bg-[#F0B8C8]/10 text-[#c08080] px-6 py-3 rounded-xl font-bold border border-[#F0B8C8]/30 shadow-sm transition-all whitespace-nowrap shrink-0 hover:scale-[1.02]"
              >
                Delete Account
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
