import { useState } from 'react';
import Sidebar from './Sidebar';
import Toast from './Toast';
import ThemeToggle from './ThemeToggle';

function Layout({ children, user, theme }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-soft-white dark:bg-navy-900">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
      />
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
      >
        {/* Header with theme toggle */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-soft-white/90 dark:bg-navy-900/90 border-b border-gray-200/50 dark:border-white/5">
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
