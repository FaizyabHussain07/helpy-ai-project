import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { showToast } from '../components/ToastContainer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        showToast(`Welcome back, ${userData.name || 'User'}!`);
        setTimeout(() => {
          if (userData.role === 'admin') navigate('/admin-dashboard');
          else navigate('/user-dashboard');
        }, 1000);
      } else {
        showToast("User record missing in Firestore.", 'error');
        setLoading(false);
      }
    } catch (error) {
      showToast(`Login failed: ${error.message}`, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50 dark:bg-gray-950 fade-in position-relative">
      <div className="absolute top-6 left-6 z-10">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft size={18} /> Back to Home
        </Link>
      </div>
      
      <div className="glass-panel w-full max-w-md p-8 sm:p-10 rounded-2xl relative overflow-hidden">
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">Welcome Back</h2>
          <p className="text-gray-500">Login to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input 
                className="form-control pl-10" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="you@example.com" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input 
                className="form-control pl-10" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary w-full py-3 mt-4" disabled={loading}>
            {loading ? <><span className="loader-mini"></span> Authenticating...</> : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Don't have an account? <Link to="/register" className="text-brand-600 font-semibold hover:underline">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
