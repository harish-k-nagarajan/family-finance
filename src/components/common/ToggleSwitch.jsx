import { motion } from 'framer-motion';

function ToggleSwitch({ enabled, onChange, disabled = false, srLabel = 'Toggle' }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={srLabel}
            disabled={disabled}
            onClick={() => !disabled && onChange(!enabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-navy-900 ${enabled
                    ? 'bg-gradient-to-r from-teal-500 to-teal-400'
                    : 'bg-gray-300 dark:bg-white/10'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span className="sr-only">{srLabel}</span>
            <motion.span
                layout
                transition={{ duration: 0.2, ease: 'easeOut' }}
                initial={false}
                animate={{
                    x: enabled ? 22 : 2,
                    backgroundColor: '#ffffff'
                }}
                className="inline-block h-5 w-5 transform rounded-full shadow-lg ring-0"
            />
        </button>
    );
}

export default ToggleSwitch;
