import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CreditCard, TrendingUp, Settings } from 'lucide-react';

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" strokeWidth={2} />,
  },
  {
    path: '/banks',
    label: 'Bank Accounts',
    icon: <CreditCard className="w-5 h-5" strokeWidth={2} />,
  },
  {
    path: '/investments',
    label: 'Investments',
    icon: <TrendingUp className="w-5 h-5" strokeWidth={2} />,
  },
  {
    path: '/mortgage',
    label: 'Loans & Mortgages',
    icon: <Home className="w-5 h-5" strokeWidth={2} />,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" strokeWidth={2} />,
  },
];

function Sidebar({ collapsed, onToggleCollapse, user, household }) {
  const visibleNavItems = household?.mortgageEnabled
    ? navItems
    : navItems.filter((item) => item.path !== '/mortgage');
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 240 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-full glass-card border-r border-gray-200 dark:border-white/10 z-50"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/Family Finance Logo.png"
              alt="Family Finance logo"
              className="w-14 h-14 rounded-lg object-contain"
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  className="font-display font-semibold text-lg text-navy-900 dark:text-white tracking-wide"
                >
                  Family Finance
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {visibleNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover-glow ${isActive
                      ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-l-2 border-teal-500 pl-[10px]'
                      : 'text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border-l-2 border-transparent'
                    }`
                  }
                >
                  <motion.div
                    whileHover={{ rotate: -8, transition: { duration: 0.25, ease: 'easeOut' } }}
                    className="flex-shrink-0"
                  >
                    {item.icon}
                  </motion.div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.12 }}
                        className="font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

export default Sidebar;
