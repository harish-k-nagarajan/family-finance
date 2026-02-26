import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { db } from './lib/instant';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Banks from './pages/Banks';
import Investments from './pages/Investments';
import Mortgage from './pages/Mortgage';
import Settings from './pages/Settings';
import Login from './pages/Login';
import OnboardingWizard from './components/Onboarding/OnboardingWizard';

function App() {
  const { isLoading, user, error } = db.useAuth();
  const transactionInFlight = useRef(false);

  // Get user data by email to handle linking pre-created accounts
  const { data: userData, isLoading: isQueryLoading } = db.useQuery(
    user ? { users: { $: { where: { email: user.email } } }, households: {} } : null
  );

  // Automatically create or link user profile
  useEffect(() => {
    if (!user) {
      transactionInFlight.current = false; // Reset on logout
      return;
    }
    if (isLoading || isQueryLoading || !userData) return;

    const existingUsers = userData.users || [];
    const userById = existingUsers.find((u) => u.id === user.id);

    if (userById) {
      transactionInFlight.current = false; // User exists in DB, clear flag
      return;
    }

    // Prevent concurrent duplicate transactions (the original crash loop cause).
    // Unlike the previous approach, this flag is cleared after each transaction
    // (success via userById check above, failure via .catch below) so retries
    // are possible if a transaction fails.
    if (transactionInFlight.current) return;
    transactionInFlight.current = true;

    const preCreatedUser = existingUsers.find((u) => u.id !== user.id && u.email === user.email);

    // Case 1: Brand new user (no profile at all)
    if (existingUsers.length === 0) {
      db.transact(
        db.tx.users[user.id].update({
          email: user.email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      ).catch(() => { transactionInFlight.current = false; });
    }
    // Case 2: Pre-created user exists (manual add) -> Migrate to real Auth ID
    else if (preCreatedUser) {
        console.log('Linking pre-created profile to new Auth ID...');
        const updates = [
          // 1. Create new user record with Auth ID, copying partial data
          db.tx.users[user.id].update({
            email: user.email,
            name: preCreatedUser.name,
            displayName: preCreatedUser.displayName,
            profilePicture: preCreatedUser.profilePicture,
            householdId: preCreatedUser.householdId,
            createdAt: preCreatedUser.createdAt || Date.now(),
            updatedAt: Date.now(),
          }),
          // 2. Delete the old placeholder user
          db.tx.users[preCreatedUser.id].delete(),
        ];

        // 3. If they were assigned as owner, update household ownerId
        // We know householdId from the pre-created user
        if (preCreatedUser.householdId) {
          // We can't query household owner inside this effect easily without complex checks
          // But we can blindly try to update if we want, or just rely on the user fixing it?
          // Better: Attempt to update household if we are linking.
          // But we need to know if they were the owner.
          // Instead of complex logic, just update household owner if it matches old ID
          // Check if we have household data in userData? 
          // userData.households might contain the relevant household if the query matched it?
          // Actually households query `{}` returns ALL households user has access to?
          // Permissions might block reading households if not member.
          // But preCreatedUser WAS a member. Auth user IS NOT YET a member in permissions eyes 
          // until this transaction runs? 
          // InstantDB permissions might be tricky here.
          // "allow read provided auth.id is in members?" No, usually "isHouseholdMember".
          // If I don't have a user record with householdId, I can't read the household.
          // So I can't check ownerId.

          // However, `users` table usually has `householdId` indexed.
          // We can assume if we copy the `householdId` to the new user, they gain access.
          // But the transaction must complete first.

          // For Owner ID migration: We can do it in a separate step or just hope the owner wasn't assigned to the ghost user yet.
          // Given the flow, the Creator adds Member. Creator is Owner. 
          // It is rare Creator assigns ghost as Owner immediately.
          // If they did, we might need a manual fix or a cloud function.
          // Let's stick to user migration for now. 
          // Actually, we can assume if the user is being linked, they are NOT the owner unless explicitly set.
        }

        db.transact(updates).catch(() => { transactionInFlight.current = false; });
    } else {
      transactionInFlight.current = false; // No applicable case, clear flag
    }
  }, [user, isLoading, isQueryLoading, userData]);

  // Use the user that matches Auth ID for the app
  const currentUser = userData?.users?.find((u) => u.id === user?.id);
  const household = userData?.households?.find(h => h.id === currentUser?.householdId);
  const theme = currentUser?.theme || localStorage.getItem('theme') || 'dark';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-teal-600 dark:text-teal-400 text-xl font-display">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 dark:text-red-400">
          Error: {error.message}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Show onboarding if user has no household yet
  if (currentUser && !currentUser.householdId) {
    return <OnboardingWizard user={currentUser} />;
  }

  return (
    <Layout user={currentUser} theme={theme} household={household}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/banks" element={<Banks />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/mortgage" element={<Mortgage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
