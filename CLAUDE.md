# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Family Finance is a web-based personal finance dashboard for tracking shared household finances between two users. It tracks bank accounts, investment portfolios, and mortgage status with real-time sync using InstantDB.

**InstantDB App ID:** Set in `.env` file (see `.env.example` for setup)

## Tech Stack

- **Frontend:** React with Vite
- **Database/Auth:** InstantDB (`@instantdb/react`) - serverless real-time database with magic link auth
- **Styling:** Tailwind CSS with custom dark/light theme
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Routing:** React Router
- **Deployment:** Vercel (frontend only - no backend needed)

## Architecture

### InstantDB (No Backend)
InstantDB handles database, authentication, and real-time sync. No backend server needed.

**Documentation:** https://www.instantdb.com/docs

Configuration files:
- `src/lib/instant.js` - Client configuration with App ID
- `instant.schema.ts` - Schema definition
- `instant.perms.ts` - Permission rules

### Key Data Entities
- **households** - Contains currency, appreciation rate, home purchase info, country, relationship status (1 per app instance)
- **users** - Linked to household with display name, full name, profile picture (max 2 per household)
- **accounts** - Bank accounts with institution, balance, account type, owner, optional logo URL
- **investments** - Brokerage accounts with type (401k, IRA, Taxable), optional logo URL
- **holdings** - Optional individual holdings within investments (stocks, bonds, ETFs) with shares, cost basis, current price
- **mortgage** - Loan details with support for multiple loan types (home, car, student, personal, other)
- **extraPayments** - Planned extra payment scenarios (monthly/annual frequency)
- **payments** - Actual payment history with principal/interest breakdown
- **snapshots** - Auto-saved historical data on any balance change

### Utility Modules
- `src/utils/mortgageCalculations.js` - Amortization math, extra payment projections
- `src/utils/formatters.js` - Date formatting (DD/MM/YYYY or DD/MM with 'short' format), currency, number formatting
- `src/utils/currencies.js` - Currency list with symbols
- `src/utils/logoFetcher.js` - Institution logo URL generation via logo.dev API with domain mapping
- `src/utils/insightsParser.js` - Parse AI insights from Perplexity responses
- `src/utils/demoData.js` - Generate realistic demo data with growth trends
- `src/utils/snapshots.js` - Utilities for creating and calculating snapshot data

## Coding Standards

### Component Structure
- **Functional components with hooks only** - No class components
- One component per file, matching filename (PascalCase)
- Props destructuring in function signature
- Early returns for loading/error states

### State Management
- InstantDB queries via `db.useQuery()` hook - No Redux/Context
- Optimistic updates for instant UI feedback using `db.transact()`
- Store user preferences in InstantDB user settings, NOT localStorage
- Theme preference stored in InstantDB, read before first render to avoid flicker
- **Toast notifications:** `<ToastProvider>` wraps `<App />` in `main.jsx` - use `useToast()` hook to show notifications

### Styling
- **Tailwind utility classes only** - No custom CSS files except `index.css` for base styles
- Use theme colors from `tailwind.config.js` (e.g., `bg-navy-900`, `text-teal-400`)
- **Glassmorphism:** Use `.glass-card` CSS class which automatically adapts to theme
  - Light mode: Translucent white cards with soft shadows over gradient background
  - Dark mode: Translucent dark cards with subtle borders
- Responsive: desktop-first, use `md:` breakpoints for mobile adjustments
- **Accessibility:** All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)

### Data Types
- **Monetary values:** Always stored as numbers (not strings) in database
- **Dates:** Store as Unix timestamps, format as DD/MM/YYYY for display
- **Percentages:** Store as decimals (3.5 for 3.5%, not 0.035)

## InstantDB Patterns

### Multi-Tenancy
Always filter by `householdId` to prevent data leakage:

```javascript
const { data } = db.useQuery({
  accounts: {
    $: { where: { householdId: user.householdId } }
  }
});
```

### Writing Data
Use `db.transact()` with transaction objects:

```javascript
import { id } from '@instantdb/react';

// Create
db.transact(
  db.tx.accounts[id()].update({
    householdId: user.householdId,
    ownerId: user.id,
    institution: 'Chase',
    balance: 5000,
    updatedAt: Date.now()
  })
);

// Update
db.transact(
  db.tx.accounts[accountId].update({ balance: 5500 })
);

// Delete
db.transact(
  db.tx.accounts[accountId].delete()
);
```

### Permissions
- Both household users have **equal access** - no admin role checks needed
- Permission rules enforce 2-user maximum per household
- Users can only read/write data for their own household

### Real-Time Sync
- Changes sync automatically across all open sessions
- Don't show "Synced!" toasts on every update - only on user-initiated actions
- Use optimistic updates for instant UI feedback

### Auto-Snapshot Trigger
Call `createSnapshot()` utility function after any account/investment/mortgage balance update. Snapshots enable historical trend charts.

## API Routes (Vercel Serverless Functions)

### Wealth Radar Endpoint

**File:** `api/wealth-radar.js`

**Purpose:** Generates AI-powered financial insights using Perplexity API

**Request:**
```javascript
POST /api/wealth-radar
{
  household: { currency, country, appreciationRate, ... },
  accounts: [...],
  investments: [...],
  mortgage: [...],
  snapshots: [last 12 months]
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    content: "5 lines of plain text insights",
    citations: [...],
    inferredCountry: "United States",
    generatedAt: 1706140800000
  }
}
```

**Features:**
- Country inference from institutions and currency
- Perplexity Sonar model with web search (past week)
- 30-second timeout
- Error handling for rate limits, auth failures
- Returns plain text (no markdown)

## External API Integrations

### Perplexity AI (Wealth Radar)
- **Purpose:** Generate real-time market insights
- **Model:** Sonar with web search enabled
- **API Key:** Stored in `PERPLEXITY_API_KEY` env var
- **Rate Limiting:** Handled gracefully with user feedback
- **Caching:** 30-day localStorage cache to minimize costs

### logo.dev (Institution Logos)
- **Purpose:** Fetch company logos by domain name
- **API Key:** Stored in `VITE_LOGO_DEV_API_KEY` env var (publishable key)
- **Domain Mapping:** 150+ financial institutions mapped in `logoFetcher.js`
- **Fallback:** Gradient placeholder icon if logo unavailable
- **Format:** PNG, 128px size for consistent display

## Design System

### Theme Colors
**Dark Mode (default):**
- Backgrounds: `#0A0E27` to `#1A1F3A` (deep navy/charcoal)
- Accents: Vibrant teal, purple, electric blue
- Glassmorphic cards: `backdrop-blur(16px) bg-white/8 border border-white/12`
- Text: `#F9FAFB` (off-white) with gray variants for secondary text

**Light Mode:**
- Background: `linear-gradient(135deg, #F0F4FF 0%, #FDF2F8 100%)` (blue-tint to pink-tint gradient for glassmorphism depth)
- Glassmorphic cards: `backdrop-blur(16px) bg-white/60 border border-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]`
- Text: `#1F2937` (dark gray) with lighter variants for secondary text
- Accents: Darker teal/purple variants for better contrast (teal-600, purple-600)

**Theme Implementation:**
- Theme stored in InstantDB user settings (source of truth)
- Cached in localStorage to prevent flicker on page load
- Inline script in `index.html` reads localStorage before React hydrates
- `App.jsx` syncs theme from InstantDB to body class and localStorage
- All components use `dark:` prefix for dark mode styles

### Typography
- **Headers:** Plus Jakarta Sans Bold OR Clash Display (bold, geometric)
- **Body:** Inter Medium
- Avoid generic system fonts to prevent AI-generated aesthetic

### Micro-interactions
- **Page transitions:** 300-400ms ease-out
- **Hover states:** `scale-102` with subtle glow effect
- **Animated number counters:** Use Framer Motion for value updates
- **Skeleton loaders:** Show during data fetches
- **Theme toggle:** 400ms fade transition with icon rotation + ripple effect

### Charts
- Use **gradients** not flat colors (e.g., teal-to-purple gradient for net worth line)
- Smooth entrance animations (fade + slide up)
- Responsive sizing for mobile

## Domain Terminology

- **Owner:** User 1 or User 2 (names set during onboarding, NOT hardcoded as "Harish")
- **Net Worth:** Banks + Investments + Home Value - Mortgage Balance
- **Home Value:** Auto-calculated from purchase price + appreciation rate (NOT manually updated)
- **Snapshot:** Historical data point auto-created on balance changes (NOT user-initiated)
- **Extra Payment:** Mortgage overpayment with "monthly" or "annual" frequency
- **Household:** The shared account between 2 users (limit enforced by InstantDB permissions)
- **Loan Types:** Five supported types - Home (mortgage), Auto (car loan), Student (education loan), Personal (unsecured loan), Other (custom)
- **Loan Name:** User-defined label (e.g., "Primary Home", "Honda Civic", "MBA Loan")
- **Payment Types:** Regular (scheduled P&I split) vs Extra (100% principal)
- **Soft Delete:** Loans can be archived (isDeleted flag) without permanent removal

## Key UI Patterns

### Owner Filtering
App uses tabs throughout: "User1 | User2 | Combined"
- Controlled by `<OwnerTabs>` component
- Filters accounts, investments by owner
- "Combined" shows totals for both users

### Auto-Save
- All changes auto-save with `db.transact()` immediately
- Show subtle toast notification on success: "Account updated"
- No explicit "Save" buttons anywhere in the app

### Navigation
- Collapsible sidebar with icons + labels
- Can collapse to icons-only mode for more screen space
- Active route highlighted with accent color

## File Organization

### Component Placement
- **Feature components:** `src/components/{FeatureName}/` (e.g., `BankAccounts/`, `Mortgage/`, `Investments/`)
- **Shared UI:** `src/components/common/` (e.g., `Sidebar.jsx`, `Toast.jsx`, `AnimatedNumber.jsx`, `ConfirmationModal.jsx`, `SearchableSelect.jsx`, `WealthRadarCard.jsx`, `Button.jsx`, `CountrySelect.jsx`, `Avatar.jsx`, `ToggleSwitch.jsx`)
- **Chart components:** `src/components/Charts/` (e.g., `DashboardTrendChart.jsx`, `SimpleTrendChart.jsx`, `AmortizationChart.jsx`)
- **No component should exceed 300 lines** - Extract sub-components if needed

### Import Order
1. React / external libraries
2. InstantDB hooks/client
3. Local components
4. Utilities/helpers
5. Types (if TypeScript is added later)

### File Naming
- **Components:** PascalCase (e.g., `BankAccounts.jsx`, `OwnerTabs.jsx`)
- **Utils/hooks:** camelCase (e.g., `useAuth.js`, `formatters.js`)
- **Pages:** PascalCase matching route names (e.g., `Home.jsx`, `Banks.jsx`)

## Environment Variables

```
VITE_INSTANT_APP_ID=your-instant-app-id-here
PERPLEXITY_API_KEY=pplx-your-api-key-here
VITE_LOGO_DEV_API_KEY=your-logo-dev-publishable-key
```

> **Security Note:** These API keys must be rotated before public release. Never commit `.env` file to git.

**API Key Sources:**
- InstantDB App ID: [InstantDB Dashboard](https://instantdb.com/dash)
- Perplexity API: [Perplexity Settings](https://www.perplexity.ai/settings/api)
- logo.dev API: [logo.dev Dashboard](https://logo.dev/dashboard)

## Debugging

### InstantDB Explorer
View live data at: `https://instantdb.com/dash?app=YOUR_APP_ID`

Replace `YOUR_APP_ID` with your actual InstantDB App ID from your `.env` file.

### Common Issues
- **Data not syncing:** Check permission rules in `instant.perms.ts` - verify `householdId` filters
- **Charts not updating:** Verify snapshots are being created after balance changes
- **Theme flicker on load:** Ensure theme is read from InstantDB user settings before first render
- **Currency symbol wrong:** Check that `currencies.js` mapping includes the selected currency

## Development Workflow

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
vercel --prod        # Deploy to Vercel
```

## Demo Data System

### Generating Demo Data

```javascript
import { createDemoData } from './utils/demoData';

// Generate 12 months of realistic data
await createDemoData(db, user, householdId);
```

**Generated data:**
- 2-3 bank accounts with realistic balances
- 2-3 investment accounts across different types
- 1 mortgage with payment history
- 12 months of snapshots with upward trending growth
- Partner user named "Sarah" for 2-user demonstration
- All entities tagged with `isDemo: true`

### Cleanup Demo Data

Users can remove all demo data from Settings page:
```javascript
// Deletes all entities where isDemo === true
await db.transact([
  ...demoAccounts.map(a => db.tx.accounts[a.id].delete()),
  ...demoInvestments.map(i => db.tx.investments[i.id].delete()),
  // ... etc
]);
```

## Key Implementation Notes

- **No backend server** - InstantDB is fully serverless
- **Max 2 users per household** - Enforced via InstantDB permission rules
- **International support** - DD/MM/YYYY dates, configurable currency from 24 options
- **Mobile responsive** - Desktop-first with basic mobile support
- **Premium fintech aesthetic** - Glassmorphism + micro-interactions = polished feel

## Reference Documentation

- InstantDB Docs: https://www.instantdb.com/docs
- PRD: See `prd.md` in project root for full feature specifications