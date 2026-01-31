import { useState, useEffect } from 'react';
import { db } from '../../lib/instant';

function ThemeToggle({ user, currentTheme }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || currentTheme || 'dark';
  });

  // Sync from DB on first load (but not on every re-render)
  useEffect(() => {
    if (currentTheme && !localStorage.getItem('theme-user-set')) {
      setTheme(currentTheme);
    }
  }, []);

  // Apply theme to DOM whenever local state changes
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme-user-set', 'true');

    // Persist to InstantDB
    if (user?.id) {
      db.transact(db.tx.users[user.id].update({ theme: newTheme }));
    }
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="group relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-navy-600 hover:bg-gray-200 dark:hover:bg-navy-500 border border-gray-200/60 dark:border-white/10 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-teal-500/20 dark:hover:shadow-purple-500/20"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-5 h-5">
        {/* Moon icon (dark mode) */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-gray-700 dark:text-yellow-400 transition-all duration-500 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>

        {/* Sun icon (light mode) */}
        <svg
          className={`absolute inset-0 w-5 h-5 text-yellow-500 dark:text-gray-400 transition-all duration-500 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'
            }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </button>
  );
}

export default ThemeToggle;
