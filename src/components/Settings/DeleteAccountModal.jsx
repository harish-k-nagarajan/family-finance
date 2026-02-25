import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';

function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    title = "Delete Account",
    description = "This action cannot be undone. This will permanently delete your account and remove you from your household."
}) {
    const [confirmationText, setConfirmationText] = useState('');
    const CONFIRM_KEYWORD = 'DELETE';

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-navy-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-white/10"
                >
                    <div className="flex flex-col items-center text-center">
                        {/* Warning Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
                            {title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {description}
                        </p>

                        <div className="w-full mb-6 text-left">
                            <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Type <span className="font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <div className="flex gap-3 w-full">
                            <Button
                                onClick={onClose}
                                variant="secondary"
                                disabled={isDeleting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onConfirm}
                                disabled={confirmationText !== CONFIRM_KEYWORD || isDeleting}
                                isLoading={isDeleting}
                                variant="destructive"
                                className="flex-1 rounded-xl"
                            >
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

export default DeleteAccountModal;
