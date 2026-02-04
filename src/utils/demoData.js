import { db } from '../lib/instant';

export const seedDemoData = async (householdId, currentUserId) => {
    const now = Date.now();
    const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60 * 1000);

    // IDs
    const partnerId = crypto.randomUUID();
    const mortgageId = crypto.randomUUID();

    const txs = [];

    // 1. Partner User
    txs.push(
        db.tx.users[partnerId].update({
            email: 'sarah.demo@example.com',
            displayName: 'Sarah',
            name: 'Sarah User',
            profilePicture: null, // Could use a stock photo URL if we had one
            householdId: householdId,
            isDemo: true,
            createdAt: now,
            updatedAt: now,
        })
    );

    // 2. Household Update (Mortgage Settings)
    txs.push(
        db.tx.households[householdId].update({
            homePurchasePrice: 500000,
            homePurchaseDate: fiveYearsAgo,
            mortgageEnabled: true,
            debtType: 'home',
            appreciationRate: 3.5,
            updatedAt: now,
        })
    );

    // 3. Mortgage Entity
    txs.push(
        db.tx.mortgage[mortgageId].update({
            householdId: householdId,
            loanType: 'home',
            lender: 'Chase Bank',
            originalAmount: 400000,
            currentBalance: 342000,
            interestRate: 3.25,
            termYears: 30,
            startDate: fiveYearsAgo,
            monthlyPayment: 1740,
            isDemo: true,
            createdAt: now,
            updatedAt: now,
        })
    );

    // 4. Accounts
    const accounts = [
        { name: 'Chase Checking', type: 'checking', balance: 5240.50, owner: currentUserId },
        { name: 'Chase Savings', type: 'savings', balance: 12500.00, owner: currentUserId },
        { name: 'Ally High Yield', type: 'savings', balance: 25000.00, owner: partnerId },
        { name: 'Amex Gold', type: 'credit', balance: -1250.00, owner: currentUserId },
    ];

    accounts.forEach(acc => {
        const id = crypto.randomUUID();
        txs.push(
            db.tx.accounts[id].update({
                householdId: householdId,
                ownerId: acc.owner,
                institution: acc.name,
                accountType: acc.type,
                balance: acc.balance,
                isDemo: true,
                createdAt: now,
                updatedAt: now,
            })
        );
    });

    // 5. Investments
    const investments = [
        { name: 'Fidelity 401k', type: '401k', balance: 85000.00, owner: currentUserId },
        { name: 'Vanguard Roth IRA', type: 'Roth IRA', balance: 32000.00, owner: partnerId },
        { name: 'Robinhood', type: 'Taxable', balance: 15400.00, owner: currentUserId },
        { name: 'Coinbase (BTC)', type: 'Taxable', balance: 4200.00, owner: currentUserId },
    ];

    investments.forEach(inv => {
        const id = crypto.randomUUID();
        txs.push(
            db.tx.investments[id].update({
                householdId: householdId,
                ownerId: inv.owner,
                institution: inv.name,
                accountType: inv.type,
                balance: inv.balance,
                isDemo: true,
                createdAt: now,
                updatedAt: now,
            })
        );
    });

    // 6. Snapshots (12 months history)
    // Simulate simple linear growth/paydown
    for (let i = 12; i >= 0; i--) {
        const date = now - (i * 30 * 24 * 60 * 60 * 1000);
        const monthsAgo = i;

        // Simulate values (Back-calculate from current roughly)
        // Investments: ~136k now. Were lower before.
        // Banks: ~42k now.
        // Mortgage: ~342k now. Was HIGHER before.
        // Home: ~500k+. Was lower before (appreciation).

        // Current ending values (at month 0)
        const currentInvestments = 136600;
        const currentBanks = 42740;

        // Define growth rates - working backward to show realistic upward trend
        const monthlyInvestmentGrowth = Math.pow(1.08, 1/12);  // 8% annual growth
        const monthlyBankGrowth = Math.pow(1.02, 1/12);        // 2% annual growth

        // Add volatility (±4% swing month-to-month for natural appearance)
        const volatility = 1 + ((Math.random() - 0.5) * 0.08);

        // Calculate historical values (working backward in time)
        const investmentTotal = (currentInvestments / Math.pow(monthlyInvestmentGrowth, 12 - monthsAgo)) * volatility;
        const bankTotal = (currentBanks / Math.pow(monthlyBankGrowth, 12 - monthsAgo)) * volatility;
        const mortgageBal = 342000 + (monthsAgo * 600); // Principal paydown ~600/mo
        const homeVal = 500000 * Math.pow(1.0025, (60 - monthsAgo)); // 5 years appreciation, calculate backwards? 
        // Actually, let's just assume home value grows 3% per year.
        // Current value ~ 500k * (1.03)^5 ~= 580k.
        // Let's just create a nice curve.
        const homeEquityCalced = (500000 * Math.pow(1.003, 60 - monthsAgo)) - mortgageBal;

        const netWorth = investmentTotal + bankTotal + homeEquityCalced;

        const snapId = crypto.randomUUID();
        txs.push(
            db.tx.snapshots[snapId].update({
                householdId: householdId,
                date: date,
                totalBankBalance: bankTotal,
                totalInvestments: investmentTotal,
                homeValue: (500000 * Math.pow(1.003, 60 - monthsAgo)),
                mortgageBalance: mortgageBal,
                netWorth: netWorth,
                isDemo: true,
                createdAt: now,
            })
        );
    }

    // Batch execute
    // InstantDB recommends reasonable batch sizes, but this should be fine (approx 25 ops)
    await db.transact(txs);
};
