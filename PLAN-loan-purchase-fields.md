# Fix Missing Purchase Fields in Loan Modal

## Problem
Home, auto, and other loans are missing purchase price, purchase date, and appreciation/depreciation rate fields. These are currently stored at household level (only supports 1 home), causing incorrect home equity calculations in the dashboard.

## Solution Overview
Add per-loan purchase fields to the mortgage schema and loan form. Each loan tracks its own asset value with individual appreciation/depreciation rates.

**Key Features:**
- Multiple homes supported with individual purchase prices
- Auto loans depreciate at -15% annually (default)
- Only home loans show in pie chart as "Home Equity"
- Backward compatible with existing data

## Implementation Steps

### 1. Update Schema
**File:** [instant.schema.ts](instant.schema.ts)

Add 3 optional fields to mortgage entity:
```typescript
mortgage: i.entity({
  // ... existing fields ...
  purchasePrice: i.number().optional(),
  purchaseDate: i.number().optional(), // Unix timestamp
  appreciationRate: i.number().optional(), // Can be negative for depreciation
})
```

**Deploy schema changes to InstantDB before code changes.**

### 2. Add Calculation Utility
**File:** [src/utils/mortgageCalculations.js](src/utils/mortgageCalculations.js)

Add new function after `calculateEquity()`:
```javascript
export function calculateLoanAssetValue(loan, household, asOfDate = Date.now()) {
  // Use loan-level data if available, fallback to household
  const purchasePrice = loan.purchasePrice ?? household?.homePurchasePrice;
  const purchaseDate = loan.purchaseDate ?? household?.homePurchaseDate;
  const appreciationRate = loan.appreciationRate ?? household?.appreciationRate ?? 0;

  if (!purchasePrice || !purchaseDate) return 0;

  return calculateHomeValue(purchasePrice, purchaseDate, appreciationRate, asOfDate);
}
```

**Reuses existing `calculateHomeValue()` which already supports negative rates.**

### 3. Update Loan Form UI
**File:** [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx) - `MortgageForm` component (lines 606-934)

Add conditional fields after "Start Date" field (around line 850):
```jsx
{/* Show purchase fields for asset-backed loans */}
{['home', 'auto', 'other'].includes(formData.loanType) && (
  <>
    {/* Purchase Price */}
    <div>
      <label className="block text-sm font-medium mb-2">
        {formData.loanType === 'home' ? 'Home' : formData.loanType === 'auto' ? 'Car' : 'Asset'} Purchase Price
      </label>
      <input
        type="number"
        value={formData.purchasePrice || ''}
        onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
        className="w-full px-4 py-2 glass-card rounded-lg"
        required
      />
    </div>

    {/* Purchase Date */}
    <div>
      <label className="block text-sm font-medium mb-2">Purchase Date</label>
      <input
        type="date"
        value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
        onChange={(e) => setFormData({ ...formData, purchaseDate: new Date(e.target.value).getTime() })}
        className="w-full px-4 py-2 glass-card rounded-lg"
        required
      />
    </div>

    {/* Appreciation/Depreciation Rate */}
    <div>
      <label className="block text-sm font-medium mb-2">
        {formData.loanType === 'auto' ? 'Depreciation' : 'Appreciation'} Rate (%)
      </label>
      <input
        type="number"
        step="0.1"
        value={formData.appreciationRate ?? (formData.loanType === 'auto' ? -15 : household?.appreciationRate || 3)}
        onChange={(e) => setFormData({ ...formData, appreciationRate: parseFloat(e.target.value) })}
        className="w-full px-4 py-2 glass-card rounded-lg"
      />
      {formData.loanType === 'auto' && (
        <p className="text-xs text-gray-400 mt-1">Negative values indicate depreciation</p>
      )}
    </div>
  </>
)}
```

**Initialize defaults in `handleEditLoan()` and `handleAddNew()` functions.**

### 4. Update Mortgage Page Calculations
**File:** [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx) - Lines 138-151

Replace home value calculation:
```javascript
// Calculate total home value from all home loans
let totalHomeValue = 0;
const homeLoans = loans.filter(l => l.loanType === 'home');
homeLoans.forEach(loan => {
  totalHomeValue += calculateLoanAssetValue(loan, household);
});

const totalHomeLoanBalance = homeLoans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
const homeEquity = calculateEquity(totalHomeValue, totalHomeLoanBalance);
```

**Update asset value display cards** (lines 386-453) to show per-loan asset values for home/auto/other types.

### 5. Update Dashboard Home Value
**File:** [src/pages/Home.jsx](src/pages/Home.jsx) - Lines 81-94

Replace home value calculation:
```javascript
// Calculate total home value from all home loans
let homeValue = 0;
if (mortgageEnabled && homeLoans.length > 0) {
  homeLoans.forEach(loan => {
    homeValue += calculateLoanAssetValue(loan, household);
  });
}
```

**Pie chart already correctly filters to show only home equity.**

### 6. Update Snapshots Calculation
**File:** [src/utils/snapshots.js](src/utils/snapshots.js) - Lines 96-117

Update `calculateTotals()` function:
```javascript
// Calculate home value from all home loans
let homeValue = 0;
const homeLoans = loans.filter(l => l.loanType === 'home');
homeLoans.forEach(loan => {
  homeValue += calculateLoanAssetValue(loan, household, date);
});
```

**Import `calculateLoanAssetValue` at top of file.**

### 7. Add Migration Logic
**File:** [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx) - Lines 68-85

Add to existing migration useEffect:
```javascript
// Migrate existing home loans to use purchase fields
if (household && loans.length > 0) {
  const homeLoansNeedingMigration = loans.filter(
    l => l.loanType === 'home' && !l.purchasePrice && household.homePurchasePrice
  );

  if (homeLoansNeedingMigration.length > 0) {
    const updates = homeLoansNeedingMigration.map(loan =>
      db.tx.mortgage[loan.id].update({
        purchasePrice: household.homePurchasePrice,
        purchaseDate: household.homePurchaseDate,
        appreciationRate: household.appreciationRate,
        updatedAt: Date.now()
      })
    );
    db.transact(updates);
  }
}
```

**Runs once on page load, automatically migrates existing home loans.**

## Critical Files Modified

1. [instant.schema.ts](instant.schema.ts) - Add 3 optional fields to mortgage entity
2. [src/utils/mortgageCalculations.js](src/utils/mortgageCalculations.js) - Add `calculateLoanAssetValue()` function
3. [src/pages/Mortgage.jsx](src/pages/Mortgage.jsx) - Add form fields, update calculations, add migration
4. [src/pages/Home.jsx](src/pages/Home.jsx) - Update home value calculation
5. [src/utils/snapshots.js](src/utils/snapshots.js) - Update snapshot calculations

## Verification Steps

1. **Schema deployment**: Verify schema changes appear in InstantDB dashboard
2. **Add new home loan**: Fill in purchase price ($500k), purchase date (2020), appreciation rate (3%)
3. **Check Mortgage page**: Verify home value shows correctly with appreciation
4. **Check Dashboard**: Verify "Home Equity" appears in pie chart with correct value
5. **Add auto loan**: Set purchase price ($30k), purchase date (2023), depreciation rate (-15%)
6. **Verify depreciation**: Car value should decrease over time (not show in pie chart)
7. **Add second home loan**: Verify total home equity = sum of both homes
8. **Check existing loans**: Verify migration populated purchase fields from household data
9. **Check snapshots**: Verify historical trend charts use new calculation logic

## Edge Cases Handled

- Loans without purchase data: Falls back to household-level values
- Student/personal loans: Don't show purchase fields (not asset-backed)
- Multiple home loans: Each calculated independently, summed for total
- Auto depreciation: Negative rates work correctly (uses same math)
- Missing household data: Returns 0 for asset value (graceful degradation)

## Rollback Strategy

If issues arise:
1. Schema changes are backward compatible (optional fields)
2. Code falls back to household data if loan fields missing
3. Can revert code changes without schema changes
4. Migration logic is idempotent (safe to re-run)
