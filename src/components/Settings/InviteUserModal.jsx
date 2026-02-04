import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function InviteUserModal({ isOpen, onClose, onInvite, isInviting }) {
    const [email, setEmail] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email) {
            onInvite(email);
        }
    };

    return (
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
                        <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center mb-6 text-teal-600 dark:text-teal-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
                            Invite to Household
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Enter the email address of the person you'd like to invite to your household. They will receive an email to join.
                        </p>

                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="mb-6 text-left">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="partner@example.com"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                                />
                            </div>

                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    disabled={isInviting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!email || isInviting}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-teal-500/20"
                                >
                                    {isInviting ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default InviteUserModal;
