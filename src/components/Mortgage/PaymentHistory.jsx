import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../lib/instant';
import { createSnapshot, calculateTotals } from '../../utils/snapshots';
import { useToast } from '../common/Toast';
import Card from '../common/Card';
import ConfirmationModal from '../common/ConfirmationModal';
import AddPaymentModal from './AddPaymentModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Trash2, Plus, Calendar, DollarSign } from 'lucide-react';

function PaymentHistory({ loan, payments, currency, householdId }) {
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate summary stats
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipal = payments.reduce((sum, p) => sum + p.principalPaid, 0);
  const totalInterest = payments.reduce((sum, p) => sum + p.interestPaid, 0);

  const createSnapshotAfterUpdate = async () => {
    try {
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

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    setIsDeleting(true);

    try {
      // Delete payment and restore balance
      await db.transact([
        db.tx.payments[paymentToDelete.id].delete(),
        db.tx.mortgage[loan.id].update({
          currentBalance: loan.currentBalance + paymentToDelete.principalPaid,
          updatedAt: Date.now(),
        }),
      ]);

      showToast('Payment deleted successfully', 'success');
      setPaymentToDelete(null);

      // Background task (non-critical)
      await createSnapshotAfterUpdate();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      showToast('Failed to delete payment. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white">
              Payment History
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Payment
            </button>
          </div>

          {/* Summary Stats */}
          {payments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1">Total Paid</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(totalPaid, currency)}
                </p>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1">Principal Paid</p>
                <p className="text-2xl font-semibold text-teal-600 dark:text-teal-400">
                  {formatCurrency(totalPrincipal, currency)}
                </p>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-400 mb-1">Interest Paid</p>
                <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(totalInterest, currency)}
                </p>
              </div>
            </div>
          )}

          {/* Payment List */}
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Amount and Date */}
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payment.amount, currency)}
                        </p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            payment.paymentType === 'extra'
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {payment.paymentType === 'extra' ? 'Extra Payment' : 'Regular Payment'}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400 mb-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(payment.date)}
                      </div>

                      {/* Principal and Interest Breakdown */}
                      {payment.paymentType === 'regular' && (
                        <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-400">
                          <div>
                            Principal: <span className="font-medium text-teal-600 dark:text-teal-400">{formatCurrency(payment.principalPaid, currency)}</span>
                          </div>
                          <div>
                            Interest: <span className="font-medium text-purple-600 dark:text-purple-400">{formatCurrency(payment.interestPaid, currency)}</span>
                          </div>
                        </div>
                      )}

                      {payment.paymentType === 'extra' && (
                        <div className="text-sm text-gray-700 dark:text-gray-400">
                          100% to principal: <span className="font-medium text-teal-600 dark:text-teal-400">{formatCurrency(payment.principalPaid, currency)}</span>
                        </div>
                      )}

                      {/* Note */}
                      {payment.note && (
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-400 italic">
                          "{payment.note}"
                        </div>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => setPaymentToDelete(payment)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Delete payment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                <DollarSign className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-700 dark:text-gray-400 mb-4">No payments recorded yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors font-medium"
              >
                Add your first payment
              </button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal
          loan={loan}
          householdId={householdId}
          currency={currency}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        isLoading={isDeleting}
        title="Delete Payment?"
        description={
          paymentToDelete
            ? `Are you sure you want to delete this ${formatCurrency(paymentToDelete.amount, currency)} payment from ${formatDate(paymentToDelete.date)}? The loan balance will be adjusted accordingly.`
            : ''
        }
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700 shadow-red-500/20"
      />
    </>
  );
}

export default PaymentHistory;
