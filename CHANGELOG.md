# Changelog

All notable changes to Family Finance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-04

### Initial Public Release

Family Finance is now open-source! A premium, real-time financial dashboard for couples to track shared household finances.

### Features

#### Core Financial Tracking
- **Multi-user household support** - Max 2 users per household with equal permissions
- **Bank accounts** - Track checking, savings, and credit accounts with owner filtering
- **Investment portfolios** - Monitor 401k, IRA, Roth IRA, and taxable brokerage accounts
- **Multiple loan types** - Support for mortgages, auto loans, student loans, personal loans, and custom loans
- **Home value tracking** - Automated appreciation calculations based on market rates
- **Net worth calculation** - Banks + Investments + Home Value - Mortgage Balance

#### Loan Management
- Full amortization schedules (yearly and monthly views)
- Extra payment modeling with monthly/annual frequency
- Payment history tracking with principal/interest breakdown
- Multiple loans with custom names and types
- Soft delete for archived loans
- Equity tracking over time

#### AI-Powered Insights
- **Wealth Radar** - Real-time market analysis via Perplexity AI
- Personalized recommendations based on portfolio
- US/EU/Asian market updates
- Commodities tracking (Gold, Silver)
- Geopolitical events affecting finances
- 30-day caching to minimize API costs

#### User Experience
- **Glassmorphic design** - Modern frosted-glass aesthetic
- **Dark/light theme** - Seamless switching with 400ms transitions
- **Real-time sync** - Powered by InstantDB, changes appear instantly
- **Responsive design** - Desktop-first with mobile support
- **Profile pictures** - Drag-and-drop upload with preview
- **24 currency support** - USD, EUR, GBP, INR, CAD, AUD, and 18 more

#### Data Visualization
- Multi-line trend charts with time range filtering (1M, 3M, 6M, 1Y, All Time)
- Investment allocation pie charts
- Amortization charts with extra payment projections
- Animated number counters
- Automated snapshots on every balance change

#### Settings & Customization
- Country selection with flag emojis (50+ countries)
- Relationship status tracking
- Mortgage toggle (enable/disable tracking)
- Demo data system for testing (one-click load/clear)
- Theme preference synced across devices

### Technical Stack
- **Frontend:** React 19 with Vite
- **Database:** InstantDB (serverless real-time database)
- **Authentication:** InstantDB magic link auth
- **Styling:** Tailwind CSS 4 with custom theme
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Routing:** React Router
- **Icons:** Lucide React
- **AI:** Perplexity API (Sonar model)
- **Logos:** logo.dev API

### Deployment
- **Hosting:** Vercel (frontend only)
- **Environment:** Serverless architecture
- **API Routes:** Vercel serverless functions for AI insights

### Documentation
- Comprehensive PRD with all feature specifications
- CLAUDE.md for AI assistant guidance
- design.md with complete design system documentation
- Detailed README with setup instructions
- Contributing guidelines for open-source contributors

### Security
- Multi-tenant data isolation with household-based permissions
- Environment variable configuration for sensitive keys
- No bank API connections - manual entry for privacy
- Passwordless authentication via magic link

---

## Future Roadmap

Potential features for future releases:

- **Mobile app** - Native iOS/Android apps
- **Bank API integration** - Optional Plaid integration for automatic sync
- **Budget tracking** - Monthly budget categories with spending alerts
- **Bill reminders** - Automated payment reminders
- **Tax reporting** - Year-end summaries for tax preparation
- **Investment performance** - Yield and returns tracking
- **Multi-household support** - Manage multiple households from one account
- **Data export** - CSV/PDF export for reports

Contributions and feature requests are welcome!

---

[1.0.0]: https://github.com/harish-k-nagarajan/personal-household-finance/releases/tag/v1.0.0
