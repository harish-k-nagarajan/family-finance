function SkeletonLoader({ className = '', variant = 'text' }) {
  const baseClasses = 'animate-pulse bg-white/10 rounded';

  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    card: 'h-32 w-full rounded-xl',
    circle: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24 rounded-lg',
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`} />;
}

export default SkeletonLoader;
