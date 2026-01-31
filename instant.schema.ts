import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    households: i.entity({
      name: i.string(), // NEW: Household name
      ownerId: i.string(), // NEW: ID of the user who owns the household
      currency: i.string(),
      country: i.string(), // NEW: Country code (e.g. 'US', 'GB')
      relationshipStatus: i.string(), // NEW: Household-level status (Married, Domestic Partnership, etc.)
      appreciationRate: i.number(),
      homePurchasePrice: i.number(),
      homePurchaseDate: i.number(), // Unix timestamp
      mortgageEnabled: i.boolean(), // Show/hide mortgage section
      debtType: i.string(), // NEW: 'home', 'car', 'student', 'personal', 'other'
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    users: i.entity({
      email: i.string().unique(),
      name: i.string(), // NEW: Full name
      displayName: i.string(),
      // relationshipStatus removed from here
      profilePicture: i.string(), // NEW: Base64 or URL
      householdId: i.string().indexed(),
      theme: i.string(), // 'dark' or 'light'
      isDemo: i.boolean(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    accounts: i.entity({
      householdId: i.string().indexed(),
      ownerId: i.string().indexed(),
      institution: i.string(),
      accountType: i.string(), // 'checking', 'savings', 'credit'
      balance: i.number(),
      isDemo: i.boolean(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    investments: i.entity({
      householdId: i.string().indexed(),
      ownerId: i.string().indexed(),
      institution: i.string(),
      accountType: i.string(), // '401k', 'IRA', 'Roth IRA', 'Taxable'
      balance: i.number(),
      isDemo: i.boolean(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    holdings: i.entity({
      investmentId: i.string().indexed(),
      symbol: i.string(),
      shares: i.number(),
      costBasis: i.number(),
      currentPrice: i.number(),
      isDemo: i.boolean(), // Flag for demo data
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
      isDemo: i.boolean(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    extraPayments: i.entity({
      mortgageId: i.string().indexed(),
      amount: i.number(),
      frequency: i.string(), // 'monthly' or 'annual'
      startDate: i.number(),
      isDemo: i.boolean(), // Flag for demo data
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
      isDemo: i.boolean(), // Flag for demo data
      createdAt: i.number(),
    }),
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export { schema };
export default schema;
