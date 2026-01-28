import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    households: i.entity({
      currency: i.string(),
      appreciationRate: i.number(),
      homePurchasePrice: i.number(),
      homePurchaseDate: i.number(), // Unix timestamp
      mortgageEnabled: i.boolean(), // Show/hide mortgage section
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    users: i.entity({
      email: i.string().unique(),
      displayName: i.string(),
      householdId: i.string().indexed(),
      theme: i.string(), // 'dark' or 'light'
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    accounts: i.entity({
      householdId: i.string().indexed(),
      ownerId: i.string().indexed(),
      institution: i.string(),
      accountType: i.string(), // 'checking', 'savings', 'credit'
      balance: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    investments: i.entity({
      householdId: i.string().indexed(),
      ownerId: i.string().indexed(),
      institution: i.string(),
      accountType: i.string(), // '401k', 'IRA', 'Roth IRA', 'Taxable'
      balance: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    holdings: i.entity({
      investmentId: i.string().indexed(),
      symbol: i.string(),
      shares: i.number(),
      costBasis: i.number(),
      currentPrice: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    mortgage: i.entity({
      householdId: i.string().indexed(),
      lender: i.string(),
      originalAmount: i.number(),
      currentBalance: i.number(),
      interestRate: i.number(), // Stored as percentage (e.g., 3.5 for 3.5%)
      termYears: i.number(),
      startDate: i.number(), // Unix timestamp
      monthlyPayment: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    extraPayments: i.entity({
      mortgageId: i.string().indexed(),
      amount: i.number(),
      frequency: i.string(), // 'monthly' or 'annual'
      startDate: i.number(),
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    snapshots: i.entity({
      householdId: i.string().indexed(),
      date: i.number(), // Unix timestamp
      totalBankBalance: i.number(),
      totalInvestments: i.number(),
      homeValue: i.number(),
      mortgageBalance: i.number(),
      netWorth: i.number(),
      createdAt: i.number(),
    }),
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export { schema };
export default schema;
