import { motion, AnimatePresence } from 'framer-motion';

function CollapsibleSection({
    children,
    isOpen,
    title,
    description,
    rightElement
}) {
    return (
        <div className={`overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-white/50 dark:bg-navy-800/50' : 'bg-transparent'
            }`}>
            {/* Header Area - Always Visible (if provided) */}
            {(title || rightElement) && (
                <div className="flex items-center justify-between p-6">
                    <div className="flex-1">
                        {title && (
                            <h3 className="text-lg font-display font-medium text-gray-900 dark:text-white">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {description}
                            </p>
                        )}
                    </div>
                    {rightElement && (
                        <div className="ml-4 flex-shrink-0">
                            {rightElement}
                        </div>
                    )}
                </div>
            )}

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                                height: { type: 'spring', stiffness: 500, damping: 40 },
                                opacity: { duration: 0.2, delay: 0.1 }
                            }
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: { duration: 0.3, ease: 'easeInOut' },
                                opacity: { duration: 0.2 }
                            }
                        }}
                    >
                        <div className="px-6 pb-6">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CollapsibleSection;
