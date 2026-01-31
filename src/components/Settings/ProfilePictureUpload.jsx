import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

function ProfilePictureUpload({ currentImage, onImageChange, name }) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const getInitials = (name) => {
        return name
            ? name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : 'U';
    };

    const handleFile = (file) => {
        // Reset error
        setError(null);

        // Validate type
        if (!file.type.match('image.*')) {
            setError('Please upload an image file (JPG, PNG, WebP)');
            return;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            onImageChange(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative group cursor-pointer w-24 h-24 rounded-full border-2 transition-all duration-300 ${isDragging
                        ? 'border-teal-500 scale-105 ring-4 ring-teal-500/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-teal-500 dark:hover:border-teal-400'
                    }`}
            >
                {/* Image or Initials */}
                <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-navy-700 dark:to-navy-800 flex items-center justify-center">
                    {currentImage ? (
                        <img
                            src={currentImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-display font-bold text-gray-400 dark:text-gray-500">
                            {getInitials(name)}
                        </span>
                    )}
                </div>

                {/* Overlay on Hover */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>

                {/* Hidden Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {/* Error Message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 text-center"
                >
                    {error}
                </motion.p>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Click or drag to upload
            </p>
        </div>
    );
}

export default ProfilePictureUpload;
