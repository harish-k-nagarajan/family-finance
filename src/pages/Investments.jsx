import { useState } from 'react';
import { motion } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import OwnerTabs from '../components/common/OwnerTabs';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { formatCurrency } from '../utils/formatters';
import { createSnapshot, calculateTotals } from '../utils/snapshots';

function Investments() {
  const { user } = db.useAuth();
  const [selectedOwner, setSelectedOwner] = useState('combined');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { data, isLoading } = db.useQuery(
    user
      ? {
          users: {},
          households: {},
          accounts: {},
          investments: {},
          mortgage: {},
        }
      : null
  );

  const users = data?.users || [];
  const household = data?.households?.[0];
  const accounts = data?.accounts || [];
  const allInvestments = data?.investments || [];
  const mortgage = data?.mortgage?.[0];

  const currency = household?.currency || 'USD';
  const householdId = household?.id;

  // Filter investments by owner
  const investments =
    selectedOwner === 'combined'
      ? allInvestments
      : allInvestments.filter((i) => i.ownerId === selectedOwner);

  const totalBalance = investments.reduce((sum, i) => sum + (i.balance || 0), 0);

  const handleAddInvestment = async (formData) => {
    if (!householdId) return;

    const now = Date.now();
    await db.transact(
      db.tx.investments[id()].update({
        householdId,
        ownerId: formData.ownerId || user.id,
        institution: formData.institution,
        accountType: formData.accountType,
        balance: parseFloat(formData.balance) || 0,
        createdAt: now,
        updatedAt: now,
      })
    );

    // Create snapshot after balance change
    const totals = calculateTotals(
      accounts,
      [...allInvestments, { balance: parseFloat(formData.balance) || 0 }],
      household,
      mortgage
    );
    await createSnapshot(householdId, totals);

    setIsAdding(false);
  };

  const handleUpdateInvestment = async (investmentId, formData) => {
    await db.transact(
      db.tx.investments[investmentId].update({
        ...formData,
        balance: parseFloat(formData.balance) || 0,
        updatedAt: Date.now(),
      })
    );

    // Create snapshot after balance change
    const updatedInvestments = allInvestments.map((i) =>
      i.id === investmentId ? { ...i, balance: parseFloat(formData.balance) || 0 } : i
    );
    const totals = calculateTotals(accounts, updatedInvestments, household, mortgage);
    await createSnapshot(householdId, totals);

    setEditingId(null);
  };

  const handleDeleteInvestment = async (investmentId) => {
    await db.transact(db.tx.investments[investmentId].delete());

    // Create snapshot after balance change
    const updatedInvestments = allInvestments.filter((i) => i.id !== investmentId);
    const totals = calculateTotals(accounts, updatedInvestments, household, mortgage);
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
          <p className="text-gray-500 dark:text-gray-400">
            Track your 401(k), IRA, and brokerage accounts
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
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
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Investments</p>
        <p className="text-3xl font-display font-bold gradient-text">
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
            {editingId === investment.id ? (
              <InvestmentForm
                investment={investment}
                users={users}
                onSubmit={(data) => handleUpdateInvestment(investment.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <Card className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {investment.institution}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {investment.accountType} • {users.find((u) => u.id === investment.ownerId)?.displayName || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(investment.balance, currency)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(investment.id)}
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
            )}
          </motion.div>
        ))}

        {investments.length === 0 && !isAdding && (
          <Card className="text-center py-8">
            <p className="text-gray-500">No investments found</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            >
              Add your first investment
            </button>
          </Card>
        )}

        {isAdding && (
          <InvestmentForm
            users={users}
            onSubmit={handleAddInvestment}
            onCancel={() => setIsAdding(false)}
          />
        )}
      </div>
    </div>
  );
}

function InvestmentForm({ investment, users, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    institution: investment?.institution || '',
    accountType: investment?.accountType || '401k',
    balance: investment?.balance?.toString() || '',
    ownerId: investment?.ownerId || users[0]?.id || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Institution
            </label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="e.g., Fidelity, Vanguard"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="401k" className="bg-white dark:bg-navy-800">401(k)</option>
              <option value="IRA" className="bg-white dark:bg-navy-800">Traditional IRA</option>
              <option value="Roth IRA" className="bg-white dark:bg-navy-800">Roth IRA</option>
              <option value="Taxable" className="bg-white dark:bg-navy-800">Taxable Brokerage</option>
              <option value="HSA" className="bg-white dark:bg-navy-800">HSA</option>
              <option value="529" className="bg-white dark:bg-navy-800">529 Plan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              placeholder="0.00"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Owner
            </label>
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-navy-800">
                  {u.displayName || u.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {investment ? 'Update' : 'Add'} Investment
          </button>
        </div>
      </form>
    </Card>
  );
}

export default Investments;
