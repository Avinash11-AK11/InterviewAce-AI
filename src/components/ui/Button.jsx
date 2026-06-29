import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const variantStyles = {
  primary: {
    base: 'bg-gradient-to-br from-[#8FAF8F] to-[#7a9a7a] text-white',
    shadow: 'shadow-[4px_4px_10px_rgba(143,175,143,0.4),-2px_-2px_8px_rgba(255,255,255,0.8)]',
    hover: 'hover:shadow-[6px_6px_14px_rgba(143,175,143,0.5),-3px_-3px_10px_rgba(255,255,255,0.9)] hover:from-[#7a9f7a] hover:to-[#6a8a6a]',
    active: 'active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.15)]',
  },
  secondary: {
    base: 'bg-gradient-to-br from-[#F5EFE6] to-[#EDE7DF] text-[#5a4f45]',
    shadow: 'shadow-[4px_4px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)]',
    hover: 'hover:shadow-[6px_6px_14px_rgba(0,0,0,0.1),-4px_-4px_10px_rgba(255,255,255,1)]',
    active: 'active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.1),inset_-2px_-2px_6px_rgba(255,255,255,0.7)]',
  },
  sky: {
    base: 'bg-gradient-to-br from-[#A8C5DA] to-[#8db5ce] text-white',
    shadow: 'shadow-[4px_4px_10px_rgba(168,197,218,0.45),-2px_-2px_8px_rgba(255,255,255,0.8)]',
    hover: 'hover:shadow-[6px_6px_14px_rgba(168,197,218,0.55)] hover:from-[#98b5ca]',
    active: 'active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.15)]',
  },
  blush: {
    base: 'bg-gradient-to-br from-[#F0B8C8] to-[#dfa0b5] text-white',
    shadow: 'shadow-[4px_4px_10px_rgba(240,184,200,0.45),-2px_-2px_8px_rgba(255,255,255,0.8)]',
    hover: 'hover:shadow-[6px_6px_14px_rgba(240,184,200,0.55)] hover:from-[#e0a8b8]',
    active: 'active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.15)]',
  },
  ghost: {
    base: 'bg-transparent text-[#6a9a6a] border border-[#8FAF8F]/40',
    shadow: '',
    hover: 'hover:bg-[#8FAF8F]/10 hover:border-[#8FAF8F]/70',
    active: '',
  },
  danger: {
    base: 'bg-gradient-to-br from-red-400 to-red-500 text-white',
    shadow: 'shadow-[4px_4px_10px_rgba(248,113,113,0.4),-2px_-2px_8px_rgba(255,255,255,0.8)]',
    hover: 'hover:from-red-500 hover:to-red-600',
    active: 'active:shadow-[inset_3px_3px_8px_rgba(0,0,0,0.15)]',
  },
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    onClick,
    type = 'button',
    ...props
  },
  ref
) {
  const v = variantStyles[variant] || variantStyles.primary;
  const s = sizeStyles[size] || sizeStyles.md;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? {} : { scale: 0.97, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none',
        v.base,
        v.shadow,
        !isDisabled && v.hover,
        !isDisabled && v.active,
        s,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'lg' ? 18 : size === 'sm' ? 13 : 15} className="animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'lg' ? 18 : size === 'sm' ? 13 : 15} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'lg' ? 18 : size === 'sm' ? 13 : 15} />
          )}
        </>
      )}
    </motion.button>
  );
});

export default Button;
