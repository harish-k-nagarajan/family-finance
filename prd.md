# Family Finance - Product Requirements Document

## Overview
A web-based personal finance dashboard for tracking shared household finances between two users, including bank accounts, investment portfolios, and mortgage status.

**App Name:** Family Finance

## Core Requirements Summary
- **Platform:** Web application (React + InstantDB)
- **Data Entry:** Manual input
- **Authentication:** InstantDB magic link (2 users max per household)
- **Deployment:** Cloud hosted (frontend only - InstantDB handles backend)
- **History:** Track trends over time with charts (auto-snapshot on any change)
- **Currency:** Single currency per household, selected during onboarding

---

## User Experience Decisions

### Information Architecture
```
Household (auto-created on first signup)
├── User 1 (creator) + User 2 (invited)
│   └── Each user: unlimited bank accounts + investments
├── Mortgage (household-level, shared — not per-user)
└── Views: per-person or combined
```

### Users & Permissions
- **Household Creation:** A household is **automatically created** when a new user first signs up. No manual "Create Household" step — the onboarding wizard handles it.
- **View Mode:** Tabs by owner - "User1 | User2 | Combined" filtering throughout app
- **User Names:** Configurable during onboarding (not hardcoded)
- **Permissions:** Equal permissions for both users (no admin role)
- **Invite Flow:** First user can invite a second user to join their household via email
- **Real-time Sync:** Silent sync - changes appear automatically, no notifications

### Visual Design (Premium Fintech Aesthetic)
- **Theme:** Dark + light mode with smooth toggle (400ms fade transition)
- **Dark Theme:** Deep navy/charcoal backgrounds (#0A0E27 to #1A1F3A), vibrant teal/purple/electric blue accents
- **Light Theme:** Soft off-whites (#F8F9FC to #FFFFFF), subtle gray cards (#F3F4F6), same accent colors adjusted for contrast
- **Typography:** Plus Jakarta Sans Bold / Clash Display for headers, Inter Medium for body text
- **Glassmorphism:** Frosted glass cards with backdrop-blur (dark: 8-12% white borders, light: 8-12% dark borders)
- **Micro-interactions:**
  - Page transitions: 300-400ms ease-out
  - Hover states: 1.02x scale with gentle glow
  - Skeleton loaders during data fetches
  - Animated number counters when values update
  - Theme toggle: icon rotation + ripple effect
- **Charts:** Gradients (not flat colors) with smooth entrance animations

### Navigation & Layout
- **Navigation:** Collapsible sidebar (icons + labels, can collapse to icons only)
- **Mobile:** Desktop primary, basic responsive for mobile
- **Login Page:** Minimal (just email input + magic link button)

### Data Display
- **Date Format:** DD/MM/YYYY (international format)
- **Number Format:** Full numbers with commas ($1,234,567.89)
- **Negative Balances:** Red color with minus sign (-$5,000)
- **Net Worth:** True net worth (Banks + Investments + Home Value - Mortgage)

### Data Behavior
- **Snapshots:** Auto-save snapshot whenever any balance is updated
- **Saving:** Auto-save with subtle toast notification
- **Deletion:** Hard delete (permanent removal, no archive)
- **Export:** Not needed (rely on InstantDB)

---

## Features

### 1. Dashboard Home
- **Net worth summary** with month-over-month change percentage
- **Quick view cards** for each category (Banks, Investments, Home Equity)
- **Trend chart:** Multi-line chart showing banks, investments, home equity as separate lines
- **Time ranges:** 1M, 3M, 6M, 1Y, All Time toggles
- **Last updated timestamps** for each account
- **Recommendations:** Smart insights like "Paying $200 extra/month saves $50k in interest"

### 1.5 Wealth Radar (AI-Powered Insights)

Real-time financial insights powered by Perplexity AI with 30-day caching:

- **Insights categories:**
  - US markets (S&P 500, Nasdaq, Dow) with specific numbers
  - EU & Asian markets (STOXX 600, FTSE, Nikkei, Hang Seng, Sensex)
  - Commodities (Gold, Silver trends with prices)
  - Geopolitical events affecting portfolio
  - Personalized action recommendations

- **Personalization:**
  - Analyzes user's actual accounts and institutions
  - Considers currency and inferred country (from institutions)
  - Reviews 12-month net worth trend
  - Factors in mortgage/loan status

- **Caching:**
  - 30-day localStorage cache to minimize API costs
  - Manual refresh button available
  - Last generated timestamp displayed

- **API:**
  - Backend: `/api/wealth-radar.js` (Vercel serverless function)
  - Model: Perplexity Sonar with web search enabled
  - Search recency: Past week only

- **Attribution:** "Powered by Perplexity" badge with logo

### 2. Bank Accounts View
- List of bank accounts with owner filter tabs
- Account details: institution (free text), account name, current balance
- Total per person and combined total
- Historical balance chart
- **Institution Logo:** Automatically resolved via fuzzy company name search (Clearbit Autocomplete API). Works with typos, abbreviations, and local bank names. Falls back to a hardcoded domain map for offline use, then to a gradient placeholder icon. Logos cached in localStorage for 7 days. Same logic applies to investment institution logos.

### 3. Investments View
- Organized by brokerage (free text entry)
- Per-brokerage breakdown showing:
  - Account type: Retirement (401k, IRA, Roth IRA, Pension) or Taxable Brokerage
  - Current value
  - Owner (configurable name)
  - **Optional:** Individual holdings within account
- Total investment value with historical chart
- **Allocation pie chart** by account type (401k vs IRA vs brokerage)

### 4. Mortgage View (Full Analysis)
- **Current Status:**
  - Original loan amount
  - Current balance
  - Interest rate
  - Monthly payment amount
  - Next payment due date (auto-advances after due date)
- **Payment Breakdown:**
  - Principal vs interest split per payment
  - Year-to-date principal paid vs interest paid
- **Amortization Schedule:**
  - Toggle between yearly summary and full monthly detail
  - Projected payoff date
- **Equity Tracking:**
  - Purchase price + annual appreciation rate (auto-calculate home value)
  - Current equity amount and percentage
  - Equity growth over time chart
- **Extra Payment Scenarios:**
  - Add extra payment with frequency dropdown (monthly OR annually)
  - For annual: specify start date, apply reduction in forecasting
  - **Track actual extra payments made** (date + amount)
  - Compare payoff dates and interest saved

### 4.5 Multiple Loan Types Support

The app supports tracking multiple types of loans beyond just mortgages:

- **Loan Types:**
  - Home (traditional mortgage)
  - Auto (car loans)
  - Student (education loans)
  - Personal (unsecured loans)
  - Other (custom loan types)

- **Features per loan:**
  - Custom loan name (e.g., "Honda Civic", "Primary Home")
  - Lender name (free text)
  - Original amount, current balance, interest rate
  - Start date and term length
  - Monthly payment amount
  - Amortization schedule
  - Extra payment scenarios
  - Payment history tracking

- **Multiple loans:** Users can add multiple loans of different types
- **Soft delete:** Loans can be archived without permanent deletion (isDeleted flag)
- **Icon indicators:** Visual loan type indicators using Lucide React icons (Home, Car, GraduationCap, CreditCard, FileText)
- **Loan tabs:** Switch between individual loans and "All Loans" combined view

### 4.6 Payment History Tracking

Track actual loan payments made with full principal/interest breakdown:

- **Payment types:**
  - Regular payments (scheduled monthly payments with P&I split)
  - Extra payments (100% to principal)

- **Payment details:**
  - Date of payment
  - Total amount paid
  - Principal paid
  - Interest paid
  - Optional note field

- **Summary statistics:**
  - Total paid to date
  - Total principal reduction
  - Total interest paid

- **Actions:**
  - Add payment modal with automatic P&I calculation
  - Delete payment (restores loan balance accordingly)
  - View payment history with filters

- **Integration:** Payments update loan balance and trigger snapshot creation

### 5. Settings Page

- **User Profile:**
  - Display name
  - Full name
  - Profile picture (drag-and-drop upload, base64 storage)
  - Email (read-only, from auth)

- **Household Settings:**
  - Currency selection (24 currencies supported)
  - Country selection (dropdown with flag emojis, 50+ countries)
  - Relationship status (Single, Married, Domestic Partnership, Roommates, Other)
  - Home appreciation rate
  - Home purchase price and date

- **Mortgage Toggle:**
  - Enable/disable mortgage tracking
  - Hides Mortgage section from sidebar when disabled
  - Excludes mortgage from net worth calculations

- **Household Members:**
  - View current members (max 2)
  - Add partner via "Add Member" button (creates pending user)
  - Remove member (with confirmation)

- **Demo Data:**
  - Load demo data (generates 12 months of realistic data)
  - Clear demo data (removes all entities with isDemo flag)

- **Theme Preference:**
  - Stored in InstantDB user settings (source of truth)
  - Cached in localStorage to prevent flicker
  - Synced before first render

### 6. Onboarding
- **First-time flow:** Guided setup wizard that **automatically creates a household** for the user (no separate "Create Household" step)
  1. Set currency from dropdown (popular world currencies with symbols)
  2. Set display name
  3. Household is auto-created at this point with the selected currency
  4. Add first bank account
  5. Add first investment (optional)
  6. Add mortgage (optional)
- **Invite second user:** Enter email to add to household (from Settings)

### 7. Demo Data System

For testing and demonstrations:

- **One-click demo setup:**
  - Generates realistic 12-month historical data
  - Creates sample bank accounts (2-3 accounts)
  - Creates sample investments (2-3 accounts)
  - Creates sample mortgage with payment history
  - Generates snapshots with upward trending net worth

- **Data characteristics:**
  - Investments: 8% annual growth with ±4% volatility
  - Banks: 2% annual growth with ±4% volatility
  - Mortgage: $600/month principal paydown
  - Home: 3.5% annual appreciation

- **Demo flag:** All demo entities tagged with `isDemo: true`
- **Cleanup:** Easy removal of all demo data via Settings page
- **Demo user:** Creates a partner user named "Sarah" for 2-user demonstration

---

## Technical Architecture

### Frontend (React + InstantDB)
```
src/
├── components/
│   ├── Dashboard/
│   ├── BankAccounts/
│   ├── Investments/
│   ├── Mortgage/
│   ├── Charts/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── InviteUser.jsx
│   ├── Onboarding/
│   ├── Settings/
│   └── common/
│       ├── Sidebar.jsx
│       ├── ThemeToggle.jsx
│       ├── Toast.jsx
│       ├── OwnerTabs.jsx
│       ├── AnimatedNumber.jsx
│       ├── Button.jsx
│       ├── ConfirmationModal.jsx
│       ├── SearchableSelect.jsx
│       ├── CountrySelect.jsx
│       ├── WealthRadarCard.jsx
│       ├── Avatar.jsx
│       ├── ToggleSwitch.jsx
│       ├── Card.jsx
│       └── SkeletonLoader.jsx
├── pages/
│   ├── Home.jsx
│   ├── Banks.jsx
│   ├── Investments.jsx
│   ├── Mortgage.jsx
│   └── Settings.jsx
├── lib/
│   └── instant.js          # InstantDB client config
├── hooks/
│   ├── useAuth.js          # Auth hook wrapper
│   └── useTheme.js         # Theme management
├── utils/
│   ├── mortgageCalculations.js
│   ├── formatters.js       # Date, currency, number formatting
│   └── currencies.js       # Currency list with symbols
└── App.jsx
```

### New UI Components

**Common Components:**
- `ConfirmationModal.jsx` - Reusable confirmation dialog for destructive actions
- `SearchableSelect.jsx` - Dropdown with search/filter capability
- `CountrySelect.jsx` - Country picker with flag emojis (50+ countries)
- `WealthRadarCard.jsx` - AI insights card with Perplexity integration
- `Button.jsx` - Standardized button component with variants (primary, hero, destructive, secondary)
- `SkeletonLoader.jsx` - Loading state placeholders with shimmer animation
- `SimpleTrendChart.jsx` - Single-series teal gradient chart for Banks/Investments pages
- `Avatar.jsx` - User profile picture display with fallback initials
- `ToggleSwitch.jsx` - Animated toggle for binary settings
- `Card.jsx` - Reusable card wrapper with glassmorphic styling

**Mortgage Components:**
- `PaymentHistory.jsx` - Payment tracking with summary stats and delete capability
- `AddPaymentModal.jsx` - Form for recording loan payments with automatic P&I calculations
- `LoanTabs.jsx` - Switch between individual loans and "All Loans" combined view

**Profile Components:**
- `ProfilePictureUpload.jsx` - Drag-and-drop image upload with preview and file validation

**Key Libraries:**
- `@instantdb/react` - Real-time database + magic link auth
- React Router for navigation
- Recharts for visualizations
- Tailwind CSS for styling
- Framer Motion for animations

**Additional Libraries:**
- `lucide-react` - Icon library (Home, Car, GraduationCap, CreditCard, FileText icons for loan types)
- Perplexity AI API - Real-time market insights with web search
- logo.dev API - Institution logo fetching with domain mapping (150+ financial institutions)

### No Backend Required (Except Serverless Function)
InstantDB provides:
- Real-time database (serverless)
- Magic link authentication
- Permission rules for access control
- Automatic syncing across devices

### InstantDB Schema

**households**:
```json
{
  "id": "uuid",
  "createdAt": 1706140800000,
  "primaryUserEmail": "harish@example.com",
  "secondaryUserEmail": "wife@example.com",
  "currency": "USD",
  "currencySymbol": "$",
  "homeAppreciationRate": 3.5,
  "homePurchasePrice": 500000,
  "homePurchaseDate": 1672531200000,
  "name": "My Household",
  "ownerId": "user-uuid",
  "country": "US",
  "relationshipStatus": "Married"
}
```

**users** (linked to household):
```json
{
  "id": "uuid",
  "email": "harish@example.com",
  "displayName": "Harish",
  "name": "Harish Nagarajan",
  "householdId": "household-uuid",
  "profilePicture": "data:image/png;base64,...",
  "isDemo": false
}
```

**accounts** (bank accounts):
```json
{
  "id": "uuid",
  "householdId": "household-uuid",
  "ownerId": "user-uuid",
  "institution": "Chase",
  "accountName": "Checking",
  "accountType": "checking",
  "balance": 5000,
  "logoUrl": "https://img.logo.dev/chase.com?token=...",
  "isDemo": false,
  "updatedAt": 1706140800000
}
```

**investments**:
```json
{
  "id": "uuid",
  "householdId": "household-uuid",
  "ownerId": "user-uuid",
  "brokerage": "Fidelity",
  "accountType": "401k",
  "accountName": "Company 401k",
  "value": 150000,
  "logoUrl": "https://img.logo.dev/fidelity.com?token=...",
  "isDemo": false,
  "updatedAt": 1706140800000
}
```

**holdings** (optional, linked to investment):
```json
{
  "id": "uuid",
  "investmentId": "investment-uuid",
  "symbol": "VTSAX",
  "name": "Vanguard Total Stock Market",
  "shares": 250,
  "costBasis": 40000,
  "currentPrice": 200,
  "value": 50000,
  "updatedAt": 1706140800000
}
```

**mortgage** (supports multiple loans):
```json
{
  "id": "uuid",
  "householdId": "household-uuid",
  "loanName": "Primary Home",
  "loanType": "home",
  "lender": "Rocket Mortgage",
  "originalAmount": 500000,
  "currentBalance": 450000,
  "interestRate": 6.5,
  "monthlyPayment": 3160,
  "startDate": 1672531200000,
  "termYears": 30,
  "nextPaymentDate": 1706140800000,
  "isDeleted": false,
  "isDemo": false,
  "updatedAt": 1706140800000
}
```

**extraPayments** (linked to mortgage):
```json
{
  "id": "uuid",
  "mortgageId": "mortgage-uuid",
  "amount": 10000,
  "frequency": "annual",
  "startDate": 1706140800000,
  "isActual": true,
  "note": "Annual bonus payment"
}
```

**payments** (actual payment history):
```json
{
  "id": "uuid",
  "mortgageId": "mortgage-uuid",
  "date": 1706140800000,
  "amount": 3160,
  "paymentType": "regular",
  "principalPaid": 600,
  "interestPaid": 2560,
  "note": "February payment",
  "isDemo": false,
  "createdAt": 1706140800000,
  "updatedAt": 1706140800000
}
```

**snapshots** (historical data - auto-saved):
```json
{
  "id": "uuid",
  "householdId": "household-uuid",
  "date": 1706140800000,
  "totalBanks": 50000,
  "totalInvestments": 300000,
  "homeValue": 600000,
  "mortgageBalance": 450000,
  "netWorth": 500000
}
```

### InstantDB Permissions
```javascript
// Both household members have equal read/write access
{
  "households": {
    "allow": {
      "read": "auth.email in [data.primaryUserEmail, data.secondaryUserEmail]",
      "create": "true",
      "update": "auth.email in [data.primaryUserEmail, data.secondaryUserEmail]",
      "delete": "auth.email in [data.primaryUserEmail, data.secondaryUserEmail]"
    }
  },
  "accounts": {
    "allow": {
      "read": "isHouseholdMember(data.householdId)",
      "write": "isHouseholdMember(data.householdId)"
    }
  }
  // ... similar rules for investments, holdings, mortgage, extraPayments, snapshots
}
```

---

## Implementation Plan

### Phase 1: Project Setup
1. Initialize React app with Vite
2. Install and configure InstantDB (`@instantdb/react`)
3. Set up InstantDB app in dashboard (get app ID)
4. Configure Tailwind CSS with custom theme (dark/light)
5. Set up Framer Motion for animations
6. Set up basic project structure and routing
7. Implement theme toggle with smooth transitions

### Phase 2: InstantDB Schema & Auth
1. Define InstantDB schema (all entities above)
2. Configure InstantDB permission rules (equal access)
3. Build minimal magic link login flow
4. Build guided onboarding wizard (currency, name, first accounts)
5. Build "invite second user" flow
6. Implement auth guards for routes

### Phase 3: Core UI Components
1. Build collapsible sidebar navigation
2. Build owner filter tabs component
3. Build animated number counter component
4. Build toast notification system
5. Build skeleton loader components
6. Build glassmorphism card components

### Phase 4: Bank Accounts Feature
1. Build bank accounts list view with owner tabs
2. Add/edit/delete account forms with auto-save
3. Display totals by owner
4. Real-time sync with auto-snapshot

### Phase 5: Investments Feature
1. Build investments view grouped by brokerage
2. Add/edit/delete investment forms
3. Optional holdings within accounts
4. Allocation pie chart by account type
5. Display totals and breakdowns by owner

### Phase 6: Mortgage Feature
1. Build mortgage status display
2. Implement amortization calculator (yearly + monthly views)
3. Build extra payment calculator (monthly/annual frequency)
4. Track actual extra payments made
5. Add equity tracking with appreciation calculation
6. Auto-advance next payment date

### Phase 7: Dashboard & Charts
1. Build dashboard home with summary cards
2. Build multi-line trend chart with time range toggles
3. Implement recommendation engine (basic insights)
4. Add per-category historical charts

### Phase 8: Settings & Polish
1. Build settings page (name, currency, appreciation, household)
2. Add responsive design for mobile
3. Error handling and loading states
4. Micro-interaction polish (hover, transitions)

### Phase 9: Deploy
1. Deploy to Vercel (frontend only)
2. Configure production InstantDB app

---

## Currency Support

Include these currencies in onboarding dropdown:
- USD ($) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound
- INR (₹) - Indian Rupee
- CAD (C$) - Canadian Dollar
- AUD (A$) - Australian Dollar
- JPY (¥) - Japanese Yen
- CHF (Fr) - Swiss Franc
- CNY (¥) - Chinese Yuan
- SGD (S$) - Singapore Dollar
- HKD (HK$) - Hong Kong Dollar
- NZD (NZ$) - New Zealand Dollar
- SEK (kr) - Swedish Krona
- NOK (kr) - Norwegian Krone
- DKK (kr) - Danish Krone
- AED (د.إ) - UAE Dirham
- SAR (﷼) - Saudi Riyal
- MXN ($) - Mexican Peso
- BRL (R$) - Brazilian Real
- ZAR (R) - South African Rand

---

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tailwind.config.js` | Custom theme with dark/light colors |
| `src/lib/instant.js` | InstantDB client configuration |
| `src/App.jsx` | Main app with routing |
| `src/components/Auth/` | Login, onboarding components |
| `src/components/Onboarding/` | Guided setup wizard |
| `src/components/Settings/` | Settings page components |
| `src/pages/` | Dashboard, Banks, Investments, Mortgage, Settings pages |
| `src/components/` | Feature-specific UI components |
| `src/components/common/` | Sidebar, ThemeToggle, Toast, OwnerTabs, AnimatedNumber |
| `src/utils/mortgageCalculations.js` | Amortization math utilities |
| `src/utils/formatters.js` | Date, currency, number formatting |
| `src/utils/currencies.js` | Currency list with symbols |
| `src/hooks/useTheme.js` | Theme management hook |
| `instant.schema.ts` | InstantDB schema definition |
| `instant.perms.ts` | InstantDB permission rules |
| `.env.example` | Environment variable template (VITE_INSTANT_APP_ID) |

---

## Verification Plan
1. **Auth flow testing:**
   - First user can create household via magic link
   - First user can invite second user email
   - Second user can login via magic link
   - Third email can create their own household
   - Both users have equal permissions
2. **CRUD testing:** Verify add/edit/delete for accounts, investments, mortgage
3. **Auto-snapshot:** Verify snapshots created on every balance change
4. **Real-time sync:** Open app in two browsers, verify changes sync silently
5. **Mortgage calculations:** Validate amortization math against online calculators
6. **Extra payments:** Test monthly and annual extra payment projections
7. **Charts:** Confirm multi-line trend chart works with time range toggles
8. **Theme:** Verify dark/light toggle with smooth 400ms transition
9. **Responsive:** Check desktop layout and basic mobile responsiveness
10. **Deploy:** Verify Vercel deployment works end-to-end

---

## Notes
- **No backend needed** - InstantDB handles database, auth, and real-time sync
- **Simplified architecture** - Frontend-only deployment to Vercel
- **Equal permissions** - Both household members can do everything
- **Premium feel** - Glassmorphism, micro-interactions, animated counters
- **International support** - DD/MM/YYYY dates, configurable currency
- Estimated files to create: ~30-35 files (frontend only)
