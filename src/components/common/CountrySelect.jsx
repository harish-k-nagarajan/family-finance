import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { countries, getFlagUrl } from '../../utils/countries';

function CountrySelect({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedCountry = useMemo(() =>
        countries.find(c => c.code === value),
        [value]
    );

    const filteredCountries = useMemo(() => {
        if (!search) return countries;
        const lower = search.toLowerCase();
        return countries.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            c.code.toLowerCase().includes(lower)
        );
    }, [search]);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-[46px] px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex items-center justify-between hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
                <div className="flex items-center gap-3">
                    {selectedCountry ? (
                        <>
                            <img
                                src={getFlagUrl(selectedCountry.code)}
                                alt={selectedCountry.name}
                                className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                            <span className="font-medium">{selectedCountry.name}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">Select a country</span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Backdrop (Click outside) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-navy-800">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search..."
                                    autoFocus
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border-none text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-teal-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-60 overflow-y-auto p-1">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((c) => (
                                    <button
                                        key={c.code}
                                        onClick={() => {
                                            onChange(c.code);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${value === c.code
                                                ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400'
                                                : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={getFlagUrl(c.code)}
                                            alt={c.name}
                                            className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                        />
                                        <span className="text-sm font-medium">{c.name}</span>
                                        {value === c.code && (
                                            <svg className="w-4 h-4 ml-auto text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No countries found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default CountrySelect;
