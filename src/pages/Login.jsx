import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../lib/instant';

function Login() {
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await db.auth.sendMagicCode({ email });
      setSentEmail(email);
      setEmail(''); // Clear email input
      setCode(''); // Clear code input
    } catch (err) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
    } catch (err) {
      setError(err.message || 'Invalid code');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-white dark:bg-navy-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img
              src="/Family Finance Logo.png"
              alt="Family Finance logo"
              className="w-16 h-16 rounded-xl object-contain"
            />
            <span className="font-display font-semibold text-2xl text-navy-900 dark:text-white tracking-wide">
              Family Finance
            </span>
          </div>

          {!sentEmail ? (
            <form onSubmit={handleSubmit}>
              <h1 className="text-xl font-display font-semibold text-gray-900 dark:text-white text-center mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Enter your email to sign in with a magic link
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email webauthn"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify}>
              <h1 className="text-xl font-display font-semibold text-gray-900 dark:text-white text-center mb-2">
                Check Your Email
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                We sent a code to <span className="text-teal-500 dark:text-teal-400">{sentEmail}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  />
                </div>

                {error && (
                  <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-500 to-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSentEmail('');
                    setCode('');
                    setError('');
                  }}
                  className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
