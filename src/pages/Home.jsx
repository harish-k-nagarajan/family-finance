import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import AnimatedNumber from '../components/common/AnimatedNumber';
import SkeletonLoader from '../components/common/SkeletonLoader';
import TrendChart from '../components/Charts/TrendChart';
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
        mortgage: {},
        snapshots: {},
      }
      : null
  );

  const currentUser = data?.users?.[0];
  const household = data?.households?.[0];
  const accounts = data?.accounts || [];
  const investments = data?.investments || [];
  const mortgage = data?.mortgage?.[0];
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

  const mortgageBalance = mortgageEnabled ? (mortgage?.currentBalance || 0) : 0;
  const netWorth = totalBankBalance + totalInvestments + homeValue - mortgageBalance;

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
      homeEquity: s.homeValue - s.mortgageBalance,
    }));

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

  const stats = [
    {
      label: 'Net Worth',
      value: netWorth,
      gradient: 'from-teal-400 to-purple-400',
    },
    {
      label: 'Bank Accounts',
      value: totalBankBalance,
      gradient: 'from-blue-400 to-teal-400',
    },
    {
      label: 'Investments',
      value: totalInvestments,
      gradient: 'from-purple-400 to-pink-400',
    },
    ...(mortgageEnabled
      ? [{
          label: 'Home Equity',
          value: homeValue - mortgageBalance,
          gradient: 'from-orange-400 to-yellow-400',
        }]
      : []),
  ];

  const timeRanges = ['1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {currentUser?.displayName || 'User'}
        </h1>
        <p className="text-gray-700 dark:text-gray-400">
          Here's your financial overview
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{stat.label}</p>
              <p className={`text-2xl font-display font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                <AnimatedNumber
                  value={stat.value}
                  formatFn={(val) => formatCurrency(val, currency)}
                />
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Trend Chart */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
            Net Worth Trend
          </h2>
          <div className="flex gap-2">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeRange === range
                  ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                  : 'text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <TrendChart data={filteredSnapshots} currency={currency} timeRange={timeRange} />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
            Bank Accounts
          </h2>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 3).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-white/5"
                >
                  <span className="text-gray-700 dark:text-gray-300">{account.institution}</span>
                  <span className="text-teal-600 dark:text-teal-400 font-medium">
                    {formatCurrency(account.balance, currency)}
                  </span>
                </div>
              ))}
              {accounts.length > 3 && (
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  +{accounts.length - 3} more accounts
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No bank accounts added yet
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
            Investments
          </h2>
          {investments.length > 0 ? (
            <div className="space-y-3">
              {investments.slice(0, 3).map((investment) => (
                <div
                  key={investment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-white/5"
                >
                  <div>
                    <span className="text-gray-700 dark:text-gray-300">{investment.institution}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                      ({investment.accountType})
                    </span>
                  </div>
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {formatCurrency(investment.balance, currency)}
                  </span>
                </div>
              ))}
              {investments.length > 3 && (
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                  +{investments.length - 3} more investments
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No investments added yet
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Home;
