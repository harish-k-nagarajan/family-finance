import { useState } from 'react';
import { db } from '../lib/instant';
import Card from '../components/common/Card';
import SkeletonLoader from '../components/common/SkeletonLoader';
import ToggleSwitch from '../components/common/ToggleSwitch';
import ProfilePictureUpload from '../components/Settings/ProfilePictureUpload';
import DeleteAccountModal from '../components/Settings/DeleteAccountModal';
import AddMemberModal from '../components/Settings/AddMemberModal';
import DemoDataSection from '../components/Settings/DemoDataSection';
import CountrySelect from '../components/common/CountrySelect';
import { currencies } from '../utils/currencies';

function Settings() {
  const { user: authUser } = db.useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch current user first to get householdId
  const { data: userData, isLoading: userLoading } = db.useQuery(
    authUser ? { users: { $: { where: { id: authUser.id } } } } : null
  );

  const currentUser = userData?.users?.[0];
  const householdId = currentUser?.householdId;

  // 2. Fetch household and all members once we have the ID
  const { data: householdData, isLoading: householdLoading } = db.useQuery(
    householdId
      ? {
        households: { $: { where: { id: householdId } } },
        users: { $: { where: { householdId: householdId } } },
      }
      : null
  );

  const household = householdData?.households?.[0];
  const users = householdData?.users || [];

  // Loading state
  if (userLoading || householdLoading || !currentUser || !household) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <SkeletonLoader variant="title" />
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
      </div>
    );
  }

  // Transaction helper
  const updateHousehold = (updates) => {
    db.transact(
      db.tx.households[household.id].update({
        ...updates,
        updatedAt: Date.now(),
      })
    );
  };

  const updateUser = (userId, updates) => {
    db.transact(
      db.tx.users[userId].update({
        ...updates,
        updatedAt: Date.now(),
      })
    );
  };

  const handleAddMember = async (formData) => {
    setIsAdding(true);
    try {
      const newUserId = crypto.randomUUID();

      await db.transact(
        db.tx.users[newUserId].update({
          name: formData.name,
          displayName: formData.displayName,
          email: formData.email,
          profilePicture: formData.profilePicture,
          householdId: household.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );

      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add member:", error);
      alert("Failed to add member. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Manage your account, household, and preferences
        </p>
      </div>

      {/* 1. Household Settings */}
      <section>
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          Household
        </h2>
        <Card className="!p-0 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Household Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Household Name
                </label>
                <input
                  type="text"
                  value={household.name || ''}
                  onChange={(e) => updateHousehold({ name: e.target.value })}
                  placeholder="e.g. Smith Family"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              {/* Household Owner */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Household Owner
                </label>
                <div className="relative">
                  <select
                    value={household.ownerId || ''}
                    onChange={(e) => updateHousehold({ ownerId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select an owner</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName || u.email}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Country of Residence */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Country of Residence
                </label>
                <CountrySelect
                  value={household.country}
                  onChange={(code) => updateHousehold({ country: code })}
                />
              </div>

              {/* Relationship Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Relationship Status
                </label>
                <div className="relative">
                  <select
                    value={household.relationshipStatus || 'Single'}
                    onChange={(e) => updateHousehold({ relationshipStatus: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none transition-all cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="In a Relationship">In a Relationship</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Married">Married</option>
                    <option value="Domestic Partnership">Domestic Partnership</option>
                    <option value="Legally Cohabiting">Legally Cohabiting</option>
                    <option value="Civil Union">Civil Union</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Base Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  Base Currency
                </label>
                <div className="relative">
                  <select
                    value={household.currency || 'USD'}
                    onChange={(e) => updateHousehold({ currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none transition-all cursor-pointer"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 2. Users */}
      <section>
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          Partners
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="relative overflow-hidden group">
              {/* Highlight current user */}
              {user.id === currentUser.id && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-bl-xl border-b border-l border-teal-500/20">
                  YOU
                </div>
              )}

              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                {/* Profile Picture (Only editable by self) */}
                <div className="flex-shrink-0">
                  {user.id === currentUser.id ? (
                    <ProfilePictureUpload
                      currentImage={user.profilePicture}
                      name={user.displayName || user.email}
                      onImageChange={(img) => updateUser(user.id, { profilePicture: img })}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-gray-200 dark:border-white/10 overflow-hidden bg-gray-100 dark:bg-navy-800 flex items-center justify-center">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-display font-bold text-gray-400">
                          {(user.displayName || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user.name || ''}
                      onChange={(e) => updateUser(user.id, { name: e.target.value })}
                      disabled={user.id !== currentUser.id} // Only edit self
                      placeholder="Full Name"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-navy-900 border-gray-200 dark:border-white/10 focus:border-teal-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={user.displayName || ''}
                      onChange={(e) => updateUser(user.id, { displayName: e.target.value })}
                      disabled={user.id !== currentUser.id}
                      placeholder="Display Name"
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-transparent focus:bg-white dark:focus:bg-navy-900 border-gray-200 dark:border-white/10 focus:border-teal-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>



                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-transparent text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Add User Placeholder */}
          {users.length < 2 && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="group relative flex flex-col items-center justify-center h-full min-h-[280px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500/50 bg-gray-50/50 dark:bg-navy-900/20 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all duration-300 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 group-hover:bg-teal-100 dark:group-hover:bg-teal-500/20 flex items-center justify-center transition-colors duration-300">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Add a partner
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 px-8">
                  Create a profile for your partner
                </p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* 3. Mortgages & Loans */}
      <section>
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          Mortgages & Loans
        </h2>
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Track Total Debt
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View your mortgage and loan details as a separate category in your portfolio. The mortgage or loan parameters must be managed there.
              </p>
            </div>

            <div className="flex-shrink-0">
              <ToggleSwitch
                enabled={household.mortgageEnabled}
                onChange={(val) => updateHousehold({ mortgageEnabled: val })}
                srLabel="Enable mortgage tracking"
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Account */}
      <section>
        <h2 className="text-xl font-display font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Account
        </h2>
        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Account Actions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sign out of your session or permanently delete your account
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => db.auth.signOut()}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>

              <DeleteAccountButton
                user={currentUser}
                household={household}
                onDelete={() => db.auth.signOut()}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Demo Data */}
      <DemoDataSection household={household} currentUser={currentUser} />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
        isAdding={isAdding}
      />
    </div>
  );
}

// Wrapper for delete flow logic
function DeleteAccountButton({ user, household, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the owner
  const isOwner = user.id === household.ownerId;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (isOwner) {
        // Delete entire household and associated data
        // 1. Delete household record
        await db.transact(
          db.tx.households[household.id].delete()
        );
        // Note: We might need to handle user deletion separately if cascading isn't automatic
        // For simple implementations, just delete self and household.
        await db.transact(db.tx.users[user.id].delete());
      } else {
        // Just delete self (leave household)
        await db.transact(db.tx.users[user.id].delete());
      }

      onDelete(); // Sign out
    } catch (error) {
      console.error('Failed to delete account:', error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
      >
        {isOwner ? 'Delete Household' : 'Leave Household'}
      </button>

      <DeleteAccountModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={isOwner ? 'Delete Household?' : 'Leave Household?'}
        description={isOwner
          ? 'This will permanently delete the household and all associated data for all members. This action cannot be undone.'
          : 'This will remove your account from the household. You will need to be re-invited to join again.'
        }
      />
    </>
  );
}

export default Settings;
