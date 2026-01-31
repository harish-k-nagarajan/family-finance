import { useState } from 'react';
import { motion } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import {
  calculateMonthlyPayment,
  calculateWithExtraPayments,
  calculateHomeValue,
  calculateEquity,
} from '../utils/mortgageCalculations';
import { AmortizationChart, PaymentCompositionChart } from '../components/Charts/MortgageCharts';

function Mortgage() {
  const { user } = db.useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading } = db.useQuery(
    user
      ? {
        households: {},
        mortgage: {},
        extraPayments: {},
      }
      : null
  );

  const household = data?.households?.[0];
  const mortgage = data?.mortgage?.[0];
  const extraPayments = data?.extraPayments || [];

  const currency = household?.currency || 'USD';
  const householdId = household?.id;

  // Calculate home value and equity
  let homeValue = 0;
  if (household?.homePurchasePrice && household?.homePurchaseDate) {
    homeValue = calculateHomeValue(
      household.homePurchasePrice,
      household.homePurchaseDate,
      household.appreciationRate || 0
    );
  }

  const equity = mortgage ? calculateEquity(homeValue, mortgage.currentBalance) : homeValue;

  // Calculate payoff projections
  let projections = null;
  if (mortgage) {
    projections = calculateWithExtraPayments(
      mortgage.originalAmount,
      mortgage.interestRate,
      mortgage.termYears,
      mortgage.startDate,
      extraPayments
    );
  }

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
            Mortgage
          </h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">
            Track your home loan and equity
          </p>
        </div>
        {mortgage && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Edit Details
          </button>
        )}
      </div>

      {/* Home Value & Equity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mb-1">Home Value</p>
          <p className="text-2xl font-display font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(homeValue, currency)}
          </p>
          {household?.appreciationRate && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {formatPercentage(household.appreciationRate)} annual appreciation
            </p>
          )}
        </Card>
        <Card>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mb-1">Mortgage Balance</p>
          <p className="text-2xl font-display font-bold text-red-600 dark:text-red-400">
            {formatCurrency(mortgage?.currentBalance || 0, currency)}
          </p>
          {mortgage && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {formatPercentage(mortgage.interestRate)} interest rate
            </p>
          )}
        </Card>
        <Card>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mb-1">Home Equity</p>
          <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-400">
            {formatCurrency(equity, currency)}
          </p>
          {homeValue > 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {formatPercentage((equity / homeValue) * 100, 1)} of home value
            </p>
          )}
        </Card>
      </div>

      {mortgage ? (
        <>
          {/* Loan Details */}
          <Card>
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
              Loan Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Lender</p>
                <p className="text-gray-900 dark:text-white font-medium">{mortgage.lender}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Original Amount</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(mortgage.originalAmount, currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Term</p>
                <p className="text-gray-900 dark:text-white font-medium">{mortgage.termYears} years</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Start Date</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(mortgage.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Monthly Payment</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(mortgage.monthlyPayment, currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Interest Rate</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatPercentage(mortgage.interestRate)}
                </p>
              </div>
            </div>
          </Card>

          {/* Payoff Analysis */}
          {projections && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                  <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">
                    Amortization Schedule
                  </h2>
                  <AmortizationChart data={projections.schedule} currency={currency} />
                </Card>

                <Card className="h-full">
                  <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-6">
                    Annual Payment Breakdown
                  </h2>
                  <PaymentCompositionChart data={projections.schedule} currency={currency} />
                </Card>
              </div>

              <Card>
                <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
                  Payoff Projections
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Payoff Date</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(projections.payoffDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Total Interest</p>
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(projections.totalInterest, currency)}
                    </p>
                  </div>
                  {projections.interestSaved > 0 && (
                    <>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Interest Saved</p>
                        <p className="text-teal-600 dark:text-teal-400 font-medium">
                          {formatCurrency(projections.interestSaved, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm">Months Saved</p>
                        <p className="text-teal-600 dark:text-teal-400 font-medium">
                          {projections.monthsSaved} months
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No mortgage information added yet</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Add Mortgage Details
          </button>
        </Card>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <MortgageForm
          mortgage={mortgage}
          household={household}
          householdId={householdId}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}

function MortgageForm({ mortgage, household, householdId, onClose }) {
  const [formData, setFormData] = useState({
    lender: mortgage?.lender || '',
    originalAmount: mortgage?.originalAmount?.toString() || '',
    currentBalance: mortgage?.currentBalance?.toString() || '',
    interestRate: mortgage?.interestRate?.toString() || '',
    termYears: mortgage?.termYears?.toString() || '30',
    startDate: mortgage?.startDate
      ? new Date(mortgage.startDate).toISOString().split('T')[0]
      : '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = Date.now();
    const startDate = new Date(formData.startDate).getTime();
    const monthlyPayment = calculateMonthlyPayment(
      parseFloat(formData.originalAmount),
      parseFloat(formData.interestRate),
      parseInt(formData.termYears)
    );

    const mortgageData = {
      householdId,
      lender: formData.lender,
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      termYears: parseInt(formData.termYears),
      startDate,
      monthlyPayment,
      updatedAt: now,
    };

    if (mortgage) {
      await db.transact(db.tx.mortgage[mortgage.id].update(mortgageData));
    } else {
      await db.transact(
        db.tx.mortgage[id()].update({
          ...mortgageData,
          createdAt: now,
        })
      );
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="glass-card rounded-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-6">
          {mortgage ? 'Edit' : 'Add'} Mortgage Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Lender
            </label>
            <input
              type="text"
              value={formData.lender}
              onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
              placeholder="e.g., Wells Fargo, Chase"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Original Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.originalAmount}
                onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Current Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Term (Years)
              </label>
              <select
                value={formData.termYears}
                onChange={(e) => setFormData({ ...formData, termYears: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="15" className="bg-white dark:bg-navy-800">15 years</option>
                <option value="20" className="bg-white dark:bg-navy-800">20 years</option>
                <option value="30" className="bg-white dark:bg-navy-800">30 years</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default Mortgage;
