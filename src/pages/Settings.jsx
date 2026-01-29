import { useState } from 'react';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { currencies } from '../utils/currencies';

function Settings() {
  const { user } = db.useAuth();

  const { data, isLoading } = db.useQuery(
    user
      ? {
          users: { $: { where: { id: user.id } } },
          households: {},
        }
      : null
  );

  const currentUser = data?.users?.[0];
  const household = data?.households?.[0];

  const handleUpdateUser = async (updates) => {
    if (!currentUser) return;
    await db.transact(
      db.tx.users[currentUser.id].update({
        ...updates,
        updatedAt: Date.now(),
      })
    );
  };

  const handleUpdateHousehold = async (updates) => {
    if (!household) return;
    await db.transact(
      db.tx.households[household.id].update({
        ...updates,
        updatedAt: Date.now(),
      })
    );
  };

  const handleSignOut = async () => {
    await db.auth.signOut();
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
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and household preferences
        </p>
      </div>

      {/* User Settings */}
      <Card>
        <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
          Your Profile
        </h2>
        <UserSettingsForm user={currentUser} onUpdate={handleUpdateUser} />
      </Card>

      {/* Household Settings */}
      {household && (
        <Card>
          <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
            Household
          </h2>
          <HouseholdSettingsForm
            household={household}
            onUpdate={handleUpdateHousehold}
          />
        </Card>
      )}

      {/* Sign Out */}
      <Card>
        <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
          Account
        </h2>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Sign Out
        </button>
      </Card>
    </div>
  );
}

function UserSettingsForm({ user, onUpdate }) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdate({ displayName });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

function HouseholdSettingsForm({ household, onUpdate }) {
  const [formData, setFormData] = useState({
    currency: household?.currency || 'USD',
    appreciationRate: household?.appreciationRate?.toString() || '3',
    homePurchasePrice: household?.homePurchasePrice?.toString() || '',
    homePurchaseDate: household?.homePurchaseDate
      ? new Date(household.homePurchaseDate).toISOString().split('T')[0]
      : '',
    mortgageEnabled: household?.mortgageEnabled || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdate({
      currency: formData.currency,
      appreciationRate: parseFloat(formData.appreciationRate) || 0,
      homePurchasePrice: parseFloat(formData.homePurchasePrice) || 0,
      homePurchaseDate: formData.homePurchaseDate
        ? new Date(formData.homePurchaseDate).getTime()
        : null,
      mortgageEnabled: formData.mortgageEnabled,
    });
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mortgage tracking toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Mortgage tracking</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track your mortgage, home equity, and include it in your net worth
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, mortgageEnabled: !formData.mortgageEnabled })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            formData.mortgageEnabled
              ? 'bg-teal-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              formData.mortgageEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Currency
        </label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code} className="bg-white dark:bg-navy-800 text-gray-900 dark:text-white">
              {c.code} - {c.name} ({c.symbol})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Home Purchase Price
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.homePurchasePrice}
            onChange={(e) => setFormData({ ...formData, homePurchasePrice: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Home Purchase Date
          </label>
          <input
            type="date"
            value={formData.homePurchaseDate}
            onChange={(e) => setFormData({ ...formData, homePurchaseDate: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
          Annual Appreciation Rate (%)
        </label>
        <input
          type="number"
          step="0.1"
          value={formData.appreciationRate}
          onChange={(e) => setFormData({ ...formData, appreciationRate: e.target.value })}
          className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

export default Settings;
