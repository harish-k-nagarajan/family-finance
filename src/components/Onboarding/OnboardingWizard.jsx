import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { id } from '@instantdb/react';
import { db } from '../../lib/instant';
import { currencies } from '../../utils/currencies';
import SearchableSelect from '../common/SearchableSelect';
import Button from '../common/Button';


const steps = [
  { id: 'welcome', title: 'Welcome to Family Finance' },
  { id: 'name', title: 'What should we call you?' },
  { id: 'currency', title: 'Choose your currency' },
  { id: 'done', title: "You're all set!" },
];

function OnboardingWizard({ user }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step = steps[currentStep];

  const canProceed = () => {
    if (step.id === 'name') return displayName.trim().length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step.id === 'currency') {
      // Final data step — create household and update user
      setIsSubmitting(true);
      const householdId = id();
      const now = Date.now();
      await db.transact([
        db.tx.households[householdId].update({
          currency,
          appreciationRate: 3,
          homePurchasePrice: 0,
          homePurchaseDate: null,
          mortgageEnabled: false,
          createdAt: now,
          updatedAt: now,
        }),
        db.tx.users[user.id].update({
          householdId,
          displayName: displayName.trim(),
          updatedAt: now,
        }),
      ]);
      setIsSubmitting(false);
      setCurrentStep(currentStep + 1);
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-colors ${i === currentStep
                  ? 'bg-teal-500'
                  : i < currentStep
                    ? 'bg-teal-500/40'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step.id === 'welcome' && <WelcomeStep />}
              {step.id === 'name' && (
                <NameStep value={displayName} onChange={setDisplayName} />
              )}
              {step.id === 'currency' && (
                <CurrencyStep value={currency} onChange={setCurrency} />
              )}
              {step.id === 'done' && <DoneStep />}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 && step.id !== 'done' ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step.id === 'done' ? (
              <Button
                onClick={() => window.location.reload()}
                variant="hero"
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                isLoading={isSubmitting}
                variant="hero"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
        <span className="text-white font-bold text-2xl">F</span>
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
        Welcome to Family Finance
      </h2>
      <p className="text-gray-700 dark:text-gray-400">
        Track your household finances in one place. Let's get you set up.
      </p>
    </div>
  );
}

function NameStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
        What should we call you?
      </h2>
      <p className="text-gray-700 dark:text-gray-400 text-sm mb-6">
        This is how you'll appear in your household
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Harish"
        autoFocus
        className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:shadow-lg focus:shadow-teal-500/20 dark:focus:shadow-teal-400/30 text-lg"
      />
    </div>
  );
}

function CurrencyStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">
        Choose your currency
      </h2>
      <p className="text-gray-700 dark:text-gray-400 text-sm mb-6">
        This will be used across all your accounts
      </p>

      <SearchableSelect
        options={currencies}
        value={value}
        onChange={onChange}
        valueKey="code"
        searchFields={['name', 'code', 'symbol']}
        placeholder="Select currency..."
        renderOption={(option) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-500 dark:text-gray-400 w-8 text-right">{option.symbol}</span>
            <span className="font-medium">{option.code}</span>
            <span className="text-gray-400 dark:text-gray-500">-</span>
            <span className="truncate">{option.name}</span>
          </div>
        )}
      />
    </div>
  );
}

function DoneStep() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
        You're all set!
      </h2>
      <p className="text-gray-700 dark:text-gray-400">
        Start adding your accounts to track your net worth.
      </p>
    </div>
  );
}

export default OnboardingWizard;
