import { motion } from 'framer-motion';

function OwnerTabs({ owners, selectedOwner, onSelect }) {
  // owners should be an array like [{ id: '1', name: 'User 1' }, { id: '2', name: 'User 2' }]
  // 'combined' is a special value for showing both

  const tabs = [
    ...owners.map((owner) => ({
      id: owner.id,
      label: owner.displayName || owner.name || 'User',
    })),
    { id: 'combined', label: 'Combined' },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-lg glass-card">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedOwner === tab.id
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {selectedOwner === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-teal-500/30 to-purple-500/30 rounded-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default OwnerTabs;
