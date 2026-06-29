import { motion } from 'framer-motion';

const cardVariants = {
  neu: {
    className: 'bg-gradient-to-br from-[#FAF6F1] to-[#F5EFE6]',
    shadow: 'shadow-[6px_6px_16px_rgba(0,0,0,0.08),-4px_-4px_12px_rgba(255,255,255,0.95)]',
    border: 'border border-white/60',
  },
  glass: {
    className: 'bg-white/30 backdrop-blur-xl',
    shadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.08)]',
    border: 'border border-white/50',
  },
  gradient: {
    className: 'bg-gradient-to-br from-[#8FAF8F]/10 via-[#A8C5DA]/10 to-[#F0B8C8]/10',
    shadow: 'shadow-[6px_6px_16px_rgba(0,0,0,0.07),-4px_-4px_12px_rgba(255,255,255,0.9)]',
    border: 'border border-white/50',
  },
};

export default function Card({
  children,
  variant = 'neu',
  title,
  subtitle,
  actions,
  className = '',
  padding = true,
  hoverable = false,
  onClick,
  animate = true,
}) {
  const v = cardVariants[variant] || cardVariants.neu;

  const content = (
    <>
      {/* Card Header */}
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#3a2f25]">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#9a8f85] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
        </div>
      )}

      {/* Card Body */}
      <div>{children}</div>
    </>
  );

  const baseClasses = [
    'rounded-2xl',
    v.className,
    v.shadow,
    v.border,
    padding ? 'p-5' : '',
    hoverable ? 'cursor-pointer transition-all duration-300 hover:shadow-[8px_8px_20px_rgba(0,0,0,0.1),-5px_-5px_16px_rgba(255,255,255,1)] hover:-translate-y-0.5' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={baseClasses}
        onClick={onClick}
        whileHover={hoverable ? { scale: 1.005 } : {}}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={baseClasses} onClick={onClick}>
      {content}
    </div>
  );
}

// Sub-components for composition
Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-bold text-[#3a2f25] ${className}`}>{children}</h3>
  );
};

Card.Subtitle = function CardSubtitle({ children, className = '' }) {
  return (
    <p className={`text-xs text-[#9a8f85] mt-0.5 ${className}`}>{children}</p>
  );
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/40 ${className}`}>{children}</div>
  );
};
