import { useEffect } from 'react';
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

  // Get user data including theme preference, and household data
  const { data: userData, isLoading: isQueryLoading } = db.useQuery(
    user ? { users: { $: { where: { id: user.id } } }, households: {} } : null
  );

  // Automatically create user profile if it doesn't exist
  useEffect(() => {
    if (user && !isLoading && !isQueryLoading && userData && userData.users && userData.users.length === 0) {
      db.transact(
        db.tx.users[user.id].update({
          email: user.email,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
    }
  }, [user, isLoading, isQueryLoading, userData]);

  const currentUser = userData?.users?.[0];
  const household = userData?.households?.[0];
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
