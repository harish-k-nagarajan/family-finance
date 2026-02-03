import { useState } from 'react';
import { motion } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../../lib/instant';
import { createSnapshot, calculateTotals } from '../../utils/snapshots';
import { useToast } from '../common/Toast';
import { calculatePaymentBreakdown } from '../../utils/mortgageCalculations';
import { formatDate } from '../../utils/formatters';

function AddPaymentModal({ loan, householdId, onClose, currency }) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format for date input
    amount: '',
    paymentType: 'regular',
    note: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Payment date is required';
    } else {
      const paymentDate = new Date(formData.date).getTime();
      const loanStartDate = loan.startDate;

      if (paymentDate < loanStartDate) {
        newErrors.date = 'Payment date cannot be before loan start date';
      }
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid payment amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createSnapshotAfterUpdate = async (householdId) => {
    try {
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
    } catch (error) {
      console.error('Failed to create snapshot (non-critical):', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const now = Date.now();
      const paymentAmount = parseFloat(formData.amount);
      const paymentDate = new Date(formData.date).getTime();

      // Calculate payment breakdown
      const breakdown = calculatePaymentBreakdown(
        loan.currentBalance,
        loan.interestRate,
        paymentAmount,
        formData.paymentType
      );

      // Warning if payment exceeds balance
      if (breakdown.principalPaid < paymentAmount - breakdown.interestPaid && formData.paymentType === 'regular') {
        // Payment exceeds balance for regular payment
        const shouldContinue = window.confirm(
          'This payment amount will pay off the remaining balance. Continue?'
        );
        if (!shouldContinue) {
          setIsLoading(false);
          return;
        }
      }

      // Create payment and update balance in single transaction
      await db.transact([
        db.tx.payments[id()].update({
          mortgageId: loan.id,
          date: paymentDate,
          amount: paymentAmount,
          paymentType: formData.paymentType,
          principalPaid: breakdown.principalPaid,
          interestPaid: breakdown.interestPaid,
          note: formData.note.trim() || '',
          createdAt: now,
          updatedAt: now,
        }),
        db.tx.mortgage[loan.id].update({
          currentBalance: Math.max(0, loan.currentBalance - breakdown.principalPaid),
          updatedAt: now,
        }),
      ]);

      showToast('Payment added successfully', 'success');
      onClose();

      // Background task (non-critical)
      await createSnapshotAfterUpdate(householdId);
    } catch (error) {
      console.error('Failed to add payment:', error);
      showToast('Failed to add payment. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
          Add Payment
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({ ...formData, date: e.target.value });
                if (errors.date) setErrors({ ...errors, date: '' });
              }}
              disabled={isLoading}
              className={`w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border ${
                errors.date
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200 dark:border-white/10'
              } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed`}
            />
            {errors.date && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.date}</p>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                placeholder="0.00"
                disabled={isLoading}
                className="w-full pl-16 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
              Payment Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="regular"
                  checked={formData.paymentType === 'regular'}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  disabled={isLoading}
                  className="w-4 h-4 text-teal-500 focus:ring-teal-500 focus:ring-2"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Regular Payment</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="extra"
                  checked={formData.paymentType === 'extra'}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  disabled={isLoading}
                  className="w-4 h-4 text-teal-500 focus:ring-teal-500 focus:ring-2"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Extra Payment</span>
              </label>
            </div>
          </div>

          {/* Note (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Note (Optional)
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note about this payment..."
              disabled={isLoading}
              rows="3"
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add Payment'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AddPaymentModal;
