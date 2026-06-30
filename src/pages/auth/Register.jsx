import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Building2,
  Sparkles,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Star,
  Zap,
  Award,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/* ─── Zod validation schema ───────────────────────────────────────────────── */
const schema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Full name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    college: z
      .string()
      .min(2, 'College name must be at least 2 characters')
      .max(100, 'College name too long'),
    graduationYear: z
      .string()
      .min(1, 'Please select your graduation year'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/* ─── Grad year options ───────────────────────────────────────────────────── */
const GRAD_YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);

/* ─── Decorative Blob ─────────────────────────────────────────────────────── */
const Blob = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl opacity-35 pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.18, 0.92, 1.12, 1],
      x: [0, 18, -12, 8, 0],
      y: [0, -12, 18, -6, 0],
    }}
    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

/* ─── Google SVG Icon ─────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

/* ─── Firebase error mapper ───────────────────────────────────────────────── */
const mapFirebaseError = (code) => {
  const map = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/invalid-api-key': 'Invalid Firebase API Key. Please verify your Vercel Environment Variables.',
    'auth/configuration-not-found': 'Firebase project configuration is invalid or missing.',
    'auth/unauthorized-domain': 'This Vercel domain is not authorized in your Firebase console. Please add it to your Authorized Domains in the Firebase Auth settings.',
  };
  return map[code] || `Error (${code || 'unknown'}): Please check browser console or Vercel logs.`;
};

/* ─── Animation variants ──────────────────────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Styled Input Component ──────────────────────────────────────────────── */
function FormInput({
  id,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  rightElement,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: '#3D5A50' }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4" style={{ color: focused ? '#6A9A7A' : '#9ABAA0' }} />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className="w-full py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{
            paddingLeft: Icon ? '2.5rem' : '1rem',
            paddingRight: rightElement ? '3rem' : '1rem',
            background: error ? 'linear-gradient(135deg, #FFF5F7, #FFF0F3)' : '#FAF6F1',
            border: focused
              ? '1.5px solid #8FAF8F'
              : error
              ? '1.5px solid #F0B8C8'
              : '1.5px solid #EDE7E0',
            boxShadow: focused
              ? '0 0 0 3px rgba(143,175,143,0.12), inset 2px 2px 5px #e4dcd4, inset -2px -2px 5px #ffffff'
              : 'inset 2px 2px 5px #e4dcd4, inset -2px -2px 5px #ffffff',
            color: '#2D4A3E',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1 text-xs font-medium"
            style={{ color: '#E07090' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Register Component ──────────────────────────────────────────────────── */
export default function Register() {
  const navigate = useNavigate();
  const { signUp, signInGoogle } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  const password = watch('password', '');
  const passwordStrength = password.length === 0
    ? 0
    : password.length < 8
    ? 1
    : !(/[A-Z]/.test(password) && /[0-9]/.test(password))
    ? 2
    : password.length >= 12
    ? 4
    : 3;

  const strengthColors = ['', '#F0B8C8', '#F5C67A', '#8FAF8F', '#5A8A6A'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);
    try {
      await signUp(data.email, data.password, {
        name: data.fullName,
        college: data.college,
        graduationYear: data.graduationYear,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Registration error:', err);
      setError(mapFirebaseError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google registration error:', err);
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
      style={{ background: 'linear-gradient(135deg, #F5EFE6 0%, #FAF6F1 50%, #F0F4F8 100%)' }}
    >
      {/* ── Left Decorative Panel ── */}
      <motion.div
        variants={slideInLeft}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:w-[46%] relative flex-col justify-center items-center px-14 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #C8A8D8 0%, #B8C8E8 35%, #A8D8C8 70%, #A8C5DA 100%)',
        }}
      >
        {/* Blobs */}
        <Blob className="w-80 h-80 bg-white/20 top-[-60px] right-[-40px]" delay={0} />
        <Blob className="w-64 h-64 bg-white/15 bottom-[-30px] left-[-20px]" delay={4} />
        <Blob className="w-48 h-48 bg-purple-200/20 top-1/4 left-8" delay={7} />
        <Blob className="w-36 h-36 bg-teal-200/25 bottom-1/3 right-12" delay={2} />

        {/* Floating particles */}
        {[
          { top: '15%', left: '20%', size: 'w-3 h-3', delay: 0 },
          { top: '60%', right: '15%', size: 'w-5 h-5', delay: 1.5 },
          { bottom: '20%', left: '35%', size: 'w-2 h-2', delay: 3 },
          { top: '40%', right: '30%', size: 'w-4 h-4', delay: 0.8 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className={`absolute ${p.size} rounded-full bg-white/50`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
            animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        {/* Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-sm"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              <Sparkles className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold text-white mb-2 leading-tight"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
          >
            Start Your
            <span className="block text-yellow-100">Journey</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-white/80 text-base mb-8 leading-relaxed"
          >
            Join 50,000+ students who aced their interviews with AI-powered practice.
          </motion.p>

          {/* Benefit Cards */}
          <motion.div variants={itemVariants} className="space-y-3">
            {[
              { icon: Zap, label: 'Start earning XP immediately', badge: 'Level 1 → ∞' },
              { icon: Star, label: 'Personalized AI feedback', badge: 'GPT-4 Powered' },
              { icon: Award, label: 'Earn badges & certificates', badge: '30+ Badges' },
            ].map(({ icon: Icon, label, badge }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-white/90 text-sm font-medium flex-1">{label}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
                >
                  {badge}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex items-center justify-center gap-2"
          >
            <div className="flex -space-x-2">
              {['#F0B8C8', '#A8C5DA', '#8FAF8F', '#F5C67A'].map((color, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-white/50"
                  style={{ background: color }}
                />
              ))}
            </div>
            <span className="text-white/80 text-sm ml-1">+49,000 already joined!</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Right Form Panel ── */}
      <motion.div
        variants={slideInRight}
        initial="hidden"
        animate="visible"
        className="flex-1 flex items-center justify-center px-6 py-8 lg:px-10 overflow-y-auto"
      >
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #C8A8D8, #A8C5DA)',
                boxShadow: '0 4px 14px rgba(168,197,218,0.4)',
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#4A3A5A' }}>
              InterviewAce AI
            </span>
          </div>

          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: 'rgba(245,239,230,0.9)', backdropFilter: 'blur(8px)' }}
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-20 h-20 mx-auto mb-4" style={{ color: '#5A8A6A' }} />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#2D4A3E' }}>
                    Account Created! 🎉
                  </h2>
                  <p style={{ color: '#6A7A72' }}>Redirecting to your dashboard…</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold mb-1" style={{ color: '#2D3A50' }}>
                Create Account ✨
              </h2>
              <p className="text-sm mb-6" style={{ color: '#7A8B90' }}>
                Free forever • No credit card required
              </p>
            </motion.div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-5"
                  style={{
                    background: 'linear-gradient(135deg, #FFF0F3, #FFE4EC)',
                    border: '1px solid #F0B8C8',
                  }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-600 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Register */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="button"
                disabled={isLoading || isGoogleLoading}
                onClick={handleGoogleRegister}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-2xl font-medium text-sm flex items-center justify-center gap-3 mb-5 transition-all duration-200 disabled:opacity-70"
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
                    className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
                  />
                ) : (
                  <GoogleIcon />
                )}
                {isGoogleLoading ? 'Connecting…' : 'Sign up with Google'}
              </motion.button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: '#DDD5CA' }} />
              <span className="text-xs" style={{ color: '#9A9088' }}>or register with email</span>
              <div className="flex-1 h-px" style={{ background: '#DDD5CA' }} />
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Full Name */}
                <FormInput
                  id="fullName"
                  label="Full Name"
                  placeholder="John Doe"
                  icon={User}
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />

                {/* Email */}
                <FormInput
                  id="email"
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  icon={Mail}
                  error={errors.email?.message}
                  {...register('email')}
                />

                {/* College & Grad Year — 2 column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    id="college"
                    label="College / University"
                    placeholder="MIT, IIT Delhi…"
                    icon={Building2}
                    error={errors.college?.message}
                    {...register('college')}
                  />

                  {/* Graduation Year - custom select */}
                  <div>
                    <label
                      htmlFor="graduationYear"
                      className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                      style={{ color: '#3D5A50' }}
                    >
                      Graduation Year
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <GraduationCap className="w-4 h-4" style={{ color: '#9ABAA0' }} />
                      </div>
                      <select
                        id="graduationYear"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none appearance-none transition-all duration-200 cursor-pointer"
                        style={{
                          background: errors.graduationYear ? 'linear-gradient(135deg, #FFF5F7, #FFF0F3)' : '#FAF6F1',
                          border: errors.graduationYear ? '1.5px solid #F0B8C8' : '1.5px solid #EDE7E0',
                          boxShadow: 'inset 2px 2px 5px #e4dcd4, inset -2px -2px 5px #ffffff',
                          color: '#2D4A3E',
                        }}
                        {...register('graduationYear')}
                      >
                        <option value="">Select year</option>
                        {GRAD_YEARS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.graduationYear && (
                      <p className="mt-1 text-xs font-medium" style={{ color: '#E07090' }}>
                        {errors.graduationYear.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <FormInput
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    icon={Lock}
                    error={errors.password?.message}
                    rightElement={
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((v) => !v)}
                        style={{ color: '#8FAF8F' }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                    {...register('password')}
                  />
                  {/* Strength meter */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className="flex-1 h-1 rounded-full transition-all duration-300"
                            style={{
                              background:
                                passwordStrength >= level
                                  ? strengthColors[passwordStrength]
                                  : '#E8E0D8',
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: strengthColors[passwordStrength] }}>
                        {strengthLabels[passwordStrength]}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <FormInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  icon={Lock}
                  error={errors.confirmPassword?.message}
                  rightElement={
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      style={{ color: '#8FAF8F' }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                  {...register('confirmPassword')}
                />

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -1 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background:
                      'linear-gradient(135deg, #9A78C8 0%, #A8A0D8 35%, #A0B8E0 70%, #80C0D0 100%)',
                    boxShadow: isLoading
                      ? 'none'
                      : '0 6px 24px rgba(154,120,200,0.4), 0 2px 8px rgba(154,120,200,0.2)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Free Account</span>
                    </>
                  )}
                </motion.button>

                {/* Terms */}
                <p className="text-center text-xs" style={{ color: '#9A9088' }}>
                  By registering you agree to our{' '}
                  <Link to="/terms" className="underline" style={{ color: '#7A8B90' }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="underline" style={{ color: '#7A8B90' }}>
                    Privacy Policy
                  </Link>
                </p>
              </motion.div>
            </form>

            {/* Login Link */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-center text-sm"
              style={{ color: '#7A8B85' }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold transition-colors hover:underline"
                style={{ color: '#6A5A8A' }}
              >
                Sign in →
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
