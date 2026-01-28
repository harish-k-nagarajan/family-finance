import { useState } from 'react';
import Sidebar from './Sidebar';
import Toast from './Toast';
import ThemeToggle from './ThemeToggle';

function Layout({ children, user, theme, household }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-transparent dark:bg-transparent">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        household={household}
      />
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
      >
        {/* Header with theme toggle */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/50 dark:bg-navy-900/90 border-b border-gray-200/40 dark:border-white/5">
          <div className="px-6 md:px-8 py-4 flex items-center justify-end">
            <ThemeToggle user={user} currentTheme={theme} />
          </div>
        </div>

        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
      <Toast />
    </div>
  );
}

export default Layout;
