import { motion } from 'framer-motion';
import Avatar from './Avatar';

function OwnerTabs({ owners, selectedOwner, onSelect }) {
  // owners are already filtered by parent component (Banks/Investments)
  // Build tabs with avatars
  const tabs = [
    ...owners.map((owner) => ({
      id: owner.id,
      label: owner.displayName || owner.name || 'User',
      avatar: owner.profilePicture,
      initials: (owner.displayName || owner.name || 'U')[0].toUpperCase(),
    })),
    {
      id: 'combined',
      label: 'Combined',
      avatars: owners.map((u) => ({
        src: u.profilePicture,
        initials: (u.displayName || u.name || 'U')[0].toUpperCase(),
      })),
    },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-lg glass-card">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium rounded-md transition-all active:scale-95 flex items-center gap-2 ${
            selectedOwner === tab.id
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
          }`}
        >
          {selectedOwner === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-purple-500/30 rounded-md"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          )}

          {/* Avatar rendering */}
          {tab.id === 'combined' ? (
            <div className="relative z-10 flex -space-x-2">
              {tab.avatars.map((avatar, i) => (
                <Avatar key={i} src={avatar.src} initials={avatar.initials} size="sm" />
              ))}
            </div>
          ) : (
            <div className="relative z-10">
              <Avatar src={tab.avatar} initials={tab.initials} size="sm" />
            </div>
          )}

          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default OwnerTabs;
