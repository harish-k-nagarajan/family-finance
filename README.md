# Family Finance 💰

**The shared financial dashboard for modern couples.**

Family Finance is a premium, real-time dashboard designed specifically for households to track their combined net worth without the privacy concerns or technical headaches of linking bank APIs. Built with React, InstantDB, and modern web technologies for a beautiful, high-performance experience.

![Family Finance Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![InstantDB](https://img.shields.io/badge/InstantDB-Realtime-purple)

## ✨ Features

### 📊 Comprehensive Financial Tracking
- **Bank Accounts**: Track multiple checking, savings, and credit accounts
- **Investment Portfolios**: Monitor 401k, IRA, Roth IRA, and taxable brokerage accounts
- **Mortgage Analysis**: Built-in amortization schedules, extra payment modeling, and equity tracking
- **Home Value**: Automated appreciation calculations based on market rates

### 🎨 Premium User Experience
- **Glassmorphic Design**: Modern, frosted-glass aesthetic with smooth animations
- **Dark/Light Mode**: Seamless theme switching with 400ms transitions
- **Real-Time Sync**: Powered by InstantDB - changes reflect instantly across all devices
- **Responsive Design**: Desktop-first with mobile support

### 📈 Data Visualization
- **Net Worth Trends**: Multi-line charts showing historical performance
- **Time Range Filtering**: View trends over 1M, 3M, 6M, 1Y, or all time
- **Investment Allocation**: Pie charts breaking down portfolio by account type
- **Automated Snapshots**: Historical data captured automatically on every update

### 👥 Multi-User Household
- **Shared Dashboard**: Perfect for couples managing finances together
- **Owner Filtering**: View accounts by person or combined
- **Equal Permissions**: Both users have full access to all features
- **Magic Link Auth**: Secure, passwordless authentication via email

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- An [InstantDB](https://instantdb.com) account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harish-k-nagarajan/personal-household-finance.git
   cd personal-household-finance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your InstantDB App ID:
   ```
   VITE_INSTANT_APP_ID=your-instant-app-id-here
   ```
   
   Get your App ID from the [InstantDB Dashboard](https://instantdb.com/dash).

4. **Configure InstantDB Schema**
   
   In the [InstantDB Dashboard](https://instantdb.com/dash):
   - Navigate to the **Schema** tab
   - Copy the contents of `instant.schema.ts` and apply it
   - Navigate to the **Permissions** tab
   - Copy the contents of `instant.perms.ts` and apply it

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Tech Stack

- **Frontend**: React 19 with Vite
- **Database & Auth**: InstantDB (serverless, real-time)
- **Styling**: Tailwind CSS 4 with custom theme
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: React Router 7

## 📁 Project Structure

```
personal-household-finance/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   └── Charts/          # Data visualization components
│   ├── pages/               # Main application pages
│   ├── utils/               # Helper functions and calculations
│   └── lib/                 # Third-party integrations
├── instant.schema.ts        # InstantDB schema definition
├── instant.perms.ts         # InstantDB permission rules
└── tailwind.config.js       # Custom theme configuration
```

## 🎯 Usage

### First-Time Setup
1. Sign in with your email (magic link authentication)
2. Set your household currency
3. Add your first bank account
4. (Optional) Add investments and mortgage details

### Adding a Second User
1. Go to Settings
2. Enter your partner's email address
3. They'll receive a magic link to join your household
4. Both users can now access and update the shared dashboard

### Tracking Your Finances
- **Banks Page**: Add and update account balances
- **Investments Page**: Track portfolio performance
- **Mortgage Page**: Monitor loan progress and equity
- **Dashboard**: View net worth trends and overall financial health

## 🔒 Privacy & Security

- **No Bank API Connections**: Manual entry means your banking credentials stay private
- **Multi-Tenant Security**: Household-based permissions ensure data isolation
- **Environment Variables**: Sensitive configuration kept out of source code
- **InstantDB Auth**: Secure, passwordless authentication

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_INSTANT_APP_ID` | Your InstantDB application ID | Yes |

## 📝 Configuration

### Supported Currencies
The app supports 20+ currencies including USD, EUR, GBP, INR, CAD, AUD, JPY, and more. Configure your preferred currency during onboarding or in Settings.

### Home Appreciation Rate
Set a custom annual appreciation rate for your home value calculations in Settings (default: 3.5%).

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   npx vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard
   - Add `VITE_INSTANT_APP_ID` with your InstantDB App ID

### Other Platforms
The app is a static site and can be deployed to any hosting platform that supports Vite builds (Netlify, Cloudflare Pages, etc.).

## 🤝 Contributing

Contributions are welcome! This project is open-source and built for the community.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [InstantDB](https://instantdb.com) for real-time data sync
- UI inspired by modern fintech applications
- Charts powered by [Recharts](https://recharts.org)

## 📧 Support

For questions or issues, please open a GitHub issue or reach out via the repository discussions.

---

**Made with ❤️ for couples managing their finances together**
