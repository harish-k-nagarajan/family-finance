import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import SkeletonLoader from '../components/common/SkeletonLoader';
import Button from '../components/common/Button';
import LoanTabs from '../components/common/LoanTabs';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import {
  calculateMonthlyPayment,
  calculateWithExtraPayments,
  calculateEquity,
  calculateLoanAssetValue,
  calculateTimeRemaining,
} from '../utils/mortgageCalculations';
import { AmortizationChart, PaymentCompositionChart } from '../components/Charts/MortgageCharts';
import ConfirmationModal from '../components/common/ConfirmationModal';
import PaymentHistory from '../components/Mortgage/PaymentHistory';
import { getInstitutionLogoUrl } from '../utils/logoFetcher';
import { useToast } from '../components/common/Toast';
import { Home, Car, GraduationCap, CreditCard, FileText, MoreHorizontal, Edit2, XCircle, Archive, History } from 'lucide-react';

const getLoanTypeIcon = (loanType) => {
  const iconProps = { className: "w-5 h-5 text-white", strokeWidth: 2 };
  switch (loanType?.toLowerCase()) {
    case 'home':
      return <Home {...iconProps} />;
    case 'car':
    case 'auto':
      return <Car {...iconProps} />;
    case 'student':
      return <GraduationCap {...iconProps} />;
    case 'personal':
      return <CreditCard {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

function Mortgage() {
  const { user } = db.useAuth();
  const [selectedLoanId, setSelectedLoanId] = useState('combined');
  const [editingLoanId, setEditingLoanId] = useState(null); // null = closed, 'new' = adding, loanId = editing
  const [loanToDelete, setLoanToDelete] = useState(null); // Stores loan to delete
  const [loanToClose, setLoanToClose] = useState(null); // Stores loan to close/mark as paid off
  const [showClosedLoans, setShowClosedLoans] = useState(false); // Toggle closed loans history modal
  const [showOverflowMenu, setShowOverflowMenu] = useState(false); // Toggle overflow menu

  const { data, isLoading } = db.useQuery(
    user
      ? {
        households: {},
        mortgage: {
          $: { where: { householdId: user.householdId, isDeleted: false } }
        },
        extraPayments: {},
        payments: {},
      }
      : null
  );

  const household = data?.households?.[0];
  const loans = data?.mortgage || [];
  const allExtraPayments = data?.extraPayments || [];
  const allPayments = data?.payments || [];

  const currency = household?.currency || 'USD';
  const householdId = household?.id;

  // Backward compatibility migration: Add loanName/loanType to existing loans
  useEffect(() => {
    const migrateExistingLoans = async () => {
      const needsMigration = loans.filter(l => !l.loanName);
      if (needsMigration.length > 0) {
        for (const loan of needsMigration) {
          await db.transact(
            db.tx.mortgage[loan.id].update({
              loanName: 'Home Mortgage',
              loanType: 'home',
              isDeleted: false,
            })
          );
        }
      }

      // Migrate existing home loans to use purchase fields
      if (household && loans.length > 0) {
        const homeLoansNeedingMigration = loans.filter(
          l => l.loanType === 'home' && !l.purchasePrice && household.homePurchasePrice
        );

        if (homeLoansNeedingMigration.length > 0) {
          const updates = homeLoansNeedingMigration.map(loan =>
            db.tx.mortgage[loan.id].update({
              purchasePrice: household.homePurchasePrice,
              purchaseDate: household.homePurchaseDate,
              appreciationRate: household.appreciationRate,
              updatedAt: Date.now()
            })
          );
          await db.transact(updates);
        }
      }
    };
    if (loans.length > 0) migrateExistingLoans();
  }, [loans, household]);

  // Auto-select first loan if "combined" is selected but only one loan exists
  useEffect(() => {
    if (loans.length === 1 && selectedLoanId === 'combined') {
      setSelectedLoanId(loans[0].id);
    }
  }, [loans, selectedLoanId]);

  // Handle loan deletion
  const handleDeleteLoan = async () => {
    if (!loanToDelete) return;

    const loanId = loanToDelete.id;
    setLoanToDelete(null); // Close modal immediately

    try {
      await db.transact(
        db.tx.mortgage[loanId].update({
          isDeleted: true,
          updatedAt: Date.now(),
        })
      );

      // Redirect to combined view after deletion
      setSelectedLoanId('combined');
    } catch (error) {
      console.error('Failed to delete loan:', error);
      alert('Failed to delete loan. Please try again.');
    }
  };

  // Loan selection logic
  const displayedLoan = selectedLoanId === 'combined'
    ? null
    : loans.find(l => l.id === selectedLoanId);

  const extraPayments = displayedLoan
    ? allExtraPayments.filter(ep => ep.mortgageId === displayedLoan.id)
    : [];

  const payments = displayedLoan
    ? allPayments.filter(p => p.mortgageId === displayedLoan.id).sort((a, b) => b.date - a.date)
    : [];

  // Combined view metrics
  const combinedMetrics = selectedLoanId === 'combined' && loans.length > 0 ? {
    totalBalance: loans.reduce((sum, l) => sum + (l.currentBalance || 0), 0),
    totalOriginal: loans.reduce((sum, l) => sum + (l.originalAmount || 0), 0),
    weightedRate: loans.reduce((sum, l) => sum + ((l.interestRate || 0) * (l.currentBalance || 0)), 0)
      / Math.max(loans.reduce((sum, l) => sum + (l.currentBalance || 0), 0), 1),
  } : null;

  // Calculate total home value from all home loans
  let totalHomeValue = 0;
  const homeLoans = loans.filter(l => l.loanType === 'home');
  homeLoans.forEach(loan => {
    totalHomeValue += calculateLoanAssetValue(loan, household);
  });

  const totalHomeLoanBalance = homeLoans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
  const homeEquity = calculateEquity(totalHomeValue, totalHomeLoanBalance);

  // Calculate payoff projections for displayed loan
  let projections = null;
  let timeRemaining = null;
  if (displayedLoan) {
    projections = calculateWithExtraPayments(
      displayedLoan.originalAmount,
      displayedLoan.interestRate,
      displayedLoan.termYears,
      displayedLoan.startDate,
      extraPayments
    );

    // Calculate time remaining until payoff
    timeRemaining = calculateTimeRemaining(
      displayedLoan.currentBalance,
      displayedLoan.interestRate,
      displayedLoan.monthlyPayment,
      extraPayments
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 laptop:space-y-8">
        <SkeletonLoader variant="title" />
        <SkeletonLoader variant="card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 laptop:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Loans & Mortgages
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-700 dark:text-gray-400">
              Track all your debt obligations
            </p>
            {displayedLoan && (
              <>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    {(() => {
                      const iconProps = { className: "w-3 h-3 text-white", strokeWidth: 2 };
                      switch (displayedLoan.loanType?.toLowerCase()) {
                        case 'home':
                          return <Home {...iconProps} />;
                        case 'car':
                        case 'auto':
                          return <Car {...iconProps} />;
                        case 'student':
                          return <GraduationCap {...iconProps} />;
                        case 'personal':
                          return <CreditCard {...iconProps} />;
                        default:
                          return <FileText {...iconProps} />;
                      }
                    })()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {displayedLoan.loanType === 'car' ? 'Auto' : displayedLoan.loanType} Loan
                  </span>
                  <span className="text-gray-400 dark:text-gray-600">·</span>
                  <span className="text-sm text-gray-700 dark:text-gray-400">
                    {displayedLoan.loanName}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setEditingLoanId('new')}
            variant="hero"
            title="Add new loan"
            className="p-2"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
          {loans.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-700 dark:text-gray-400" />
              </button>

              {showOverflowMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowOverflowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 mt-2 w-56 glass-card rounded-lg shadow-lg z-20 overflow-hidden"
                  >
                    {selectedLoanId !== 'combined' && displayedLoan && (
                      <>
                        <button
                          onClick={() => {
                            setEditingLoanId(displayedLoan.id);
                            setShowOverflowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <Edit2 className="w-4 h-4 text-gray-700 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">Edit Loan</span>
                        </button>
                        <button
                          onClick={() => {
                            setLoanToClose(displayedLoan);
                            setShowOverflowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <Archive className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-sm text-gray-900 dark:text-white">Close Loan</span>
                        </button>
                        <div className="border-t border-gray-200 dark:border-white/10" />
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShowClosedLoans(true);
                        setShowOverflowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                    >
                      <History className="w-4 h-4 text-gray-700 dark:text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">View Closed Loans</span>
                    </button>
                    {selectedLoanId !== 'combined' && displayedLoan && (
                      <>
                        <div className="border-t border-gray-200 dark:border-white/10" />
                        <button
                          onClick={() => {
                            setLoanToDelete(displayedLoan);
                            setShowOverflowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
                        >
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-red-600 dark:text-red-400">Delete Permanently</span>
                        </button>
                      </>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loan Tabs */}
      {loans.length > 1 && (
        <LoanTabs
          loans={loans}
          selectedLoanId={selectedLoanId}
          onSelect={setSelectedLoanId}
        />
      )}

      {/* Empty State */}
      {loans.length === 0 ? (
        <Card className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-2">
              No loans added yet
            </h3>
            <p className="text-gray-700 dark:text-gray-400 mb-6">
              Track mortgages, auto loans, student debt, and more in one place
            </p>
          </div>
        </Card>
      ) : selectedLoanId === 'combined' ? (
        /* Combined View */
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Total Loan Balance</p>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                {formatCurrency(combinedMetrics?.totalBalance || 0, currency)}
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                Across {loans.length} {loans.length === 1 ? 'loan' : 'loans'}
              </p>
            </Card>
            <Card>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Total Borrowed</p>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                {formatCurrency(combinedMetrics?.totalOriginal || 0, currency)}
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                Original amount
              </p>
            </Card>
            <Card>
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Avg. Interest Rate</p>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                {formatPercentage(combinedMetrics?.weightedRate || 0)}
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                Weighted by balance
              </p>
            </Card>
          </div>

          {/* Home Equity (if home loans exist) */}
          {homeLoans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Home Value</p>
                <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-400">
                  {formatCurrency(totalHomeValue, currency)}
                </p>
                {household?.appreciationRate && (
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {formatPercentage(household.appreciationRate)} annual appreciation
                  </p>
                )}
              </Card>
              <Card>
                <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Home Loan Balance</p>
                <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalHomeLoanBalance, currency)}
                </p>
                <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                  {homeLoans.length} {homeLoans.length === 1 ? 'loan' : 'loans'}
                </p>
              </Card>
              <Card>
                <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Home Equity</p>
                <p className={`text-2xl font-display font-bold ${homeEquity >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatCurrency(homeEquity, currency)}
                </p>
                {totalHomeValue > 0 && (
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {formatPercentage((homeEquity / totalHomeValue) * 100, 1)} of home value
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* List of all loans */}
          <Card>
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
              All Loans
            </h2>
            <div className="space-y-3">
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  onClick={() => setSelectedLoanId(loan.id)}
                  className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Lender Logo */}
                      <div className="relative">
                        {loan.logoUrl && (
                          <img
                            src={loan.logoUrl}
                            alt={loan.lender}
                            className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-navy-800 p-1.5 border border-gray-200 dark:border-white/10"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.parentElement.querySelector('.fallback-icon');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        )}
                        <div
                          className="fallback-icon w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0"
                          style={{ display: loan.logoUrl ? 'none' : 'flex' }}
                        >
                          {getLoanTypeIcon(loan.loanType)}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{loan.loanName}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-400">{loan.lender}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(loan.currentBalance, currency)}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-400">
                        {formatPercentage(loan.interestRate)} APR
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : displayedLoan ? (
        /* Single Loan View */
        <>
          {/* Summary Cards for Home Loans */}
          {displayedLoan.loanType === 'home' && (() => {
            const loanAssetValue = calculateLoanAssetValue(displayedLoan, household);
            const loanEquity = calculateEquity(loanAssetValue, displayedLoan.currentBalance);
            const equityPercentage = loanAssetValue > 0 ? (loanEquity / loanAssetValue) * 100 : 0;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Loan Balance</p>
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    {formatCurrency(displayedLoan.currentBalance, currency)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {formatPercentage(displayedLoan.interestRate)} interest rate
                  </p>
                </Card>
                <Card>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Home Equity</p>
                  <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-400">
                    {formatPercentage(equityPercentage, 1)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {formatCurrency(loanEquity, currency)} owned
                  </p>
                </Card>
                <Card>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Estimated Payoff</p>
                  <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-400">
                    {timeRemaining?.formattedTime || 'Calculating...'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {timeRemaining ? (() => {
                      const date = new Date(timeRemaining.payoffDate);
                      const month = date.toLocaleString('en-US', { month: 'short' });
                      const year = date.getFullYear();
                      return `${month} ${year}`;
                    })() : 'Calculating...'}
                  </p>
                </Card>
              </div>
            );
          })()}

          {/* Summary Card for Non-Home Loans */}
          {displayedLoan.loanType !== 'home' && (() => {
            const loanAssetValue = ['auto', 'other'].includes(displayedLoan.loanType)
              ? calculateLoanAssetValue(displayedLoan, household)
              : 0;
            const appreciationRate = displayedLoan.appreciationRate ?? household?.appreciationRate;
            const hasAssetValue = loanAssetValue > 0;

            return (
              <div className={`grid grid-cols-1 md:grid-cols-${hasAssetValue ? '3' : '2'} gap-6`}>
                {hasAssetValue && (
                  <Card>
                    <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">
                      {displayedLoan.loanType === 'auto' ? 'Car' : 'Asset'} Value
                    </p>
                    <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-400">
                      {formatCurrency(loanAssetValue, currency)}
                    </p>
                    {appreciationRate != null && (
                      <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                        {formatPercentage(appreciationRate)} {appreciationRate < 0 ? 'depreciation' : 'appreciation'}
                      </p>
                    )}
                  </Card>
                )}
                <Card>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Current Balance</p>
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                    {formatCurrency(displayedLoan.currentBalance, currency)}
                  </p>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {formatPercentage(displayedLoan.interestRate)} interest rate
                  </p>
                </Card>
                <Card>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Time Left</p>
                  <p className="text-2xl font-display font-bold text-teal-600 dark:text-teal-400">
                    {timeRemaining?.formattedTime || 'Calculating...'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-400 text-sm mt-1">
                    {timeRemaining ? (() => {
                      const date = new Date(timeRemaining.payoffDate);
                      const day = date.getDate();
                      const month = date.toLocaleString('en-US', { month: 'short' });
                      const year = date.getFullYear();
                      const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                                     day === 2 || day === 22 ? 'nd' :
                                     day === 3 || day === 23 ? 'rd' : 'th';
                      return `Payoff by ${day}${suffix} ${month} ${year}`;
                    })() : 'Calculating...'}
                  </p>
                </Card>
              </div>
            );
          })()}

          {/* Loan Details */}
          <Card>
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
              Loan Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-700 dark:text-gray-400 text-sm mb-1">Lender</p>
                <div className="flex items-center gap-2">
                  {/* Lender Logo */}
                  <div className="relative">
                    {displayedLoan.logoUrl && (
                      <img
                        src={displayedLoan.logoUrl}
                        alt={displayedLoan.lender}
                        className="w-8 h-8 rounded object-contain bg-white dark:bg-navy-800 p-1 border border-gray-200 dark:border-white/10"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.fallback-icon');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    )}
                    <div
                      className="fallback-icon w-8 h-8 rounded bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0"
                      style={{ display: displayedLoan.logoUrl ? 'none' : 'flex' }}
                    >
                      {getLoanTypeIcon(displayedLoan.loanType)}
                    </div>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium">{displayedLoan.lender}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Original Amount</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(displayedLoan.originalAmount, currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Term</p>
                <p className="text-gray-900 dark:text-white font-medium">{displayedLoan.termYears} years</p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Start Date</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(displayedLoan.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Monthly Payment</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(displayedLoan.monthlyPayment, currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Interest Rate</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatPercentage(displayedLoan.interestRate)}
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
                    <p className="text-gray-700 dark:text-gray-400 dark:text-gray-400 text-sm">Payoff Date</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(projections.payoffDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-400 dark:text-gray-400 text-sm">Total Interest</p>
                    <p className="text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(projections.totalInterest, currency)}
                    </p>
                  </div>
                  {projections.interestSaved > 0 && (
                    <>
                      <div>
                        <p className="text-gray-700 dark:text-gray-400 dark:text-gray-400 text-sm">Interest Saved</p>
                        <p className="text-teal-600 dark:text-teal-400 font-medium">
                          {formatCurrency(projections.interestSaved, currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-700 dark:text-gray-400 dark:text-gray-400 text-sm">Months Saved</p>
                        <p className="text-teal-600 dark:text-teal-400 font-medium">
                          {projections.monthsSaved} months
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Payment History Section */}
              <PaymentHistory
                loan={displayedLoan}
                payments={payments}
                currency={currency}
                householdId={householdId}
              />
            </div>
          )}
        </>
      ) : null}

      {/* Edit Modal */}
      {editingLoanId && (
        <MortgageForm
          loan={editingLoanId === 'new' ? null : loans.find(l => l.id === editingLoanId)}
          householdId={householdId}
          onClose={() => setEditingLoanId(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={handleDeleteLoan}
        isLoading={false}
        title={`Delete "${loanToDelete?.loanName}"?`}
        description="This will permanently delete this loan. This action cannot be undone."
        confirmText="Delete Loan"
      />

      {/* Close Loan Modal */}
      {loanToClose && (
        <CloseLoanModal
          loan={loanToClose}
          currency={currency}
          onClose={() => setLoanToClose(null)}
          onSuccess={() => {
            setLoanToClose(null);
            setSelectedLoanId('combined');
          }}
        />
      )}

      {/* Closed Loans History Modal */}
      {showClosedLoans && (
        <ClosedLoansHistoryModal
          householdId={householdId}
          currency={currency}
          onClose={() => setShowClosedLoans(false)}
        />
      )}
    </div>
  );
}

function MortgageForm({ loan, householdId, onClose }) {
  const { showToast } = useToast();

  // Query household data for default appreciation rate
  const { data: householdData } = db.useQuery({
    households: {
      $: { where: { id: householdId } }
    }
  });
  const household = householdData?.households?.[0];

  const [formData, setFormData] = useState({
    loanName: loan?.loanName || '',
    loanType: loan?.loanType || 'home',
    lender: loan?.lender || '',
    originalAmount: loan?.originalAmount?.toString() || '',
    currentBalance: loan?.currentBalance?.toString() || '',
    interestRate: loan?.interestRate?.toString() || '',
    termYears: loan?.termYears?.toString() || '30',
    startDate: loan?.startDate
      ? new Date(loan.startDate).toISOString().split('T')[0]
      : '',
    logoUrl: loan?.logoUrl || '',
    purchasePrice: loan?.purchasePrice || '',
    purchaseDate: loan?.purchaseDate || null,
    appreciationRate: loan?.appreciationRate ?? null,
  });
  const [autoFetchedLogoUrl, setAutoFetchedLogoUrl] = useState('');

  // Real-time logo fetching with debounce
  useEffect(() => {
    // Don't fetch if lender empty or manual logo already uploaded
    if (!formData.lender.trim() || formData.logoUrl) {
      setAutoFetchedLogoUrl('');
      return;
    }

    // Debounce: Wait 300ms after user stops typing
    const timer = setTimeout(() => {
      const logoUrl = getInstitutionLogoUrl(formData.lender);
      setAutoFetchedLogoUrl(logoUrl || '');
    }, 300);

    // Cleanup: Cancel timer if user keeps typing
    return () => clearTimeout(timer);
  }, [formData.lender, formData.logoUrl]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = Date.now();
    const startDate = new Date(formData.startDate).getTime();
    const monthlyPayment = calculateMonthlyPayment(
      parseFloat(formData.originalAmount),
      parseFloat(formData.interestRate),
      parseInt(formData.termYears)
    );

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

    const loanData = {
      householdId,
      loanName: formData.loanName,
      loanType: formData.loanType,
      lender: formData.lender,
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      termYears: parseInt(formData.termYears),
      startDate,
      monthlyPayment,
      logoUrl: logoToSave || '',
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      purchaseDate: formData.purchaseDate || undefined,
      appreciationRate: formData.appreciationRate !== null ? parseFloat(formData.appreciationRate) : undefined,
      isDeleted: false,
      updatedAt: now,
    };

    if (loan) {
      await db.transact(db.tx.mortgage[loan.id].update(loanData));
    } else {
      await db.transact(
        db.tx.mortgage[id()].update({
          ...loanData,
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
      className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="glass-card rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-6">
          {loan ? 'Edit' : 'Add'} Loan Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Loan Name
                </label>
                <input
                  type="text"
                  value={formData.loanName}
                  onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
                  placeholder="e.g., Primary Home, Honda Civic, Student Loan"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Loan Type
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: 'home', label: 'Home', Icon: Home },
                  { value: 'car', label: 'Auto', Icon: Car },
                  { value: 'student', label: 'Student', Icon: GraduationCap },
                  { value: 'personal', label: 'Personal', Icon: CreditCard },
                  { value: 'other', label: 'Other', Icon: FileText },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, loanType: type.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${formData.loanType === type.value
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-gray-200 dark:border-white/10 hover:border-teal-500/50'
                      }`}
                  >
                    <type.Icon className="w-5 h-5 mx-auto mb-1 text-gray-700 dark:text-gray-300" strokeWidth={2} />
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lender Information Section */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Lender
                </label>
                <input
                  type="text"
                  value={formData.lender}
                  onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                  placeholder="e.g., Wells Fargo, Chase, Sallie Mae"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Lender Logo (optional)
                </label>
                <div className="flex items-start gap-2">
                  {/* Show logo preview: Manual upload takes priority, then auto-fetched, then nothing */}
                  {(formData.logoUrl || autoFetchedLogoUrl) && (
                    <div className="relative flex-shrink-0 mt-0.5">
                      <img
                        src={formData.logoUrl || autoFetchedLogoUrl}
                        alt="Logo preview"
                        className="w-9 h-9 rounded-lg object-contain bg-white dark:bg-navy-800 p-1.5 border border-gray-200 dark:border-white/10"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: '' })}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove logo"
                        >
                          <svg
                            className="w-3 h-3"
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
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full text-sm px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-teal-50 dark:file:bg-teal-500/10 file:text-teal-600 dark:file:text-teal-400 hover:file:bg-teal-100 dark:hover:file:bg-teal-500/20 file:cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {autoFetchedLogoUrl && !formData.logoUrl ? 'Auto-fetched from logo.dev. ' : ''}PNG, JPG, or SVG. Max 500KB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Details Section */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Original Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalAmount}
                  onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Current Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Term (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={formData.termYears}
                  onChange={(e) => setFormData({ ...formData, termYears: e.target.value })}
                  placeholder="30"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
              />
            </div>
          </div>

          {/* Asset Information Section (conditional) */}
          {['home', 'auto', 'other'].includes(formData.loanType) && (
            <div className="border-t border-gray-200 dark:border-white/10 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {formData.loanType === 'home' ? 'Home' : formData.loanType === 'auto' ? 'Car' : 'Asset'} Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: new Date(e.target.value).getTime() })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {formData.loanType === 'auto' ? 'Depreciation' : 'Appreciation'} Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.appreciationRate ?? (formData.loanType === 'auto' ? -15 : household?.appreciationRate || 3)}
                    onChange={(e) => setFormData({ ...formData, appreciationRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30"
                  />
                  {formData.loanType === 'auto' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Negative values indicate depreciation</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
            >
              Save
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Close Loan Modal Component
function CloseLoanModal({ loan, currency, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [closedDate, setClosedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseLoan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const closedAtTimestamp = new Date(closedDate).getTime();

      await db.transact(
        db.tx.mortgage[loan.id].update({
          isDeleted: true,
          closedAt: closedAtTimestamp,
          currentBalance: 0, // Mark balance as 0
          updatedAt: Date.now(),
        })
      );

      showToast(`${loan.loanName} marked as paid off`, 'success');
      onSuccess();
    } catch (error) {
      console.error('Failed to close loan:', error);
      showToast('Failed to close loan. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="glass-card rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-1">
              Close "{loan.loanName}"
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-400">
              Mark this loan as paid off. It will be moved to closed loans history and will still appear in historical charts.
            </p>
          </div>
        </div>

        <form onSubmit={handleCloseLoan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Final Payment Date
            </label>
            <input
              type="date"
              value={closedDate}
              onChange={(e) => setClosedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Date when the final payment was made
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700 dark:text-gray-400">Original Amount</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(loan.originalAmount, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 dark:text-gray-400">Current Balance</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(loan.currentBalance, currency)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Closing...' : 'Close Loan'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Closed Loans History Modal Component
function ClosedLoansHistoryModal({ householdId, currency, onClose }) {
  const { data, isLoading } = db.useQuery({
    mortgage: {
      $: {
        where: {
          householdId,
          isDeleted: true
        }
      }
    }
  });

  const closedLoans = data?.mortgage || [];

  // Calculate duration
  const getDuration = (loan) => {
    if (!loan.closedAt) return 'N/A';
    const durationMs = loan.closedAt - loan.startDate;
    const durationMonths = Math.round(durationMs / (30 * 24 * 60 * 60 * 1000));
    const years = Math.floor(durationMonths / 12);
    const months = durationMonths % 12;

    if (years > 0 && months > 0) {
      return `${years}y ${months}m`;
    } else if (years > 0) {
      return `${years}y`;
    } else {
      return `${months}m`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="glass-card rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white">
              Closed Loans History
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
              {closedLoans.length} {closedLoans.length === 1 ? 'loan' : 'loans'} paid off
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-700 dark:text-gray-400">Loading...</p>
          </div>
        ) : closedLoans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <History className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 dark:text-gray-400">No closed loans yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300">
                    Loan
                  </th>
                  <th className="text-left py-3 px-4 text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300">
                    Original Amount
                  </th>
                  <th className="text-right py-3 px-4 text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300">
                    Interest Rate
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300">
                    Duration
                  </th>
                  <th className="text-center py-3 px-4 text-xs uppercase tracking-wider font-medium text-gray-600 dark:text-gray-300">
                    Closed Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {closedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                          {getLoanTypeIcon(loan.loanType)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {loan.loanName}
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-400">{loan.lender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-400 capitalize">
                        {loan.loanType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(loan.originalAmount, currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-gray-700 dark:text-gray-400">
                        {formatPercentage(loan.interestRate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-700 dark:text-gray-400">
                        {getDuration(loan)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm text-gray-700 dark:text-gray-400">
                        {loan.closedAt ? formatDate(loan.closedAt) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Mortgage;
