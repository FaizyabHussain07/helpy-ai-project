import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LogOut, User, LayoutDashboard, Settings, Trash2, Users, UserPlus } from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword as secondaryCreateUser } from 'firebase/auth';
import { auth, db, firebaseConfig } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

const AdminDashboard = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [usersList, setUsersList] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });

  useEffect(() => {
    if (userData) {
      setProfileName(userData.name || '');
    }
  }, [userData]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = [];
      snapshot.forEach(docSnap => {
        usersData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersList(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const handleDeleteUser = async (uid) => {
    if (window.confirm("Are you sure you want to delete this user from Firestore?")) {
      try {
        await deleteDoc(doc(db, "users", uid));
        console.log("User deleted successfully.");
      } catch (err) {
        console.error(`Error: ${err.message}`);
        alert(`Error: ${err.message}`);
      }
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
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error(`Update failed: ${error.message}`);
      alert(`Update failed: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp_" + Date.now());
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      
      const userCredential = await secondaryCreateUser(secondaryAuth, newUser.email, newUser.password);
      const createdUser = userCredential.user;

      await setDoc(doc(db, "users", createdUser.uid), {
        uid: createdUser.uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: serverTimestamp()
      });

      console.log(`User ${newUser.name} created successfully!`);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
    } catch (err) {
      console.error(`Creation failed: ${err.message}`);
      alert(`Creation failed: ${err.message}`);
    } finally {
      if (secondaryApp) await deleteApp(secondaryApp);
      setCreating(false);
    }
  };

  const createdAt = userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'Recently';

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 fade-in">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-y-0 border-l-0 hidden md:flex flex-col fixed h-full z-10 transition-transform">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight text-brand-600 dark:text-brand-500">SmartDash</h2>
          <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-1 rounded">Admin</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard size={20} /> System Overview
          </button>
          <button 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'create' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            onClick={() => setActiveTab('create')}
          >
            <UserPlus size={20} /> Create User
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Portal, <span className="text-brand-600 dark:text-brand-400">{userData?.name || 'Admin'}</span></h1>
            <p className="text-gray-500 mt-1">Manage users and oversee system security</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100 leading-none">{userData?.name || 'Admin'}</p>
                <p className="text-gray-500 text-xs mt-1 leading-none">{userData?.email}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl">
          {activeTab === 'overview' && (
            <div className="space-y-8 fade-in">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{usersList.length}</p>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm font-medium">System Status</p>
                    <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 mt-1">Healthy</p>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 dark:border-gray-800">
                        <th className="px-6 py-4 font-semibold">Name</th>
                        <th className="px-6 py-4 font-semibold">Email</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Joined Date</th>
                        <th className="px-6 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-medium text-gray-900 dark:text-white">{u.name || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Recently'}
                          </td>
                          <td className="px-6 py-4">
                            {u.role !== 'admin' ? (
                              <button onClick={() => handleDeleteUser(u.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors">
                                <Trash2 size={14} /> Delete
                              </button>
                            ) : (
                              <span className="text-gray-400 italic text-sm">Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="glass-panel p-8 rounded-2xl max-w-2xl fade-in">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Admin Profile</h3>
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
                      value={userData?.role || 'admin'} 
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

          {activeTab === 'create' && (
            <div className="glass-panel p-8 rounded-2xl max-w-2xl fade-in">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Create New User</h3>
              <p className="text-gray-500 mb-6 text-sm">Add a new user manually. They will be actively added to Firestore.</p>
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Full Name</label>
                  <input 
                    className="form-control" 
                    type="text" 
                    value={newUser.name} 
                    onChange={e => setNewUser({...newUser, name: e.target.value})} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email Address</label>
                  <input 
                    className="form-control" 
                    type="email" 
                    value={newUser.email} 
                    onChange={e => setNewUser({...newUser, email: e.target.value})} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Password</label>
                    <input 
                      className="form-control" 
                      type="password" 
                      value={newUser.password} 
                      onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Role</label>
                    <select 
                      className="form-control" 
                      value={newUser.role} 
                      onChange={e => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-6">
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? <><span className="loader-mini"></span> Creating...</> : 'Create User'}
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

export default AdminDashboard;
