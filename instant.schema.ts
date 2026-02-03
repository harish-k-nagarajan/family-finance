import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    households: i.entity({
      name: i.string().optional(), // NEW: Household name
      ownerId: i.string().optional(), // NEW: ID of the user who owns the household
      currency: i.string(),
      country: i.string().optional(), // NEW: Country code (e.g. 'US', 'GB')
      relationshipStatus: i.string().optional(), // NEW: Household-level status (Married, Domestic Partnership, etc.)
      appreciationRate: i.number(),
      homePurchasePrice: i.number(),
      homePurchaseDate: i.number(), // Unix timestamp
      mortgageEnabled: i.boolean(), // Show/hide mortgage section
      debtType: i.string().optional(), // NEW: 'home', 'car', 'student', 'personal', 'other'
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    users: i.entity({
      email: i.string().unique(),
      name: i.string().optional(), // NEW: Full name
      displayName: i.string().optional(),
      // relationshipStatus removed from here
      profilePicture: i.string().optional(), // NEW: Base64 or URL
      householdId: i.string().indexed().optional(),
      theme: i.string().optional(), // 'dark' or 'light'
      isDemo: i.boolean().optional(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    accounts: i.entity({
      householdId: i.string().indexed(),
      ownerId: i.string().indexed(),
      institution: i.string(),
      accountType: i.string(), // 'checking', 'savings', 'credit'
      balance: i.number(),
      logoUrl: i.string().optional(), // Optional user-provided logo URL
      isDemo: i.boolean().optional(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    investments: i.entity({
      householdId: i.string().indexed(),
      ownerId: i.string().indexed(),
      institution: i.string(),
      accountType: i.string(), // '401k', 'IRA', 'Roth IRA', 'Taxable'
      balance: i.number(),
      logoUrl: i.string().optional(), // Optional user-provided logo URL
      isDemo: i.boolean().optional(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    holdings: i.entity({
      investmentId: i.string().indexed(),
      symbol: i.string(),
      shares: i.number(),
      costBasis: i.number(),
      currentPrice: i.number(),
      isDemo: i.boolean().optional(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    mortgage: i.entity({
      householdId: i.string().indexed(),
      loanName: i.string().optional(), // User-defined label (e.g., "Primary Home", "Honda Civic")
      loanType: i.string().optional(), // 'home', 'car', 'student', 'personal', 'other'
      lender: i.string(),
      originalAmount: i.number(),
      currentBalance: i.number(),
      interestRate: i.number(), // Stored as percentage (e.g., 3.5 for 3.5%)
      termYears: i.number(),
      startDate: i.number(), // Unix timestamp
      monthlyPayment: i.number(),
      isDeleted: i.boolean().optional(), // Soft delete flag
      isDemo: i.boolean().optional(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    extraPayments: i.entity({
      mortgageId: i.string().indexed(),
      amount: i.number(),
      frequency: i.string(), // 'monthly' or 'annual'
      startDate: i.number(),
      isDemo: i.boolean().optional(), // Flag for demo data
      createdAt: i.number(),
      updatedAt: i.number(),
    }),
    payments: i.entity({
      mortgageId: i.string().indexed(),
      date: i.number(), // Unix timestamp of payment date
      amount: i.number(), // Total payment amount
      paymentType: i.string(), // 'regular' or 'extra'
      principalPaid: i.number(), // Calculated principal portion
      interestPaid: i.number(), // Calculated interest portion (0 for extra)
      note: i.string().optional(), // Optional user note
      isDemo: i.boolean().optional(), // Flag for demo data
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
      isDemo: i.boolean().optional(), // Flag for demo data
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
