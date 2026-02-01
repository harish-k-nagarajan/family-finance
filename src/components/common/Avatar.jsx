function Avatar({ src, initials, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-white dark:border-navy-800 overflow-hidden bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center flex-shrink-0`}
    >
      {src ? (
        <img src={src} alt={initials} className="w-full h-full object-cover" />
      ) : (
        <span className="font-display font-bold text-white">{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
