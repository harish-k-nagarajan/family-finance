import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import SkeletonLoader from '../components/common/SkeletonLoader';
import AssetAllocationChart from '../components/Charts/AssetAllocationChart';
import StatCard from '../components/Dashboard/StatCard';
import DashboardTrendChart from '../components/Dashboard/DashboardTrendChart';
import WealthRadarCard from '../components/common/WealthRadarCard';
import { formatCurrency } from '../utils/formatters';
import { calculateHomeValue } from '../utils/mortgageCalculations';

function Home() {
  const { user } = db.useAuth();
  const [timeRange, setTimeRange] = useState('1Y');

  const { data, isLoading } = db.useQuery(
    user
      ? {
        users: { $: { where: { id: user.id } } },
        households: {},
        accounts: {},
        investments: {},
        mortgage: {
          $: { where: { householdId: user.householdId, isDeleted: false } }
        },
        snapshots: {},
      }
      : null
  );

  const currentUser = data?.users?.[0];
  const household = data?.households?.[0];
  const accounts = data?.accounts || [];
  const investments = data?.investments || [];
  const loans = data?.mortgage || [];
  const snapshots = data?.snapshots || [];

  const currency = household?.currency || 'USD';

  // Calculate totals
  const totalBankBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalInvestments = investments.reduce((sum, i) => sum + (i.balance || 0), 0);

  const mortgageEnabled = household?.mortgageEnabled;

  let homeValue = 0;
  if (mortgageEnabled && household?.homePurchasePrice && household?.homePurchaseDate) {
    homeValue = calculateHomeValue(
      household.homePurchasePrice,
      household.homePurchaseDate,
      household.appreciationRate || 0
    );
  }

  const totalLoanBalance = mortgageEnabled
    ? loans.reduce((sum, l) => sum + (l.currentBalance || 0), 0)
    : 0;
  const netWorth = totalBankBalance + totalInvestments + homeValue - totalLoanBalance;

  // Filter snapshots by time range
  const getTimeRangeDate = () => {
    const now = Date.now();
    const ranges = {
      '1M': 30 * 24 * 60 * 60 * 1000,
      '3M': 90 * 24 * 60 * 60 * 1000,
      '6M': 180 * 24 * 60 * 60 * 1000,
      '1Y': 365 * 24 * 60 * 60 * 1000,
      'ALL': Infinity,
    };
    return now - (ranges[timeRange] || ranges['1Y']);
  };

  const filteredSnapshots = snapshots
    .filter(s => s.date >= getTimeRangeDate())
    .sort((a, b) => a.date - b.date)
    .map(s => ({
      date: s.date,
      netWorth: s.netWorth,
      totalBanks: s.totalBankBalance,
      totalInvestments: s.totalInvestments,
      homeEquity: s.homeValue - s.totalLoanBalance,
      forecast: null,
    }));

  // --- FORECASTING LOGIC ---
  // Define forecast horizons by time range (in days)
  const forecastHorizonDays = {
    '1M': 14,
    '3M': 30,
    '6M': 45,
    '1Y': 60,
    'ALL': 90,
  };
  const forecastDays = forecastHorizonDays[timeRange] || 30;
  const forecastMs = forecastDays * 24 * 60 * 60 * 1000;

  // Clone data to avoid mutating original source if needed (though map creates new)
  let chartData = [...filteredSnapshots];

  // If no history, seed with current state
  if (chartData.length === 0) {
    chartData.push({
      date: Date.now(),
      netWorth: netWorth,
      totalBanks: totalBankBalance,
      totalInvestments: totalInvestments,
      homeEquity: homeValue - totalLoanBalance,
      forecast: null, // Will optionally set overlap below
    });
  }

  // Get last historical point to project from
  const lastPoint = chartData[chartData.length - 1];
  const lastHistoricalDate = lastPoint.date;

  // Set overlaps for continuity (Solid line ends here, Dashed line starts here)
  lastPoint.forecast = lastPoint.netWorth;

  // Project into future based on time range
  // Assumption: 5% Annual Growth on Net Worth
  const dailyGrowthRate = Math.pow(1.05, 1 / 365);
  let currentProjectedNW = lastPoint.netWorth;
  let currentDate = lastPoint.date;

  // Generate forecast points (weekly intervals for smoother line)
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const numForecastPoints = Math.ceil(forecastDays / 7);

  for (let i = 1; i <= numForecastPoints; i++) {
    currentDate += weekMs;
    const daysElapsed = (currentDate - lastHistoricalDate) / (24 * 60 * 60 * 1000);
    currentProjectedNW = lastPoint.netWorth * Math.pow(dailyGrowthRate, daysElapsed);

    chartData.push({
      date: currentDate,
      netWorth: null, // Stop solid line
      forecast: currentProjectedNW,
      totalBanks: null,
      totalInvestments: null,
      homeEquity: null,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="title" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" />
          ))}
        </div>
      </div>
    );
  }

  const allStats = [
    {
      label: 'Net Worth',
      value: netWorth,
    },
    {
      label: 'Bank Accounts',
      value: totalBankBalance,
    },
    {
      label: 'Investments',
      value: totalInvestments,
    },
    ...(mortgageEnabled
      ? [{
        label: 'Home Equity',
        value: homeValue - totalLoanBalance,
      }]
      : []),
  ];

  const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-3">
          Welcome back, {currentUser?.displayName || 'User'}
        </h1>
        <p className="text-base font-body text-gray-600 dark:text-gray-400">
          Here's your financial overview
        </p>
      </motion.div>

      {/* Stats Grid - Four Equal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {allStats.map((stat, index) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            currency={currency}
            delay={index * 0.08}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
        {/* Trend Chart (2/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
                  Net Worth Trend
                </h2>
                <div className="group relative">
                  <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                    Includes 6-month projection based on 5% annual growth
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {timeRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium font-body transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-navy-900 ${
                      timeRange === range
                        ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <DashboardTrendChart
              data={chartData}
              currency={currency}
              timeRange={timeRange}
              lastHistoricalDate={lastHistoricalDate}
              forecastMs={forecastMs}
            />
          </Card>
        </motion.div>

        {/* Asset Allocation (1/3 width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
          className="lg:col-span-1"
        >
          <Card className="h-full flex flex-col">
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-8">
              Asset Allocation
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <AssetAllocationChart
                cash={totalBankBalance}
                investments={totalInvestments}
                homeEquity={homeValue - totalLoanBalance}
                currency={currency}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Wealth Radar Widget */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3, ease: 'easeOut' }}
        className="mt-12"
      >
        <WealthRadarCard householdId={household?.id} />
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {/* Bank Accounts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
        >
          <Card>
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">
              Bank Accounts
            </h2>
            {accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.slice(0, 3).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <span className="text-sm font-body text-gray-700 dark:text-gray-300">
                      {account.institution}
                    </span>
                    <span className="text-base font-body font-medium text-teal-600 dark:text-teal-400 tabular-nums">
                      {formatCurrency(account.balance, currency)}
                    </span>
                  </div>
                ))}
                {accounts.length > 3 && (
                  <p className="text-xs font-body text-gray-600 dark:text-gray-400 text-center pt-2">
                    +{accounts.length - 3} more accounts
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm font-body text-gray-600 dark:text-gray-400 text-center py-8">
                No bank accounts added yet
              </p>
            )}
          </Card>
        </motion.div>

        {/* Investments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3, ease: 'easeOut' }}
        >
          <Card>
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">
              Investments
            </h2>
            {investments.length > 0 ? (
              <div className="space-y-3">
                {investments.slice(0, 3).map((investment) => (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <div>
                      <span className="text-sm font-body text-gray-700 dark:text-gray-300">
                        {investment.institution}
                      </span>
                      <span className="text-xs font-body text-gray-600 dark:text-gray-400 ml-2">
                        ({investment.accountType})
                      </span>
                    </div>
                    <span className="text-base font-body font-medium text-purple-600 dark:text-purple-400 tabular-nums">
                      {formatCurrency(investment.balance, currency)}
                    </span>
                  </div>
                ))}
                {investments.length > 3 && (
                  <p className="text-xs font-body text-gray-600 dark:text-gray-400 text-center pt-2">
                    +{investments.length - 3} more investments
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm font-body text-gray-600 dark:text-gray-400 text-center py-8">
                No investments added yet
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
