import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Button component with consistent styling across the app
 *
 * Variants:
 * - primary: Solid teal for standard actions
 * - hero: Gradient teal-to-purple for main CTAs
 * - destructive: Red for delete/destructive actions
 * - secondary: Ghost/outline for cancel/secondary actions
 * - ghost: Minimal text-only for icon buttons
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  onClick,
  ...props
}, ref) => {
  // Base styles shared by all variants
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-navy-900 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant-specific styles
  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 dark:shadow-teal-400/20 focus:ring-teal-500 active:scale-[0.98]',
    hero: 'bg-gradient-to-r from-teal-500 to-purple-500 hover:opacity-90 text-white font-semibold shadow-lg shadow-purple-500/20 dark:shadow-purple-400/20 focus:ring-purple-500 active:scale-[0.98]',
    destructive: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 dark:shadow-red-400/20 focus:ring-red-500 active:scale-[0.98]',
    secondary: 'border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 focus:ring-gray-400 active:scale-[0.98]',
    ghost: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 focus:ring-gray-400',
  };

  // Size-specific styles
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // Combine all classes
  const buttonClasses = `
    ${baseStyles}
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const content = (
    <>
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </>
  );

  // Use motion.button for variants that should have scale animation
  const shouldAnimate = ['primary', 'hero', 'destructive', 'secondary'].includes(variant);

  if (shouldAnimate) {
    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={buttonClasses}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
      {...props}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
