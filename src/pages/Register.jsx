import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { showToast } from '../components/ToastContainer';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: "user",
        createdAt: serverTimestamp()
      });

      showToast("Account created successfully! Preparing your dashboard...");
      setTimeout(() => {
        navigate('/user-dashboard');
      }, 1500);
    } catch (error) {
      showToast(`Registration failed: ${error.message}`, 'error');
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
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <User size={24} />
          </div>
          <h2 className="text-3xl font-black mb-2 text-gray-900 dark:text-white">Create Account</h2>
          <p className="text-gray-500">Join SmartDash today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input 
                className="form-control pl-10" 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="John Doe" 
              />
            </div>
          </div>

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
            {loading ? <><span className="loader-mini"></span> Processing...</> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
