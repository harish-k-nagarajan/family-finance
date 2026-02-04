import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePictureUpload from './ProfilePictureUpload';

function AddMemberModal({ isOpen, onClose, onAdd, isAdding }) {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        email: '',
        profilePicture: null
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.email && formData.displayName) {
            onAdd(formData);
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
                    className="relative w-full max-w-lg bg-white dark:bg-navy-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-white/10"
                >
                    <div className="flex flex-col items-center">
                        <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
                            Add Household Member
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                            Create a profile for your partner. They will be linked to this account when they log in with this email.
                        </p>

                        <form onSubmit={handleSubmit} className="w-full space-y-5">
                            {/* Profile Picture */}
                            <div className="flex justify-center mb-2">
                                <ProfilePictureUpload
                                    currentImage={formData.profilePicture}
                                    name={formData.displayName || formData.email || 'User'}
                                    onImageChange={(img) => setFormData({ ...formData, profilePicture: img })}
                                />
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Jane Smith"
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 placeholder-gray-500"
                                />
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Display Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="e.g. Jane"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 placeholder-gray-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="partner@example.com"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 placeholder-gray-500"
                                />
                            </div>

                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    disabled={isAdding}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!formData.email || !formData.displayName || isAdding}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-purple-600 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-teal-500/20"
                                >
                                    {isAdding ? 'Adding...' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default AddMemberModal;
