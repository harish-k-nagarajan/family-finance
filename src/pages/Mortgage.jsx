import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import SkeletonLoader from '../components/common/SkeletonLoader';
import LoanTabs from '../components/common/LoanTabs';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import {
  calculateMonthlyPayment,
  calculateWithExtraPayments,
  calculateHomeValue,
  calculateEquity,
} from '../utils/mortgageCalculations';
import { AmortizationChart, PaymentCompositionChart } from '../components/Charts/MortgageCharts';
import ConfirmationModal from '../components/common/ConfirmationModal';
import PaymentHistory from '../components/Mortgage/PaymentHistory';
import { getInstitutionLogoUrl } from '../utils/logoFetcher';
import { useToast } from '../components/common/Toast';
import { Home, Car, GraduationCap, CreditCard, FileText } from 'lucide-react';

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
    };
    if (loans.length > 0) migrateExistingLoans();
  }, [loans]);

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

  // Calculate home value and equity
  let homeValue = 0;
  if (household?.homePurchasePrice && household?.homePurchaseDate) {
    homeValue = calculateHomeValue(
      household.homePurchasePrice,
      household.homePurchaseDate,
      household.appreciationRate || 0
    );
  }

  // Calculate equity based on home loans
  const homeLoans = loans.filter(l => l.loanType === 'home');
  const totalHomeLoanBalance = homeLoans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
  const equity = calculateEquity(homeValue, totalHomeLoanBalance);

  // Calculate payoff projections for displayed loan
  let projections = null;
  if (displayedLoan) {
    projections = calculateWithExtraPayments(
      displayedLoan.originalAmount,
      displayedLoan.interestRate,
      displayedLoan.termYears,
      displayedLoan.startDate,
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
            Loans & Mortgages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track all your debt obligations
          </p>
        </div>
        <div className="flex gap-3">
          {selectedLoanId !== 'combined' && displayedLoan && (
            <>
              <button
                onClick={() => setEditingLoanId(displayedLoan.id)}
                className="p-2 rounded-lg hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-100 transition-colors"
                title="Edit loan details"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => setLoanToDelete(displayedLoan)}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Delete loan"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={() => setEditingLoanId('new')}
            className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
            title="Add new loan"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
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
            <p className="text-gray-600 dark:text-gray-400 mb-6">
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
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Loan Balance</p>
              <p className="text-2xl font-display font-bold text-red-600 dark:text-red-400">
                {formatCurrency(combinedMetrics?.totalBalance || 0, currency)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Across {loans.length} {loans.length === 1 ? 'loan' : 'loans'}
              </p>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Borrowed</p>
              <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                {formatCurrency(combinedMetrics?.totalOriginal || 0, currency)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Original amount
              </p>
            </Card>
            <Card>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Avg. Interest Rate</p>
              <p className="text-2xl font-display font-bold text-orange-600 dark:text-orange-400">
                {formatPercentage(combinedMetrics?.weightedRate || 0)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Weighted by balance
              </p>
            </Card>
          </div>

          {/* Home Equity (if home loans exist) */}
          {homeLoans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Home Value</p>
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
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Home Loan Balance</p>
                <p className="text-2xl font-display font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalHomeLoanBalance, currency)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {homeLoans.length} {homeLoans.length === 1 ? 'loan' : 'loans'}
                </p>
              </Card>
              <Card>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Home Equity</p>
                <p className={`text-2xl font-display font-bold ${equity >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(equity, currency)}
                </p>
                {homeValue > 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {formatPercentage((equity / homeValue) * 100, 1)} of home value
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">{loan.lender}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(loan.currentBalance, currency)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
          {displayedLoan.loanType === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Home Value</p>
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
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Loan Balance</p>
                <p className="text-2xl font-display font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(displayedLoan.currentBalance, currency)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {formatPercentage(displayedLoan.interestRate)} interest rate
                </p>
              </Card>
              <Card>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Home Equity</p>
                <p className={`text-2xl font-display font-bold ${equity >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(equity, currency)}
                </p>
                {homeValue > 0 && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                    {formatPercentage((equity / homeValue) * 100, 1)} of home value
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Summary Card for Non-Home Loans */}
          {displayedLoan.loanType !== 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Current Balance</p>
                <p className="text-2xl font-display font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(displayedLoan.currentBalance, currency)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {formatPercentage(displayedLoan.interestRate)} interest rate
                </p>
              </Card>
              <Card>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Original Amount</p>
                <p className="text-2xl font-display font-bold text-gray-900 dark:text-white">
                  {formatCurrency(displayedLoan.originalAmount, currency)}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {formatPercentage((displayedLoan.currentBalance / displayedLoan.originalAmount) * 100, 1)} remaining
                </p>
              </Card>
            </div>
          )}

          {/* Loan Details */}
          <Card>
            <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white mb-4">
              Loan Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Lender</p>
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
                <p className="text-gray-600 dark:text-gray-400 text-sm">Original Amount</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(displayedLoan.originalAmount, currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Term</p>
                <p className="text-gray-900 dark:text-white font-medium">{displayedLoan.termYears} years</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Start Date</p>
                <p className="text-gray-900 dark:text-white font-medium">{formatDate(displayedLoan.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Monthly Payment</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(displayedLoan.monthlyPayment, currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Interest Rate</p>
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

      <ConfirmationModal
        isOpen={!!loanToDelete}
        onClose={() => setLoanToDelete(null)}
        onConfirm={handleDeleteLoan}
        isLoading={false}
        title={`Delete "${loanToDelete?.loanName}"?`}
        description="This will permanently delete this loan. This action cannot be undone."
        confirmText="Delete Loan"
      />
    </div>
  );
}

function MortgageForm({ loan, householdId, onClose }) {
  const { showToast } = useToast();
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
        className="glass-card rounded-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-6">
          {loan ? 'Edit' : 'Add'} Loan Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Loan Name
            </label>
            <input
              type="text"
              value={formData.loanName}
              onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
              placeholder="e.g., Primary Home, Honda Civic, Student Loan"
              required
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Loan Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: 'home', label: 'Home', icon: '🏠' },
                { value: 'car', label: 'Auto', icon: '🚗' },
                { value: 'student', label: 'Student', icon: '🎓' },
                { value: 'personal', label: 'Personal', icon: '💳' },
                { value: 'other', label: 'Other', icon: '📋' },
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
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{type.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Lender
              </label>
              <input
                type="text"
                value={formData.lender}
                onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                placeholder="e.g., Wells Fargo, Chase, Sallie Mae"
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Lender Logo (optional)
              </label>
              <div className="flex items-center gap-2">
                {/* Show logo preview: Manual upload takes priority, then auto-fetched, then nothing */}
                {(formData.logoUrl || autoFetchedLogoUrl) && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={formData.logoUrl || autoFetchedLogoUrl}
                      alt="Logo preview"
                      className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-navy-800 p-1.5 border border-gray-200 dark:border-white/10"
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
                    {autoFetchedLogoUrl && !formData.logoUrl ? 'Auto-fetched. ' : ''}PNG, JPG, or SVG. Max 500KB.
                  </p>
                </div>
              </div>
            </div>
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
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={formData.termYears}
                onChange={(e) => setFormData({ ...formData, termYears: e.target.value })}
                placeholder="e.g., 5, 15, 30"
                required
                className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
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
