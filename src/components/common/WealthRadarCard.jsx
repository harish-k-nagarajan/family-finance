import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import { db } from '../../lib/instant';
import Card from './Card';
import SkeletonLoader from './SkeletonLoader';
import { useToast } from './Toast';
import { formatDate } from '../../utils/formatters';

// Cache management constants
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Get cached data from localStorage
const getCachedData = (householdId) => {
  if (!householdId) return null;

  const key = `wealthRadar:${householdId}`;
  const cached = localStorage.getItem(key);

  if (!cached) return null;

  try {
    const data = JSON.parse(cached);
    const now = Date.now();

    // Check if expired
    if (data.expiresAt && now > data.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (e) {
    console.warn('Failed to parse cached Wealth Radar data:', e);
    localStorage.removeItem(key);
    return null;
  }
};

// Save data to localStorage cache
const setCachedData = (householdId, data) => {
  if (!householdId) return;

  const key = `wealthRadar:${householdId}`;
  const cacheData = {
    ...data,
    expiresAt: Date.now() + CACHE_TTL
  };

  try {
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('Failed to cache Wealth Radar data (localStorage may be full):', e);
  }
};

// Perplexity badge component
const PerplexityBadge = () => (
  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
    <span className="uppercase tracking-wider font-medium">Powered by</span>
    <img
      src="/perplexity.svg"
      alt="Perplexity"
      className="h-4 opacity-70"
    />
  </div>
);

// Citations tooltip component
const CitationsTooltip = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
        <span>{citations.length} source{citations.length > 1 ? 's' : ''} cited</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-72 p-3 glass-card shadow-xl border border-gray-200 dark:border-white/10 rounded-xl z-10"
          >
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sources
            </p>
            <div className="space-y-2">
              {citations.map((cite, idx) => (
                <a
                  key={idx}
                  href={cite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-teal-600 dark:text-teal-400 hover:underline break-words"
                >
                  {cite.title || cite.url}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Wealth Radar Card component
function WealthRadarCard({ householdId }) {
  const { user } = db.useAuth();
  const { showToast } = useToast();

  const [state, setState] = useState('empty'); // 'empty' | 'loading' | 'loaded' | 'error'
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  // Fetch household data via InstantDB
  const { data, isLoading: isQueryLoading } = db.useQuery(
    householdId ? {
      households: { $: { where: { id: householdId } } },
      accounts: { $: { where: { householdId } } },
      investments: { $: { where: { householdId } } },
      mortgage: { $: { where: { householdId, isDeleted: false } } },
      snapshots: { $: { where: { householdId } } }
    } : null
  );

  // Check cache on mount
  useEffect(() => {
    if (!householdId) return;

    const cached = getCachedData(householdId);
    if (cached) {
      setInsights(cached);
      setState('loaded');
    } else {
      setState('empty');
    }
  }, [householdId]);

  // Generate insights function
  const generateInsights = async () => {
    if (!data) {
      showToast('Loading household data...', 'warning');
      return;
    }

    const household = data.households?.[0];
    const accounts = data.accounts || [];
    const investments = data.investments || [];
    const loans = data.mortgage || [];
    const snapshots = data.snapshots || [];

    // Check if user has any financial data
    if (accounts.length === 0 && investments.length === 0) {
      showToast('Add bank accounts or investments to generate insights', 'warning');
      return;
    }

    setState('loading');
    setError(null);

    try {
      // Prepare payload with minimal data
      const payload = {
        household: {
          currency: household?.currency || 'USD',
          country: household?.country,
          appreciationRate: household?.appreciationRate,
          homePurchasePrice: household?.homePurchasePrice,
          relationshipStatus: household?.relationshipStatus
        },
        accounts: accounts.map(a => ({
          institution: a.institution,
          accountType: a.accountType,
          balance: a.balance
        })),
        investments: investments.map(i => ({
          institution: i.institution,
          accountType: i.accountType,
          balance: i.balance
        })),
        mortgage: loans.map(l => ({
          loanName: l.loanName,
          loanType: l.loanType,
          currentBalance: l.currentBalance,
          interestRate: l.interestRate
        })),
        snapshots: snapshots
          .sort((a, b) => a.date - b.date)
          .slice(-12)
          .map(s => ({
            date: s.date,
            netWorth: s.netWorth
          }))
      };

      // Call API
      const response = await fetch('/api/wealth-radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // Handle errors
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate insights');
      }

      // Update state and cache
      setInsights(result.data);
      setCachedData(householdId, result.data);
      setState('loaded');
      showToast('Wealth insights generated successfully');

    } catch (err) {
      console.error('Generate insights error:', err);
      setError(err.message);
      setState('error');
      showToast(err.message, 'error');
    }
  };

  // Show skeleton while querying household data
  if (isQueryLoading || !householdId) {
    return (
      <Card>
        <div className="relative">
          <SkeletonLoader variant="title" className="mb-6" />
          <div className="space-y-4">
            <SkeletonLoader variant="text" className="h-5 w-full" />
            <SkeletonLoader variant="text" className="h-5 w-11/12" />
            <SkeletonLoader variant="text" className="h-5 w-full" />
          </div>
          <PerplexityBadge />
        </div>
      </Card>
    );
  }

  // EMPTY STATE
  if (state === 'empty') {
    return (
      <Card>
        <div className="relative">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-teal-500 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-2">
              Wealth Radar
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
              Get personalized financial insights based on your household data and current market conditions
            </p>
            <button
              onClick={generateInsights}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Generate Insights
            </button>
          </div>
          <PerplexityBadge />
        </div>
      </Card>
    );
  }

  // LOADING STATE
  if (state === 'loading') {
    return (
      <Card>
        <div className="relative">
          <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">
            Wealth Radar
          </h3>
          <div className="space-y-4 mb-8">
            <SkeletonLoader variant="text" className="h-5 w-full" />
            <SkeletonLoader variant="text" className="h-5 w-11/12" />
            <SkeletonLoader variant="text" className="h-5 w-full" />
            <SkeletonLoader variant="text" className="h-5 w-10/12" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing your finances...</span>
          </div>
          <PerplexityBadge />
        </div>
      </Card>
    );
  }

  // ERROR STATE
  if (state === 'error') {
    return (
      <Card>
        <div className="relative">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400 mb-4" />
            <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-2">
              Unable to Generate Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
              {error || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={generateInsights}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
          <PerplexityBadge />
        </div>
      </Card>
    );
  }

  // LOADED STATE
  if (state === 'loaded' && insights) {
    return (
      <Card>
        <div className="relative">
          <div className="flex items-start justify-between mb-6 pr-32">
            <div>
              <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
                Wealth Radar
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Personalized for {insights.inferredCountry}
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-6"
          >
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {insights.content}
            </div>
          </motion.div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last generated: {formatDate(insights.generatedAt, 'short')}
            </span>
            <button
              onClick={generateInsights}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Refresh
            </button>
          </div>

          <PerplexityBadge />
        </div>
      </Card>
    );
  }

  return null;
}

export default WealthRadarCard;
