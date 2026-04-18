import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/ToastContainer';
import ThemeToggle from '../components/ThemeToggle';

const UserDashboard = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profileName, setProfileName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (userData) {
      setProfileName(userData.name || '');
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      showToast("Error during logout.", 'error');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profileName,
        updatedAt: new Date()
      });
      showToast("Profile updated successfully!");
    } catch (error) {
      showToast(`Update failed: ${error.message}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const createdAt = userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'Recently';

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 fade-in">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-y-0 border-l-0 hidden md:flex flex-col fixed h-full z-10 transition-transform">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight text-brand-600 dark:text-brand-500">SmartDash</h2>
          <span className="text-xs font-bold uppercase tracking-wider bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 px-2 py-1 rounded">User</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} /> Overview
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'profile' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('profile')}
          >
            <Settings size={20} /> Profile Settings
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hello, <span className="text-brand-600 dark:text-brand-400">{userData?.name || 'User'}</span></h1>
            <p className="text-gray-500 mt-1">Welcome back to your personal dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100 leading-none">{userData?.name || 'User'}</p>
                <p className="text-gray-500 text-xs mt-1 leading-none">{userData?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl">
          {activeTab === 'overview' && (
            <div className="space-y-6 fade-in">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Account Status</p>
                    <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 mt-1">Active</p>
                  </div>
                </div>
              </div>
              
              <div className="glass-panel p-8 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Welcome Instructions</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  This is your user dashboard. You can navigate to your Profile Settings to securely update your display name using Firebase authentication.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="glass-panel p-8 rounded-2xl max-w-2xl fade-in">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Edit Profile</h3>
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Display Name</label>
                  <input 
                    className="form-control" 
                    type="text" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email Address (Read-only)</label>
                  <input 
                    className="form-control bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed" 
                    type="email" 
                    value={userData?.email || ''} 
                    readOnly 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Account Created</label>
                    <input 
                      className="form-control bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed" 
                      type="text" 
                      value={createdAt} 
                      readOnly 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Role</label>
                    <input 
                      className="form-control bg-gray-100 dark:bg-gray-800/50 text-gray-500 cursor-not-allowed uppercase" 
                      type="text" 
                      value={userData?.role || 'user'} 
                      readOnly 
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-6">
                  <button type="submit" className="btn-primary" disabled={updating}>
                    {updating ? <><span className="loader-mini"></span> Updating...</> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
