import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    labelKey = "label", // key to display in list
    valueKey = "value", // unique key
    renderOption = null, // optional custom renderer
    searchFields = [] // array of keys to search in. if empty, searches labelKey
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options
    const filteredOptions = useMemo(() => {
        if (!search.trim()) return options;

        const lowerSearch = search.toLowerCase();
        return options.filter(option => {
            // Check specific search fields
            if (searchFields.length > 0) {
                return searchFields.some(field => {
                    const val = option[field];
                    return val && String(val).toLowerCase().includes(lowerSearch);
                });
            }
            // Default to labelKey
            const val = option[labelKey];
            return val && String(val).toLowerCase().includes(lowerSearch);
        });
    }, [options, search, searchFields, labelKey]);

    // Handle selection
    const handleSelect = (option) => {
        onChange(option[valueKey]);
        setIsOpen(false);
        setSearch("");
    };

    // Find selected object
    const selectedOption = options.find(o => o[valueKey] === value);

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger */}
            <div
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        // Focus search input after opening (need a small timeout for render)
                        setTimeout(() => inputRef.current?.focus(), 50);
                    }
                }}
                className={`
            w-full px-4 py-3 rounded-lg border text-left cursor-pointer flex items-center justify-between transition-all
            ${isOpen
                        ? 'ring-2 ring-teal-500 border-transparent bg-white dark:bg-navy-800'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }
        `}
            >
                <div className="flex-1 truncate text-gray-900 dark:text-white">
                    {selectedOption
                        ? (renderOption ? renderOption(selectedOption, false) : selectedOption[labelKey])
                        : <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
                    }
                </div>
                <div className="text-gray-400">
                    <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100 dark:border-white/5">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-black/20 border-none text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0"
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto scrollbar-thin">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => {
                                    const isSelected = option[valueKey] === value;
                                    return (
                                        <div
                                            key={option[valueKey]}
                                            onClick={() => handleSelect(option)}
                                            className={`
                                    px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                                    ${isSelected
                                                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                                                }
                                `}
                                        >
                                            <div className="flex-1">
                                                {renderOption ? renderOption(option, true) : option[labelKey]}
                                            </div>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SearchableSelect;
