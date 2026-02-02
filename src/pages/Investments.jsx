import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import OwnerTabs from '../components/common/OwnerTabs';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { formatCurrency } from '../utils/formatters';
import { createSnapshot, calculateTotals } from '../utils/snapshots';
import { TrendingUp, LineChart, BarChart3, PieChart } from 'lucide-react';
import InvestmentModal from '../components/Investments/InvestmentModal';

const getInvestmentTypeIcon = (investmentType) => {
  const iconProps = { className: "w-6 h-6 text-white", strokeWidth: 2 };
  switch (investmentType?.toLowerCase()) {
    case '401k':
      return <TrendingUp {...iconProps} />;
    case 'ira':
      return <LineChart {...iconProps} />;
    case 'taxable':
      return <BarChart3 {...iconProps} />;
    default:
      return <PieChart {...iconProps} />;
  }
};

function Investments() {
  const { user } = db.useAuth();
  const [selectedOwner, setSelectedOwner] = useState('combined');
  const [editingInvestment, setEditingInvestment] = useState(null);

  const { data, isLoading } = db.useQuery(
    user
      ? {
        users: { $: { where: { id: user.id } } },
        households: {},
        accounts: {},
        investments: {},
        loans: {
          $: { where: { householdId: user.householdId, isDeleted: false } }
        },
      }
      : null
  );

  const currentUser = data?.users?.[0];
  const household = data?.households?.[0];
  const accounts = data?.accounts || [];
  const allInvestments = data?.investments || [];
  const loans = data?.loans || [];

  // Get household members
  const { data: householdData } = db.useQuery(
    household?.id
      ? {
        users: { $: { where: { householdId: household.id } } },
      }
      : null
  );

  const allHouseholdUsers = householdData?.users || [];
  const hasDemoData = accounts.some((a) => a.isDemo) || allInvestments.some((i) => i.isDemo);
  const users = allHouseholdUsers.filter((u) => !u.isDemo || hasDemoData);

  const currency = household?.currency || 'USD';
  const householdId = household?.id;

  // Filter investments by owner
  const investments =
    selectedOwner === 'combined'
      ? allInvestments
      : allInvestments.filter((i) => i.ownerId === selectedOwner);

  const totalBalance = investments.reduce((sum, i) => sum + (i.balance || 0), 0);

  const handleDeleteInvestment = async (investmentId) => {
    await db.transact(db.tx.investments[investmentId].delete());

    // Create snapshot after balance change
    const updatedInvestments = allInvestments.filter((i) => i.id !== investmentId);
    const totals = calculateTotals(accounts, updatedInvestments, household, loans);
    await createSnapshot(householdId, totals);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="title" />
        <SkeletonLoader variant="card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Investments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
            Track your 401(k), IRA, and brokerage accounts
          </p>
        </div>
        <button
          onClick={() => setEditingInvestment('new')}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Add Investment
        </button>
      </div>

      {/* Owner Tabs */}
      <OwnerTabs
        owners={users}
        selectedOwner={selectedOwner}
        onSelect={setSelectedOwner}
      />

      {/* Total Balance */}
      <Card>
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mb-1">Total Investments</p>
        <p className="text-3xl font-display font-bold text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(totalBalance, currency)}
        </p>
      </Card>

      {/* Investments List */}
      <div className="space-y-4">
        {investments.map((investment) => (
          <motion.div
            key={investment.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Institution Logo */}
                  <div className="relative">
                    {investment.logoUrl && (
                      <img
                        src={investment.logoUrl}
                        alt={investment.institution}
                        className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-navy-800 p-2 border border-gray-200 dark:border-white/10"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.fallback-icon');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    )}
                    <div
                      className="fallback-icon w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0"
                      style={{ display: investment.logoUrl ? 'none' : 'flex' }}
                    >
                      {getInvestmentTypeIcon(investment.accountType)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {investment.institution}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">
                      {investment.accountType} • {users.find((u) => u.id === investment.ownerId)?.displayName || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(investment.balance, currency)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingInvestment(investment)}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteInvestment(investment.id)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
          </motion.div>
        ))}

        {investments.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No investments found</p>
            <button
              onClick={() => setEditingInvestment('new')}
              className="mt-4 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Add your first investment
            </button>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      {editingInvestment && (
        <InvestmentModal
          investment={editingInvestment === 'new' ? null : editingInvestment}
          users={users}
          householdId={householdId}
          onClose={() => setEditingInvestment(null)}
        />
      )}
    </div>
  );
}

export default Investments;
