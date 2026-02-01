import { useState } from 'react';
import Sidebar from './Sidebar';
import Toast from './Toast';
import ThemeToggle from './ThemeToggle';
import { db } from '../../lib/instant';

function Layout({ children, user, theme, household }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await db.auth.signOut();
  };

  return (
    <div className="min-h-screen flex bg-transparent dark:bg-transparent">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        household={household}
      />
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-60'
          }`}
      >
        {/* Header with theme toggle and sign out */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/50 dark:bg-navy-900/90 border-b border-gray-200/40 dark:border-white/5">
          <div className="px-4 laptop:px-6 desktop:px-8 py-3 laptop:py-4 flex items-center justify-end gap-3">
            <ThemeToggle user={user} currentTheme={theme} />
            <button
              onClick={handleSignOut}
              className="group relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-navy-600 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200/60 dark:border-white/10 hover:border-red-300 dark:hover:border-red-500/50 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/20"
              title="Sign out"
              aria-label="Sign out"
            >
              <svg
                className="w-5 h-5 text-gray-700 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>


        <div className="p-4 laptop:p-6 desktop:p-8">
          {children}
        </div>
      </main>
      <Toast />
    </div>
  );
}

export default Layout;
