import { id } from '@instantdb/react';
import db from '../lib/instant';

/**
 * Create a snapshot of current financial state
 * Called automatically after any balance update
 * @param {string} householdId - Household ID
 * @param {object} data - Current financial data
 * @param {number} data.totalBankBalance - Sum of all bank account balances
 * @param {number} data.totalInvestments - Sum of all investment balances
 * @param {number} data.homeValue - Current calculated home value
 * @param {number} data.mortgageBalance - Current mortgage balance
 */
export async function createSnapshot(householdId, data) {
  const { totalBankBalance, totalInvestments, homeValue, mortgageBalance } = data;
  const netWorth = totalBankBalance + totalInvestments + homeValue - mortgageBalance;

  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  // Check if a snapshot already exists for today
  const { data: existingSnapshots } = await db.queryOnce({
    snapshots: {
      $: {
        where: {
          householdId,
          date: todayTimestamp,
        },
      },
    },
  });

  if (existingSnapshots?.snapshots?.length > 0) {
    // Update existing snapshot
    const existingId = existingSnapshots.snapshots[0].id;
    await db.transact(
      db.tx.snapshots[existingId].update({
        totalBankBalance,
        totalInvestments,
        homeValue,
        mortgageBalance,
        netWorth,
      })
    );
  } else {
    // Create new snapshot
    await db.transact(
      db.tx.snapshots[id()].update({
        householdId,
        date: todayTimestamp,
        totalBankBalance,
        totalInvestments,
        homeValue,
        mortgageBalance,
        netWorth,
        createdAt: now,
      })
    );
  }
}

/**
 * Get snapshots for a household within a date range
 * @param {string} householdId - Household ID
 * @param {number} startDate - Start date as Unix timestamp
 * @param {number} endDate - End date as Unix timestamp (defaults to now)
 * @returns {Array} Array of snapshot objects sorted by date
 */
export async function getSnapshots(householdId, startDate, endDate = Date.now()) {
  const { data } = await db.queryOnce({
    snapshots: {
      $: {
        where: {
          householdId,
        },
      },
    },
  });

  if (!data?.snapshots) return [];

  return data.snapshots
    .filter(s => s.date >= startDate && s.date <= endDate)
    .sort((a, b) => a.date - b.date);
}

/**
 * Calculate current totals for snapshot creation
 * @param {Array} accounts - Bank accounts
 * @param {Array} investments - Investment accounts
 * @param {object} household - Household data with home info
 * @param {Array} loans - Array of loan/mortgage data (supports multiple loans)
 * @returns {object} Totals for snapshot
 */
export function calculateTotals(accounts, investments, household, loans) {
  const totalBankBalance = accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0;
  const totalInvestments = investments?.reduce((sum, i) => sum + (i.balance || 0), 0) || 0;

  let homeValue = 0;
  if (household?.homePurchasePrice && household?.homePurchaseDate) {
    const appreciationRate = household.appreciationRate || 0;
    const yearsOwned = (Date.now() - household.homePurchaseDate) / (365.25 * 24 * 60 * 60 * 1000);
    homeValue = Math.round(household.homePurchasePrice * Math.pow(1 + appreciationRate / 100, yearsOwned));
  }

  // Sum all loan balances (supports multiple loans)
  const mortgageBalance = loans?.reduce((sum, loan) => sum + (loan.currentBalance || 0), 0) || 0;

  return {
    totalBankBalance,
    totalInvestments,
    homeValue,
    mortgageBalance, // Keep field name for backward compatibility with historical snapshots
  };
}

export default createSnapshot;
