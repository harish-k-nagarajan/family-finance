import { useState } from 'react';
import { db } from '../../lib/instant';
import Card from '../common/Card';
import { seedDemoData } from '../../utils/demoData';

function DemoDataSection({ household, currentUser }) {
    const [isLoading, setIsLoading] = useState(false);

    // Query all potential demo data to see if we have any, and to be able to delete it
    const { data } = db.useQuery({
        users: { $: { where: { householdId: household.id } } },
        accounts: { $: { where: { householdId: household.id } } },
        investments: { $: { where: { householdId: household.id } } },
        mortgage: { $: { where: { householdId: household.id } } },
        snapshots: { $: { where: { householdId: household.id } } },
    });

    const demoUsers = data?.users?.filter(x => x.isDemo) || [];
    const demoAccounts = data?.accounts?.filter(x => x.isDemo) || [];
    const demoInvestments = data?.investments?.filter(x => x.isDemo) || [];
    const demoMortgage = data?.mortgage?.filter(x => x.isDemo) || [];
    const demoSnapshots = data?.snapshots?.filter(x => x.isDemo) || [];

    const hasDemoData = demoUsers.length > 0 || demoAccounts.length > 0 || demoInvestments.length > 0 || demoMortgage.length > 0 || demoSnapshots.length > 0;

    const handleLoadDemo = async () => {
        setIsLoading(true);
        try {
            await seedDemoData(household.id, currentUser.id);
            // alert('Demo data loaded!');
        } catch (e) {
            console.error(e);
            alert('Failed to load demo data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearDemo = async () => {
        if (!window.confirm("Are you sure? This will delete all demo accounts, users, and investments.")) return;

        setIsLoading(true);
        try {
            const txs = [];

            // Delete entities
            demoUsers.forEach(u => txs.push(db.tx.users[u.id].delete()));
            demoAccounts.forEach(a => txs.push(db.tx.accounts[a.id].delete()));
            demoInvestments.forEach(i => txs.push(db.tx.investments[i.id].delete()));
            demoMortgage.forEach(m => txs.push(db.tx.mortgage[m.id].delete()));
            demoSnapshots.forEach(s => txs.push(db.tx.snapshots[s.id].delete()));

            // Reset Household Mortgage Settings to defaults (disable)
            txs.push(
                db.tx.households[household.id].update({
                    mortgageEnabled: false,
                    homePurchasePrice: 0,
                    appreciationRate: 0,
                    debtType: null, // or undefined
                    updatedAt: Date.now(),
                })
            );

            if (txs.length > 0) {
                await db.transact(txs);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to clear demo data');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section>
            <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                Demo Data
            </h2>
            <Card>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Data Controls
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Populate your account with realistic dummy data to test expected behavior.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleLoadDemo}
                            disabled={isLoading || hasDemoData}
                            className="px-5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20 font-medium hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && !hasDemoData ? 'Loading...' : 'Load Demo Data'}
                        </button>

                        <button
                            onClick={handleClearDemo}
                            disabled={isLoading || !hasDemoData}
                            className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && hasDemoData ? 'Clearing...' : 'Clear Demo Data'}
                        </button>
                    </div>
                </div>
            </Card>
        </section>
    );
}

export default DemoDataSection;
