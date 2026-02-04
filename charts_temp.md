# Dashboard Chart Enhancements Plan

## Status Tracker

- [x] **Task 4**: Replace Emojis with Professional Icons ✅ COMPLETED
- [x] **Task 2**: Upward Trending Demo Data ✅ COMPLETED
- [x] **Task 1**: Intelligent X-Axis Formatting ✅ COMPLETED
- [x] **Task 3**: Trend Charts for Banks & Investments Pages ✅ COMPLETED

---

## Overview
This plan implements four improvements to the personal finance dashboard:
1. Intelligent X-axis labels based on time window selection ✅ **DONE**
2. Realistic upward-trending demo data with natural fluctuations ✅ **DONE**
3. Beautiful trend charts on Banks and Investments pages (teal gradient) ✅ **DONE**
4. Professional icon replacements for loan type selector ✅ **DONE**

---

## Task 4: Replace Emojis with Professional Icons ✅ COMPLETED

### Problem
Loan type selector uses emojis (🏠 🚗 🎓 💳 📋) which render inconsistently across browsers/OS.

### Solution
Replace with lucide-react icons (already imported and used throughout app).

### Implementation

**4.1 Update loan type configuration**
- File: [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx:753-757)
- Replace emoji strings with Icon components (lines 753-757):
  ```javascript
  {[
    { value: 'home', label: 'Home', Icon: Home },
    { value: 'car', label: 'Auto', Icon: Car },
    { value: 'student', label: 'Student', Icon: GraduationCap },
    { value: 'personal', label: 'Personal', Icon: CreditCard },
    { value: 'other', label: 'Other', Icon: FileText },
  ].map((type) => (
  ```

**4.2 Update button rendering**
- Replace emoji display (line 768):
  ```javascript
  <type.Icon className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" strokeWidth={2} />
  ```

**Verification:**
- [x] Mortgage page loan selector shows lucide icons (not emojis)
- [x] Icons render correctly in light mode (gray-700)
- [x] Icons render correctly in dark mode (gray-300)
- [x] Icons consistent with sidebar icon style
- [x] Loan type selection functionality unchanged

---

## Task 1: Intelligent X-Axis Formatting ✅ COMPLETED

### Problem
Dashboard chart currently shows DD/MM labels for all time ranges. For 1-month view, week-based labels would be clearer. For 3+ months, month names would be more meaningful.

### Solution
Create smart date formatter that adapts to time range:
- **1M window**: Week labels (W1, W2, W3, W4)
- **3M/6M windows**: Month labels (Jan, Feb, Mar)
- **1Y/ALL windows**: Month + year (Jan '26, Feb '26)

### Implementation

**1.1 Add new formatter function**
- File: [src/utils/formatters.js](src/utils/formatters.js)
- Add `formatChartAxisDate(timestamp, timeRange, rangeStartDate)` function after line 19
- Logic:
  - For 1M: Calculate weeks since range start → `W1`, `W2`, etc.
  - For 3M/6M: Return abbreviated month name → `Jan`, `Feb`, etc.
  - For 1Y/ALL: Return month + short year → `Jan '26`, `Feb '26`

**1.2 Update chart component**
- File: [src/components/Dashboard/DashboardTrendChart.jsx](src/components/Dashboard/DashboardTrendChart.jsx:157)
- Import: Add `formatChartAxisDate` to imports (line 4)
- Update XAxis tickFormatter (line 157):
  ```javascript
  tickFormatter={(date) => formatChartAxisDate(date, timeRange, data[0]?.date)}
  ```

**Verification:**
- [x] Switch to 1M view → verify week labels (W1, W2, W3, W4)
- [x] Switch to 3M view → verify month labels (Jan, Feb, Mar)
- [x] Switch to 1Y view → verify month + year (Jan '26, Feb '26)
- [x] Hover over chart → verify tooltip still shows full date (DD/MM/YYYY)

---

## Task 2: Upward Trending Demo Data ✅ COMPLETED

### Problem
Current demo data uses exponential **decay** (`Math.pow(0.992, monthsAgo)`), creating declining values instead of growth.

### Solution
Replace decay with **growth calculations** working backward from current values:
- **Investments**: 8% annual growth (~0.64% monthly)
- **Banks**: 2% annual growth (~0.17% monthly)
- **Volatility**: ±4% random fluctuation for natural appearance
- **Mortgage**: Keep existing $600/month paydown
- **Home**: 3.5% annual appreciation

### Implementation

**2.1 Update snapshot generation**
- File: [src/utils/demoData.js](src/utils/demoData.js:119-127)
- Replace lines 119-127 calculation logic:
  ```javascript
  // Define growth rates
  const monthlyInvestmentGrowth = Math.pow(1.08, 1/12);  // 8% annual
  const monthlyBankGrowth = Math.pow(1.02, 1/12);        // 2% annual
  const volatility = 1 + ((Math.random() - 0.5) * 0.08); // ±4% swing

  // Calculate historical values (working backward)
  const investmentTotal = (currentInvestments / Math.pow(monthlyInvestmentGrowth, 12 - monthsAgo)) * volatility;
  const bankTotal = (currentBanks / Math.pow(monthlyBankGrowth, 12 - monthsAgo)) * volatility;
  ```

**Verification:**
- [x] Seed demo data from onboarding
- [x] Dashboard chart shows clear upward trend over 12 months
- [x] Natural fluctuations visible (not flat line)
- [x] Net worth higher at present than 12 months ago

---

## Task 3: Trend Charts for Banks & Investments Pages

### Design
- **New component**: `SimpleTrendChart` (single-series, matches AmortizationChart style)
- **Placement**: Above account lists, below total balance card
- **Color**: Teal gradient (#2DD4BF) for both Banks and Investments pages
- **Data**: Combined household totals from snapshots (show disclaimer if owner filter active)
- **No time range filters**: Show full history by default

### Implementation

**3.1 Create SimpleTrendChart component**
- File: Create [src/components/Charts/SimpleTrendChart.jsx](src/components/Charts/SimpleTrendChart.jsx)
- Props: `data`, `currency`, `label`, `color` (default: `#2DD4BF`)
- Features:
  - Recharts AreaChart with teal gradient fill
  - Gradient definition: 80% opacity top → 5% opacity bottom
  - 3px stroke width, motion animations
  - Custom tooltip showing date + formatted value
  - "No data" message if empty array

**3.2 Add chart to Banks page**
- File: [src/pages/Banks.jsx](src/pages/Banks.jsx)
- Import SimpleTrendChart (line 10)
- Update query to include `snapshots: {}` (line 38)
- Extract snapshots: `const snapshots = data?.snapshots || [];` (line 50)
- Transform data (after line 74):
  ```javascript
  const chartData = snapshots
    .sort((a, b) => a.date - b.date)
    .map(s => ({ date: s.date, value: s.totalBankBalance }));
  ```
- Insert chart component after line 127 (before "Accounts List"):
  ```jsx
  {snapshots.length > 0 && (
    <Card>
      <h3 className="text-base font-display font-semibold text-gray-900 dark:text-white mb-4">
        Balance History
      </h3>
      <SimpleTrendChart data={chartData} currency={currency} label="Bank Balance" color="#2DD4BF" />
      {selectedOwner !== 'combined' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          * Chart shows combined household data
        </p>
      )}
    </Card>
  )}
  ```

**3.3 Add chart to Investments page**
- File: [src/pages/Investments.jsx](src/pages/Investments.jsx)
- Same pattern as Banks page
- Use `s.totalInvestments` for value
- Use `color="#2DD4BF"` (teal) and `label="Investment Total"`

**Verification:**
- [x] Banks page shows teal gradient chart above account list
- [x] Investments page shows teal gradient chart above investment list
- [x] Charts animate on page load (fade-in, slide-up)
- [x] Disclaimer appears when User1/User2 filter active
- [x] Charts match AmortizationChart aesthetic

---

## Critical Files to Modify

1. ✅ [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx:753-772) - Replace emojis with icons **COMPLETED**
2. ✅ [src/utils/demoData.js](src/utils/demoData.js:119-127) - Fix growth calculations **COMPLETED**
3. ✅ [src/utils/formatters.js](src/utils/formatters.js) - Add `formatChartAxisDate` function **COMPLETED**
4. ✅ [src/components/Dashboard/DashboardTrendChart.jsx](src/components/Dashboard/DashboardTrendChart.jsx:157) - Update XAxis tickFormatter **COMPLETED**
5. ✅ [src/components/Charts/SimpleTrendChart.jsx](src/components/Charts/SimpleTrendChart.jsx) - Create new reusable chart component **COMPLETED**
6. ✅ [src/pages/Banks.jsx](src/pages/Banks.jsx) - Add trend chart **COMPLETED**
7. ✅ [src/pages/Investments.jsx](src/pages/Investments.jsx) - Add trend chart **COMPLETED**

---

## Edge Cases Handled

- **Empty snapshots**: Charts conditionally render only when `snapshots.length > 0`
- **Single data point**: Recharts handles gracefully, shows single point
- **Owner filtering**: Charts show combined data with disclaimer note
- **Month label duplication**: Accepted for 3M/6M (fixed in 1Y/ALL with year suffix)
- **Null timestamps**: formatChartAxisDate returns empty string

---

## Risk Assessment

**Overall Risk: LOW**
- All changes are additive (no breaking changes)
- Isolated modifications to specific components
- Existing functionality preserved
- User-visible improvements only

**Complexity: MEDIUM**
- Total estimated time: 2-3 hours
- Most complex: Task 3 (new chart component + 2 page updates)
- Least complex: Task 4 (simple icon replacement) ✅ **COMPLETED**
- Second least: Task 2 (demo data calculations) ✅ **COMPLETED**

---

## Implementation Notes

### Task 4 Completion Details
**Date**: 2026-02-03
**Changes Made**:
- Updated [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx) lines 753-757 to use Icon components instead of emoji strings
- Updated line 768 to render `<type.Icon>` component with proper styling
- Icons used: `Home`, `Car`, `GraduationCap`, `CreditCard`, `FileText` from lucide-react
- Styling: `w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300` with `strokeWidth={2}`
- Result: Clean, professional icons that match the app's theme and render consistently across all browsers/OS

### Task 2 Completion Details
**Date**: 2026-02-03
**Changes Made**:
- Updated [src/utils/demoData.js](src/utils/demoData.js) lines 110-120 to use growth-based calculations
- Replaced exponential decay (Math.pow(0.992, monthsAgo)) with growth formulas
- Investments: 8% annual growth (Math.pow(1.08, 1/12) per month)
- Banks: 2% annual growth (Math.pow(1.02, 1/12) per month)
- Volatility: Increased from ±2% to ±4% for more natural fluctuations
- Result: Demo data now shows clear upward trend over 12 months with realistic market-like fluctuations instead of flat/declining values

### Task 1 Completion Details
**Date**: 2026-02-03
**Changes Made**:
- Added `formatChartAxisDate(timestamp, timeRange, rangeStartDate)` function to [src/utils/formatters.js](src/utils/formatters.js) after line 19
- Function logic:
  - 1M view: Calculates weeks since range start → W1, W2, W3, W4
  - 3M/6M views: Returns abbreviated month name → Jan, Feb, Mar
  - 1Y/ALL views: Returns month + short year → Jan '26, Feb '26
- Updated [src/components/Dashboard/DashboardTrendChart.jsx](src/components/Dashboard/DashboardTrendChart.jsx) line 4 to import `formatChartAxisDate`
- Updated line 157 XAxis tickFormatter to use `formatChartAxisDate(date, timeRange, data[0]?.date)`
- Result: Dashboard chart now shows intelligent x-axis labels that adapt to the selected time window, making charts more readable and meaningful at different time scales

### Task 3 Completion Details
**Date**: 2026-02-04
**Changes Made**:
- Created new [src/components/Charts/SimpleTrendChart.jsx](src/components/Charts/SimpleTrendChart.jsx) component
  - Uses Recharts AreaChart with teal gradient (#2DD4BF)
  - Gradient: 80% opacity at top → 5% opacity at bottom
  - 3px stroke width with smooth animation
  - Custom tooltip with glass-card styling
  - Handles empty data with friendly message
  - Adapts to light/dark theme
- Updated [src/pages/Banks.jsx](src/pages/Banks.jsx):
  - Added SimpleTrendChart import
  - Added `snapshots: {}` to query
  - Extracted snapshots data and transformed for chart
  - Inserted chart component between Total Balance card and Accounts List
  - Shows disclaimer when owner filter is active (chart always shows combined household data)
- Updated [src/pages/Investments.jsx](src/pages/Investments.jsx):
  - Same pattern as Banks page
  - Uses `s.totalInvestments` for chart data
  - Inserted chart between Total Investments card and Investments List
- Result: Both Banks and Investments pages now display beautiful teal gradient trend charts showing historical balance data with smooth animations, matching the AmortizationChart aesthetic
