import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', color = 'sage', className = '' }) {
  const sizes = { sm: 'w-5 h-5 border-2', md: 'w-9 h-9 border-[3px]', lg: 'w-14 h-14 border-4' };
  const colors = {
    sage: 'border-[#8FAF8F]/20 border-t-[#8FAF8F]',
    sky: 'border-[#A8C5DA]/20 border-t-[#A8C5DA]',
    blush: 'border-[#F0B8C8]/20 border-t-[#F0B8C8]',
    amber: 'border-amber-200 border-t-amber-500',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div
      className={`rounded-full animate-spin ${sizes[size] || sizes.md} ${colors[color] || colors.sage} ${className}`}
    />
  );
}

// ── Skeleton Line ────────────────────────────────────────────────────────────
export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div
      className={`${width} ${height} rounded-lg bg-gradient-to-r from-[#EDE7DF] via-[#F5EFE6] to-[#EDE7DF] bg-[length:400%_100%] animate-shimmer ${className}`}
      style={{
        backgroundSize: '400% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}

// ── Skeleton Card ────────────────────────────────────────────────────────────
export function SkeletonCard({ lines = 3, hasAvatar = false, hasImage = false }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, #FAF6F1, #F5EFE6)',
        boxShadow: '6px 6px 16px rgba(0,0,0,0.07), -4px -4px 12px rgba(255,255,255,0.95)',
        border: '1px solid rgba(255,255,255,0.6)',
      }}
    >
      {hasImage && <SkeletonLine height="h-40" className="mb-4 rounded-xl" />}
      {hasAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#EDE7DF] via-[#F5EFE6] to-[#EDE7DF] animate-pulse" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="w-3/4" height="h-3" />
            <SkeletonLine width="w-1/2" height="h-2" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            width={i === lines - 1 ? 'w-2/3' : 'w-full'}
            height="h-3"
          />
        ))}
      </div>
    </div>
  );
}

// ── Skeleton Grid ────────────────────────────────────────────────────────────
export function SkeletonGrid({ count = 6, cols = 3 }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  return (
    <div className={`grid ${gridCols[cols] || gridCols[3]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={3} />
      ))}
    </div>
  );
}

// ── Floating Blob ────────────────────────────────────────────────────────────
function FloatingBlob({ color, size, x, y, duration, delay }) {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        background: color,
        width: size,
        height: size,
        left: x,
        top: y,
        opacity: 0.35,
      }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
        scale: [1, 1.1, 0.95, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// ── Full Page Loader ─────────────────────────────────────────────────────────
export function FullPageLoader({ message = 'Loading...' }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #FAF6F1 0%, #F5EFE6 50%, #F0EBE3 100%)' }}
    >
      {/* Animated blobs */}
      <FloatingBlob color="radial-gradient(circle, #A8C5DA, transparent)" size="380px" x="10%" y="5%" duration={8} delay={0} />
      <FloatingBlob color="radial-gradient(circle, #8FAF8F, transparent)" size="320px" x="60%" y="50%" duration={10} delay={1} />
      <FloatingBlob color="radial-gradient(circle, #F0B8C8, transparent)" size="280px" x="20%" y="60%" duration={9} delay={2} />

      {/* Loader card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 rounded-3xl"
        style={{
          background: 'rgba(250, 246, 241, 0.8)',
          backdropFilter: 'blur(24px)',
          boxShadow: '10px 10px 30px rgba(0,0,0,0.1), -6px -6px 20px rgba(255,255,255,0.95)',
          border: '1px solid rgba(255,255,255,0.7)',
        }}
      >
        {/* Animated brain icon with rings */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#8FAF8F]/30"
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#A8C5DA]/30"
            animate={{ scale: [1, 2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center shadow-lg"
          >
            <Brain size={30} className="text-white" />
          </motion.div>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA]"
              animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#4a3f35]">{message}</p>
          <p className="text-xs text-[#9a8f85] mt-1">InterviewAce AI</p>
        </div>
      </motion.div>

      {/* Shimmer keyframes injected */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #EDE7DF 25%, #F8F3EE 50%, #EDE7DF 75%);
          background-size: 400% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ── Inline Section Loader ────────────────────────────────────────────────────
export function SectionLoader({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner size="md" color="sage" />
      <p className="text-sm text-[#9a8f85]">{message}</p>
    </div>
  );
}

// Default export = FullPageLoader
export default FullPageLoader;
