import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import OwnerTabs from '../components/common/OwnerTabs';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { formatCurrency } from '../utils/formatters';
import { createSnapshot, calculateTotals } from '../utils/snapshots';
import { Landmark, PiggyBank, CreditCard, Wallet } from 'lucide-react';
import BankAccountModal from '../components/BankAccounts/BankAccountModal';
import SimpleTrendChart from '../components/Charts/SimpleTrendChart';

const getAccountTypeIcon = (accountType) => {
  const iconProps = { className: "w-6 h-6 text-white", strokeWidth: 2 };
  switch (accountType?.toLowerCase()) {
    case 'checking':
      return <Landmark {...iconProps} />;
    case 'savings':
      return <PiggyBank {...iconProps} />;
    case 'credit':
    case 'credit card':
      return <CreditCard {...iconProps} />;
    default:
      return <Wallet {...iconProps} />;
  }
};

function Banks() {
  const { user } = db.useAuth();
  const [selectedOwner, setSelectedOwner] = useState('combined');
  const [editingAccount, setEditingAccount] = useState(null);

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
  const allAccounts = data?.accounts || [];
  const investments = data?.investments || [];
  const loans = data?.mortgage || [];
  const snapshots = data?.snapshots || [];

  // Get household members
  const { data: householdData } = db.useQuery(
    household?.id
      ? {
        users: { $: { where: { householdId: household.id } } },
      }
      : null
  );

  const allHouseholdUsers = householdData?.users || [];
  const hasDemoData = allAccounts.some((a) => a.isDemo) || investments.some((i) => i.isDemo);
  const users = allHouseholdUsers.filter((u) => !u.isDemo || hasDemoData);

  const currency = household?.currency || 'USD';
  const householdId = household?.id;

  // Filter accounts by owner
  const accounts =
    selectedOwner === 'combined'
      ? allAccounts
      : allAccounts.filter((a) => a.ownerId === selectedOwner);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  // Transform snapshots for chart (always use combined household data)
  const chartData = snapshots
    .sort((a, b) => a.date - b.date)
    .map(s => ({ date: s.date, value: s.totalBankBalance }));

  const handleDeleteAccount = async (accountId) => {
    await db.transact(db.tx.accounts[accountId].delete());

    // Create snapshot after balance change
    const updatedAccounts = allAccounts.filter((a) => a.id !== accountId);
    const totals = calculateTotals(updatedAccounts, investments, household, loans);
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
            Bank Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
            Manage your checking, savings, and credit accounts
          </p>
        </div>
        <button
          onClick={() => setEditingAccount('new')}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Add Account
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
        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mb-1">Total Balance</p>
        <p className="text-3xl font-display font-bold text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(totalBalance, currency)}
        </p>
      </Card>

      {/* Balance History Chart */}
      {snapshots.length > 0 && (
        <Card>
          <h3 className="text-base font-display font-semibold text-gray-900 dark:text-white mb-4">
            Balance History
          </h3>
          <SimpleTrendChart data={chartData} currency={currency} label="Bank Balance" color="#2DD4BF" />
          {selectedOwner !== 'combined' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
              * Chart shows combined household data
            </p>
          )}
        </Card>
      )}

      {/* Accounts List */}
      <div className="space-y-4">
        {accounts.map((account) => (
          <motion.div
            key={account.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Bank Logo */}
                  <div className="relative">
                    {account.logoUrl && (
                      <img
                        src={account.logoUrl}
                        alt={account.institution}
                        className="w-12 h-12 rounded-lg object-contain bg-white dark:bg-navy-800 p-2 border border-gray-200 dark:border-white/10"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.fallback-icon');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    )}
                    <div
                      className="fallback-icon w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center flex-shrink-0"
                      style={{ display: account.logoUrl ? 'none' : 'flex' }}
                    >
                      {getAccountTypeIcon(account.accountType)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {account.institution}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">
                      {account.accountType} • {users.find((u) => u.id === account.ownerId)?.displayName || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency(account.balance, currency)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
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

        {accounts.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No accounts found</p>
            <button
              onClick={() => setEditingAccount('new')}
              className="mt-4 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Add your first account
            </button>
          </Card>
        )}
      </div>

      {/* Add/Edit Modal */}
      {editingAccount && (
        <BankAccountModal
          account={editingAccount === 'new' ? null : editingAccount}
          users={users}
          householdId={householdId}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
}

export default Banks;
