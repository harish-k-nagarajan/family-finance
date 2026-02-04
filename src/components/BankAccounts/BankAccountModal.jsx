import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../../lib/instant';
import { createSnapshot, calculateTotals } from '../../utils/snapshots';
import { useToast } from '../common/Toast';
import { getInstitutionLogoUrl } from '../../utils/logoFetcher';
import Button from '../common/Button';

function BankAccountModal({ account, users, householdId, onClose }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    institution: account?.institution || '',
    accountType: account?.accountType || 'checking',
    balance: account?.balance?.toString() || '',
    ownerId: account?.ownerId || users[0]?.id || '',
    logoUrl: account?.logoUrl || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoFetchedLogoUrl, setAutoFetchedLogoUrl] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.institution?.trim()) {
      newErrors.institution = 'Institution name is required';
    }

    if (!formData.balance || isNaN(parseFloat(formData.balance))) {
      newErrors.balance = 'Valid balance is required';
    }

    if (!formData.ownerId) {
      newErrors.ownerId = 'Owner selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createSnapshotAfterUpdate = async (householdId) => {
    // Re-query to get fresh data after transaction
    const { data } = await db.queryOnce({
      accounts: { $: { where: { householdId } } },
      investments: { $: { where: { householdId } } },
      households: { $: { where: { id: householdId } } },
      mortgage: { $: { where: { householdId, isDeleted: false } } },
    });

    const totals = calculateTotals(
      data.accounts || [],
      data.investments || [],
      data.households?.[0],
      data.mortgage || []
    );

    await createSnapshot(householdId, totals);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const now = Date.now();
      const balanceValue = parseFloat(formData.balance) || 0;

      // If no manual logo but auto-fetched logo exists, convert URL to base64
      let logoToSave = formData.logoUrl;
      if (!logoToSave && autoFetchedLogoUrl) {
        try {
          const response = await fetch(autoFetchedLogoUrl);
          const blob = await response.blob();
          logoToSave = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Failed to convert auto-fetched logo to base64:', error);
          // Continue without logo if conversion fails
          logoToSave = '';
        }
      }

      if (account) {
        // UPDATE existing account
        await db.transact(
          db.tx.accounts[account.id].update({
            institution: formData.institution.trim(),
            accountType: formData.accountType,
            balance: balanceValue,
            ownerId: formData.ownerId,
            logoUrl: logoToSave || '',
            updatedAt: now,
          })
        );
      } else {
        // CREATE new account
        await db.transact(
          db.tx.accounts[id()].update({
            householdId,
            institution: formData.institution.trim(),
            accountType: formData.accountType,
            balance: balanceValue,
            ownerId: formData.ownerId,
            logoUrl: logoToSave || '',
            createdAt: now,
            updatedAt: now,
          })
        );
      }

      // Show success toast immediately (account creation succeeded)
      showToast(`Account ${account ? 'updated' : 'added'} successfully`, 'success');

      // Close modal
      onClose();

      // Create snapshot in background (don't block on errors)
      try {
        await createSnapshotAfterUpdate(householdId);
      } catch (snapshotError) {
        console.error('Failed to create snapshot (non-critical):', snapshotError);
        // Don't show error to user - account creation was successful
      }
    } catch (error) {
      console.error('Failed to save account:', error);
      showToast(`Failed to ${account ? 'update' : 'add'} account. Please try again.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 500KB)
      if (file.size > 500 * 1024) {
        showToast('Image size should be less than 500KB', 'error');
        e.target.value = '';
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time logo fetching with debounce
  useEffect(() => {
    // Don't fetch if institution empty or manual logo already uploaded
    if (!formData.institution.trim() || formData.logoUrl) {
      setAutoFetchedLogoUrl('');
      return;
    }

    // Debounce: Wait 300ms after user stops typing
    const timer = setTimeout(() => {
      const logoUrl = getInstitutionLogoUrl(formData.institution);
      setAutoFetchedLogoUrl(logoUrl || '');
    }, 300);

    // Cleanup: Cancel timer if user keeps typing
    return () => clearTimeout(timer);
  }, [formData.institution, formData.logoUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-radial from-black/60 via-black/50 to-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card rounded-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-6">
          {account ? 'Edit' : 'Add'} Bank Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Institution
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => {
                  setFormData({ ...formData, institution: e.target.value });
                  if (errors.institution) setErrors({ ...errors, institution: '' });
                }}
                placeholder="e.g., Chase, Bank of America"
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border ${
                  errors.institution
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-white/10'
                } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              {errors.institution && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.institution}</p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Account Type
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="checking" className="bg-white dark:bg-navy-800">
                  Checking
                </option>
                <option value="savings" className="bg-white dark:bg-navy-800">
                  Savings
                </option>
                <option value="credit" className="bg-white dark:bg-navy-800">
                  Credit Card
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => {
                  setFormData({ ...formData, balance: e.target.value });
                  if (errors.balance) setErrors({ ...errors, balance: '' });
                }}
                placeholder="0.00"
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border ${
                  errors.balance
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-white/10'
                } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 disabled:opacity-60 disabled:cursor-not-allowed`}
              />
              {errors.balance && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.balance}</p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Owner
              </label>
              <select
                value={formData.ownerId}
                onChange={(e) => {
                  setFormData({ ...formData, ownerId: e.target.value });
                  if (errors.ownerId) setErrors({ ...errors, ownerId: '' });
                }}
                disabled={isLoading}
                className={`w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border ${
                  errors.ownerId
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-white/10'
                } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-navy-800">
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>
              {errors.ownerId && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.ownerId}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Bank Logo (optional)
              </label>
              <div className="flex items-center gap-4">
                {/* Show logo preview: Manual upload takes priority, then auto-fetched, then nothing */}
                {(formData.logoUrl || autoFetchedLogoUrl) && (
                  <div className="relative">
                    <img
                      src={formData.logoUrl || autoFetchedLogoUrl}
                      alt="Logo preview"
                      className="w-16 h-16 rounded-lg object-contain bg-white dark:bg-navy-800 p-2 border border-gray-200 dark:border-white/10"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        disabled={isLoading}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Remove logo"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    {!formData.logoUrl && autoFetchedLogoUrl && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Auto-fetched from logo.dev
                      </p>
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isLoading}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 dark:file:bg-teal-500/10 file:text-teal-600 dark:file:text-teal-400 hover:file:bg-teal-100 dark:hover:file:bg-teal-500/20 file:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PNG, JPG, or SVG. Max 500KB. {autoFetchedLogoUrl && !formData.logoUrl && 'Or use auto-fetched logo.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              variant="hero"
              className="min-w-[120px]"
            >
              {account ? 'Update Account' : 'Add Account'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default BankAccountModal;
