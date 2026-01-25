import { Routes, Route, Navigate } from 'react-router-dom';
import { db } from './lib/instant';
import Layout from './components/common/Layout';
import Home from './pages/Home';
import Banks from './pages/Banks';
import Investments from './pages/Investments';
import Mortgage from './pages/Mortgage';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  const { isLoading, user, error } = db.useAuth();

  // Get user data including theme preference
  const { data: userData } = db.useQuery(
    user ? { users: { $: { where: { id: user.id } } } } : null
  );

  const currentUser = userData?.users?.[0];
  const theme = currentUser?.theme || 'dark';

  // Apply theme class to body
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark', theme === 'dark');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="animate-pulse text-teal-400 text-xl font-display">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="text-red-400">
          Error: {error.message}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout user={currentUser} theme={theme}>
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
