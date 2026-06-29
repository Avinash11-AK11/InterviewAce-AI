import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Shield,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ─── Decorative Blob ─────────────────────────────────────────────────────── */
const Blob = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-40 pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.15, 0.95, 1.1, 1],
      x: [0, 20, -15, 10, 0],
      y: [0, -15, 20, -8, 0],
    }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ─── Google SVG Icon ─────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

/* ─── Feature items ───────────────────────────────────────────────────────── */
const features = [
  { icon: Brain, text: 'AI-powered mock interviews', color: 'text-sky-500' },
  { icon: Target, text: 'Real-time feedback & scoring', color: 'text-sage-600' },
  { icon: TrendingUp, text: 'Track your XP & progress', color: 'text-blush-500' },
  { icon: Shield, text: 'Company-specific preparation', color: 'text-amber-500' },
];

/* ─── Animation variants ──────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Firebase error mapper ───────────────────────────────────────────────── */
const mapFirebaseError = (code) => {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
  };
  return map[code] || 'An unexpected error occurred. Please try again.';
};

/* ─── Login Component ─────────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInGoogle } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onTouched' });

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      // Re-fetch profile to get role (signInWithEmail already fetches it into context)
      // Navigate based on role
      const token = await result.user.getIdTokenResult();
      const role = token.claims?.role;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(mapFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      const result = await signInGoogle();
      const token = await result.user.getIdTokenResult();
      const role = token.claims?.role;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(mapFirebaseError(err.code));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #F5EFE6 0%, #FAF6F1 50%, #EEF4F0 100%)' }}
    >
      {/* ── Left Decorative Panel ── */}
      <motion.div
        variants={slideInLeft}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-center items-center px-16 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #7A9E7A 0%, #8FAF8F 35%, #A8C5DA 70%, #B8D4E8 100%)',
        }}
      >
        {/* Animated Blobs */}
        <Blob className="w-96 h-96 bg-white/20 top-[-80px] left-[-60px]" delay={0} />
        <Blob className="w-72 h-72 bg-white/15 bottom-[-40px] right-[-30px]" delay={3} />
        <Blob className="w-56 h-56 bg-emerald-200/25 top-1/3 right-12" delay={6} />
        <Blob className="w-40 h-40 bg-sky-200/30 bottom-32 left-16" delay={2} />
        <Blob className="w-32 h-32 bg-pink-200/20 top-20 right-32" delay={8} />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-24 right-20 w-4 h-4 rounded-full bg-white/60"
          animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 left-24 w-6 h-6 rounded-full bg-white/40"
          animate={{ y: [0, 16, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-12 w-3 h-3 rounded-full bg-yellow-200/70"
          animate={{ y: [0, -8, 0], x: [0, 6, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-md"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <Sparkles className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl font-bold text-white mb-3 leading-tight"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.15)' }}
          >
            InterviewAce
            <span className="block text-yellow-200/90">AI</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-white/85 text-lg mb-10 leading-relaxed"
          >
            Your intelligent partner for acing every interview — from FAANG to startups.
          </motion.p>

          {/* Features */}
          <motion.div variants={itemVariants} className="space-y-3 text-left">
            {features.map(({ icon: Icon, text, color }) => (
              <motion.div
                key={text}
                variants={itemVariants}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-white/90 text-sm font-medium">{text}</span>
                <ChevronRight className="w-4 h-4 text-white/50 ml-auto" />
              </motion.div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="mt-10 flex justify-center gap-8">
            {[
              { value: '50K+', label: 'Users' },
              { value: '200+', label: 'Companies' },
              { value: '98%', label: 'Success Rate' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-white/65 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <motion.div
        variants={slideInRight}
        initial="hidden"
        animate="visible"
        className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:hidden flex items-center gap-3 mb-10"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7A9E7A, #A8C5DA)',
                boxShadow: '0 4px 14px rgba(143,175,143,0.4)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#4A7A5A' }}>
              InterviewAce AI
            </span>
          </motion.div>

          {/* Form Card */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <h2
                className="text-3xl font-bold mb-1"
                style={{ color: '#2D4A3E' }}
              >
                Welcome back 👋
              </h2>
              <p className="text-sm mb-8" style={{ color: '#7A8B85' }}>
                Sign in to continue your interview prep journey
              </p>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-6"
                  style={{
                    background: 'linear-gradient(135deg, #FFF0F3, #FFE4EC)',
                    border: '1px solid #F0B8C8',
                    boxShadow: '0 2px 12px rgba(240,184,200,0.25)',
                  }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-600 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <motion.div variants={itemVariants} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#3D5A50' }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Mail className="w-4.5 h-4.5" style={{ color: '#8FAF8F' }} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all duration-200"
                      style={{
                        background: errors.email
                          ? 'linear-gradient(135deg, #FFF5F7, #FFF0F3)'
                          : '#FAF6F1',
                        border: errors.email
                          ? '1.5px solid #F0B8C8'
                          : '1.5px solid transparent',
                        boxShadow: errors.email
                          ? 'inset 3px 3px 7px #edd9e0, inset -3px -3px 7px #ffffff'
                          : 'inset 3px 3px 7px #e8e0d8, inset -3px -3px 7px #ffffff',
                        color: '#2D4A3E',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1.5px solid #8FAF8F';
                        e.target.style.boxShadow =
                          '0 0 0 3px rgba(143,175,143,0.15), inset 3px 3px 7px #e8e0d8, inset -3px -3px 7px #ffffff';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = errors.email
                          ? '1.5px solid #F0B8C8'
                          : '1.5px solid transparent';
                        e.target.style.boxShadow = errors.email
                          ? 'inset 3px 3px 7px #edd9e0, inset -3px -3px 7px #ffffff'
                          : 'inset 3px 3px 7px #e8e0d8, inset -3px -3px 7px #ffffff';
                      }}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email address',
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium"
                      style={{ color: '#E07090' }}
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold mb-2"
                    style={{ color: '#3D5A50' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Lock className="w-4.5 h-4.5" style={{ color: '#8FAF8F' }} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm outline-none transition-all duration-200"
                      style={{
                        background: errors.password ? 'linear-gradient(135deg, #FFF5F7, #FFF0F3)' : '#FAF6F1',
                        border: errors.password ? '1.5px solid #F0B8C8' : '1.5px solid transparent',
                        boxShadow: errors.password
                          ? 'inset 3px 3px 7px #edd9e0, inset -3px -3px 7px #ffffff'
                          : 'inset 3px 3px 7px #e8e0d8, inset -3px -3px 7px #ffffff',
                        color: '#2D4A3E',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '1.5px solid #8FAF8F';
                        e.target.style.boxShadow =
                          '0 0 0 3px rgba(143,175,143,0.15), inset 3px 3px 7px #e8e0d8, inset -3px -3px 7px #ffffff';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = errors.password ? '1.5px solid #F0B8C8' : '1.5px solid transparent';
                        e.target.style.boxShadow = errors.password
                          ? 'inset 3px 3px 7px #edd9e0, inset -3px -3px 7px #ffffff'
                          : 'inset 3px 3px 7px #e8e0d8, inset -3px -3px 7px #ffffff';
                      }}
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#8FAF8F' }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-medium"
                      style={{ color: '#E07090' }}
                    >
                      {errors.password.message}
                    </motion.p>
                  )}
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium transition-colors hover:underline"
                    style={{ color: '#6A9A7A' }}
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -1 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background:
                      'linear-gradient(135deg, #5A8A6A 0%, #7A9E7A 40%, #8FAF8F 70%, #A8C5DA 100%)',
                    boxShadow: isLoading
                      ? 'none'
                      : '0 6px 24px rgba(90,138,106,0.4), 0 2px 8px rgba(90,138,106,0.25)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4.5 h-4.5" />
                      <span>Sign In</span>
                    </>
                  )}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: '#DDD5CA' }} />
                  <span className="text-xs font-medium" style={{ color: '#9A9088' }}>
                    or continue with
                  </span>
                  <div className="flex-1 h-px" style={{ background: '#DDD5CA' }} />
                </div>

                {/* Google Button */}
                <motion.button
                  type="button"
                  disabled={isLoading || isGoogleLoading}
                  onClick={handleGoogleLogin}
                  whileHover={{ scale: isGoogleLoading ? 1 : 1.02, y: isGoogleLoading ? 0 : -1 }}
                  whileTap={{ scale: isGoogleLoading ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: '#FAF6F1',
                    border: '1.5px solid #DDD5CA',
                    boxShadow: '3px 3px 8px #e0d8d0, -3px -3px 8px #ffffff',
                    color: '#3D5A50',
                  }}
                >
                  {isGoogleLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4.5 h-4.5 border-2 border-gray-300 border-t-gray-600 rounded-full"
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>{isGoogleLoading ? 'Connecting…' : 'Sign in with Google'}</span>
                </motion.button>
              </motion.div>
            </form>

            {/* Register Link */}
            <motion.p
              variants={itemVariants}
              className="mt-8 text-center text-sm"
              style={{ color: '#7A8B85' }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#5A8A6A' }}
              >
                Create one free →
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
