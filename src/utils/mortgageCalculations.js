/**
 * Calculate monthly mortgage payment
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate as percentage (e.g., 3.5 for 3.5%)
 * @param {number} termYears - Loan term in years
 * @returns {number} Monthly payment amount
 */
export function calculateMonthlyPayment(principal, annualRate, termYears) {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment = principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Generate amortization schedule
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} termYears - Loan term in years
 * @param {number} startDate - Start date as Unix timestamp
 * @returns {Array} Array of payment objects with date, payment, principal, interest, balance
 */
export function generateAmortizationSchedule(principal, annualRate, termYears, startDate) {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

  const schedule = [];
  let balance = principal;
  let date = new Date(startDate);

  for (let i = 1; i <= numPayments && balance > 0; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      paymentNumber: i,
      date: date.getTime(),
      payment: monthlyPayment,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });

    date = new Date(date);
    date.setMonth(date.getMonth() + 1);
  }

  return schedule;
}

/**
 * Calculate amortization with extra payments
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} termYears - Loan term in years
 * @param {number} startDate - Start date as Unix timestamp
 * @param {Array} extraPayments - Array of extra payment objects {amount, frequency, startDate}
 * @returns {Object} { schedule, totalInterest, payoffDate, interestSaved, monthsSaved }
 */
export function calculateWithExtraPayments(principal, annualRate, termYears, startDate, extraPayments = []) {
  const monthlyRate = annualRate / 100 / 12;
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);

  // Calculate standard amortization for comparison
  const standardSchedule = generateAmortizationSchedule(principal, annualRate, termYears, startDate);
  const standardTotalInterest = standardSchedule.reduce((sum, p) => sum + p.interest, 0);

  const schedule = [];
  let balance = principal;
  let date = new Date(startDate);
  let paymentNumber = 0;

  while (balance > 0) {
    paymentNumber++;
    const currentDate = date.getTime();

    // Calculate extra payment for this month
    let extraAmount = 0;
    extraPayments.forEach(ep => {
      if (currentDate >= ep.startDate) {
        if (ep.frequency === 'monthly') {
          extraAmount += ep.amount;
        } else if (ep.frequency === 'annual') {
          // Check if this is the anniversary month
          const epStart = new Date(ep.startDate);
          if (date.getMonth() === epStart.getMonth()) {
            extraAmount += ep.amount;
          }
        }
      }
    });

    const interestPayment = balance * monthlyRate;
    const basePrincipalPayment = baseMonthlyPayment - interestPayment;
    const totalPrincipalPayment = Math.min(basePrincipalPayment + extraAmount, balance);
    const actualPayment = interestPayment + totalPrincipalPayment;

    balance = Math.max(0, balance - totalPrincipalPayment);

    schedule.push({
      paymentNumber,
      date: currentDate,
      payment: Math.round(actualPayment * 100) / 100,
      principal: Math.round(totalPrincipalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      extraPayment: Math.round(extraAmount * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });

    date = new Date(date);
    date.setMonth(date.getMonth() + 1);

    // Safety check to prevent infinite loops
    if (paymentNumber > termYears * 12 + 120) break;
  }

  const totalInterest = schedule.reduce((sum, p) => sum + p.interest, 0);
  const interestSaved = standardTotalInterest - totalInterest;
  const monthsSaved = (termYears * 12) - schedule.length;

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    payoffDate: schedule[schedule.length - 1]?.date,
    interestSaved: Math.round(interestSaved * 100) / 100,
    monthsSaved,
  };
}

/**
 * Calculate current mortgage balance at a specific date
 * @param {number} originalAmount - Original loan amount
 * @param {number} annualRate - Annual interest rate as percentage
 * @param {number} termYears - Loan term in years
 * @param {number} startDate - Start date as Unix timestamp
 * @param {number} asOfDate - Date to calculate balance for (Unix timestamp)
 * @returns {number} Remaining balance
 */
export function calculateBalanceAtDate(originalAmount, annualRate, termYears, startDate, asOfDate) {
  const schedule = generateAmortizationSchedule(originalAmount, annualRate, termYears, startDate);

  const targetPayment = schedule.find(p => p.date > asOfDate);
  if (!targetPayment) {
    // Loan is paid off
    return 0;
  }

  const previousPayment = schedule[targetPayment.paymentNumber - 2];
  return previousPayment ? previousPayment.balance : originalAmount;
}

/**
 * Calculate home value with appreciation
 * @param {number} purchasePrice - Original purchase price
 * @param {number} purchaseDate - Purchase date as Unix timestamp
 * @param {number} appreciationRate - Annual appreciation rate as percentage (e.g., 3 for 3%)
 * @param {number} asOfDate - Date to calculate value for (defaults to now)
 * @returns {number} Appreciated home value
 */
export function calculateHomeValue(purchasePrice, purchaseDate, appreciationRate, asOfDate = Date.now()) {
  const yearsOwned = (asOfDate - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
  const appreciationMultiplier = Math.pow(1 + appreciationRate / 100, yearsOwned);
  return Math.round(purchasePrice * appreciationMultiplier);
}

/**
 * Calculate equity in home
 * @param {number} homeValue - Current home value
 * @param {number} mortgageBalance - Current mortgage balance
 * @returns {number} Home equity
 */
export function calculateEquity(homeValue, mortgageBalance) {
  return homeValue - mortgageBalance;
}

/**
 * Calculate interest and principal portions for a payment
 * @param {number} currentBalance - Current loan balance before this payment
 * @param {number} annualRate - Annual interest rate as percentage (e.g., 3.5 for 3.5%)
 * @param {number} paymentAmount - Amount being paid
 * @param {string} paymentType - 'regular' or 'extra'
 * @returns {object} { principalPaid, interestPaid }
 */
export function calculatePaymentBreakdown(currentBalance, annualRate, paymentAmount, paymentType) {
  if (paymentType === 'extra') {
    // Extra payments go 100% to principal
    return {
      principalPaid: Math.min(paymentAmount, currentBalance),
      interestPaid: 0,
    };
  }

  // Regular payment: calculate interest for this month first
  const monthlyRate = annualRate / 100 / 12;
  const interestPaid = currentBalance * monthlyRate;
  const principalPaid = Math.max(0, Math.min(paymentAmount - interestPaid, currentBalance));

  return {
    principalPaid: Math.round(principalPaid * 100) / 100,
    interestPaid: Math.round(interestPaid * 100) / 100,
  };
}
